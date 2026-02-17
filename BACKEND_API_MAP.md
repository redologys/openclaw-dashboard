# Backend API Map

Base URL: `http://localhost:3001`

Transport:
- HTTP JSON under `/api/*` (Express app in `src/server/app.ts`).
- SSE stream at `GET /api/browser/events`.
- No inbound WebSocket endpoint for browser clients.
- Backend maintains an outbound WebSocket client to the OpenClaw gateway (`src/server/gateway.ts`).

## Gateway & Health
- `GET /api/gateway/status` - Returns gateway connection snapshot (`connected`, `latency`, reconnect attempts) and `safeMode`. Data: no `data/*.json` file.
- `GET /api/health/checks` - Returns latest per-check Sentinel results. Data: reads `data/system_health.json`.
- `GET /api/health/summary` - Returns aggregate status (`OK`/`DEGRADED`/`DOWN`) and counts. Data: reads `data/system_health.json`, `data/sentinel_config.json`.
- `POST /api/health/run` - Triggers manual/retry Sentinel check run. Data: reads `data/system_health.json`, `data/sentinel_config.json`; writes `data/system_health.json`, `data/audit.json`.
- `GET /api/health/config` - Returns Sentinel thresholds/config. Data: reads `data/sentinel_config.json`.
- `POST /api/health/config` - Updates Sentinel thresholds/config. Data: writes `data/sentinel_config.json`, appends `data/audit.json`.

## Agents
- `GET /api/agents` - List agents. Data: reads `data/agents.json`.
- `POST /api/agents` - Create agent. Data: writes `data/agents.json`.
- `PUT /api/agents/:id` - Update agent. Data: writes `data/agents.json`.
- `DELETE /api/agents/:id` - Delete agent. Data: writes `data/agents.json`.
- `GET /api/status/agents` - Returns in-memory heartbeat statuses. Data: no `data/*.json` file.
- `POST /api/status/heartbeat/:agentId` - Records in-memory heartbeat timestamp. Data: no `data/*.json` file.

## Skills
- `GET /api/skills` - Lists skills from in-memory `SkillsRegistry` scan. Data: no `data/*.json` file (reads skills directory on disk, not `data/`).

## Playbooks
- `POST /api/webhooks/playbook/:id` - Triggers a playbook run by id. Data: reads `data/playbooks.json`; may append `data/audit.json` and `data/approvals.json` through permission checks during execution.

## Cron Jobs
- `GET /api/cron/jobs` - Lists cron jobs. Data: reads `data/cron.json`.
- `POST /api/cron/jobs` - Adds cron job. Data: writes `data/cron.json`.
- `PATCH /api/cron/jobs/:id/toggle` - Enables/disables cron job. Data: writes `data/cron.json`.

Background maintenance:
- `sentinel-health-check` task is registered in `src/server/index.ts` and evaluated in `src/lib/cronRunner.ts`; when due, it runs Sentinel checks and writes `data/system_health.json` and `data/audit.json`.

## Permissions & Security
- `GET /api/permissions/rules` - Returns in-memory default rule set. Data: no `data/*.json` file.
- `GET /api/permissions/approvals` - Lists pending approvals. Data: reads `data/approvals.json`.
- `POST /api/permissions/approvals/:id` - Approve/reject request. Data: writes `data/approvals.json`.
- `GET /api/permissions/audit` - Returns audit log entries. Data: reads `data/audit.json`.

## Chat & Messages
- `GET /api/conversations` - Lists conversations (optional `agentId` filter). Data: reads `data/conversations.json`.
- `POST /api/conversations` - Creates conversation. Data: writes `data/conversations.json`.
- `GET /api/conversations/:id` - Gets conversation details/messages. Data: reads `data/conversations.json`.
- `POST /api/conversations/:id/messages` - Appends message to conversation. Data: writes `data/conversations.json`.
- `PATCH /api/conversations/:id/agent` - Switches conversation agent. Data: writes `data/conversations.json`.
- `DELETE /api/conversations/:id` - Deletes conversation. Data: writes `data/conversations.json`.

## Browser & Remote Control
- `GET /api/browser/screenshot` - Gets browser screenshot (placeholder in Safe Mode). Data: no `data/*.json` file.
- `GET /api/browser/state` - Gets current browser state snapshot. Data: no `data/*.json` file.
- `GET /api/browser/events` - SSE stream of browser-related events. Data: no `data/*.json` file.
- `POST /api/browser/click` - Sends browser click tool call (blocked in Safe Mode). Data: no `data/*.json` file.
- `POST /api/browser/navigate` - Sends browser navigate tool call (blocked in Safe Mode). Data: no `data/*.json` file.
- `POST /api/ssh/execute` - Executes remote command through backend SSH client (mocked in Safe Mode). Data: no `data/*.json` file.

## Memory
- No `/api/memory/*` routes are currently implemented in `src/server`.
- `src/lib/supermemory.ts` exists but is not wired to backend HTTP routes.

## Imperial Vault
- No `/api/imperial-vault/*` routes are currently implemented in `src/server`.
- Imperial Vault overlay control currently uses shared endpoint `POST /api/ssh/execute`.

## Workspace Import
- No HTTP endpoint currently exposes import/sync execution.
- `runOpenClawImport` exists in `src/lib/openclawImporter.ts` and can write `data/import_report.json` when called programmatically.

## Gateway-touching endpoints
These paths ultimately interact with the gateway client (`src/server/gateway.ts`) instead of only local JSON:
- `POST /api/webhooks/playbook/:id` (playbook runner emits gateway chat/tool flow)
- `GET /api/browser/screenshot` (calls gateway tool `browser_screenshot` when not in placeholder path)
- `POST /api/browser/click` (calls gateway tool `browser_click`)
- `POST /api/browser/navigate` (calls gateway tool `browser_navigate`)
- `GET /api/gateway/status` reads gateway connection state (status read only; no tool call)

## Data Files
- `data/agents.json` - Agent definitions; used by `GET/POST/PUT/DELETE /api/agents`.
- `data/playbooks.json` - Playbook definitions; read by `POST /api/webhooks/playbook/:id`.
- `data/conversations.json` - Conversation records + stored chat messages; used by `/api/conversations*`.
- `data/cron.json` - Cron job definitions; used by `/api/cron/jobs*`.
- `data/system_health.json` - Sentinel health check history; used by `/api/health/checks`, `/api/health/summary`, `/api/health/run`, and scheduled Sentinel runs.
- `data/sentinel_config.json` - Sentinel thresholds/scheduling settings; used by `/api/health/config`, `/api/health/summary`, `/api/health/run`.
- `data/audit.json` - Audit/reliability/security events; read by `/api/permissions/audit`, appended by Sentinel runs/config updates and permission firewall activity.
- `data/approvals.json` - Approval queue; used by `/api/permissions/approvals*` and permission firewall writes.
- `data/messages.json` - Gateway message mirror used for WS rehydration/history in `GatewayClient`; not currently exposed via HTTP route.
- `data/import_report.json` - OpenClaw import scan report when importer runs; currently no route serves it.

## Planned but not implemented
- `/api/memory/*` endpoints.
- `/api/imperial-vault/*` endpoints.
- Playbook CRUD endpoints (`GET/POST/PUT/DELETE /api/playbooks`).
- Skill install/sync endpoints beyond `GET /api/skills`.
