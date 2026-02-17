# DEPLOYMENT_GUIDE

This guide is generated from the current repo state (scanned before writing). It documents what exists now and flags missing pieces as `TODO`.

## Reality-Checked Stack
- Frontend: Vite + React Router (`npm run dev`, `npm run build`, `npm run preview`)
- Backend: Express + `tsx` runtime (`src/server/index.ts`)
- Default ports:
  - Frontend dev/proxy: `3000` (from `vite.config.ts`)
  - Backend: `3001` (from `PORT` in `src/lib/config.ts`, default 3001)
- Gateway client file: `src/server/gateway.ts`
- Mock gateway file: `src/server/mockGateway.ts`

## 1. System Requirements
- Ubuntu 24.04 LTS
- Node.js 20.x (recommended; project requires 18+)
- npm 10+
- git
- Optional but useful: `jq`, `pm2`, `ufw`, `autossh`

## 2. Install Runtime on Ubuntu 24
```bash
sudo apt update
sudo apt install -y curl git ca-certificates gnupg jq

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version
```

## 3. Get the Project onto Server

Option A: clone via git
```bash
sudo mkdir -p /opt/openclaw-command-center
sudo chown -R $USER:$USER /opt/openclaw-command-center
git clone <YOUR_REPO_URL> /opt/openclaw-command-center
cd /opt/openclaw-command-center
```

Option B: upload archive
```bash
sudo mkdir -p /opt/openclaw-command-center
sudo chown -R $USER:$USER /opt/openclaw-command-center
cd /opt/openclaw-command-center
tar -xzf /path/to/uploaded-project.tar.gz --strip-components=1
```

## 4. Install Dependencies
```bash
cd /opt/openclaw-command-center
npm install
npm run typecheck
npm run build
```

## 5. Directory Layout on Server
```text
/opt/openclaw-command-center
  src/
    server/
      index.ts
      app.ts
      gateway.ts
      mockGateway.ts
  data/
    agents.json
    audit.json
    conversations.json
    cron.json
    messages.json
    providers.json
    sentinel_config.json
    system_health.json
  .env
  package.json
  vite.config.ts
```

## 6. Configure Environment
Create `.env` in project root:
```bash
cat > .env <<'EOF'
# Gateway
SAFE_MODE=false
GATEWAY_URL=ws://localhost:18789
GATEWAY_TOKEN=YOUR_REAL_TOKEN_HERE

# Backend
PORT=3001

# SSH tool bridge
SSH_HOST=localhost
SSH_USER=ubuntu
# SSH_PASSWORD=
SSH_KEY_PATH=/home/ubuntu/.ssh/id_rsa

# Optional integration keys
# OPENAI_API_KEY=
# GEMINI_API_KEY=
# SUPERMEMORY_API_KEY=

# Optional import paths
# WORKSPACE_ROOT=/home/ubuntu/.openclaw/workspace
# OPENCLAW_CONFIG_PATH=/home/ubuntu/.openclaw/openclaw.json
# DATA_DIR=/opt/openclaw-command-center/data
# SKILLS_EXTRA_DIRS=/opt/openclaw-extra-skills,/home/ubuntu/.openclaw/custom-skills
EOF
```

Token safety rule:
- Keep `GATEWAY_TOKEN` only in `.env`.
- Do not store real token values in markdown, scripts, or git.

Scenario A env vars:
- `SAFE_MODE`
  - `true`: mock-safe mode, no real gateway/tool execution.
  - `false`: live mode (real gateway/tool path).
- `WORKSPACE_ROOT`
  - Ubuntu Scenario A target: `/home/ubuntu/.openclaw/workspace`.
  - Skills precedence starts at `${WORKSPACE_ROOT}/skills`.
- `OPENCLAW_CONFIG_PATH`
  - Ubuntu Scenario A target: `/home/ubuntu/.openclaw/openclaw.json`.
- `DATA_DIR`
  - Absolute path for all backend JSON persistence. Example: `/opt/openclaw-command-center/data`.
- `SKILLS_EXTRA_DIRS`
  - Comma-separated extra directories appended after built-in precedence.
  - Example: `/opt/openclaw-extra-skills,/home/ubuntu/.openclaw/custom-skills`.

## 7. Frontend/Backend Port Configuration
- Backend binds to `PORT` (default `3001`) from `.env`.
- Frontend dev is hard-coded to `3000` in `vite.config.ts`.
- Frontend production preview can be pinned with:
  - `npm run preview -- --host 0.0.0.0 --port 3000`

## 8. Gateway SSH Tunnel (for ws://localhost:18789)
If gateway is remote, create local tunnel on server host:
```bash
ssh -N -L 18789:localhost:18789 ubuntu@<gateway-host>
```

Run persistent tunnel with `autossh`:
```bash
sudo apt install -y autossh
autossh -M 0 -N -L 18789:localhost:18789 ubuntu@<gateway-host>
```

Validate tunnel:
```bash
ss -ltnp | grep 18789 || true
```

## 9. Run Services Manually (Smoke Test)
Terminal 1:
```bash
cd /opt/openclaw-command-center
npm run dev:backend
```

Terminal 2:
```bash
cd /opt/openclaw-command-center
npm run dev
```

Health checks:
```bash
curl http://localhost:3001/api/gateway/status
curl http://localhost:3001/api/health/summary
curl http://localhost:3001/api/providers
```

## 10. Production Process Manager (pm2)
Install pm2:
```bash
sudo npm install -g pm2
```

Create `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: "openclaw-backend",
      cwd: "/opt/openclaw-command-center",
      script: "npx",
      args: "tsx src/server/index.ts",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: "openclaw-frontend",
      cwd: "/opt/openclaw-command-center",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 3000",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
```

Start and persist:
```bash
cd /opt/openclaw-command-center
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 11. Auto-Start after Reboot
After `pm2 startup`, run the command pm2 prints (with sudo) once.

Verify:
```bash
sudo reboot
# after reconnect:
pm2 status
curl http://localhost:3001/api/gateway/status
```

## 12. Firewall Rules (if needed)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
sudo ufw status
```

If using reverse proxy, you can keep 3000/3001 internal only and expose 80/443.

## 13. Operational Health Commands
```bash
# App process status
pm2 status

# Logs
pm2 logs openclaw-backend --lines 200
pm2 logs openclaw-frontend --lines 200

# Backend endpoint checks
curl http://localhost:3001/api/gateway/status
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/health/checks

# Port listeners
ss -ltnp | egrep '3000|3001|18789'
```

## 14. Common Failure Cases
- Gateway disconnected:
  - Check `.env` (`SAFE_MODE=false`, `GATEWAY_URL`, token set).
  - Check tunnel on `18789`.
  - Check backend logs for WS errors.
- Frontend unreachable:
  - Verify `pm2 status`.
  - Verify `npm run build` ran before preview.
- Data write failures:
  - Ensure `/opt/openclaw-command-center/data` is writable.
  - Check permissions and ownership.

See `TROUBLESHOOTING.md` for deeper runbooks.

## 15. Ubuntu Scenario A Smoke Test
Use this exact sequence to validate Ubuntu Scenario A wiring:

```bash
cd /opt/openclaw-command-center

export SAFE_MODE=true
export PORT=3001
export GATEWAY_URL=ws://127.0.0.1:18789
export WORKSPACE_ROOT=/home/ubuntu/.openclaw/workspace
export OPENCLAW_CONFIG_PATH=/home/ubuntu/.openclaw/openclaw.json
export DATA_DIR=/opt/openclaw-command-center/data
export SKILLS_EXTRA_DIRS=/opt/openclaw-extra-skills,/home/ubuntu/.openclaw/custom-skills
```

If backend is not already running:
```bash
npm run dev:backend
```

In another shell:
```bash
curl -sS http://localhost:3001/api/gateway/status | jq
curl -sS -X POST http://localhost:3001/api/import/run \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' | jq
curl -sS http://localhost:3001/api/import/status | jq
curl -sS http://localhost:3001/api/skills | jq '.[0] | {id, path, source, precedenceRank}'
curl -sS http://localhost:3001/api/agents | jq 'length'
curl -sS http://localhost:3001/api/imperial-vault/status/intel | jq '{agent, state, progress}'
```

Expected smoke characteristics:
- `/api/gateway/status` returns HTTP `200`.
- `/api/import/run` with `{"dryRun": true}` returns HTTP `200`.
- `/api/skills` items include `path`, `source`, and `precedenceRank`.
- `/api/agents` returns an array.
- `/api/imperial-vault/status/intel` returns `agent/state/progress`.
