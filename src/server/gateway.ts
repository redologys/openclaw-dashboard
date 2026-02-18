import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { z } from 'zod';
import { config } from '../lib/config';
import { MockGateway } from './mockGateway';
import { JsonDb } from '../lib/db';
import { MessageDbSchema, MessageSchema } from '../lib/schema';
import { v4 as uuidv4 } from 'uuid';

// Basic OCMP Types
const OcmpMessageSchema = z.object({
  type: z.string(),
  payload: z.any().optional(),
  params: z.any().optional(),
  method: z.string().optional(),
  result: z.any().optional(),
  ok: z.boolean().optional(),
  error: z.any().optional(),
  id: z.string().optional(),
});

type OcmpMessage = z.infer<typeof OcmpMessageSchema>;

type GatewayRuntimeConfigUpdate = {
  gatewayUrl?: string;
  gatewayToken?: string;
  reconnect?: boolean;
};

export class GatewayClient extends EventEmitter {
  private ws: WebSocket | MockGateway | null = null;
  private url: string;
  private token: string;
  private shouldKeyReconnect: boolean = true;
  private messageDb: JsonDb<z.infer<typeof MessageDbSchema>>;
  private onConnectCallback: (() => void) | null = null;
  private pendingRequests: Map<string, (response: any) => void> = new Map();
  
  // Health & Metrics
  private latency: number = 0;
  private lastPingTime: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private handshakeFallbackTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectDelay: number = 30000;
  private readonly baseReconnectDelay: number = 1000;
  private readonly smokeMode: boolean = process.env.SMOKE_MODE === '1';
  private sessionReady: boolean = false;
  private reconnectOverrideTimer: NodeJS.Timeout | null = null;
  private connectRequestId: string | null = null;
  private pendingHealthChecks: Map<string, number> = new Map();
  private readonly clientModeCandidates = ['cli', 'operator', 'dashboard', 'command_center', 'agent'] as const;
  private clientModeIndex = 0;

  constructor() {
    super();
    this.url = config.GATEWAY_URL;
    this.token = config.GATEWAY_TOKEN;
    this.messageDb = new JsonDb('messages.json', MessageDbSchema, []);
  }

  public setOnConnect(callback: () => void) {
    this.onConnectCallback = callback;
  }

  async init() {
    await this.messageDb.init();
    this.connect();
    if (this.smokeMode) {
      console.log('[GatewayClient] SMOKE_MODE=1 detected. Health ping interval disabled.');
    }
  }

  private startHealthChecks() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.healthCheckInterval = setInterval(() => {
      this.ping();
    }, 30000);
  }

  private ping() {
    if (this.ws && (this.ws as any).readyState === 1) {
      this.lastPingTime = Date.now();

      if (config.SAFE_MODE) {
        this.send({ type: 'ping', payload: { timestamp: this.lastPingTime } });
        return;
      }

      const id = uuidv4();
      this.pendingHealthChecks.set(id, this.lastPingTime);
      this.send({
        type: 'req',
        id,
        method: 'health',
        params: {},
      });
    }
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[GatewayClient] Attempting to reconnect in ${delay}ms (Attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  getLatency() {
    return this.latency;
  }

  getConnectionStatus() {
    return {
      connected: this.sessionReady && !!this.ws && (this.ws as any).readyState === 1,
      latency: this.latency,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  getRuntimeConfig() {
    return {
      gatewayUrl: this.url,
      hasToken: this.token.trim().length > 0,
    };
  }

  updateRuntimeConfig(update: GatewayRuntimeConfigUpdate) {
    let changed = false;

    if (typeof update.gatewayUrl === 'string') {
      const normalizedUrl = this.normalizeGatewayUrl(update.gatewayUrl);
      if (normalizedUrl !== this.url) {
        this.url = normalizedUrl;
        changed = true;
      }
    }

    if (typeof update.gatewayToken === 'string') {
      const trimmedToken = update.gatewayToken.trim();
      if (trimmedToken.length > 0 && trimmedToken !== this.token) {
        this.token = trimmedToken;
        changed = true;
      }
    }

    if (changed) {
      console.log(
        `[GatewayClient] Runtime connection target updated (gatewayUrl=${this.url}, tokenProvided=${this.token.trim().length > 0})`,
      );

      if (update.reconnect !== false && !config.SAFE_MODE) {
        this.reconnectNow('runtime-config-update');
      }
    }

    return this.getRuntimeConfig();
  }

  private normalizeGatewayUrl(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('gatewayUrl is required');
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error('gatewayUrl must be a valid ws:// or wss:// URL');
    }

    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      throw new Error('gatewayUrl must use ws:// or wss://');
    }

    return parsed.toString();
  }

  private reconnectNow(reason: string, options?: { preserveClientMode?: boolean }) {
    console.log(`[GatewayClient] Forcing reconnect (${reason})...`);

    this.sessionReady = false;
    this.connectRequestId = null;
    this.pendingHealthChecks.clear();
    if (!options?.preserveClientMode) {
      this.clientModeIndex = 0;
    }
    if (this.handshakeFallbackTimer) {
      clearTimeout(this.handshakeFallbackTimer);
      this.handshakeFallbackTimer = null;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.reconnectOverrideTimer) {
      clearTimeout(this.reconnectOverrideTimer);
      this.reconnectOverrideTimer = null;
    }

    this.shouldKeyReconnect = false;

    try {
      this.ws?.close();
    } catch (error) {
      console.warn('[GatewayClient] Failed to close existing gateway socket before reconnect:', error);
    }

    this.reconnectOverrideTimer = setTimeout(() => {
      this.shouldKeyReconnect = true;
      this.reconnectAttempts = 0;
      this.connect();
      this.reconnectOverrideTimer = null;
    }, 100);
  }

  async rehydrate() {
    if (!config.SAFE_MODE) {
      // TODO: implement live protocol history replay once upstream event contracts are finalized.
      console.log('[GatewayClient] Rehydration skipped in live mode (protocol-v3 history endpoint TODO).');
      return;
    }

    console.log('[GatewayClient] Starting rehydration...');
    const messages = this.messageDb.get();
    const lastMsg = messages[messages.length - 1];
    const since = lastMsg ? lastMsg.createdAt : new Date(0).toISOString();

    this.send({
      type: 'request_history',
      payload: { since }
    });
  }

  connect() {
    this.sessionReady = false;
    this.connectRequestId = null;
    this.pendingHealthChecks.clear();

    if (config.SAFE_MODE) {
      console.log(`[GatewayClient] SAFE_MODE is ON. Using Mock Gateway.`);
      this.ws = new MockGateway();
      (this.ws as MockGateway).connect();
    } else {
      console.log(`[GatewayClient] Connecting to ${this.url} (Compatibility Mode)...`);
      // Many OpenClaw gateways require the 'ocmp' sub-protocol to be specified
      this.ws = new WebSocket(this.url, 'ocmp', {
        headers: {
          // Keep both forms for gateway compatibility.
          'Authorization': `Bearer ${this.token}`,
          'X-OpenClaw-Token': this.token,
          'User-Agent': 'openclaw-command-center/1.0.0',
          'X-OpenClaw-Version': '1.0.0'
        },
        // Explicitly disable compression to avoid 'invalid request frame' errors
        // often caused by extension negotiation failures.
        perMessageDeflate: false,
        handshakeTimeout: 10000,
      });

      this.ws.on('unexpected-response', (_req, res) => {
        console.error(`[GatewayClient] Handshake rejected by server. Status: ${res.statusCode} ${res.statusMessage}`);
        console.error(`[GatewayClient] Response headers:`, JSON.stringify(res.headers, null, 2));
      });
    }

    this.ws.on('open', () => {
      console.log('[GatewayClient] Connected to Gateway');
      this.authenticate();

      // Safe mode mock can operate without an explicit auth ack.
      if (config.SAFE_MODE) {
        if (this.handshakeFallbackTimer) clearTimeout(this.handshakeFallbackTimer);
        this.handshakeFallbackTimer = setTimeout(() => {
          this.markSessionReady('fallback-timeout');
        }, 1200);
      }
    });

    this.ws.on('close', () => {
      console.warn('[GatewayClient] Disconnected from Gateway');
      this.sessionReady = false;
      this.connectRequestId = null;
      this.pendingHealthChecks.clear();
      if (this.handshakeFallbackTimer) {
        clearTimeout(this.handshakeFallbackTimer);
        this.handshakeFallbackTimer = null;
      }
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      this.emit('disconnected');
      if (this.shouldKeyReconnect && !config.SAFE_MODE) {
        this.handleReconnect();
      }
    });

    this.ws.on('message', (data: any) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        
        // Handle pending requests
        if (parsed.id && this.pendingRequests.has(parsed.id) && parsed.type === 'res') {
            const callback = this.pendingRequests.get(parsed.id);
            if (callback) {
                callback(parsed.ok === false ? { error: parsed.error ?? 'Gateway request failed' } : (parsed.result ?? parsed.payload));
                this.pendingRequests.delete(parsed.id);
                return;
            }
        }

        if (parsed.id && this.pendingHealthChecks.has(parsed.id) && parsed.type === 'res') {
          const started = this.pendingHealthChecks.get(parsed.id)!;
          this.latency = Math.max(0, Date.now() - started);
          this.pendingHealthChecks.delete(parsed.id);
        }

        const msg = OcmpMessageSchema.safeParse(parsed);
        if (msg.success) {
          this.handleMessage(msg.data);
        } else {
          console.warn('[GatewayClient] Invalid message format:', parsed);
        }
      } catch (err) {
        console.error('[GatewayClient] Error parsing message:', err);
      }
    });

    if (!config.SAFE_MODE) {
      const socket = this.ws as WebSocket;
      socket.on('error', (err: any) => {
        console.error('[GatewayClient] WebSocket Error:', err.message);
        if (err.code === 'ECONNREFUSED') {
          console.error(`[GatewayClient] Connection refused at ${this.url}. Check if the Gateway is running.`);
        } else if (err.message.includes('1008')) {
          console.error('[GatewayClient] Policy Violation (1008). This often means the token is invalid or the handshake headers are rejected.');
        } else if (err.message.includes('handshake')) {
          console.error('[GatewayClient] Handshake failed. The server might not be a WebSocket server or handles headers differently.');
        }
      });
    }
  }

  private authenticate() {
    const normalizePlatform = () => {
      switch (process.platform) {
        case 'win32':
          return 'windows';
        case 'darwin':
          return 'macos';
        default:
          return 'linux';
      }
    };

    const client = {
      id: 'cli',
      version: '1.0.0',
      platform: normalizePlatform(),
      mode: this.clientModeCandidates[this.clientModeIndex],
    };

    if (config.SAFE_MODE) {
      this.send({
        type: 'connect',
        id: uuidv4(),
        params: {
          auth: { token: this.token },
          role: 'operator',
          client,
        },
      });
      return;
    }

    // Protocol-v3 handshake expected by modern OpenClaw gateway builds.
    const requestId = uuidv4();
    this.connectRequestId = requestId;
    this.send({
      type: 'req',
      id: requestId,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        role: 'operator',
        auth: { token: this.token },
        client,
        locale: 'en-US',
        userAgent: 'openclaw-cli/1.0.0',
      },
    });
  }

  private tryNextClientMode() {
    if (this.clientModeIndex >= this.clientModeCandidates.length - 1) {
      console.error(
        `[GatewayClient] Exhausted client.mode fallbacks: ${this.clientModeCandidates.join(', ')}`,
      );
      return false;
    }

    this.clientModeIndex += 1;
    const nextMode = this.clientModeCandidates[this.clientModeIndex];
    console.warn(`[GatewayClient] Retrying gateway connect with client.mode="${nextMode}"`);
    this.reconnectNow(`client-mode-fallback:${nextMode}`, { preserveClientMode: true });
    return true;
  }

  private markSessionReady(reason: string) {
    if (this.sessionReady) return;
    if (!this.ws || (this.ws as any).readyState !== 1) return;

    this.sessionReady = true;
    this.reconnectAttempts = 0;
    this.connectRequestId = null;

    if (this.handshakeFallbackTimer) {
      clearTimeout(this.handshakeFallbackTimer);
      this.handshakeFallbackTimer = null;
    }

    if (!this.smokeMode) {
      this.startHealthChecks();
    }

    console.log(`[GatewayClient] Session ready (${reason})`);

    this.rehydrate();
    if (this.onConnectCallback) {
      this.onConnectCallback();
    }
    this.emit('connected');
  }

  private async handleMessage(msg: OcmpMessage) {
    this.emit('raw_message', msg);
    
    if (msg.type === 'res' && msg.id && msg.id === this.connectRequestId) {
      if (msg.ok === false || msg.error) {
        console.error('[GatewayClient] Gateway connect request failed:', msg.error ?? msg);
        const messageText =
          typeof msg.error?.message === 'string'
            ? msg.error.message
            : typeof msg.error === 'string'
              ? msg.error
              : '';
        if (messageText.includes('/client/mode')) {
          this.tryNextClientMode();
        }
        return;
      }
      if (this.clientModeIndex > 0) {
        console.log(
          `[GatewayClient] Connected using client.mode="${this.clientModeCandidates[this.clientModeIndex]}"`,
        );
      }
      this.markSessionReady('ack:res/connect');
      return;
    }

    if (msg.type === 'event' && msg.method === 'connect.challenge' && !this.connectRequestId) {
      // Some gateway builds send challenge first; re-send connect if we do not have one in flight.
      this.authenticate();
      return;
    }

    switch (msg.type) {
      case 'connect_ack':
      case 'connected':
      case 'session_created':
      case 'register_success':
        this.markSessionReady(`ack:${msg.type}`);
        break;
      case 'error':
      case 'auth_error':
        console.error('[GatewayClient] Gateway reported auth/session error:', msg.payload ?? msg.params ?? msg);
        break;
      case 'pong':
        this.markSessionReady('pong');
        this.latency = Date.now() - this.lastPingTime;
        break;
      case 'history_batch':
        this.markSessionReady('history_batch');
        if (Array.isArray(msg.payload.messages)) {
          for (const m of msg.payload.messages) {
             await this.processIncomingChatMessage(m);
          }
        }
        break;
      case 'chat_message':
        await this.processIncomingChatMessage(msg.payload);
        break;
      case 'thought_trace':
        this.emit('thought', msg.payload);
        break;
    }
  }

  private async processIncomingChatMessage(payload: any) {
    if (!payload.id) return;
    try {
      const message = {
        id: payload.id,
        conversationId: payload.conversationId || 'unknown',
        senderType: payload.senderType || 'agent',
        senderAgentId: payload.senderAgentId,
        agentId: payload.agentId || 'unknown',
        text: payload.text || '',
        createdAt: payload.timestamp || payload.createdAt || new Date().toISOString(),
        toolCalls: payload.toolCalls,
        toolResults: payload.toolResults,
        thinkingTrace: payload.thinkingTrace,
      };

      const validated = MessageSchema.safeParse(message);
      if (validated.success) {
        this.emit('message', validated.data);
        const existing = this.messageDb.get();
        if (!existing.find((m: any) => m.id === message.id)) {
          await this.messageDb.update(msgs => [...msgs, validated.data]);
        }
      }
    } catch (e) {
      console.error("Failed to save message", e);
    }
  }

  send(msg: OcmpMessage) {
    if (this.ws && (this.ws as any).readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[GatewayClient] Cannot send, socket not open');
    }
  }

  async callTool(tool: string, args: any): Promise<any> {
      if (config.SAFE_MODE && !tool.startsWith('browser_screenshot')) {
          console.warn(`[GatewayClient] SAFE_MODE blocks tool call: ${tool}`);
          return { error: 'Blocked by Safe Mode' };
      }

      const id = uuidv4();
      return new Promise((resolve) => {
          this.pendingRequests.set(id, resolve);
          if (config.SAFE_MODE) {
            this.send({
              type: 'tool_call',
              id,
              payload: { tool, args }
            });
          } else {
            this.send({
              type: 'req',
              id,
              method: 'tool.call',
              params: { tool, args },
            });
          }
          
          // Timeout after 30s
          setTimeout(() => {
              if (this.pendingRequests.has(id)) {
                  this.pendingRequests.delete(id);
                  resolve({ error: 'Request timeout' });
              }
          }, 30000);
      });
  }

  disconnect() {
    this.shouldKeyReconnect = false;
    this.sessionReady = false;
    this.connectRequestId = null;
    this.pendingHealthChecks.clear();
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.handshakeFallbackTimer) clearTimeout(this.handshakeFallbackTimer);
    if (this.reconnectOverrideTimer) clearTimeout(this.reconnectOverrideTimer);
    this.ws?.close();
  }
}

export const gateway = new GatewayClient();
