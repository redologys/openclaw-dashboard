import { useEffect, useState } from 'react';
import { Agent, ProviderConnection } from '../lib/types';
import { AgentDetail } from '../components/agents/AgentDetail';
import { Brain, Cpu, Plus, Search, Sparkles, Users } from 'lucide-react';

interface GeneratedAgentDraft {
  name: string;
  model: string;
  systemPrompt: string;
  skills: string[];
  agentMd: string;
  heartbeatMd: string;
  soulMd: string;
  suggestedCron: string | null;
  suggestedWebhooks: string[];
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providersById, setProvidersById] = useState<Record<string, ProviderConnection>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<GeneratedAgentDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAgents();
    void fetchProviders();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = (await res.json()) as Agent[];
      setAgents(data);
      if (data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
      if (selectedAgentId && !data.some((agent) => agent.id === selectedAgentId)) {
        setSelectedAgentId(data[0]?.id ?? null);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (!res.ok) return;
      const data = (await res.json()) as ProviderConnection[];
      const byId = data.reduce<Record<string, ProviderConnection>>((acc, provider) => {
        acc[provider.id] = provider;
        return acc;
      }, {});
      setProvidersById(byId);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const handleGenerate = async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setCreateError('Describe your agent before generating.');
      return;
    }
    setGenerateState(true);
    try {
      const res = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: trimmed,
          autoGenerateFiles: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to generate agent preview.');
      }
      setDraft((await res.json()) as GeneratedAgentDraft);
      setCreateError(null);
    } catch (error: any) {
      setCreateError(error.message ?? 'Failed to generate agent preview.');
    } finally {
      setGenerating(false);
    }
  };

  const setGenerateState = (value: boolean) => {
    setGenerating(value);
    if (value) setCreateError(null);
  };

  const handleCreate = async () => {
    if (!draft) return;
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        name: draft.name,
        role: 'Specialist',
        description: description.trim(),
        model: draft.model,
        systemPrompt: draft.systemPrompt,
        skills: draft.skills,
        canTalkToAgents: true,
        heartbeatEnabled: true,
        autoGenerateFiles: true,
        agentMd: draft.agentMd,
        heartbeatMd: draft.heartbeatMd,
        soulMd: draft.soulMd,
      };
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to create agent.');
      }

      const created = (await res.json()) as Agent;
      await fetchAgents();
      setSelectedAgentId(created.id);
      setCreateOpen(false);
      setDraft(null);
      setDescription('');
    } catch (error: any) {
      setCreateError(error.message ?? 'Failed to create agent.');
    } finally {
      setCreating(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const role = agent.role ?? '';
    return (
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
        <div className="flex w-80 flex-col border-r border-white/5 bg-zinc-900/20">
          <div className="space-y-4 border-b border-white/5 p-4">
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-5 w-5 text-amber-500" />
                Agent Hub
              </h1>
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500 transition-colors hover:bg-amber-500/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-white/5 bg-zinc-900 py-2 pl-10 pr-4 text-sm transition-colors focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-4 text-center text-sm text-zinc-500">Loading agents...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">No agents found</div>
            ) : (
              filteredAgents.map((agent) => (
                <div key={agent.id} className="space-y-1">
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full rounded-xl p-3 text-left transition-all ${
                      selectedAgentId === agent.id
                        ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20'
                        : 'text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          selectedAgentId === agent.id ? 'bg-amber-500/20' : 'bg-zinc-800'
                        }`}
                      >
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-zinc-100">{agent.name}</div>
                        <div className="truncate text-xs text-zinc-500">{agent.role}</div>
                      </div>
                    </div>
                  </button>

                  {agent.providerId && agent.model && providersById[agent.providerId] && (
                    <div className="px-3">
                      <div className="inline-flex max-w-full items-center truncate rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-300">
                        Using: {providersById[agent.providerId].displayName} - {agent.model}
                      </div>
                    </div>
                  )}

                  {Array.isArray(agent.subagents) && agent.subagents.length > 0 && (
                    <div className="px-3">
                      <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                        Active/Tracked Sub-Agents: {agent.subagents.length}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedAgent ? (
            <AgentDetail agent={selectedAgent} onUpdate={fetchAgents} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-zinc-500">
              <Brain className="h-12 w-12 text-zinc-800" />
              <div className="text-sm">Select an agent to manage brain, skills, and sub-agents</div>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <CreateAgentModal
          description={description}
          setDescription={setDescription}
          draft={draft}
          generating={generating}
          creating={creating}
          error={createError}
          onClose={() => {
            if (creating) return;
            setCreateOpen(false);
            setDraft(null);
            setDescription('');
            setCreateError(null);
          }}
          onGenerate={handleGenerate}
          onCreate={handleCreate}
          onRegenerate={handleGenerate}
        />
      )}
    </>
  );
}

function CreateAgentModal({
  description,
  setDescription,
  draft,
  generating,
  creating,
  error,
  onClose,
  onGenerate,
  onRegenerate,
  onCreate,
}: {
  description: string;
  setDescription: (value: string) => void;
  draft: GeneratedAgentDraft | null;
  generating: boolean;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">
            {draft ? 'Agent Preview - Review Before Creating' : 'Create Agent - Describe What You Need'}
          </h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
            Close
          </button>
        </div>

        {!draft ? (
          <div className="space-y-4">
            <label className="block text-sm text-zinc-300">Describe your agent in plain English</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none"
              placeholder="I need an agent that monitors my channel analytics, tracks competitors, and suggests trending topics."
            />
            {error && <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
            <div className="flex gap-2">
              <button
                onClick={onGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? 'Generating...' : 'Generate Agent'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
                <div className="text-xs text-zinc-500">Name</div>
                <div className="text-sm font-medium text-zinc-100">{draft.name}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
                <div className="text-xs text-zinc-500">Model</div>
                <div className="text-sm font-medium text-zinc-100">{draft.model}</div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-2 text-xs text-zinc-500">System Prompt</div>
              <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">{draft.systemPrompt}</pre>
            </div>

            <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-2 text-xs text-zinc-500">Recommended Skills</div>
              <div className="flex flex-wrap gap-2">
                {draft.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-2 text-xs text-zinc-500">Generated Files</div>
              <ul className="space-y-1 text-xs text-zinc-300">
                <li>agent.md</li>
                <li>heartbeat.md</li>
                <li>soul.md</li>
                <li>config.json</li>
              </ul>
              {draft.suggestedCron && (
                <p className="mt-2 text-xs text-amber-300">Suggested cron: {draft.suggestedCron}</p>
              )}
            </div>

            {error && <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onCreate}
                disabled={creating}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
              <button
                onClick={onRegenerate}
                disabled={generating}
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={onClose}
                className="rounded-md border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
