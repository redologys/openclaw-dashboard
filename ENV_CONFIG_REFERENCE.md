# ENV_CONFIG_REFERENCE

This reference is generated from actual env parsing code in `src/lib/config.ts` and client env usage in `src/lib/clientConfig.ts`.

Token safety:
- Keep real values only in `.env`.
- In docs/examples use placeholders (never commit real tokens).

## 1. Backend Environment Variables (Actual)

| Variable | Required | Default | Used By | Notes |
|---|---|---|---|---|
| `GATEWAY_URL` | Yes (practically) | `ws://localhost:3000` | `src/server/gateway.ts` | Should be `ws://localhost:18789` in live deployment |
| `GATEWAY_TOKEN` | Yes (practically) | `mock-token` | `src/server/gateway.ts` | Sent as bearer token on WS connect |
| `SAFE_MODE` | No | `false` | backend-wide | `true` forces mock gateway and blocks risky tools |
| `PORT` | No | `3001` | `src/server/index.ts` | Backend listen port |
| `NODE_ENV` | No | `development` | runtime logs/config | `development`, `production`, `test` |
| `SSH_HOST` | No | `18.227.140.90` | `src/server/sshClient.ts` | Use `localhost` when tunneling/local SSH |
| `SSH_USER` | No | `ubuntu` | `src/server/sshClient.ts` | SSH username |
| `SSH_PASSWORD` | Optional | none | `src/server/sshClient.ts` | Prefer key auth |
| `SSH_KEY_PATH` | Optional | none | `src/server/sshClient.ts` | Private key path |
| `OPENAI_API_KEY` | Optional | none | config only | Not directly used by server routes yet |
| `GEMINI_API_KEY` | Optional | none | config only | Not directly used by server routes yet |
| `LOCAL_MODEL_PATH` | Optional | none | config only | Reserved |
| `SUPERMEMORY_API_KEY` | Optional | hardcoded default in code | `src/lib/supermemory.ts` | Override in production |
| `OPENCLAW_CONFIG_PATH` | Optional | none | import config | Reserved for importer usage |
| `WORKSPACE_ROOT` | Optional | none | `src/lib/openclawImporter.ts`, skills registry setup | Import/skills scan root |

## 2. Frontend Environment Variables (Actual)

Used in `src/lib/clientConfig.ts`:

| Variable | Required | Default | Used By | Notes |
|---|---|---|---|---|
| `VITE_SAFE_MODE` | No | `true` | frontend UI controls | Should mirror backend `SAFE_MODE` for UX consistency |
| `VITE_SSH_HOST` | No | `18.227.140.90` | terminal/overlay UI labels | Display only |

## 3. Production .env Template (Safe Placeholder Version)
```bash
# ==========================================================
# OpenClaw Command Center - Production Config (Ubuntu)
# ==========================================================

# ----------------------------------------------------------
# Gateway Connection
# ----------------------------------------------------------
SAFE_MODE=false
GATEWAY_URL=ws://localhost:18789
GATEWAY_TOKEN=YOUR_REAL_TOKEN_HERE
# Note: value comes from secure secret store/.env only

# ----------------------------------------------------------
# Backend Server
# ----------------------------------------------------------
PORT=3001
NODE_ENV=production

# ----------------------------------------------------------
# SSH Configuration (for /api/ssh/execute)
# ----------------------------------------------------------
SSH_HOST=localhost
SSH_USER=ubuntu
SSH_KEY_PATH=/home/ubuntu/.ssh/id_rsa
# SSH_PASSWORD=

# ----------------------------------------------------------
# Optional AI Integration Keys
# ----------------------------------------------------------
# OPENAI_API_KEY=
# GEMINI_API_KEY=
# SUPERMEMORY_API_KEY=
# LOCAL_MODEL_PATH=

# ----------------------------------------------------------
# Optional Import Paths
# ----------------------------------------------------------
# WORKSPACE_ROOT=/home/ubuntu/.openclaw
# OPENCLAW_CONFIG_PATH=/home/ubuntu/.openclaw/openclaw.json
```

Frontend env example (`.env.local` for Vite):
```bash
VITE_SAFE_MODE=false
VITE_SSH_HOST=localhost
```

## 4. Requested Variables Not Currently Wired (`TODO`)
These names were requested in planning docs but are **not parsed by current backend code**:
- `FRONTEND_PORT`
- `BACKEND_PORT` (backend uses `PORT`)
- `IV_BASE_PATH`
- `IV_STATE_DIR`
- `IV_DELIVERABLES_DIR`
- `DATA_DIR`
- `ENABLE_WORKSPACE_IMPORT`
- `ENABLE_BROWSER_CONTROL`
- `ENABLE_IMPERIAL_VAULT`

If you add them, update `src/lib/config.ts` schema and usage first.

## 5. Switching Safe Mode vs Live Mode
Safe Mode:
```bash
SAFE_MODE=true
VITE_SAFE_MODE=true
```

Live Mode:
```bash
SAFE_MODE=false
VITE_SAFE_MODE=false
```

Behavior difference highlights:
- Safe Mode uses `MockGateway`.
- Browser click/navigate endpoints return `403` in Safe Mode.
- SSH execution returns mock command output in Safe Mode.

## 6. Updating .env and Reload Behavior
- Backend reads env at process start (`dotenv/config`), so restart backend after changes.
- Frontend Vite env vars are embedded at build/dev-server startup, so restart frontend after changes.
- No hot env reload is implemented.

## 7. Security Notes
- Never commit `.env` to git.
- Keep token/API keys out of markdown and logs.
- Restrict file permissions:
```bash
chmod 600 .env
```
- Prefer a secret manager for production (AWS SSM, Vault, etc.).

