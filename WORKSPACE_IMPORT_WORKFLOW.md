# WORKSPACE_IMPORT_WORKFLOW

This file is generated from current source state. Missing requested files/flows are marked `TODO`.

## Reality Check
- Requested file `src/lib/workspaceImporter.ts`: `TODO` (not present)
- Actual importer file: `src/lib/openclawImporter.ts`
- Auto-import on gateway connect: `TODO` (not currently wired)
- Import status endpoint (`/api/import/status`): `TODO` (not currently implemented)

## 1. What Exists Today
Current import utility:
- Function: `runOpenClawImport(skillsRegistry)`
- File: `src/lib/openclawImporter.ts`
- Output report file: `data/import_report.json`

Current backend startup (`src/server/index.ts`) does **not** call importer.

## 2. Current Trigger Behavior
Implemented:
- None automatic for workspace import.

Not implemented:
- Trigger on first gateway connection (`gateway.setOnConnect(...)` is available but unused).

## 3. Current Scan Logic (Implemented)
`runOpenClawImport` scans relative to:
- `WORKSPACE_ROOT` from env if set
- else `process.cwd()`

What it currently scans:
- `agents/*.json`
- skills directory via `SkillsRegistry.scan()`:
  - scans directories and expects `skill.json` metadata
  - does not parse `SKILL.md` as primary source today
- `cron.json` (root-level)
- `playbooks/*.json`
- `swarms/*.json`
- `memory/` directory existence (boolean presence check)
- Imperial Vault marker:
  - detects true if `.imperial-vault` exists OR root path contains `imperial-vault`

## 4. Current Write Targets
Implemented writes:
- `data/import_report.json` only

Not implemented:
- No merge/write into `data/agents.json`, `data/skills.json`, `data/playbooks.json`, `data/swarms.json`, etc.

## 5. Merge Rules Status
Current code behavior:
- Import report counters are generated.
- No persistent merge into main runtime data files.

`TODO` proposed merge rule:
- Never overwrite existing IDs.
- Add new IDs only.
- Emit skipped count for duplicates.

## 6. Import Report Structure (Implemented)
`data/import_report.json` schema:
```ts
{
  timestamp: string;
  agents: { found: number; imported: number; skipped: number };
  skills: { found: number; imported: number; skipped: number };
  crons: { found: number; imported: number; skipped: number };
  playbooks: { found: number; imported: number; skipped: number };
  swarms: { found: number; imported: number; skipped: number };
  memory: { found: number; imported: number; skipped: number };
  errors: string[];
  imperialVault: { detected: boolean; path?: string };
}
```

## 7. UI Visibility of Import Report
Current `/dev` page:
- Uses mock data in component state.
- Mentions import report in comments, but does not fetch backend/import file.

`TODO`:
- Add backend endpoint to read `data/import_report.json`.
- Wire `/dev` to that endpoint.

## 8. Manual Re-import (Current State)
There is no dedicated CLI command or API endpoint for manual re-import yet.

`TODO` options:
- Add endpoint:
  - `POST /api/import/run`
  - `GET /api/import/status`
- Or add npm script for a one-off importer runner.

## 9. Imperial Vault Detection Logic
Implemented in importer:
- Checks `.imperial-vault` marker or root path substring.
- Sets `imperialVault.detected` and `imperialVault.path` in report.

Not implemented from requested spec:
- No explicit check for `/home/ubuntu/imperial-vault/`
- No scan of `/home/ubuntu/imperial-vault/scripts/*.py`
- No creation of `data/imperialVault.json`
- No automatic UI enable/disable gating based on detection

## 10. Safe Workflow for Future Import Integration
Before enabling auto-import in production:
1. Backup local data files:
   - `cp data/agents.json data/agents.json.bak`
   - repeat for each target file.
2. Implement non-destructive merge writes.
3. Add dry-run mode that only creates `import_report.json`.
4. Add endpoint-level auth/guard for manual import trigger.

## 11. Suggested Next Implementation Order (`TODO`)
1. Create `src/lib/workspaceImporter.ts` as wrapper around current importer.
2. Add backend routes:
   - `POST /api/import/run`
   - `GET /api/import/status`
3. Register `gateway.setOnConnect(async () => runImportOnce())`.
4. Persist merge results to runtime `data/*.json`.
5. Wire `/dev` page to live import status.

