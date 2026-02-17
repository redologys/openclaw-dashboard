# OpenClaw Command Center Deployment Context Pack

These docs were generated from the current repository state (code/routes/data scanned first). Missing items are marked as `TODO` instead of assumed.

## Recommended Reading Order
1. `DEPLOYMENT_GUIDE.md`
2. `GATEWAY_INTEGRATION.md`
3. `ENV_CONFIG_REFERENCE.md`
4. `API_COMPLETE_REFERENCE.md`
5. `DATA_FILES_SCHEMA.md`
6. `WORKSPACE_IMPORT_WORKFLOW.md`
7. `IMPERIAL_VAULT_INTEGRATION.md`
8. `TROUBLESHOOTING.md`
9. `TESTING_CHECKLIST.md`
10. `CLI_AGENT_HANDOFF.md`

## Notes
- Secrets are parameterized (for example `GATEWAY_TOKEN=YOUR_REAL_TOKEN_HERE`).
- Real token values should stay only in `.env` or a secure secret manager.
- Deployment agent should follow non-destructive data handling and create `.bak` files before any manual JSON repair.

