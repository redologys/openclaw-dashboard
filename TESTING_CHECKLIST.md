# TESTING_CHECKLIST

Post-deployment verification checklist.

Source mapping:
- 24 total checks = QA audit Phase 0 (2 checks) + Checkpoints 1-22.
- This checklist preserves all 24 while marking current `TODO`/not-implemented areas clearly.

## Phase 0 - Environment and Gateway (Checks 01-02)

### [ ] Check 01 - Start Services in Selected Mode
- Steps:
  1. Start backend and frontend.
  2. Confirm ports are listening (`3001`, `3000`).
- Expected:
  - Backend starts from `src/server/index.ts`.
  - Frontend starts from Vite.

### [ ] Check 02 - Verify Gateway Status Endpoint
- Steps:
```bash
curl http://localhost:3001/api/gateway/status
```
- Expected:
  - JSON includes `connected`, `latency`, `reconnectAttempts`, `safeMode`, `gatewayUrl`.
  - In production: `safeMode=false`.

## Phase 1 - Core Interface (Checks 03-06)

### [ ] Check 03 - Main Dashboard (`/`)
- Steps:
  - Open `/`
  - Inspect browser console.
- Expected:
  - Page loads, layout visible, no blocking console errors.

### [ ] Check 04 - Layout Persistence
- Steps:
  - Modify dashboard layout (if drag/drop exposed), refresh page.
- Expected:
  - Current behavior is mostly local UI state; persistent storage is limited.
  - Mark regression if layout crashes or fails to render.

### [ ] Check 05 - Agents Page (`/agents`)
- Steps:
  - Open `/agents`
  - Verify list and detail panel load.
- Expected:
  - Agents render from `GET /api/agents`.
  - Provider/model badge appears when configured.

### [ ] Check 06 - Chat Page (`/chat`)
- Steps:
  - Open `/chat`, select agent, send message.
- Expected:
  - Page renders and conversation list fetch works.
  - Note: send flow is still partially mock in current build.

## Phase 2 - System Components (Checks 07-10)

### [ ] Check 07 - Skills Surface
- Steps:
  - In `/agents` -> Brain tab, verify Skill Matrix loads.
- Expected:
  - `GET /api/skills` succeeds.
- Note:
  - Dedicated `/skills` route is not implemented in current router.

### [ ] Check 08 - Playbooks Surface
- Steps:
  - Verify playbook trigger endpoint via API.
```bash
curl -X POST http://localhost:3001/api/webhooks/playbook/<id> \
  -H "Content-Type: application/json" \
  -d '{}'
```
- Expected:
  - Endpoint exists; response depends on `data/playbooks.json` content.
- Note:
  - Dedicated `/playbooks` route is not implemented in current router.

### [ ] Check 09 - Browser Page (`/browser`)
- Steps:
  - Open `/browser`
  - Watch screenshot/state updates.
- Expected:
  - `/api/browser/state`, `/api/browser/screenshot`, `/api/browser/events` reachable.
  - In Safe Mode: placeholder screenshot + disabled interactions.

### [ ] Check 10 - Dev Page (`/dev` and `/dev/approvals`)
- Steps:
  - Open `/dev`
  - Open `/dev/approvals`
- Expected:
  - Approvals page fetches pending approvals.
  - Dev main page currently contains mock sections.

## Phase 3 - Imperial Vault Routes (Checks 11-19)

### [ ] Check 11 - Imperial Vault Hub (`/imperial-vault`)
- Expected: page loads without route errors.

### [ ] Check 12 - IV Pipeline (`/imperial-vault/pipeline`)
- Expected: page loads.

### [ ] Check 13 - IV Calendar (`/imperial-vault/calendar`)
- Expected: page loads.

### [ ] Check 14 - IV Intel/Intelligence (`/imperial-vault/intel`, `/imperial-vault/intelligence`)
- Expected: both pages load.

### [ ] Check 15 - IV Footage (`/imperial-vault/footage`)
- Expected: page loads.

### [ ] Check 16 - IV Music (`/imperial-vault/music`)
- Expected: page loads.

### [ ] Check 17 - IV Discord (`/imperial-vault/discord`)
- Expected: page loads.

### [ ] Check 18 - IV Overlay (`/imperial-vault/overlay`)
- Steps:
  - Trigger render action.
- Expected:
  - Calls `POST /api/ssh/execute`.
  - In Safe Mode returns mocked execution behavior.

### [ ] Check 19 - IV Cookies (`/imperial-vault/cookies`)
- Expected: page loads.

## Phase 4 - Advanced Features (Checks 20-24)

### [ ] Check 20 - Analytics (`/analytics`)
- Expected: page and charts render.

### [ ] Check 21 - Memory Hub (`/memory`)
- Expected: page loads (backend memory API currently TODO).

### [ ] Check 22 - Monitoring/Sentinel (`/sentinel`)
- Steps:
  - Open `/sentinel`
  - Run full health check
  - Save thresholds
- Expected:
  - Uses `/api/health/*` and `/api/permissions/audit`.
  - `data/system_health.json` and `data/sentinel_config.json` update.

### [ ] Check 23 - Swarm/Agent Visualization
- Expected:
  - Visualization widgets/pages render if present.
  - No runtime crashes.

### [ ] Check 24 - Additional Routes
- Steps:
  - Open:
    - `/pipelines`
    - `/imperial-vault/alerts`
    - `/imperial-vault/facts`
    - `/imperial-vault/sandbox`
    - `/imperial-vault/terminal`
    - `/imperial-vault/viral-score`
- Expected:
  - All routes resolve and render.

---

## API Smoke Test Script
```bash
#!/usr/bin/env bash
set -euo pipefail

base="http://localhost:3001"
endpoints=(
  "/api/gateway/status"
  "/api/health/summary"
  "/api/health/checks"
  "/api/providers"
  "/api/agents"
  "/api/conversations"
  "/api/skills"
  "/api/permissions/rules"
  "/api/permissions/approvals"
  "/api/permissions/audit"
  "/api/cron/jobs"
)

for ep in "${endpoints[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$base$ep")
  echo "$ep -> $code"
done
```

## Route Smoke Test List
```text
/
/agents
/chat
/browser
/dev
/dev/approvals
/analytics
/memory
/pipelines
/settings
/settings/providers
/sentinel
/imperial-vault
/imperial-vault/pipeline
/imperial-vault/calendar
/imperial-vault/intel
/imperial-vault/intelligence
/imperial-vault/footage
/imperial-vault/music
/imperial-vault/discord
/imperial-vault/overlay
/imperial-vault/cookies
/imperial-vault/alerts
/imperial-vault/facts
/imperial-vault/sandbox
/imperial-vault/terminal
/imperial-vault/viral-score
```

