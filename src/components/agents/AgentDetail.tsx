import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Agent, SubAgent } from '../../lib/types';
import {
  Activity,
  Brain,
  Bot,
  Cpu,
  Database,
  History,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BrainEditor } from './BrainEditor';

interface AgentDetailProps {
  agent: Agent;
  onUpdate: () => void;
}

type TabType = 'overview' | 'brain' | 'subagents' | 'history';

export function AgentDetail({ agent, onUpdate }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [subagents, setSubagents] = useState<SubAgent[]>([]);
  const [subagentsLoading, setSubagentsLoading] = useState(false);
  const [subagentError, setSubagentError] = useState<string | null>(null);
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [spawnTask, setSpawnTask] = useState('');
  const [spawnLifespan, setSpawnLifespan] = useState<'task' | 'session' | 'permanent'>('task');
  const [spawning, setSpawning] = useState(false);

  useEffect(() => {
    void loadSubagents();
  }, [agent.id]);

  const activeSubagents = useMemo(
    () => subagents.filter((subagent) => subagent.status !== 'terminated'),
    [subagents],
  );
  const terminatedSubagents = useMemo(
    () => subagents.filter((subagent) => subagent.status === 'terminated'),
    [subagents],
  );

  const loadSubagents = async () => {
    setSubagentsLoading(true);
    setSubagentError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/subagents`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to fetch sub-agents');
      }
      setSubagents((await res.json()) as SubAgent[]);
    } catch (error: any) {
      setSubagentError(error.message ?? 'Failed to fetch sub-agents');
      setSubagents([]);
    } finally {
      setSubagentsLoading(false);
    }
  };

  const spawnSubagent = async () => {
    const trimmedTask = spawnTask.trim();
    if (!trimmedTask) {
      setSubagentError('Task description is required.');
      return;
    }

    setSpawning(true);
    setSubagentError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/subagents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: trimmedTask,
          lifespan: spawnLifespan,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to spawn sub-agent');
      }

      await loadSubagents();
      onUpdate();
      setSpawnTask('');
      setSpawnLifespan('task');
      setSpawnOpen(false);
    } catch (error: any) {
      setSubagentError(error.message ?? 'Failed to spawn sub-agent');
    } finally {
      setSpawning(false);
    }
  };

  const terminateSubagent = async (subagentId: string) => {
    setSubagentError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/subagents/${subagentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to terminate sub-agent');
      }
      await loadSubagents();
      onUpdate();
    } catch (error: any) {
      setSubagentError(error.message ?? 'Failed to terminate sub-agent');
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/10 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
            <Cpu className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">{agent.name}</h2>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Shield className="h-3.5 w-3.5" />
                {agent.role}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Active & Synced
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/5 bg-zinc-900/5 px-6">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity className="h-4 w-4" />} label="Overview" />
        <TabButton active={activeTab === 'brain'} onClick={() => setActiveTab('brain')} icon={<Brain className="h-4 w-4" />} label="Brain & Prompt" />
        <TabButton active={activeTab === 'subagents'} onClick={() => setActiveTab('subagents')} icon={<Bot className="h-4 w-4" />} label="Sub-Agents" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="h-4 w-4" />} label="History" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-3 gap-4">
              <OverviewCard label="Status" value="NOMINAL" accent="text-amber-500" />
              <OverviewCard label="Uptime" value="99.9%" />
              <OverviewCard label="Tracked Sub-Agents" value={String(activeSubagents.length)} />
            </div>

            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Database className="h-4 w-4 text-amber-500" />
                Agent Definition
              </h3>
              <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-zinc-500 ring-1 ring-white/5">
                {JSON.stringify(agent, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'brain' && <BrainEditor agent={agent} onSave={onUpdate} />}

        {activeTab === 'subagents' && (
          <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Sub-Agent Management</h3>
                <p className="text-sm text-zinc-500">
                  Spawn specialized helpers and terminate them when the task is complete.
                </p>
              </div>
              <button
                onClick={() => setSpawnOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/20"
              >
                <Sparkles className="h-4 w-4" />
                Spawn New Sub-Agent
              </button>
            </div>

            {subagentError && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {subagentError}
              </div>
            )}

            {subagentsLoading ? (
              <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-sm text-zinc-500">Loading sub-agents...</div>
            ) : (
              <>
                <section className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-300">Active Sub-Agents ({activeSubagents.length})</h4>
                  {activeSubagents.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                      No active sub-agents for this parent.
                    </div>
                  )}
                  {activeSubagents.map((subagent) => (
                    <div key={subagent.id} className="rounded-lg border border-white/10 bg-zinc-900/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{subagent.name}</div>
                          <p className="mt-1 text-xs text-zinc-400">{subagent.taskScope}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Lifespan: {subagent.lifespan} | Status: {subagent.status} | Spawned:{' '}
                            {new Date(subagent.spawnedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => void terminateSubagent(subagent.id)}
                          className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Terminate
                        </button>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-300">
                    Terminated ({terminatedSubagents.length})
                  </h4>
                  {terminatedSubagents.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                      No terminated sub-agents yet.
                    </div>
                  )}
                  {terminatedSubagents.map((subagent) => (
                    <div key={subagent.id} className="rounded-lg border border-white/10 bg-zinc-900/30 p-3 text-xs text-zinc-400">
                      {subagent.name} | Terminated:{' '}
                      {subagent.terminatesAt ? new Date(subagent.terminatesAt).toLocaleString() : 'n/a'}
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-12 text-center text-zinc-500">
            <History className="mx-auto mb-4 h-12 w-12 opacity-10" />
            <p className="text-sm">Prompt and execution history timeline is coming soon.</p>
          </div>
        )}
      </div>

      {spawnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-zinc-950 p-6">
            <h4 className="text-lg font-semibold text-zinc-100">Spawn Sub-Agent</h4>
            <p className="mt-1 text-sm text-zinc-500">Describe the task and choose a lifespan.</p>

            <div className="mt-4 space-y-4">
              <textarea
                value={spawnTask}
                onChange={(event) => setSpawnTask(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none"
                placeholder="Research top 5 trending history topics and return a ranked report."
              />

              <div>
                <label className="mb-2 block text-xs text-zinc-500">Lifespan</label>
                <div className="flex flex-wrap gap-2">
                  {(['task', 'session', 'permanent'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSpawnLifespan(option)}
                      className={`rounded border px-3 py-1.5 text-xs ${
                        spawnLifespan === option
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                          : 'border-white/10 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void spawnSubagent()}
                  disabled={spawning}
                  className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {spawning ? 'Spawning...' : 'Spawn'}
                </button>
                <button
                  onClick={() => {
                    if (spawning) return;
                    setSpawnOpen(false);
                  }}
                  className="rounded-md border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
        active ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
    </button>
  );
}

function OverviewCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4">
      <div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-lg font-bold ${accent ?? 'text-zinc-200'}`}>{value}</div>
    </div>
  );
}
