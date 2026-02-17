# DATA_FILES_SCHEMA

This schema reference is derived from:
- Current TypeScript types (`src/lib/types.ts`, `src/lib/schema.ts`)
- Current file usage in backend services/routes
- Actual files currently present under `data/`

Rules:
- `Implemented` means file and read/write paths exist now.
- `Proposed` means requested/planned but not currently wired.

---

## Implemented Files (Currently in data/)

### data/agents.json
- Status: Implemented
- Purpose: Store agent definitions.
- Schema:
```ts
type Agent = {
  id: string;
  name: string;
  role: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  providerId?: string;
  cliProfileId?: string;
  skills: string[];
  canTalkToAgents: boolean;
  heartbeatEnabled?: boolean;
};
type AgentsFile = Agent[];
```
- Example:
```json
[]
```
- Written by:
  - `POST /api/agents`
  - `PUT /api/agents/:id`
  - `DELETE /api/agents/:id`
- Read by:
  - `GET /api/agents`
  - frontend `/agents`, `/chat`
- Safe Mode: same file behavior as live.

### data/providers.json
- Status: Implemented
- Purpose: Provider metadata and model catalogs.
- Schema:
```ts
type ProviderConnection = {
  id: string;
  provider: "openai" | "anthropic" | "google" | "custom";
  displayName: string;
  createdAt: string;
  updatedAt: string;
  status: "connected" | "error" | "disabled";
  models: string[];
};
type ProvidersFile = ProviderConnection[];
```
- Example:
```json
[]
```
- Written by:
  - `POST /api/providers`
- Read by:
  - `GET /api/providers`
  - `GET /api/providers/:id/models`
  - frontend `/settings/providers`, `/agents`, `BrainEditor`
- Safe Mode: same file behavior as live.

### data/conversations.json
- Status: Implemented
- Purpose: Conversation records including embedded messages per conversation.
- Schema:
```ts
type Conversation = {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};
type ConversationsFile = Conversation[];
```
- Example:
```json
[
  {
    "id": "d8df31f7-d296-4f31-a49d-79dc814f8b5f",
    "agentId": "agent-qa-001",
    "title": "QA Test Conversation",
    "createdAt": "2026-02-17T18:30:08.303Z",
    "updatedAt": "2026-02-17T18:30:08.303Z",
    "messages": []
  }
]
```
- Written by:
  - `/api/conversations*` endpoints via `ChatService`
- Read by:
  - `/api/conversations*`
  - frontend chat interface
- Safe Mode: same file behavior as live.

### data/messages.json
- Status: Implemented
- Purpose: Gateway message mirror for WS rehydration/history.
- Schema:
```ts
type Message = {
  id: string;
  conversationId: string;
  senderType: "user" | "agent" | "system";
  senderAgentId?: string;
  agentId: string;
  text: string;
  createdAt: string;
  toolCalls?: any[];
  toolResults?: any[];
  thinkingTrace?: string;
};
type MessagesFile = Message[];
```
- Example:
```json
[]
```
- Written by:
  - `src/server/gateway.ts` on `history_batch` and `chat_message`
- Read by:
  - `src/server/gateway.ts` for rehydration `request_history`
- Safe Mode:
  - Can receive mock history messages from `MockGateway`.

### data/cron.json
- Status: Implemented
- Purpose: Scheduled playbook job definitions.
- Schema:
```ts
type CronJob = {
  id: string;
  name: string;
  schedule: string;
  playbookId: string;
  enabled: boolean;
  lastRun?: string;
};
type CronFile = CronJob[];
```
- Example:
```json
[
  {
    "id": "cron-qa-001",
    "name": "QA Test Cron",
    "schedule": "0 * * * *",
    "playbookId": "test-playbook",
    "enabled": false
  }
]
```
- Written by:
  - `POST /api/cron/jobs`
  - `PATCH /api/cron/jobs/:id/toggle`
- Read by:
  - `GET /api/cron/jobs`
  - `CronRunner`
- Safe Mode: same file behavior as live.

### data/audit.json
- Status: Implemented
- Purpose: Audit log (permissions + sentinel reliability events).
- Schema:
```ts
type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  params?: unknown;
  resultSummary?: string;
};
type AuditFile = AuditLogEntry[];
```
- Example: see current `data/audit.json` (sentinel events present).
- Written by:
  - `PermissionFirewall` (`validateAndExecute`)
  - `SentinelService` (`run`, `config_update`, incidents/recovery)
- Read by:
  - `GET /api/permissions/audit`
  - frontend `/sentinel` timeline
- Safe Mode: sentinel entries include `safeMode` in params.

### data/system_health.json
- Status: Implemented
- Purpose: Sentinel health check history.
- Schema:
```ts
type HealthCheck = {
  id: string;
  timestamp: string;
  checkName: string;
  status: "ok" | "degraded" | "down";
  errorSummary: string;
  retryCount: number;
  severity: "low" | "medium" | "high" | "critical";
  source: "manual" | "cron" | "retry";
};
type SystemHealthFile = HealthCheck[];
```
- Example: see current `data/system_health.json`.
- Written by:
  - `POST /api/health/run`
  - scheduled sentinel maintenance task
- Read by:
  - `GET /api/health/checks`
  - `GET /api/health/summary`
- Safe Mode: checks are generated with safe-mode logic.

### data/sentinel_config.json
- Status: Implemented
- Purpose: Sentinel thresholds and scheduling config.
- Schema:
```ts
type SentinelConfig = {
  enabled: boolean;
  retriesBeforeEscalation: number;
  checkIntervalMinutes: number;
  maxStoredChecks: number;
};
```
- Example:
```json
{
  "enabled": true,
  "retriesBeforeEscalation": 3,
  "checkIntervalMinutes": 5,
  "maxStoredChecks": 500
}
```
- Written by:
  - `POST /api/health/config`
- Read by:
  - `GET /api/health/config`
  - summary and scheduler logic
- Safe Mode: same file behavior as live.

### data/approvals.json
- Status: Implemented but lazy-created
- Purpose: Pending/decided approval requests.
- Schema:
```ts
type ApprovalRequest = {
  id: string;
  type: "tool_call" | "playbook_run" | "skill_install";
  status: "pending" | "approved" | "rejected";
  requesterId: string;
  details: unknown;
  createdAt: string;
};
type ApprovalsFile = ApprovalRequest[];
```
- Example:
```json
[]
```
- Written by:
  - `PermissionFirewall.createApprovalRequest`
  - `POST /api/permissions/approvals/:id` (status update)
- Read by:
  - `GET /api/permissions/approvals`
- Safe Mode: same file behavior as live.

---

## Requested Files Not Implemented Yet (Proposed Schemas)

### data/skills.json
- Status: Proposed (`TODO`)
- Purpose: Persistent skill catalog (imported + marketplace).
- Proposed schema:
```ts
type SkillsFile = Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  inputsSchemaName: string;
  permissions: string[];
  origin: "imported" | "marketplace";
  createdAt: string;
  updatedAt: string;
}>;
```

### data/playbooks.json
- Status: Partially used (`read path exists`, no CRUD endpoints)
- Purpose: Playbook definitions.
- Proposed/assumed schema from `Playbook` type:
```ts
type PlaybooksFile = Array<{
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    agentId: string;
    skillId?: string;
    instruction: string;
  }>;
  webhookUrl?: string;
  createdAt: string;
}>;
```

### data/swarms.json
- Status: Proposed (`TODO`)
- Purpose: Swarm template storage.
- Proposed schema:
```ts
type SwarmsFile = Array<{
  id: string;
  name: string;
  description?: string;
  routerAgentId: string;
  workerAgentIds: string[];
}>;
```

### data/memoryIndex.json
- Status: Proposed (`TODO`)
- Purpose: Local memory index metadata.
- Proposed schema:
```ts
type MemoryIndexFile = Array<{
  id: string;
  source: string;
  summary: string;
  embeddingRef?: string;
  createdAt: string;
  updatedAt: string;
}>;
```

### data/imperialVault.json
- Status: Proposed (`TODO`)
- Purpose: Imperial Vault detection + runtime status.
- Proposed schema:
```ts
type ImperialVaultFile = {
  detected: boolean;
  basePath?: string;
  scriptsPath?: string;
  statePath?: string;
  deliverablesPath?: string;
  scannedAt?: string;
  agents?: Array<"intel" | "historian" | "footage">;
};
```

---

## Additional Runtime Artifacts (Optional/Conditional)

### data/import_report.json
- Status: Conditional (created when importer is manually run)
- Source: `src/lib/openclawImporter.ts`
- Notes: currently not exposed by a dedicated backend API route.

---

## Safe Mode vs Live Data Notes
- Safe Mode does not swap storage files; it changes runtime behavior (mock gateway, blocked tool actions).
- Data is always persisted to the same `data/*.json` paths.
- Before manual repairs, backup files first (`.bak` copy).

