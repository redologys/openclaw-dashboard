# OpenClaw Dashboard QA Audit Checklist

## Phase 0: Environment Setup ✅

### Step 1: Start Server in Safe Mode
```bash
SAFE_MODE=true npm run dev:all
```

**Expected Output:**
- Backend server starts on `http://localhost:3001`
- Frontend server starts on `http://localhost:3000`
- Console shows: `[Backend] Safe Mode: true`
- Console shows: `[GatewayClient] SAFE_MODE is ON. Using Mock Gateway.`

### Step 2: Verify Gateway Status
```bash
curl http://localhost:3001/api/gateway/status
```

**Expected Response:**
```json
{
  "connected": true,
  "latency": 0,
  "reconnectAttempts": 0,
  "safeMode": true,
  "gatewayUrl": "ws://localhost:3000"
}
```

---

## Phase 1: Core Interface Audit

### Checkpoint 1: Main Dashboard (/)
**URL:** `http://localhost:3000/`

**Test Points:**
- [ ] Page loads without errors
- [ ] Layout renders correctly
- [ ] Navigation menu is visible
- [ ] No console errors in browser DevTools
- [ ] Responsive layout works (test different screen sizes)

**How to Test:**
1. Open browser to `http://localhost:3000/`
2. Open DevTools (F12) and check Console tab
3. Verify no red errors
4. Test navigation clicks

---

### Checkpoint 2: Layout Engine Persistence
**Test Points:**
- [ ] Dashboard layout can be modified (drag/drop widgets if applicable)
- [ ] Layout changes persist after page reload
- [ ] Layout data saved in localStorage or backend

**How to Test:**
1. Modify dashboard layout (if drag/drop is available)
2. Refresh page (F5)
3. Verify layout remained as modified

---

### Checkpoint 3: Agents Page (/agents)
**URL:** `http://localhost:3000/agents`

**Test Points:**
- [ ] Page loads without errors
- [ ] Agent list displays
- [ ] Can create new agent
- [ ] Can edit existing agent
- [ ] Can delete agent
- [ ] Agent data persists

**API Endpoint Test:**
```bash
# List agents
curl http://localhost:3001/api/agents

# Get agent heartbeat status
curl http://localhost:3001/api/status/agents
```

---

### Checkpoint 4: Chat Page (/chat)
**URL:** `http://localhost:3000/chat`

**Test Points:**
- [ ] Page loads without errors
- [ ] Conversation list displays
- [ ] Can create new conversation
- [ ] Can send messages
- [ ] Messages display correctly
- [ ] Can switch agents

**API Endpoint Test:**
```bash
# List conversations
curl http://localhost:3001/api/conversations

# Create conversation
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent", "title": "Test Conversation"}'
```

---

## Phase 2: System Components Audit

### Checkpoint 5: Skills Page (/skills)
**URL:** `http://localhost:3000/skills` (if exists)

**Test Points:**
- [ ] Page loads without errors
- [ ] Skills list displays
- [ ] Skill details shown correctly

**API Endpoint Test:**
```bash
curl http://localhost:3001/api/skills
```

---

### Checkpoint 6: Playbooks (/playbooks)
**URL:** `http://localhost:3000/playbooks` (if exists)

**Test Points:**
- [ ] Page loads without errors
- [ ] Playbook list displays
- [ ] Can trigger playbook
- [ ] Playbook execution status visible

---

### Checkpoint 7: Browser Page (/browser)
**URL:** `http://localhost:3000/browser`

**Test Points:**
- [ ] Page loads without errors
- [ ] Browser interface renders
- [ ] Can interact with browser features

---

### Checkpoint 8: Dev Page (/dev)
**URL:** `http://localhost:3000/dev`

**Test Points:**
- [ ] Page loads without errors
- [ ] Dev tools interface renders
- [ ] Subpages accessible:
  - [ ] `/dev/approvals` - Permission approvals page

**API Endpoint Test:**
```bash
# Check pending approvals
curl http://localhost:3001/api/permissions/approvals

# Check permission rules
curl http://localhost:3001/api/permissions/rules

# Check audit log
curl http://localhost:3001/api/permissions/audit
```

---

## Phase 3: Imperial Vault Integration Audit

### Checkpoint 9: Imperial Vault Hub (/imperial-vault)
**URL:** `http://localhost:3000/imperial-vault`

**Test Points:**
- [ ] Page loads without errors
- [ ] Hub interface displays
- [ ] Links to sub-pages work

---

### Checkpoint 10: IV Pipeline
**URL:** `http://localhost:3000/imperial-vault/pipeline`

**Test Points:**
- [ ] Page loads without errors
- [ ] Pipeline view renders
- [ ] Data flows correctly

---

### Checkpoint 11: IV Calendar
**URL:** `http://localhost:3000/imperial-vault/calendar`

**Test Points:**
- [ ] Page loads without errors
- [ ] Calendar renders
- [ ] Events display correctly

---

### Checkpoint 12: IV Intel / Intelligence
**URLs:**
- `http://localhost:3000/imperial-vault/intel`
- `http://localhost:3000/imperial-vault/intelligence`

**Test Points:**
- [ ] Page loads without errors
- [ ] Intel data displays
- [ ] Filters/search works

---

### Checkpoint 13: IV Footage Manager
**URL:** `http://localhost:3000/imperial-vault/footage`

**Test Points:**
- [ ] Page loads without errors
- [ ] Footage list displays
- [ ] Media playback works

---

### Checkpoint 14: IV Music
**URL:** `http://localhost:3000/imperial-vault/music`

**Test Points:**
- [ ] Page loads without errors
- [ ] Music interface renders
- [ ] Player controls work

---

### Checkpoint 15: IV Discord Feed
**URL:** `http://localhost:3000/imperial-vault/discord`

**Test Points:**
- [ ] Page loads without errors
- [ ] Discord messages display
- [ ] Feed updates correctly

---

### Checkpoint 16: IV Overlay Studio
**URL:** `http://localhost:3000/imperial-vault/overlay`

**Test Points:**
- [ ] Page loads without errors
- [ ] Overlay editor renders
- [ ] Can create/edit overlays

---

### Checkpoint 17: Cookie Health
**URL:** `http://localhost:3000/imperial-vault/cookies`

**Test Points:**
- [ ] Page loads without errors
- [ ] Cookie status displays
- [ ] Health metrics visible

---

## Phase 4: Advanced Features Audit

### Checkpoint 18: Analytics
**URL:** `http://localhost:3000/analytics`

**Test Points:**
- [ ] Page loads without errors
- [ ] Charts/graphs render
- [ ] Data updates correctly

---

### Checkpoint 19: Memory Hub
**URL:** `http://localhost:3000/memory`

**Test Points:**
- [ ] Page loads without errors
- [ ] Memory interface renders
- [ ] Can search/browse memories

---

### Checkpoint 20: Monitoring
**Test Points:**
- [ ] Health checks working
- [ ] Metrics collecting
- [ ] Alerts functioning

---

### Checkpoint 21: Swarm Visualizer
**Test Points:**
- [ ] Visualization loads
- [ ] Agent connections shown
- [ ] Real-time updates work

---

### Checkpoint 22: Additional Features
**URLs to check:**
- `http://localhost:3000/pipelines`
- `http://localhost:3000/imperial-vault/alerts`
- `http://localhost:3000/imperial-vault/facts`
- `http://localhost:3000/imperial-vault/sandbox`
- `http://localhost:3000/imperial-vault/terminal`
- `http://localhost:3000/imperial-vault/viral-score`

---

## Testing Scripts

### Quick Health Check
```bash
#!/bin/bash
echo "Testing all API endpoints..."
endpoints=(
  "/api/gateway/status"
  "/api/agents"
  "/api/conversations"
  "/api/skills"
  "/api/status/agents"
  "/api/permissions/rules"
  "/api/permissions/approvals"
  "/api/permissions/audit"
  "/api/cron/jobs"
)

for endpoint in "${endpoints[@]}"; do
  echo -n "Testing $endpoint... "
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001$endpoint)
  if [ "$status" -eq 200 ]; then
    echo "✅ OK ($status)"
  else
    echo "❌ FAILED ($status)"
  fi
done
```

### Browser Testing Checklist
Create test plan for each page:
1. Load page
2. Check console for errors
3. Test user interactions
4. Verify data persistence
5. Test error states
6. Test loading states

---

## Common Issues & Solutions

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### Issue: SAFE_MODE not working
**Solution:** Ensure environment variable is set correctly:
```bash
# Windows CMD
set SAFE_MODE=true && npm run dev:all

# Windows PowerShell
$env:SAFE_MODE="true"; npm run dev:all

# Unix/Linux/Mac
SAFE_MODE=true npm run dev:all
```

### Issue: Missing data directory
**Solution:**
```bash
mkdir -p data
```

---

## Automated Test Run

You can run this comprehensive test:
```bash
# Save as test-all-pages.sh
#!/bin/bash

pages=(
  "/"
  "/agents"
  "/chat"
  "/browser"
  "/dev"
  "/dev/approvals"
  "/analytics"
  "/memory"
  "/pipelines"
  "/imperial-vault"
  "/imperial-vault/pipeline"
  "/imperial-vault/calendar"
  "/imperial-vault/intel"
  "/imperial-vault/intelligence"
  "/imperial-vault/footage"
  "/imperial-vault/music"
  "/imperial-vault/discord"
  "/imperial-vault/overlay"
  "/imperial-vault/cookies"
  "/imperial-vault/alerts"
  "/imperial-vault/facts"
  "/imperial-vault/sandbox"
  "/imperial-vault/terminal"
  "/imperial-vault/viral-score"
)

echo "Starting comprehensive page test..."
for page in "${pages[@]}"; do
  echo "Testing: http://localhost:3000$page"
  # Add your browser automation or curl tests here
done
```
