# API_COMPLETE_REFERENCE

This reference is derived from current backend code in `src/server/app.ts` and `src/server/browserStream.ts`.

Base URL: `http://localhost:3001`

Global defaults:
- Authentication required: `No` (all endpoints currently unauthenticated)
- Rate limits: `None implemented`
- Content type: JSON unless noted

---

## Gateway and Health

### GET /api/gateway/status
- Description: Return backend-to-gateway connection status and mode.
- Request body schema: `None`
- Response schema:
```ts
{
  connected: boolean;
  latency: number;
  reconnectAttempts: number;
  safeMode: boolean;
  gatewayUrl: string;
}
```
- Example:
```bash
curl http://localhost:3001/api/gateway/status
```
- Called by UI: not directly called by current frontend routes.
- Safe Mode behavior: `safeMode=true`; connection typically uses `MockGateway`.
- Authentication required: No
- Rate limits: None

### GET /api/health/checks
- Description: Return latest health check result per check name.
- Request body schema: `None`
- Response schema:
```ts
Array<{
  id: string;
  timestamp: string;
  checkName: string;
  status: "ok" | "degraded" | "down";
  errorSummary: string;
  retryCount: number;
  severity: "low" | "medium" | "high" | "critical";
  source: "manual" | "cron" | "retry";
}>
```
- Example:
```bash
curl http://localhost:3001/api/health/checks
```
- Called by UI: `/sentinel`
- Safe Mode behavior: checks are computed with Safe Mode assumptions.
- Authentication required: No
- Rate limits: None

### GET /api/health/summary
- Description: Return aggregate sentinel health summary.
- Request body schema: `None`
- Response schema:
```ts
{
  overallStatus: "OK" | "DEGRADED" | "DOWN";
  counts: { ok: number; degraded: number; down: number };
  failingChecks: number;
  totalChecks: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  safeMode: boolean;
}
```
- Example:
```bash
curl http://localhost:3001/api/health/summary
```
- Called by UI: `/sentinel`
- Safe Mode behavior: includes `safeMode: true` when enabled.
- Authentication required: No
- Rate limits: None

### POST /api/health/run
- Description: Run all checks, or one check when `checkName` provided.
- Request body schema:
```ts
{
  checkName?: string;
}
```
- Response schema:
```ts
{
  checks: HealthCheck[];
  summary: HealthSummary;
}
```
- Example:
```bash
curl -X POST http://localhost:3001/api/health/run \
  -H "Content-Type: application/json" \
  -d '{"checkName":"gateway"}'
```
- Called by UI: `/sentinel` (full run + per-check retry)
- Safe Mode behavior: safe-mode check logic; no dangerous actions executed.
- Authentication required: No
- Rate limits: None

### GET /api/health/config
- Description: Get sentinel configuration thresholds.
- Request body schema: `None`
- Response schema:
```ts
{
  enabled: boolean;
  retriesBeforeEscalation: number;
  checkIntervalMinutes: number;
  maxStoredChecks: number;
}
```
- Example:
```bash
curl http://localhost:3001/api/health/config
```
- Called by UI: `/sentinel`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/health/config
- Description: Update sentinel configuration thresholds.
- Request body schema:
```ts
Partial<{
  enabled: boolean;
  retriesBeforeEscalation: number;
  checkIntervalMinutes: number;
  maxStoredChecks: number;
}>
```
- Response schema: same as `GET /api/health/config`
- Example:
```bash
curl -X POST http://localhost:3001/api/health/config \
  -H "Content-Type: application/json" \
  -d '{"retriesBeforeEscalation":4,"checkIntervalMinutes":10}'
```
- Called by UI: `/sentinel`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## Providers

### GET /api/providers
- Description: List provider connection metadata from `data/providers.json`.
- Request body schema: `None`
- Response schema:
```ts
Array<{
  id: string;
  provider: "openai" | "anthropic" | "google" | "custom";
  displayName: string;
  createdAt: string;
  updatedAt: string;
  status: "connected" | "error" | "disabled";
  models: string[];
}>
```
- Example:
```bash
curl http://localhost:3001/api/providers
```
- Called by UI: `/settings/providers`, `/agents`, `BrainEditor`
- Safe Mode behavior: same as live (local file-backed).
- Authentication required: No
- Rate limits: None

### GET /api/providers/:id/models
- Description: Return model IDs for one provider connection.
- Request body schema: `None`
- Response schema:
```ts
string[]
```
- Example:
```bash
curl http://localhost:3001/api/providers/openai-main/models
```
- Called by UI: `BrainEditor` provider-model selector
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/providers
- Description: Create or update provider metadata (OAuth not implemented here).
- Request body schema:
```ts
{
  id?: string;
  provider: "openai" | "anthropic" | "google" | "custom";
  displayName: string;
  status?: "connected" | "error" | "disabled";
  models?: string[];
}
```
- Response schema: `ProviderConnection`
- Example:
```bash
curl -X POST http://localhost:3001/api/providers \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","displayName":"OpenAI Main","models":["gpt-4.1","gpt-4o-mini"]}'
```
- Called by UI: `/settings/providers` add/edit dialog
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## Agents

### GET /api/agents
- Description: List all agents from `data/agents.json`.
- Request body schema: `None`
- Response schema:
```ts
Agent[]
```
- Example:
```bash
curl http://localhost:3001/api/agents
```
- Called by UI: `/agents`, `/chat`
- Safe Mode behavior: same as live (local file).
- Authentication required: No
- Rate limits: None

### POST /api/agents
- Description: Create an agent.
- Request body schema:
```ts
{
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
}
```
- Response schema: created `Agent`
- Example:
```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","name":"Ops Agent","role":"ops","systemPrompt":"...","skills":[],"canTalkToAgents":true}'
```
- Called by UI: create button exists but create flow not wired yet.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### PUT /api/agents/:id
- Description: Update an existing agent.
- Request body schema: `Partial<Agent>`
- Response schema: updated `Agent`
- Example:
```bash
curl -X PUT http://localhost:3001/api/agents/agent-1 \
  -H "Content-Type: application/json" \
  -d '{"providerId":"openai-main","model":"gpt-4o-mini"}'
```
- Called by UI: `BrainEditor`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### DELETE /api/agents/:id
- Description: Delete agent by id.
- Request body schema: `None`
- Response schema: empty (`204`)
- Example:
```bash
curl -X DELETE http://localhost:3001/api/agents/agent-1 -i
```
- Called by UI: delete flow not currently wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## Playbooks and Conversations

### POST /api/webhooks/playbook/:id
- Description: Trigger a playbook run by id.
- Request body schema:
```ts
Record<string, any> // variables payload
```
- Response schema:
```ts
{ runId: string; status: "queued" }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/webhooks/playbook/playbook-1 \
  -H "Content-Type: application/json" \
  -d '{"topic":"rome"}'
```
- Called by UI: not currently wired directly.
- Safe Mode behavior: executes against mock gateway when `SAFE_MODE=true`.
- Authentication required: No
- Rate limits: None

### GET /api/conversations
- Description: List conversations, optionally filtered by `agentId`.
- Request body schema: `None`
- Query params: `agentId?: string`
- Response schema: `Conversation[]`
- Example:
```bash
curl "http://localhost:3001/api/conversations?agentId=agent-1"
```
- Called by UI: `ChatInterface`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/conversations
- Description: Create conversation for agent.
- Request body schema:
```ts
{ agentId: string; title?: string }
```
- Response schema: created `Conversation`
- Example:
```bash
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-1","title":"New Conversation"}'
```
- Called by UI: create flow currently limited.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### GET /api/conversations/:id
- Description: Get full conversation object by id.
- Request body schema: `None`
- Response schema: `Conversation`
- Example:
```bash
curl http://localhost:3001/api/conversations/<conversation-id>
```
- Called by UI: `ChatInterface`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/conversations/:id/messages
- Description: Append message to conversation.
- Request body schema:
```ts
{
  id: string;
  conversationId: string;
  senderType: "user" | "agent" | "system";
  agentId: string;
  text: string;
  createdAt: string;
  senderAgentId?: string;
  toolCalls?: any[];
  toolResults?: any[];
  thinkingTrace?: string;
}
```
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/conversations/<id>/messages \
  -H "Content-Type: application/json" \
  -d '{"id":"m1","conversationId":"<id>","senderType":"user","agentId":"agent-1","text":"hi","createdAt":"2026-02-17T00:00:00.000Z"}'
```
- Called by UI: not currently used by send action (chat send is mostly mock).
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### PATCH /api/conversations/:id/agent
- Description: Switch active agent on conversation.
- Request body schema:
```ts
{ agentId: string }
```
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X PATCH http://localhost:3001/api/conversations/<id>/agent \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-2"}'
```
- Called by UI: not currently wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### DELETE /api/conversations/:id
- Description: Delete conversation by id.
- Request body schema: `None`
- Response schema: empty (`204`)
- Example:
```bash
curl -X DELETE http://localhost:3001/api/conversations/<id> -i
```
- Called by UI: not currently wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## Status and Cron

### GET /api/status/agents
- Description: Return in-memory heartbeat status list.
- Request body schema: `None`
- Response schema:
```ts
Array<{ agentId: string; status: "online" | "offline"; lastSeenAt: string }>
```
- Example:
```bash
curl http://localhost:3001/api/status/agents
```
- Called by UI: not directly called in current frontend.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/status/heartbeat/:agentId
- Description: Record heartbeat for specific agent id.
- Request body schema: `None`
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/status/heartbeat/agent-1
```
- Called by UI: not currently called from frontend.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### GET /api/cron/jobs
- Description: List cron jobs from `data/cron.json`.
- Request body schema: `None`
- Response schema: `CronJob[]`
- Example:
```bash
curl http://localhost:3001/api/cron/jobs
```
- Called by UI: not directly wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/cron/jobs
- Description: Add cron job.
- Request body schema:
```ts
{
  id: string;
  name: string;
  schedule: string;
  playbookId: string;
  enabled: boolean;
  lastRun?: string;
}
```
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/cron/jobs \
  -H "Content-Type: application/json" \
  -d '{"id":"job-1","name":"Hourly","schedule":"0 * * * *","playbookId":"pb-1","enabled":true}'
```
- Called by UI: not directly wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### PATCH /api/cron/jobs/:id/toggle
- Description: Enable/disable one cron job.
- Request body schema:
```ts
{ enabled: boolean }
```
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X PATCH http://localhost:3001/api/cron/jobs/job-1/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}'
```
- Called by UI: not directly wired.
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## SSH and Browser Bridge

### POST /api/ssh/execute
- Description: Execute SSH command via backend SSH client.
- Request body schema:
```ts
{ command: string }
```
- Response schema:
```ts
{ stdout: string; stderr: string; code: number | null }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/ssh/execute \
  -H "Content-Type: application/json" \
  -d '{"command":"echo hello"}'
```
- Called by UI: `/imperial-vault/overlay`
- Safe Mode behavior: returns `[MOCK] Executed: ...` output.
- Authentication required: No
- Rate limits: None

### GET /api/browser/screenshot
- Description: Return cached or fresh browser screenshot (base64).
- Request body schema: `None`
- Response schema:
```ts
{ image: string; placeholder?: boolean }
```
- Example:
```bash
curl http://localhost:3001/api/browser/screenshot
```
- Called by UI: `/browser` `BrowserPreview`
- Safe Mode behavior: always returns 1x1 placeholder image with `placeholder: true`.
- Authentication required: No
- Rate limits: None

### GET /api/browser/state
- Description: Return browser activity/state snapshot.
- Request body schema: `None`
- Response schema:
```ts
{
  active: boolean;
  url: string;
  title: string;
  agent: string;
  task: string;
  step: number;
  lastScreenshot: string | null;
}
```
- Example:
```bash
curl http://localhost:3001/api/browser/state
```
- Called by UI: `/browser` `BrowserPreview`
- Safe Mode behavior: `active` becomes `false`.
- Authentication required: No
- Rate limits: None

### GET /api/browser/events
- Description: Server-Sent Events stream for browser updates and thought traces.
- Request body schema: `None`
- Response schema: `text/event-stream` events with JSON payloads.
- Example:
```bash
curl -N http://localhost:3001/api/browser/events
```
- Called by UI: `/browser` `BrowserPreview` via `EventSource`
- Safe Mode behavior: stream still opens; events depend on emitted backend events.
- Authentication required: No
- Rate limits: None

### POST /api/browser/click
- Description: Send browser click tool call.
- Request body schema:
```ts
{ x: number; y: number }
```
- Response schema: tool payload from gateway, or error object.
- Example:
```bash
curl -X POST http://localhost:3001/api/browser/click \
  -H "Content-Type: application/json" \
  -d '{"x":100,"y":200}'
```
- Called by UI: `/browser` `BrowserPreview`
- Safe Mode behavior: returns `403` with `{ error: "Forbidden in Safe Mode" }`.
- Authentication required: No
- Rate limits: None

### POST /api/browser/navigate
- Description: Send browser navigation tool call.
- Request body schema:
```ts
{ url: string }
```
- Response schema: tool payload from gateway, or error object.
- Example:
```bash
curl -X POST http://localhost:3001/api/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```
- Called by UI: not currently called by frontend code.
- Safe Mode behavior: returns `403` with `{ error: "Forbidden in Safe Mode" }`.
- Authentication required: No
- Rate limits: None

---

## Skills and Permissions

### GET /api/skills
- Description: List scanned skills from `SkillsRegistry`.
- Request body schema: `None`
- Response schema:
```ts
Array<{
  id: string;
  name: string;
  version: string;
  description: string;
  inputsSchemaName: string;
  permissions: string[];
  origin?: "imported" | "marketplace";
}>
```
- Example:
```bash
curl http://localhost:3001/api/skills
```
- Called by UI: `BrainEditor`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### GET /api/permissions/rules
- Description: Return in-memory permission rules.
- Request body schema: `None`
- Response schema: `PermissionRule[]`
- Example:
```bash
curl http://localhost:3001/api/permissions/rules
```
- Called by UI: indirectly in dev/ops tooling (not fully wired).
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### GET /api/permissions/approvals
- Description: List pending approval requests from `data/approvals.json`.
- Request body schema: `None`
- Response schema: `ApprovalRequest[]` (pending only)
- Example:
```bash
curl http://localhost:3001/api/permissions/approvals
```
- Called by UI: `/dev/approvals`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### POST /api/permissions/approvals/:id
- Description: Approve/reject one approval request.
- Request body schema:
```ts
{ status: "approved" | "rejected" }
```
- Response schema:
```ts
{ status: "ok" }
```
- Example:
```bash
curl -X POST http://localhost:3001/api/permissions/approvals/<id> \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```
- Called by UI: `/dev/approvals`
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

### GET /api/permissions/audit
- Description: Return full audit log from `data/audit.json`.
- Request body schema: `None`
- Response schema: `AuditLogEntry[]`
- Example:
```bash
curl http://localhost:3001/api/permissions/audit
```
- Called by UI: `/sentinel` timeline, dev/audit flows
- Safe Mode behavior: same as live.
- Authentication required: No
- Rate limits: None

---

## Planned/TODO Endpoints (Not Implemented)
- `/api/import/run`
- `/api/import/status`
- `/api/imperial-vault/*`
- `/api/memory/*`
- `/api/playbooks` CRUD

