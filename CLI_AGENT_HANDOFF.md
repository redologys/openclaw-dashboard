# CLI_AGENT_HANDOFF

## CLI Agent Instructions - OpenClaw Dashboard Deployment

You are deploying this dashboard to an Ubuntu production server and connecting it to a real OpenClaw gateway.

Read everything below as source-of-truth for the current repo state. Do not assume missing files/endpoints exist.

## Context Files to Read First
Read these in order:
1. `DEPLOYMENT_GUIDE.md`
2. `GATEWAY_INTEGRATION.md`
3. `ENV_CONFIG_REFERENCE.md`
4. `WORKSPACE_IMPORT_WORKFLOW.md`
5. `IMPERIAL_VAULT_INTEGRATION.md`
6. `API_COMPLETE_REFERENCE.md`
7. `DATA_FILES_SCHEMA.md`
8. `TROUBLESHOOTING.md`
9. `TESTING_CHECKLIST.md`

## Hard Safety Rules
- Prefer non-destructive fixes.
- Never delete or overwrite existing `data/*.json` without backup.
- Before any data rewrite:
```bash
cp data/<file>.json data/<file>.json.bak.$(date +%Y%m%d-%H%M%S)
```
- Never print real gateway tokens in logs/docs; use env vars.

## Phase 1: System Setup
- [ ] Verify Node.js 18+ installed:
```bash
node --version
npm --version
```
- [ ] Install dependencies:
```bash
npm install
```
- [ ] Ensure data directory exists:
```bash
mkdir -p data
```
- [ ] Validate data file JSON syntax:
```bash
for f in data/*.json; do jq . "$f" >/dev/null; done
```

## Phase 2: Environment Configuration
- [ ] Create `.env` from `ENV_CONFIG_REFERENCE.md` template.
- [ ] Set live values:
  - `SAFE_MODE=false`
  - `GATEWAY_URL=ws://localhost:18789`
  - `GATEWAY_TOKEN=YOUR_REAL_TOKEN_HERE`
  - `PORT=3001`
- [ ] Optional frontend env:
  - `VITE_SAFE_MODE=false`
- [ ] Verify `.gitignore` prevents accidental data commits where desired.

## Phase 3: Gateway Connection
- [ ] Verify local tunnel/listener:
```bash
ss -ltnp | grep 18789 || true
```
- [ ] Start backend:
```bash
npm run dev:backend
```
- [ ] Check gateway status:
```bash
curl http://localhost:3001/api/gateway/status
```
- [ ] Expected target:
  - `safeMode: false`
  - `gatewayUrl: ws://localhost:18789`
  - `connected: true` once gateway/tunnel/token are valid

## Phase 4: Workspace Import Reality Check
Current repo status:
- Auto-import on gateway connect is not wired yet.
- `/api/import/status` endpoint does not exist yet.

Actions:
- [ ] Confirm this gap before proceeding (do not assume import happened).
- [ ] If needed, implement importer trigger/endpoint as a separate tracked change.
- [ ] If `data/import_report.json` exists, inspect it:
```bash
cat data/import_report.json | jq .
```

## Phase 5: Frontend Launch
- [ ] Dev mode:
```bash
npm run dev
```
- [ ] Or production preview:
```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```
- [ ] Verify root route:
```bash
curl -I http://localhost:3000/
```

## Phase 6: Verification (Current Implemented Features)
- [ ] `/api/gateway/status` returns valid status object.
- [ ] `/api/agents` returns JSON array.
- [ ] `/api/providers` returns JSON array.
- [ ] `/sentinel` page loads and can run checks.
- [ ] `/settings/providers` can create/edit provider metadata.
- [ ] `/agents` Brain tab can assign provider/model and save.
- [ ] `/browser` page loads and SSE endpoint works.

Reality notes:
- `/playbooks` and `/skills` routes are not currently frontend routes.
- `/api/imperial-vault/*` and `/api/import/*` are not implemented.

## Phase 7: Production Setup with PM2
- [ ] Install PM2:
```bash
sudo npm install -g pm2
```
- [ ] Create `ecosystem.config.cjs` using `DEPLOYMENT_GUIDE.md`.
- [ ] Start services:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
- [ ] Reboot test:
```bash
sudo reboot
```
- [ ] After reboot, confirm:
```bash
pm2 status
curl http://localhost:3001/api/gateway/status
```

## Success Criteria
- [ ] Backend reachable on `3001`
- [ ] Frontend reachable on `3000`
- [ ] `safeMode=false` in gateway status
- [ ] Gateway shows connected in live mode
- [ ] Provider registry works (`/api/providers`)
- [ ] Agent provider/model assignment works end-to-end
- [ ] Sentinel checks run and persist history
- [ ] Services survive reboot via PM2

## If Something Breaks
1. Check process logs:
```bash
pm2 logs
```
2. Check gateway status:
```bash
curl http://localhost:3001/api/gateway/status
```
3. Check env:
```bash
cat .env
```
4. Validate JSON files:
```bash
for f in data/*.json; do echo "$f"; jq . "$f" >/dev/null || echo "Invalid"; done
```
5. Follow `TROUBLESHOOTING.md`.

