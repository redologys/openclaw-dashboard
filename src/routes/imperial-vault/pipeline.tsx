import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Loader2, Play } from 'lucide-react';
import { BackButton, IVBreadcrumb } from '../../app/imperial-vault/_components/Shared';

type IVAgent = 'intel' | 'historian' | 'footage' | 'music';
type AgentRunState = 'idle' | 'running' | 'completed' | 'error';

interface ImperialVaultStatus {
  detected: boolean;
  safeMode: boolean;
  paths: {
    basePath: string;
    scriptsPath: string;
    statePath: string;
    deliverablesPath: string;
  };
  availability: {
    scriptsExists: boolean;
    stateExists: boolean;
    deliverablesExists: boolean;
  };
  agents?: AgentStatus[];
}

interface AgentStatus {
  agent: IVAgent;
  state: AgentRunState;
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  lastRunAt: string | null;
  lastExitCode: number | null;
  lastError: string | null;
  stdout: string;
  stderr: string;
  logs: string[];
  safeMode: boolean;
}

interface RunResult {
  agent: IVAgent;
  exitCode: number;
  stdout: string;
  stderr: string;
  timestamp: string;
  safeMode: boolean;
  status?: AgentStatus;
  error?: string;
}

const IV_AGENTS: IVAgent[] = ['intel', 'historian', 'footage', 'music'];

const buildDefaultAgentStatus = (agent: IVAgent): AgentStatus => ({
  agent,
  state: 'idle',
  progress: 0,
  startedAt: null,
  finishedAt: null,
  lastRunAt: null,
  lastExitCode: null,
  lastError: null,
  stdout: '',
  stderr: '',
  logs: [],
  safeMode: true,
});

const buildInitialStatuses = () =>
  IV_AGENTS.reduce<Record<IVAgent, AgentStatus>>((acc, agent) => {
    acc[agent] = buildDefaultAgentStatus(agent);
    return acc;
  }, {} as Record<IVAgent, AgentStatus>);

export default function Pipeline() {
  const [status, setStatus] = useState<ImperialVaultStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<IVAgent, AgentStatus>>(buildInitialStatuses);
  const [eventLog, setEventLog] = useState<Array<{ file: string; timestamp: string }>>([]);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [lastRunResults, setLastRunResults] = useState<Record<IVAgent, RunResult | null>>({
    intel: null,
    historian: null,
    footage: null,
    music: null,
  });

  const pollTimers = useRef<Record<IVAgent, number | null>>({
    intel: null,
    historian: null,
    footage: null,
    music: null,
  });

  useEffect(() => {
    void loadStatus();
    const source = new EventSource('/api/imperial-vault/stream');
    source.addEventListener('imperial-vault-update', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as
          | { type: 'agent-status'; status: AgentStatus; agent: IVAgent }
          | { type: 'state-file'; file: string; timestamp: string }
          | { type: 'initial'; agents?: AgentStatus[] };

        if (payload.type === 'agent-status') {
          setAgentStatuses((prev) => ({
            ...prev,
            [payload.agent]: payload.status,
          }));
          if (payload.status.state === 'completed' || payload.status.state === 'error') {
            stopPolling(payload.agent);
          }
          return;
        }

        if (payload.type === 'state-file') {
          setEventLog((prev) => [{ file: payload.file, timestamp: payload.timestamp }, ...prev].slice(0, 8));
          return;
        }

        if (payload.type === 'initial' && Array.isArray(payload.agents)) {
          const initialAgents = payload.agents;
          setAgentStatuses((prev) => {
            const next = { ...prev };
            for (const agentStatus of initialAgents) {
              next[agentStatus.agent] = agentStatus;
            }
            return next;
          });
        }
      } catch {
        // ignore malformed events
      }
    });

    return () => {
      source.close();
      IV_AGENTS.forEach((agent) => stopPolling(agent));
    };
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/imperial-vault/status');
      if (!res.ok) throw new Error('Failed to load Imperial Vault status.');
      const payload = (await res.json()) as ImperialVaultStatus;
      setStatus(payload);
      if (Array.isArray(payload.agents)) {
        setAgentStatuses((prev) => {
          const next = { ...prev };
          for (const agentStatus of payload.agents ?? []) {
            next[agentStatus.agent] = agentStatus;
          }
          return next;
        });
      }
      setStatusError(null);
    } catch (error: any) {
      setStatusError(error.message ?? 'Failed to load Imperial Vault status.');
    }
  };

  const fetchAgentStatus = async (agent: IVAgent) => {
    try {
      const res = await fetch(`/api/imperial-vault/status/${agent}`);
      if (!res.ok) return;
      const payload = (await res.json()) as AgentStatus;
      setAgentStatuses((prev) => ({ ...prev, [agent]: payload }));
      if (payload.state === 'completed' || payload.state === 'error') {
        stopPolling(agent);
      }
    } catch {
      // best effort polling
    }
  };

  const startPolling = (agent: IVAgent) => {
    if (pollTimers.current[agent] !== null) return;
    void fetchAgentStatus(agent);
    pollTimers.current[agent] = window.setInterval(() => {
      void fetchAgentStatus(agent);
    }, 1500);
  };

  const stopPolling = (agent: IVAgent) => {
    const timer = pollTimers.current[agent];
    if (timer !== null) {
      window.clearInterval(timer);
      pollTimers.current[agent] = null;
    }
  };

  const runAgent = async (agent: IVAgent) => {
    setInlineError(null);
    startPolling(agent);
    try {
      const res = await fetch(`/api/imperial-vault/run/${agent}`, { method: 'POST' });
      const payload = (await res.json()) as RunResult;
      if (!res.ok) {
        throw new Error(payload.error ?? `Failed to run ${agent}.`);
      }
      setLastRunResults((prev) => ({ ...prev, [agent]: payload }));
      if (payload.status) {
        setAgentStatuses((prev) => ({ ...prev, [agent]: payload.status as AgentStatus }));
      }
    } catch (error: any) {
      setInlineError(error.message ?? `Failed to run ${agent}.`);
    } finally {
      await fetchAgentStatus(agent);
    }
  };

  const completedToday = useMemo(
    () => IV_AGENTS.map((agent) => agentStatuses[agent]).filter((entry) => entry.state === 'completed').length,
    [agentStatuses],
  );

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">Imperial Vault Pipeline</h1>
        <p className="text-zinc-500">Trigger pipeline agents, monitor live status, and inspect execution logs.</p>
      </div>

      {statusError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {statusError}
        </div>
      )}
      {inlineError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {inlineError}
        </div>
      )}

      {status && (
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-100">
                Detection: {status.detected ? 'Detected' : 'Not detected'}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Scripts: {status.availability.scriptsExists ? 'ok' : 'missing'} | State:{' '}
                {status.availability.stateExists ? 'ok' : 'missing'} | Deliverables:{' '}
                {status.availability.deliverablesExists ? 'ok' : 'missing'}
              </div>
            </div>
            <span
              className={`rounded-md border px-3 py-1 text-xs uppercase tracking-wide ${
                status.safeMode
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {status.safeMode ? 'SAFE_MODE' : 'LIVE_MODE'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-600">{status.paths.basePath}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-zinc-200">
              <Activity className="h-5 w-5 text-emerald-500" />
              Pipeline Controls
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {IV_AGENTS.map((agent) => {
                const agentStatus = agentStatuses[agent];
                const isRunning = agentStatus.state === 'running';
                return (
                  <button
                    key={agent}
                    onClick={() => void runAgent(agent)}
                    disabled={isRunning}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/60 p-3 text-left hover:border-amber-500/40 disabled:opacity-50"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-100">Run {labelForAgent(agent)}</div>
                      <div className="text-xs text-zinc-500">POST /api/imperial-vault/run/{agent}</div>
                    </div>
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                    ) : (
                      <Play className="h-4 w-4 text-amber-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-lg font-medium text-zinc-200">Agent Status + Logs</h3>
            <div className="space-y-4">
              {IV_AGENTS.map((agent) => {
                const agentStatus = agentStatuses[agent];
                const lastRun = lastRunResults[agent];
                return (
                  <div key={agent} className="rounded-lg border border-white/10 bg-black/30 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-zinc-100">{labelForAgent(agent)}</div>
                      <StatusBadge status={agentStatus.state} />
                    </div>

                    <div className="mb-2 h-2 w-full overflow-hidden rounded bg-zinc-800">
                      <div
                        className={`h-full transition-all ${
                          agentStatus.state === 'error'
                            ? 'bg-rose-500'
                            : agentStatus.state === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, agentStatus.progress))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-[11px] text-zinc-500 md:grid-cols-2">
                      <div>Progress: {agentStatus.progress}%</div>
                      <div>Exit Code: {agentStatus.lastExitCode ?? 'n/a'}</div>
                      <div>Started: {agentStatus.startedAt ? new Date(agentStatus.startedAt).toLocaleString() : 'n/a'}</div>
                      <div>Finished: {agentStatus.finishedAt ? new Date(agentStatus.finishedAt).toLocaleString() : 'n/a'}</div>
                    </div>

                    {(agentStatus.lastError || (lastRun?.stderr ?? '').length > 0) && (
                      <div className="mt-2 flex items-start gap-2 rounded border border-rose-500/20 bg-rose-500/10 p-2 text-xs text-rose-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{agentStatus.lastError ?? lastRun?.stderr}</span>
                      </div>
                    )}

                    <textarea
                      readOnly
                      className="mt-3 h-36 w-full resize-y rounded border border-white/10 bg-zinc-950 p-2 font-mono text-[11px] text-zinc-300"
                      value={buildLogText(agentStatus, lastRun)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-lg font-medium text-zinc-200">Daily Batch Goal</h3>
            <div className="flex justify-center py-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${Math.min(100, completedToday * 20)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-white">{Math.min(5, completedToday)}/5</span>
                  <span className="text-xs uppercase text-zinc-500">Complete</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <StatusRow label="Generation" done={completedToday > 0} />
              <StatusRow label="Review" done={completedToday > 1} />
              <StatusRow label="Upload" done={completedToday > 2} />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">State File Activity (SSE)</h3>
            {eventLog.length === 0 && <div className="text-xs text-zinc-500">No file events yet.</div>}
            <div className="space-y-2">
              {eventLog.map((event, index) => (
                <div key={`${event.file}-${event.timestamp}-${index}`} className="rounded border border-white/10 bg-zinc-950/50 p-2">
                  <div className="truncate text-[11px] text-zinc-300">{event.file}</div>
                  <div className="text-[10px] text-zinc-500">{new Date(event.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelForAgent(agent: IVAgent) {
  if (agent === 'intel') return 'Intel';
  if (agent === 'historian') return 'Historian';
  if (agent === 'footage') return 'Footage';
  return 'Music';
}

function buildLogText(status: AgentStatus, result: RunResult | null) {
  const lines: string[] = [];
  lines.push(`agent=${status.agent}`);
  lines.push(`state=${status.state}`);
  lines.push(`progress=${status.progress}%`);
  if (status.logs.length > 0) {
    lines.push('');
    lines.push('--- status log ---');
    lines.push(...status.logs);
  }
  const stdout = result?.stdout || status.stdout;
  const stderr = result?.stderr || status.stderr;
  if (stdout) {
    lines.push('');
    lines.push('--- stdout ---');
    lines.push(stdout);
  }
  if (stderr) {
    lines.push('');
    lines.push('--- stderr ---');
    lines.push(stderr);
  }
  return lines.join('\n');
}

function StatusBadge({ status }: { status: AgentRunState }) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
        <CheckCircle className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300">
        <AlertTriangle className="h-3 w-3" />
        Error
      </span>
    );
  }
  return <span className="rounded border border-white/10 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-500">Idle</span>;
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm text-zinc-400">
      <span>{label}</span>
      <span className={done ? 'text-emerald-500' : 'text-zinc-600'}>
        <CheckCircle className="mr-1 inline h-4 w-4" />
        {done ? 'Done' : 'Pending'}
      </span>
    </div>
  );
}
