# Workspace Integration TODO

Generated on 2026-02-17 after re-scanning repo and `data/`.

## Implemented in Code
- `src/lib/workspaceImporter.ts` exists and is wired to:
  - `GET /api/import/status`
  - `POST /api/import/run`
  - `POST /api/import/conflicts/:id/resolve`
- `src/server/imperialVaultAPI.ts` exists and is mounted at `/api/imperial-vault`.
- `data/agents.json` now supports both:
  - legacy array format `Agent[]`
  - object format `{ agents: Agent[], subagents: SubAgent[] }`
- Agent runtime APIs added:
  - `POST /api/agents/generate`
  - `PUT /api/agents/:id/skills`
  - `POST /api/agents/:id/skills/test`
  - `GET /api/agents/:parentId/subagents`
  - `POST /api/agents/:parentId/subagents`
  - `DELETE /api/agents/:parentId/subagents/:subagentId`
- Auto-import on first gateway connect is enabled in `src/server/index.ts`.

## Still TODO / Partial
- Prompt-referenced `src/server/gatewayClient.ts` does not exist in this repo.
  - Equivalent runtime file is `src/server/gateway.ts`.
- Automatic sub-agent spawn from live gateway tool-call complexity is not fully wired yet.
  - Manual spawn/terminate APIs and UI are implemented.
- Playbook step-level sub-agent assignment UI/API is not implemented yet.
- `/playbooks` route from prompt is not present; this repo currently uses `/pipelines`.
- Conflict diff view is JSON side-by-side, not structured field-level diff yet.
- `npm run build` is timing out in this local workspace (large timestamp artifact set); `npm run typecheck` passes.

## Safety Notes
- Import and agent writes use `safeWriteJSON` with backup/validation semantics.
- SAFE_MODE behavior is preserved for:
  - Sentinel health runs
  - Imperial Vault run/search/overlay endpoints
  - Skill test endpoint (`/api/agents/:id/skills/test`)
