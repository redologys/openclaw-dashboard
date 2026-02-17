# TROUBLESHOOTING

This runbook is aligned to the current codebase and deployment model.

## Safety Rule (Always)
- Prefer non-destructive fixes first.
- Never delete or overwrite `data/*.json` blindly.
- Before edits/reset, create backup:
```bash
cp data/<file>.json data/<file>.json.bak.$(date +%Y%m%d-%H%M%S)
```

## 1) Gateway Will Not Connect

### Symptoms
- `GET /api/gateway/status` shows `connected: false`
- Backend logs show WebSocket errors/reconnect attempts

### Checks
```bash
cat .env | egrep 'SAFE_MODE|GATEWAY_URL|GATEWAY_TOKEN'
ss -ltnp | grep 18789 || true
curl http://localhost:3001/api/gateway/status
pm2 logs openclaw-backend --lines 200
```

### Fixes
- Ensure live mode:
  - `SAFE_MODE=false`
- Ensure tunnel and gateway target:
  - `GATEWAY_URL=ws://localhost:18789`
- Verify tunnel is running:
  - `ssh -N -L 18789:localhost:18789 ubuntu@<gateway-host>`
- Verify token is correct (from secure source, not docs).

## 2) Frontend Will Not Load

### Checks
```bash
pm2 status
ss -ltnp | grep 3000 || true
npm run build
```

### Fixes
- If using preview mode, rebuild first:
  - `npm run build`
  - `npm run preview -- --host 0.0.0.0 --port 3000`
- Verify no conflicting process on port 3000.

## 3) Backend API Returns 500

### Checks
```bash
node --version
pm2 logs openclaw-backend --lines 200
ls -la data
```

Validate JSON files:
```bash
for f in data/*.json; do
  echo "Checking $f"
  jq . "$f" >/dev/null || echo "Invalid JSON: $f"
done
```

### Fixes
- Ensure Node 18+ (Node 20 recommended).
- Restore malformed JSON from `.bak` backup.
- Confirm backend has write permission to `data/`.

## 4) Imperial Vault Not Detected / Not Functional

Reality note:
- No backend `/api/imperial-vault/*` exists yet.
- Most IV pages are UI-only today.

### Checks
```bash
ls -la /home/ubuntu/imperial-vault || true
curl -i http://localhost:3001/api/imperial-vault/status
```

### Expected
- `404` for `/api/imperial-vault/*` in current code (until implemented).

### Current usable path
- Overlay route uses `POST /api/ssh/execute`.

## 5) Permission/Approval Issues

### Checks
```bash
curl http://localhost:3001/api/permissions/rules
curl http://localhost:3001/api/permissions/approvals
curl http://localhost:3001/api/permissions/audit
ls -la data/approvals.json data/audit.json
```

### Fixes
- Ensure `data/` is writable.
- If file missing, backend will create on first write path.

## 6) Port Already in Use
```bash
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :18789
```

Kill blocking PID only when confirmed safe:
```bash
sudo kill -9 <PID>
```

Or change backend port:
```bash
PORT=3101 npm run dev:backend
```

## 7) High Memory / Process Restarts

### Checks
```bash
pm2 monit
pm2 logs openclaw-backend --lines 300
```

### Fixes
- Add PM2 memory cap:
```bash
pm2 restart openclaw-backend --max-memory-restart 500M
```
- Check reconnect loops in gateway logs.

## 8) Sessions Not Persisting

### Checks
```bash
ls -la data/messages.json data/conversations.json
jq 'length' data/messages.json
jq 'length' data/conversations.json
```

### Fixes
- Ensure files are writable.
- Ensure backend process has consistent working directory.
- For gateway rehydration, verify connection open events in logs.

## 9) Provider/Model Assignment Errors

### Checks
```bash
curl http://localhost:3001/api/providers
curl http://localhost:3001/api/agents
```

### Common error
- `Provider "<id>" was not found.`
- `Model "<id>" is not available for provider "<providerId>".`

### Fix
- Create/update provider first via `POST /api/providers`.
- Ensure selected model exists in provider's `models` array.

## 10) Logs and Live Diagnostics
```bash
# Backend logs
pm2 logs openclaw-backend

# Frontend logs
pm2 logs openclaw-frontend

# Systemd journal (if managed there)
journalctl -u openclaw-dashboard -f

# API checks
curl http://localhost:3001/api/gateway/status
curl http://localhost:3001/api/health/summary
```

