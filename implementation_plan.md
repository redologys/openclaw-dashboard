# Implementation Plan - OpenClaw Command Center

## Goal Description

Build a production-ready OpenClaw Command Center & Automation Dashboard. This is a full-stack application serving as a bridge between the user (browser) and the OpenClaw Gateway. It features multi-agent orchestration, a dual-WebSocket architecture, file-based persistence, and a high-performance React 19 UI.

## Proposed Changes

### 1. Project Scaffolding

- Initialize a new project using `npm create @tanstack/start@latest` (or manual setup if needed for custom server).
- Configure Tailwind CSS.
- Set up `TsConfig` with strict mode.
- Install dependencies: `zod`, `ws`, `express` (or similar for custom server), `lucide-react`, etc.

### 3. Frontend Dashboard (React 19 + TanStack Start)

- **Layout Engine (Backbone):** [LayoutBuilder](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/components/dashboard/LayoutBuilder.tsx#30-86) drives Dashboard, Monitoring, and Chat Sidebar.
- **Versioning:** Support for named layout presets (e.g., "Ops", "Dev") persisted to `data/layouts.json`.
- **Widget Configuration:** `dataMode` (mock/live), refresh interval, and specialized settings per widget.
- **Routing:** File-based routing via `@tanstack/react-router`.
- **Theme:** Dynamic accent color picker, persisted user preferences.

### 4. Operations, Safety & Connectivity

- **Mission Control:** Enhanced activity feed with type/severity filters and "jump-to-chat".
- **Cron Ops:** Visual calendar with history, missed run counts, and manual run/pause controls.
- **Permission Firewall (Central Gate):** Unified rules engine for all high-risk actions (Web, Shell, Files). Support for time-bound and approval-based rules.
- **Gateway Debug:** Live log streaming (WebSocket/SSE) with regex filtering and pattern saving.
- **Connectivity Hardening:** Dual connection health indicators (Browser<->Server, Server<->Gateway).
- **Optimized Rehydration:** `sessionIndex.json` for fast loading, lazy interaction history.

### 5. Multi-Agent Ergonomics & Metrics

- **Chat Interface:** Agent handoff indicators, "Convert to Playbook" quick action.
- **Playbooks:** Dry Run mode, auto-generation from Swarm configs.
- **Metrics:** Priority on Gateway Health, Provider Latency/Cost, and Token Usage. Defer non-critical widgets.

#### [NEW] [src/components/dashboard/LayoutBuilder.tsx](file:///src/components/dashboard/LayoutBuilder.tsx)

- Primary layout engine for Dashboard and Chat Sidebar.
- Supports switching between Layout Presets.

#### [Imperial Vault Integration]

Integrated sub-dashboard for YouTube Shorts pipeline (Imperial Vault).

#### [NEW] [route.tsx](file:///src/routes/imperial-vault/route.tsx) - Layout wrapper

#### [NEW] [index.tsx](file:///src/routes/imperial-vault/index.tsx) - Hub Dashboard

#### [NEW] [pipeline.tsx](file:///src/routes/imperial-vault/pipeline.tsx) - Feature 1

#### [NEW] [calendar.tsx](file:///src/routes/imperial-vault/calendar.tsx) - Feature 2

#### [NEW] [intel.tsx](file:///src/routes/imperial-vault/intel.tsx) - Feature 3

#### [NEW] [footage.tsx](file:///src/routes/imperial-vault/footage.tsx) - Feature 4

#### [NEW] [music.tsx](file:///src/routes/imperial-vault/music.tsx) - Feature 5

#### [NEW] [discord.tsx](file:///src/routes/imperial-vault/discord.tsx) - Feature 6

### Phase 8 Finalization: Production-Grade Enhancements

#### [MODIFY] [calendar.tsx](file:///src/routes/imperial-vault/calendar.tsx)
- **Streak History**: Add a yearly heatmap for consistency tracking.
- **Detailed Slots**: Expand calendar cells to show specific content status (Draft, Rendring, Posted).
- **Performance Feed**: Recent post performance log with viral coefficient.

#### [MODIFY] [intel.tsx](file:///src/routes/imperial-vault/intel.tsx)
- **Trend Matrix**: Visual heatmap of topic performance across competitors.
- **Hook Analysis**: Database of top-performing hooks from monitored channels.
- **Gap Detection**: automated "Topic Gap" suggestions based on competitor overlap.

#### [MODIFY] [Sidebar.tsx](file:///src/components/layout/Sidebar.tsx) - Add navigation item

#### [NEW] [src/components/ops/MissionControl.tsx](file:///src/components/ops/MissionControl.tsx)

- Activity feed with advanced filtering and "Jump to Session" actions.

#### [NEW] [src/components/ops/GatewayDebug.tsx](file:///src/components/ops/GatewayDebug.tsx)

- Live log viewer with regex support.

#### [NEW] [src/components/admin/PermissionFirewall.tsx](file:///src/components/admin/PermissionFirewall.tsx)

- Visual rules editor and audit log viewer.
- "Why?" explanation for blocked actions.

#### [NEW] [src/lib/permissions.ts](file:///src/lib/permissions.ts)

- Core logic for evaluating [PermissionRule](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/types.ts#214-229) against tool calls.

#### [NEW] [src/lib/monitoring.ts](file:///src/lib/monitoring.ts)

- Backend helpers for collecting system stats and AI metrics.

- Add types for [DashboardLayout](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/types.ts#167-175), [WidgetConfig](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/types.ts#148-156), [SystemStats](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/types.ts#178-191), [PermissionRule](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/types.ts#214-229).

### 2. Backend Architecture (`src/server`)

- **Custom Server**: A Node.js entry point that spins up the HTTP server for the app and a WebSocket server for the client.
- **Gateway Client**: A persistent WebSocket client connecting to the OpenClaw Gateway.
  - **OCMP Implementation**: Explicitly handle `session_created`, `tool_call_request`, `provider_status_update` events.
- **Bridge**: Logic to route messages between the Client WS and Gateway WS.
- **Session Rehydration**: On client reconnect, read [data/messages.json](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/data/messages.json) and query Gateway for active sessions to replay state to the browser.
- **Persistence**: Simple `fs` based read/write for `data/*.json` files.

### 3. Core Logic (`src/lib`)

- **Config**: Zod-validated env var loading.
- **Types**: Shared types for Agents, Messages, Skills.
- **Skills System**:
  - [skillsRegistry.ts](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/skillsRegistry.ts): Auto-discover skills from `skills/` directory.
  - [clawdhubClient.ts](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/clawdhubClient.ts): Mock search/install for skills.
  - `skillScanner.ts`: Scan for dangerous patterns and feed into approvals queue.
- **Supermemory**: [supermemory.ts](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/supermemory.ts) adapter for index/search using API key.
- **Orchestration**:
  - Playbooks with webhook trigger support (`/api/webhooks/playbook/:id`).
  - Multi-Agent chatting logic.
  - **Agent Management**:
    - `POST /api/agents` (Create), `PUT /api/agents/:id` (Update), `DELETE /api/agents/:id` (Remove).
    - Persist to `data/agents.json`.
  - **OpenClaw Import & Sync**:
    - [openclawImporter.ts](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/src/lib/openclawImporter.ts): Scan local `openclaw.json` / workspace for agents, skills, and playbooks.
    - **Swarm Detection**: Map multi-agent configs to `data/swarms.json` (Swarm Templates).
    - **Skill Sync**: Catalog imported skills in `data/skills.json` (mark as "imported").
  - **Chat Assignment**:
    - `POST /api/chat` requires `agentId`.
    - Conversations tied to `agentId`. Allow switching agents mid-conversation (record new `agentId` for subsequent messages).
    - Auto-create "Quick Start" conversations for imported agents.

- **Data Structure**:
  - `data/agents.json`: Agent definitions (id, name, description, systemPrompt, model, skills, canTalkToAgents, heartbeatEnabled).
  - `data/skills.json`: Installed skills metadata (supports `origin: "imported" | "marketplace"`).
  - [data/messages.json](file:///C:/Users/reds%27/.gemini/antigravity/scratch/openclaw_command_center/data/messages.json): Chat history (extended with `agentId`).
  - `data/swarms.json`: "Swarm Templates" derived from OpenClaw configs.
  - `data/playbooks.json`: Automation scripts.
  - `data/audit.json`: System audit logs.
  - `data/cron.json`: Scheduled tasks.
  - `data/contexts.json`: Context packs.
  - `data/memoryIndex.json`: Local memory index.
  - `data/approvals.json`: Pending approvals queue.

### 4. Frontend Architecture (`src/app`)

- **Layout**: Sidebar navigation, Topbar with model switcher.
- **Pages**:
  - `/`: Dashboard (Activity Feed, Metrics, Latency Heatmap).
    - **Monitoring**: Provider metrics charts, latency heatmap, "Cost-Efficiency Router" toggle.
    - **Quick Start**: List of auto-created chats for imported agents.
  - `/chat`: Main chat interface.
    - **Agent Selector**: Dropdown to assign agent to chat. Show current agent.
    - **Switching**: Allow changing agent mid-conversation.
  - `/agents`: Agent management.
    - List view with "New Agent" (Drawer/Modal) and "Edit" buttons.
    - **Shortcuts**: "Start Chat", "Run Playbook" quick actions per agent.
  - `/skills`: Marketplace (with install/scan/import status) and installed skills.
    - Toggle imported skills per-agent.
  - `/playbooks`: Automation builder/runner.
  - `/dev`: Developer tools including "Approvals Queue" and **Safe Mode** toggle.
  - **Setup Wizard**:
    - "Connect & Import from OpenClaw" flow (Gateway URL/Token, Paths).
    - Preview and confirm imports.
- **Components**: Reusable UI components (using Tailwind).

### 5. Config & Safety

- **Safe Mode**: Toggle in config (`SAFE_MODE=true`).
  - Uses Mock Gateway client (simulated events/responses).
  - Disables real OpenClaw/Skill execution.

## Verification Plan

### Automated Tests

- Basic unit tests for Config loading and Type validation.
- Mock tests for Playbook execution logic.

### Manual Verification

- **Startup**: Run `npm run dev` and ensure server starts.
- **Connectivity**: Verify WebSocket connection from Browser to Server.
- **OCMP**: Open a test page to view raw gateway events (`session_created`, `provider_status_update`).
- **Rehydration**: Kill/restart server during active chat, reload browser, verify messages/thinking traces reappear.
- **Webhook**: Curl `POST /api/webhooks/playbook/:id` and verify playbook run in Activity Feed.
- **UI Interaction**: Navigate all pages, create a dummy agent, run a dummy playbook.
