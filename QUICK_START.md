# Quick Start Guide - OpenClaw Command Center

## Current Status
✅ **Backend:** Running on http://localhost:3001 (Safe Mode)
⚠️ **Frontend:** Blocked - requires Node.js upgrade

---

## Immediate Next Steps

### 1. Check Backend Status (Currently Running)
```bash
# Test if backend is responsive
curl http://localhost:3001/api/gateway/status

# Expected response:
# {"connected":true,"latency":0,"reconnectAttempts":0,"safeMode":true,...}
```

### 2. Upgrade Node.js (REQUIRED for Frontend)
```bash
# Check current version
node --version
# Current: v20.11.1
# Required: >= 20.19.0 or >= 22.12.0

# Download Node.js 22.x LTS from:
# https://nodejs.org/en/download/

# Or use nvm (Node Version Manager):
nvm install 22
nvm use 22
node --version  # Verify it's >= 22.0.0
```

### 3. After Node.js Upgrade
```bash
# Navigate to project
cd "C:\Users\reds'\.gemini\antigravity\scratch\openclaw_command_center"

# Clean install
rm -rf node_modules package-lock.json
npm install

# Start full stack
npm run dev:all

# Or start with Safe Mode
SAFE_MODE=true npm run dev:all
```

---

## Testing Commands

### Run All API Tests
```bash
bash test-api.sh
```

### Individual API Tests
```bash
# Gateway status
curl http://localhost:3001/api/gateway/status

# List agents
curl http://localhost:3001/api/agents

# List conversations
curl http://localhost:3001/api/conversations

# Permission rules
curl http://localhost:3001/api/permissions/rules

# Skills
curl http://localhost:3001/api/skills

# Cron jobs
curl http://localhost:3001/api/cron/jobs
```

### Create Test Data
```bash
# Create a test agent
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "id": "agent-001",
    "name": "Test Agent",
    "type": "conversational",
    "status": "active",
    "description": "Test agent for QA",
    "capabilities": ["chat", "reasoning"],
    "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Create a test conversation
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "title": "QA Test Conversation"
  }'
```

---

## Access URLs (After Frontend Starts)

### Core Pages
- **Dashboard:** http://localhost:3000/
- **Agents:** http://localhost:3000/agents
- **Chat:** http://localhost:3000/chat
- **Analytics:** http://localhost:3000/analytics
- **Browser:** http://localhost:3000/browser
- **Dev Tools:** http://localhost:3000/dev
- **Approvals:** http://localhost:3000/dev/approvals
- **Memory:** http://localhost:3000/memory
- **Pipelines:** http://localhost:3000/pipelines

### Imperial Vault
- **Hub:** http://localhost:3000/imperial-vault
- **Pipeline:** http://localhost:3000/imperial-vault/pipeline
- **Calendar:** http://localhost:3000/imperial-vault/calendar
- **Intel:** http://localhost:3000/imperial-vault/intel
- **Footage:** http://localhost:3000/imperial-vault/footage
- **Music:** http://localhost:3000/imperial-vault/music
- **Discord:** http://localhost:3000/imperial-vault/discord
- **Overlay Studio:** http://localhost:3000/imperial-vault/overlay
- **Cookies:** http://localhost:3000/imperial-vault/cookies
- **Alerts:** http://localhost:3000/imperial-vault/alerts
- **Facts:** http://localhost:3000/imperial-vault/facts
- **Sandbox:** http://localhost:3000/imperial-vault/sandbox
- **Terminal:** http://localhost:3000/imperial-vault/terminal
- **Viral Score:** http://localhost:3000/imperial-vault/viral-score

---

## Environment Configuration

### Safe Mode (Mock Gateway)
```bash
# Edit .env
SAFE_MODE=true
```

### Production Mode (Real Gateway)
```bash
# Edit .env
SAFE_MODE=false
GATEWAY_URL=ws://localhost:18789
GATEWAY_TOKEN=6fcded2e854ac87bd61565365f875e1cb50ca7ba9f5cde21
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill port 3000 (frontend)
npx kill-port 3000

# Kill port 3001 (backend)
npx kill-port 3001
```

### Stop Current Backend Server
```bash
# If running in background, find the process:
ps aux | grep "tsx watch"

# Or check the task output location:
# C:\Users\reds'\AppData\Local\Temp\claude\C--Users-reds---gemini-antigravity-scratch-openclaw-command-center\tasks\

# Kill specific background task (replace ID):
# Task ID: b68e28a
```

### Backend Not Responding
```bash
# Check if server is running
curl http://localhost:3001/api/gateway/status

# If no response, restart:
npm run dev:backend
```

### Frontend Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules .tanstack package-lock.json
npm install
npm run dev
```

---

## File Structure Overview

```
openclaw_command_center/
├── src/
│   ├── routes/          # Frontend pages (TanStack Router)
│   │   ├── index.tsx    # Main dashboard
│   │   ├── agents.tsx   # Agents page
│   │   ├── chat.tsx     # Chat page
│   │   └── imperial-vault/  # Imperial Vault pages
│   ├── server/          # Backend server
│   │   ├── index.ts     # Server entry point
│   │   ├── app.ts       # Express app & API routes
│   │   ├── gateway.ts   # Gateway WebSocket client
│   │   └── mockGateway.ts  # Safe Mode mock
│   ├── lib/            # Shared libraries
│   │   ├── config.ts   # Environment config
│   │   ├── types.ts    # TypeScript types
│   │   └── ...
│   └── components/     # React components
├── data/               # Runtime data (agents, playbooks, etc.)
├── .env                # Environment variables
├── package.json        # Dependencies
├── QA_AUDIT.md        # Full testing checklist
├── QA_RESULTS.md      # Test results
└── test-api.sh        # API test script
```

---

## QA Audit Progress

| Phase | Status | Ready to Test |
|-------|--------|---------------|
| Phase 0: Setup | ✅ Complete | Yes |
| Phase 1: Core APIs | ✅ Complete | Yes |
| Phase 1: Frontend | ⚠️ Blocked | After Node upgrade |
| Phase 2: Components | ⏸️ Pending | After Node upgrade |
| Phase 3: Imperial Vault | ⏸️ Pending | After Node upgrade |
| Phase 4: Advanced | ⏸️ Pending | After Node upgrade |

---

## Quick Commands Reference

```bash
# Start everything in Safe Mode
SAFE_MODE=true npm run dev:all

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev

# Run API tests
bash test-api.sh

# Check backend status
curl http://localhost:3001/api/gateway/status

# View full audit checklist
cat QA_AUDIT.md

# View test results
cat QA_RESULTS.md
```

---

**Last Updated:** February 17, 2026
**Backend Status:** ✅ Running (Task ID: b68e28a)
**Next Action:** Upgrade Node.js to >=20.19.0 or >=22.12.0
