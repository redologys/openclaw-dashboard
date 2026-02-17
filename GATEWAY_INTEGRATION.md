# GATEWAY_INTEGRATION

This document is based on current code. Any item not found in repo is explicitly marked `TODO`.

## Reality Check
- Requested file `src/server/gatewayClient.ts`: `TODO` (not present)
- Actual gateway file: `src/server/gateway.ts`
- Mock gateway file: `src/server/mockGateway.ts`
- Backend health endpoint: `GET /api/gateway/status` (implemented in `src/server/app.ts`)

## 1. Architecture Overview
Current architecture:
```text
Browser UI
  -> HTTP/SSE to backend (/api/*)
Backend (Express, src/server/app.ts)
  -> WebSocket client to OpenClaw gateway (src/server/gateway.ts)
```

Important boundary:
- Frontend does not connect directly to OpenClaw gateway.
- All gateway interactions pass through backend endpoints.

## 2. Gateway URL and Tunnel
Live target should be:
- `GATEWAY_URL=ws://localhost:18789`

If remote gateway, use SSH tunnel:
```bash
ssh -N -L 18789:localhost:18789 ubuntu@<gateway-host>
```

## 3. Authentication
- Token comes from `.env` variable: `GATEWAY_TOKEN`
- Token is sent as WS header:
  - `Authorization: Bearer <token>`
- Keep token in environment only. Do not store token values in docs.

## 4. WebSocket Connection Flow
Implemented flow in `src/server/gateway.ts`:
1. `gateway.init()` called from `src/server/index.ts`
2. `messages.json` DB initialized
3. Connect:
   - Safe Mode: instantiate `MockGateway`
   - Live Mode: open WS to `GATEWAY_URL` with bearer token
4. On `open`:
   - reset reconnect attempts
   - send `register_agent`
   - start ping interval (30s)
   - call `rehydrate()` (requests history since last stored message timestamp)
5. On `message`:
   - parse OCMP envelope
   - resolve pending tool-call promises by `id` when applicable
   - route known events
6. On `close`:
   - emit disconnected event
   - attempt reconnect with exponential backoff (live mode only)

## 5. OCMP/Event Handling (Implemented)
Handled message types in `handleMessage`:
- `pong`: updates gateway latency
- `history_batch`: processes list of historical chat messages
- `chat_message`: processes and persists incoming message
- `thought_trace`: emits internal `thought` event

Additional raw behavior:
- Unknown or invalid messages are logged/warned.

## 6. Safe Mode vs Live Mode
Safe Mode (`SAFE_MODE=true`):
- Uses `MockGateway` instead of real WS.
- Most `gateway.callTool(...)` requests are blocked except `browser_screenshot`.
- Browser API behavior:
  - `/api/browser/screenshot`: placeholder image
  - `/api/browser/click` and `/api/browser/navigate`: `403`

Live Mode (`SAFE_MODE=false`):
- Real WS connection to configured gateway.
- Real tool calls are attempted through OCMP `tool_call` messages.

## 7. Session Rehydration and Persistence
Implemented:
- Gateway client stores messages in `data/messages.json` through `JsonDb`.
- On connect, backend sends `request_history` with `since` timestamp from last saved message.
- Incoming `history_batch` and `chat_message` are validated and appended.

Not implemented:
- No dedicated REST endpoint to directly inspect/replay `messages.json`.

## 8. Gateway Health Monitoring
Implemented health signals:
- `/api/gateway/status` returns:
  - `connected`
  - `latency`
  - `reconnectAttempts`
  - `safeMode`
  - `gatewayUrl`
- Ping interval every 30 seconds updates latency via `pong`.

## 9. Disconnect and Reconnect Behavior
Implemented:
- Exponential backoff reconnect:
  - base delay: 1s
  - capped at 30s
- Reconnect occurs only when:
  - `SAFE_MODE=false`
  - `shouldKeyReconnect=true`

## 10. Where Gateway Data Appears in UI
Currently wired:
- Browser page (`/browser`):
  - screenshot/state APIs
  - SSE stream (`/api/browser/events`) receives browser events and thought traces
- Sentinel page (`/sentinel`):
  - indirectly shows gateway status impact through health checks

Partially wired / mock:
- Chat page is currently mostly local/mock interaction; it is not fully streaming live gateway replies to UI.

## 11. Tool Call Approval Flow and Firewall
Implemented today:
- Permission firewall is used in playbook execution (`PlaybookRunner -> PermissionFirewall`).
- Browser tool endpoints call `gateway.callTool` directly and do not currently pass through `PermissionFirewall`.

`TODO` hardening:
- Route all high-risk tool calls (browser/ssh/files) through permission firewall checks.

## 12. Validation Commands
```bash
# Backend gateway status
curl http://localhost:3001/api/gateway/status

# Browser state endpoint (indirect gateway signal)
curl http://localhost:3001/api/browser/state
```

Expected in Live Mode:
- `/api/gateway/status` shows `"safeMode": false`.
- `connected` true when gateway/tunnel is healthy.

## 13. Known Gaps (TODO)
- `src/server/gatewayClient.ts` naming does not match repo (`src/server/gateway.ts` exists instead).
- No explicit server-side endpoint to surface raw OCMP event stream for diagnostics.
- No full UI wiring for live gateway chat responses yet.

