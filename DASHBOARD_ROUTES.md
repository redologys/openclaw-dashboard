# Dashboard Routes -> API Mapping

All routes use React Router 7 (`src/main.tsx`) and call backend endpoints through Vite proxy (`vite.config.ts`):
- Frontend origin: `http://localhost:3000`
- Backend target: `http://localhost:3001`
- Client calls are relative (`/api/...`) and proxied by Vite.

## / (Main Dashboard)
- Components: `src/routes/index.tsx` (`Dashboard`) with `Topbar` and `LayoutBuilder`.
- APIs called: none.
- Status: UI present, connection indicators currently mocked in component state.

## /agents
- Components: `src/routes/agents.tsx` -> `AgentDetail` -> `BrainEditor`.
- APIs called:
  - `GET /api/agents` (load list)
  - `GET /api/skills` (Brain tab skill matrix)
  - `PUT /api/agents/:id` (save agent prompt/config)
- Notes: Create/delete agent UI actions are visible but not wired to `POST/DELETE /api/agents` yet.

## /chat
- Components: `src/routes/chat.tsx` -> `ChatInterface`.
- APIs called:
  - `GET /api/agents`
  - `GET /api/conversations?agentId={id}`
  - `GET /api/conversations/:id`
- Notes: Message send flow in `ChatInterface` is currently mocked client-side; `POST /api/conversations/:id/messages` is not called yet.

## /memory
- Components: `src/routes/memory.tsx` -> `MemoryHub`.
- APIs called: none.
- Status: UI present, backend TODO.

## /imperial-vault (and subroutes)
- Layout: `/imperial-vault` uses `src/routes/imperial-vault/route.tsx`.
- `/imperial-vault` -> `src/routes/imperial-vault/index.tsx`; APIs: none.
- `/imperial-vault/pipeline` -> `src/routes/imperial-vault/pipeline.tsx`; APIs: none.
- `/imperial-vault/calendar` -> `src/routes/imperial-vault/calendar.tsx`; APIs: none.
- `/imperial-vault/intel` -> `src/routes/imperial-vault/intel.tsx`; APIs: none.
- `/imperial-vault/intelligence` -> `src/routes/imperial-vault/intelligence.tsx`; APIs: none.
- `/imperial-vault/footage` -> `src/routes/imperial-vault/footage.tsx`; APIs: none.
- `/imperial-vault/music` -> `src/routes/imperial-vault/music.tsx`; APIs: none.
- `/imperial-vault/discord` -> `src/routes/imperial-vault/discord.tsx`; APIs: none.
- `/imperial-vault/overlay` -> `src/routes/imperial-vault/overlay.tsx` + `OverlayStudio`; APIs: `POST /api/ssh/execute` (only when client Safe Mode is off).
- `/imperial-vault/cookies` -> `src/routes/imperial-vault/cookies.tsx`; APIs: none.
- `/imperial-vault/alerts` -> `src/routes/imperial-vault/alerts.tsx`; APIs: none.
- `/imperial-vault/facts` -> `src/routes/imperial-vault/facts.tsx`; APIs: none.
- `/imperial-vault/sandbox` -> `src/routes/imperial-vault/sandbox.tsx`; APIs: none.
- `/imperial-vault/terminal` -> `src/routes/imperial-vault/terminal.tsx`; APIs: none (terminal currently simulated UI).
- `/imperial-vault/viral-score` -> `src/routes/imperial-vault/viral-score.tsx`; APIs: none.
- Status: Most Imperial Vault pages are UI present, backend TODO (`/api/imperial-vault/*` not implemented).

## /browser
- Components: `src/routes/browser.tsx` -> `src/app/browser/index.tsx` -> `BrowserPreview`.
- APIs called:
  - `GET /api/browser/screenshot`
  - `GET /api/browser/state`
  - `GET /api/browser/events` (SSE via `EventSource`)
  - `POST /api/browser/click`
- Notes: Backend route `POST /api/browser/navigate` exists but is not called by current frontend code.

## /playbooks
- Route status: not present in `src/main.tsx`.
- APIs called: none.
- Status: planned but not implemented.

## /skills
- Route status: not present in `src/main.tsx`.
- APIs called: none as a page route.
- Notes: `GET /api/skills` is consumed inside `/agents` (`BrainEditor`).

## /dev
- Components: `src/routes/dev.tsx`.
- APIs called: none (current view uses simulated report/log data).
- Status: UI present, backend wiring TODO for import/logs surfaces.

## /dev/approvals
- Components: `src/routes/dev/approvals.tsx`.
- APIs called:
  - `GET /api/permissions/approvals`
  - `POST /api/permissions/approvals/:id`

## /settings
- Components: `src/routes/settings.tsx`.
- APIs called: none.
- Status: UI shell present.

## Additional existing routes
- `/analytics` -> `src/routes/analytics.tsx`; APIs: none.
- `/pipelines` -> `src/routes/pipelines.tsx`; APIs: none.
- `/sentinel` -> `src/routes/sentinel.tsx`; APIs:
  - `GET /api/health/summary`
  - `GET /api/health/checks`
  - `GET /api/health/config`
  - `GET /api/permissions/audit` (frontend filters `sentinel:*` events)
  - `POST /api/health/run`
  - `POST /api/health/config`

## Data Flow Rules
- Frontend uses `fetch('/api/...')` and `EventSource('/api/browser/events')`.
- Vite dev proxy forwards `/api` to `http://localhost:3001`.
- Frontend does not open a direct WebSocket to OpenClaw gateway.
- Gateway/tool operations are backend-mediated (`src/server/gateway.ts` + server endpoints).

## Safe Mode Behavior
- Backend Safe Mode (`SAFE_MODE=true`) effects:
  - Gateway client switches to `MockGateway` (`src/server/gateway.ts`).
  - `GET /api/browser/screenshot` returns placeholder image.
  - `POST /api/browser/click` and `POST /api/browser/navigate` return `403`.
  - `GET /api/browser/state` reports `active: false`.
  - `POST /api/ssh/execute` returns mocked command output.
  - Sentinel responses include `safeMode` and run checks with safe-mode logic.
- Frontend Safe Mode (`VITE_SAFE_MODE=true`) effects:
  - Browser and Imperial overlay UI disable/short-circuit actions before backend calls in several components.
  - UI still reads backend health/state via `/api`.

## Planned but not implemented
- `/playbooks` and `/skills` route pages.
- `/api/memory/*` backend routes for `/memory`.
- `/api/imperial-vault/*` backend routes for most Imperial Vault pages.
