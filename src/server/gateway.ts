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
  payload: z.any(),
  id: z.string().optional(),
});

type OcmpMessage = z.infer<typeof OcmpMessageSchema>;

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
  private reconnectAttempts: number = 0;
  private readonly maxReconnectDelay: number = 30000;
  private readonly baseReconnectDelay: number = 1000;
  private readonly smokeMode: boolean = process.env.SMOKE_MODE === '1';

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
    if (!this.smokeMode) {
      this.startHealthChecks();
    } else {
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
      this.send({ type: 'ping', payload: { timestamp: this.lastPingTime } });
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
      this.init();
    }, delay);
  }

  getLatency() {
    return this.latency;
  }

  getConnectionStatus() {
    return {
      connected: !!this.ws && (this.ws as any).readyState === 1,
      latency: this.latency,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  async rehydrate() {
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
    if (config.SAFE_MODE) {
      console.log(`[GatewayClient] SAFE_MODE is ON. Using Mock Gateway.`);
      this.ws = new MockGateway();
      (this.ws as MockGateway).connect();
    } else {
      console.log(`[GatewayClient] Connecting to ${this.url}...`);
      this.ws = new WebSocket(this.url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    }

    this.ws.on('open', () => {
      console.log('[GatewayClient] Connected to Gateway');
      this.reconnectAttempts = 0;
      this.register();
      if (!this.smokeMode) {
        this.startHealthChecks();
      }
      this.rehydrate();
      if (this.onConnectCallback) {
        this.onConnectCallback();
      }
      this.emit('connected');
    });

    this.ws.on('close', () => {
      console.warn('[GatewayClient] Disconnected from Gateway');
      this.emit('disconnected');
      if (this.shouldKeyReconnect && !config.SAFE_MODE) {
        this.handleReconnect();
      }
    });

    this.ws.on('message', (data: any) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        
        // Handle pending requests
        if (parsed.id && this.pendingRequests.has(parsed.id)) {
            const callback = this.pendingRequests.get(parsed.id);
            if (callback) {
                callback(parsed.payload);
                this.pendingRequests.delete(parsed.id);
                return;
            }
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
       (this.ws as WebSocket).on('error', (err) => {
        console.error('[GatewayClient] Error:', err);
      });
    }
  }

  private register() {
    this.send({
      type: 'register_agent', 
      payload: {
        clientType: 'command_center',
      },
    });
  }

  private async handleMessage(msg: OcmpMessage) {
    this.emit('raw_message', msg);
    
    switch (msg.type) {
      case 'pong':
        this.latency = Date.now() - this.lastPingTime;
        break;
      case 'history_batch':
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
          this.send({
              type: 'tool_call',
              id,
              payload: { tool, args }
          });
          
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
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.ws?.close();
  }
}

export const gateway = new GatewayClient();
