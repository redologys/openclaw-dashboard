#!/usr/bin/env node

import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';

const PREFERRED_SMOKE_PORT = Number(process.env.SMOKE_PORT ?? 3101);
const START_TIMEOUT_MS = 60_000;
const OVERALL_TIMEOUT_MS = 90_000;
const WAIT_INTERVAL_MS = 750;
const SHUTDOWN_GRACE_MS = 3_000;
const PORT_SCAN_LIMIT = 30;

/** @type {import('node:child_process').ChildProcess | null} */
let backendProcess = null;
let smokePort = PREFERRED_SMOKE_PORT;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const getBaseUrl = () => `http://localhost:${smokePort}`;

async function request(method, routePath, body) {
  const response = await fetch(`${getBaseUrl()}${routePath}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  return {
    status: response.status,
    raw,
    json,
  };
}

async function backendIsUp() {
  try {
    const response = await fetch(`${getBaseUrl()}/api/gateway/status`);
    return response.ok;
  } catch {
    return false;
  }
}

const canBindPort = async (port) =>
  new Promise((resolve) => {
    const tester = net.createServer();
    tester.unref();
    tester.once('error', () => resolve(false));
    tester.listen(port, '127.0.0.1', () => {
      tester.close(() => resolve(true));
    });
  });

async function resolveSmokePort() {
  for (let i = 0; i < PORT_SCAN_LIMIT; i += 1) {
    const candidate = PREFERRED_SMOKE_PORT + i;
    // eslint-disable-next-line no-await-in-loop
    if (await canBindPort(candidate)) return candidate;
  }
  throw new Error(
    `No open smoke port in range ${PREFERRED_SMOKE_PORT}-${PREFERRED_SMOKE_PORT + PORT_SCAN_LIMIT - 1}`,
  );
}

async function startBackend() {
  smokePort = await resolveSmokePort();
  if (smokePort !== PREFERRED_SMOKE_PORT) {
    console.log(`[smoke] Preferred port ${PREFERRED_SMOKE_PORT} busy. Using ${smokePort}.`);
  }

  const command = process.platform === 'win32' ? 'npx.cmd tsx src/server/index.ts' : 'npx tsx src/server/index.ts';

  backendProcess = spawn(command, [], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(smokePort),
      SMOKE_MODE: '1',
      SAFE_MODE: 'true',
    },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout?.on('data', (chunk) => {
    process.stdout.write(`[backend] ${chunk.toString()}`);
  });
  backendProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(`[backend] ${chunk.toString()}`);
  });
}

async function waitForReadiness() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    if (await backendIsUp()) {
      console.log(`[smoke] Backend ready at ${getBaseUrl()}`);
      return;
    }
    await sleep(WAIT_INTERVAL_MS);
  }

  throw new Error(`Backend did not become ready within ${START_TIMEOUT_MS}ms`);
}

async function shutdownBackend() {
  if (!backendProcess) return;

  if (backendProcess.exitCode !== null) {
    backendProcess = null;
    return;
  }

  try {
    backendProcess.kill('SIGTERM');
  } catch {
    // ignore
  }

  const exited = await Promise.race([
    new Promise((resolve) => backendProcess?.once('exit', () => resolve(true))),
    sleep(SHUTDOWN_GRACE_MS).then(() => false),
  ]);

  if (!exited) {
    try {
      backendProcess.kill('SIGKILL');
    } catch {
      // ignore
    }
  }

  backendProcess = null;
}

function validateGatewayStatus(payload) {
  assert(payload && typeof payload === 'object', 'gateway status must be an object');
  assert(typeof payload.connected === 'boolean', 'gateway.connected must be boolean');
  assert(typeof payload.safeMode === 'boolean', 'gateway.safeMode must be boolean');
}

function validateImportStatus(payload) {
  assert(payload && typeof payload === 'object', 'import status must be an object');
  if ('available' in payload) {
    assert(payload.available === true, 'import.available must be true after /api/import/run');
  }
  assert(typeof payload.timestamp === 'string', 'import.timestamp must be string');
  assert(payload.summary && typeof payload.summary === 'object', 'import.summary must exist');
  assert(
    payload.summary.agents && typeof payload.summary.agents.found === 'number',
    'import.summary.agents.found must be number',
  );
}

function validateArray(payload, name) {
  assert(Array.isArray(payload), `${name} response must be an array`);
}

function validateImperialVaultAgentStatus(payload) {
  assert(payload && typeof payload === 'object', 'imperial-vault status payload must be object');
  assert(typeof payload.agent === 'string', 'imperial-vault status agent must be string');
  assert(['intel', 'historian', 'footage', 'music'].includes(payload.agent), 'imperial-vault agent must be valid');
  assert(typeof payload.state === 'string', 'imperial-vault state must be string');
  assert(typeof payload.progress === 'number', 'imperial-vault progress must be number');
}

async function runChecks() {
  const checks = [
    {
      name: 'GET /api/gateway/status',
      method: 'GET',
      path: '/api/gateway/status',
      validate: validateGatewayStatus,
    },
    {
      name: 'GET /api/import/status',
      method: 'GET',
      path: '/api/import/status',
      validate: validateImportStatus,
      before: async () => {
        const runImport = await request('POST', '/api/import/run', { dryRun: true });
        assert(runImport.status === 200, `POST /api/import/run failed with HTTP ${runImport.status}`);
      },
    },
    {
      name: 'GET /api/agents',
      method: 'GET',
      path: '/api/agents',
      validate: (payload) => validateArray(payload, 'agents'),
    },
    {
      name: 'GET /api/skills',
      method: 'GET',
      path: '/api/skills',
      validate: (payload) => validateArray(payload, 'skills'),
    },
    {
      name: 'GET /api/imperial-vault/status/intel',
      method: 'GET',
      path: '/api/imperial-vault/status/intel',
      validate: validateImperialVaultAgentStatus,
    },
  ];

  let passed = 0;
  for (const check of checks) {
    if (check.before) {
      await check.before();
    }

    const response = await request(check.method, check.path);
    assert(response.status === 200, `${check.name} returned HTTP ${response.status}`);
    check.validate(response.json);
    console.log(`[smoke] PASS ${check.name}`);
    passed += 1;
  }

  console.log(`[smoke] Completed ${passed}/${checks.length} checks`);
}

async function runWithOverallTimeout(work) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Smoke run exceeded ${OVERALL_TIMEOUT_MS}ms`));
    }, OVERALL_TIMEOUT_MS);
  });

  try {
    await Promise.race([work(), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function main() {
  try {
    await runWithOverallTimeout(async () => {
      await startBackend();
      await waitForReadiness();
      await runChecks();
    });
  } catch (error) {
    console.error(`[smoke] FAIL ${(error && error.message) || String(error)}`);
    process.exitCode = 1;
  } finally {
    await shutdownBackend();
  }
}

await main();
