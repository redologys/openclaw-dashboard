# IMPERIAL_VAULT_INTEGRATION

This document is based on the current repository. Missing backend pieces are marked `TODO`.

## Reality Check
- Requested backend file `src/server/imperialVaultAPI.ts`: `TODO` (not present)
- No `/api/imperial-vault/*` endpoints currently implemented in `src/server/app.ts`
- Imperial Vault frontend routes are implemented under `src/routes/imperial-vault/*`
- Current backend tie-in:
  - `POST /api/ssh/execute` (used by overlay tooling)

## 1. Current Integration Architecture
Current:
```text
Imperial Vault UI pages
  -> mostly static/mock data
  -> overlay page can call /api/ssh/execute
Backend /api/ssh/execute
  -> src/server/sshClient.ts
  -> NodeSSH (mocked in SAFE_MODE)
```

No dedicated Imperial Vault API currently exists.

## 2. Current Frontend Surface
Implemented routes:
- `/imperial-vault`
- `/imperial-vault/pipeline`
- `/imperial-vault/calendar`
- `/imperial-vault/intel`
- `/imperial-vault/intelligence`
- `/imperial-vault/footage`
- `/imperial-vault/music`
- `/imperial-vault/discord`
- `/imperial-vault/overlay` (calls backend)
- `/imperial-vault/cookies`
- `/imperial-vault/alerts`
- `/imperial-vault/facts`
- `/imperial-vault/sandbox`
- `/imperial-vault/terminal`
- `/imperial-vault/viral-score`

## 3. Pipeline Agent Model (Requested vs Actual)
Requested conceptual architecture:
- Intel agent
- Historian agent
- Footage agent

Actual code status:
- No backend orchestration layer specific to those 3 agents yet.
- No `/api/imperial-vault/run/:agent` route yet.

## 4. Expected Directory Structure (Target)
Target deployment structure (not enforced by code yet):
```text
/home/ubuntu/imperial-vault/
  scripts/
  state/
  DELIVERABLES/
```

Current code does not validate these paths directly.

## 5. Detection Status
Current detection is only in importer report logic (`src/lib/openclawImporter.ts`):
- Flags detected if:
  - `.imperial-vault` marker exists, or
  - workspace root path string contains `imperial-vault`

Not implemented:
- strict check for `/home/ubuntu/imperial-vault`
- script scan under `scripts/*.py`
- writing `data/imperialVault.json`
- runtime route gating based on detection

## 6. Existing API Touchpoints
Implemented:
- `POST /api/ssh/execute`
  - used by `OverlayStudio` (`/imperial-vault/overlay`)
  - executes remote command (or mock in Safe Mode)

Not implemented (requested):
- `GET /api/imperial-vault/status`
- `GET /api/imperial-vault/batch`
- `GET /api/imperial-vault/calendar`
- `GET /api/imperial-vault/intel`
- `POST /api/imperial-vault/run/:agent`

## 7. Safe Mode Behavior
Current behavior:
- In `SAFE_MODE=true`, `sshClient.executeCommand` returns mock output.
- Overlay UI simulates render preview without remote execution.

## 8. How Manual Trigger Works Today
Only current path:
1. Go to `/imperial-vault/overlay`
2. Select fact, click render
3. Frontend posts command to `/api/ssh/execute`
4. Backend runs command over SSH (or mock)

No dedicated agent runner endpoint yet.

## 9. Proposed API Contract (`TODO`)
Proposed backend module:
- `src/server/imperialVaultAPI.ts`

Proposed routes:
- `GET /api/imperial-vault/status`
- `GET /api/imperial-vault/batch`
- `GET /api/imperial-vault/calendar`
- `GET /api/imperial-vault/intel`
- `POST /api/imperial-vault/run/:agent`

Proposed data file:
- `data/imperialVault.json` (path discovery + runtime status)

## 10. Failure Mode
Current behavior if Imperial Vault is absent:
- Imperial Vault UI routes still load (no backend detection gate).
- Some pages remain static/mock.
- Overlay execution will fail if SSH command/path invalid in live mode.

`TODO` UX improvement:
- Setup banner when not detected.
- Disable execution controls until required paths are verified.

