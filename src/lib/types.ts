export type ModelId = "gemini" | "gpt4" | "local" | "mock";
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'custom'
export type ProviderConnectionStatus = 'connected' | 'error' | 'disabled'

export type UserRole = 'root' | 'admin' | 'user' | 'viewer';

export interface Agent {
  id: string;
  name: string;
  role: string; // e.g. "Research Lead", "System Ops"
  description?: string;
  systemPrompt: string;
  model?: string;
  providerId?: string;
  cliProfileId?: string;
  skills: string[];
  canTalkToAgents: boolean;
  heartbeatEnabled?: boolean;
  subagents?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubAgent extends Agent {
  parentAgentId: string;
  taskScope: string;
  lifespan: 'task' | 'session' | 'permanent';
  spawnedAt: string;
  terminatesAt?: string;
  status: 'spawning' | 'active' | 'completing' | 'terminated';
  progress?: string;
}

export interface ProviderConnection {
  id: string;
  provider: ProviderType;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  status: ProviderConnectionStatus;
  models: string[];
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  inputsSchemaName?: string;
  permissions?: string[];
  origin?: "imported" | "marketplace" | "preinstalled" | "manual";
  category?: string;
  source?: string;
  status?: "preinstalled" | "installed" | "disabled" | "error";
  preinstalled?: boolean;
  tools?: string[];
  path?: string;
  elevated_permissions?: boolean;
  [key: string]: unknown;
}

export type SkillManifest = Skill;

export interface ToolCall {
  id: string;
  toolId: string;
  args: unknown;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: "user" | "agent" | "system"; 
  senderAgentId?: string; // which agent sent this
  agentId: string; // which agent this message belongs to (context owner)
  text: string;
  createdAt: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  thinkingTrace?: string;
}

export interface MultiAgentSession {
  id: string;
  agentIds: string[];
  initialSpeakerId: string;
  createdAt: string;
}

export interface PlaybookStep {
  id: string;
  agentId: string;
  skillId?: string;
  instruction: string;
}

export interface Playbook {
  id: string;
  name: string;
  description?: string;
  steps: PlaybookStep[];
  webhookUrl?: string; // Derived from ID
  createdAt: string;
}

export interface ContextPack {
  id: string;
  name: string;
  description?: string;
  content: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  params?: unknown;
  resultSummary?: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  playbookId: string;
  enabled: boolean;
  lastRun?: string;
}

export interface ApprovalRequest {
  id: string;
  type: "tool_call" | "playbook_run" | "skill_install";
  status: "pending" | "approved" | "rejected";
  requesterId: string; // Agent or Playbook ID
  details: unknown;
  createdAt: string;
}

export interface SwarmTemplate {
  id: string;
  name: string;
  description?: string;
  routerAgentId: string;
  workerAgentIds: string[];
}

export interface ImportedState {
  agents: Agent[];
  skills: SkillManifest[];
  playbooks: Playbook[];
  swarms: SwarmTemplate[];
}

// --- Dashboard & Widget Types ---

export type WidgetType = 
  | 'system-cpu' 
  | 'system-memory' 
  | 'system-disk' 
  | 'docker-status' 
  | 'ai-token-gauge' 
  | 'ai-api-status' 
  | 'mission-control' 
  | 'agent-status' 
  | 'pomodoro' 
  | 'rss-feed' 
  | 'calendar-feed'
  | 'terminal'
  | 'overlay-studio'
  | 'viral-score'
  | 'reasoning-trace'
  | 'permission-manager'
  | 'gateway-debug'
  | 'security-health'
  | 'context-health'
  | 'live-activity'
  | 'system-resources'; // Added Sentinel + preinstalled skill widgets

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  refreshInterval?: number; // ms
  dataMode?: 'mock' | 'live'; // v2.0: Control data source
  props?: Record<string, any>;
}

export interface DashboardLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardLayout {
  id: string; // e.g. "default", "ops", "streaming"
  name: string;
  items: DashboardLayoutItem[];
  widgets: Record<string, WidgetConfig>;
  accentColor?: string;
  updatedAt?: string;
}

// --- Monitoring Types ---

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  dockerContainers: {
    id: string;
    name: string;
    state: string;
    cpu: string;
    mem: string;
  }[];
  timestamp: number;
}

export interface AiMetrics {
  totalTokensSession: number;
  apiLatency: Record<string, number>; // provider -> ms
  apiErrors: Record<string, number>; // provider -> count
}

// --- Security & Permissions (v2.0) ---
export interface PermissionContext {
  userRole: UserRole;
  agentId?: string;
  safeMode?: boolean;
  [key: string]: any;
}

export interface AccessResult {
  granted: boolean;
  policy: 'allow' | 'deny' | 'ask';
  ruleId?: string;
  reason?: string;
  approvalId?: string;
}

export interface PermissionRule {
  id: string;
  name: string;
  description?: string;
  resource: 'web' | 'shell' | 'files' | 'email' | 'overlay' | '*';
  action: 'read' | 'write' | 'execute' | '*' | string;
  policy: 'allow' | 'deny' | 'ask';
  scope?: string[]; // Regex or glob patterns
  agentIds?: string[]; // Specific agents this rule applies to
  timeWindow?: {
    start: string; // ISO time or cron?
    end: string;
  };
  enabled: boolean;
}

export interface ChannelPolicy {
  channelId: string; // e.g., 'telegram', 'discord'
  enabled: boolean;
  dmAllowed: boolean;
  allowList: string[]; // user IDs
}

// --- Session Index (v2.0) ---
export interface SessionIndexEntry {
  id: string;
  agentId: string;
  title?: string;
  lastEventTime: string;
  messageCount: number;
  hasErrors: boolean;
  tags?: string[];
}

// --- Sentinel Reliability ---

export type HealthStatus = 'ok' | 'degraded' | 'down';
export type HealthSeverity = 'low' | 'medium' | 'high' | 'critical';
export type HealthRunSource = 'manual' | 'cron' | 'retry';

export interface HealthCheck {
  id: string;
  timestamp: string;
  checkName: string;
  status: HealthStatus;
  errorSummary: string;
  retryCount: number;
  severity: HealthSeverity;
  source: HealthRunSource;
}

export interface HealthSummary {
  overallStatus: 'OK' | 'DEGRADED' | 'DOWN';
  counts: {
    ok: number;
    degraded: number;
    down: number;
  };
  failingChecks: number;
  totalChecks: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  safeMode: boolean;
}

export interface SentinelConfig {
  enabled: boolean;
  retriesBeforeEscalation: number;
  checkIntervalMinutes: number;
  maxStoredChecks: number;
}

// --- Skill Telemetry ---

export interface SkillActivityEvent {
  id: string;
  timestamp: string;
  source: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface ContextHealthSnapshot {
  safeMode: boolean;
  utilizationPct: number;
  compactionThresholdPct: number;
  autoCompactionEligible: boolean;
  lastCompactionAt: string | null;
  compactedToday: number;
  history: Array<{
    timestamp: string;
    utilizationPct: number;
    action: "check" | "compact";
    status: "ok" | "warning";
  }>;
}

export interface SecurityAlertItem {
  id: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  title: string;
  details: string;
}

export interface RestoreContextResult {
  safeMode: boolean;
  restored: boolean;
  summary: string;
  anchorPoints: Array<{
    id: string;
    timestamp: string;
    snippet: string;
  }>;
}

export interface SmartSearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  timestamp: string;
}

export interface MemoryTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface QuickCaptureResult {
  safeMode: boolean;
  saved: boolean;
  id: string;
  message: string;
}

