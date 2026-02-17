import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Agent, ProviderConnection, Skill } from '../../lib/types';
import {
  Cable,
  CheckCircle2,
  Code,
  FlaskConical,
  GripVertical,
  Layers,
  Minus,
  Plus,
  Save,
  Settings,
  Zap,
} from 'lucide-react';

interface BrainEditorProps {
  agent: Agent;
  onSave: () => void;
}

interface SkillTestResponse {
  safeMode: boolean;
  status: string;
  message: string;
  skills: string[];
  dangerousSkills: string[];
}

export function BrainEditor({ agent, onSave }: BrainEditorProps) {
  const [prompt, setPrompt] = useState(agent.systemPrompt || '');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(agent.skills ?? []);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [draggingSkillId, setDraggingSkillId] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<SkillTestResponse | null>(null);

  const [providers, setProviders] = useState<ProviderConnection[]>([]);
  const [providerModels, setProviderModels] = useState<string[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState(agent.providerId ?? '');
  const [selectedModel, setSelectedModel] = useState(agent.model ?? '');

  useEffect(() => {
    setPrompt(agent.systemPrompt || '');
    setSelectedProviderId(agent.providerId ?? '');
    setSelectedModel(agent.model ?? '');
    setSelectedSkillIds(agent.skills ?? []);
    setTestResult(null);
  }, [agent.id, agent.systemPrompt, agent.providerId, agent.model, agent.skills]);

  useEffect(() => {
    void fetchSkills();
    void fetchProviders();
  }, [agent.id]);

  useEffect(() => {
    extractVariables(prompt);
  }, [prompt]);

  useEffect(() => {
    if (!selectedProviderId) {
      setProviderModels([]);
      return;
    }
    void fetchProviderModels(selectedProviderId);
  }, [selectedProviderId]);

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);

  const enabledSkills = useMemo(
    () =>
      selectedSkillIds.map((skillId) => {
        const match = skills.find((skill) => skill.id === skillId);
        if (match) return match;
        return {
          id: skillId,
          name: skillId,
          description: 'Imported from agent config',
          version: 'unknown',
        } as Skill;
      }),
    [selectedSkillIds, skills],
  );

  const availableSkills = useMemo(
    () => skills.filter((skill) => !selectedSkillIds.includes(skill.id)),
    [skills, selectedSkillIds],
  );

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      const data = (await res.json()) as Skill[];
      setSkills(data);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const fetchProviders = async () => {
    setProviderLoading(true);
    setProviderError(null);
    try {
      const res = await fetch('/api/providers');
      if (!res.ok) throw new Error('Failed to fetch providers.');
      const data = (await res.json()) as ProviderConnection[];
      setProviders(data);

      if (selectedProviderId && !data.some((provider) => provider.id === selectedProviderId)) {
        setSelectedProviderId('');
        setSelectedModel('');
      }
    } catch (err: any) {
      setProviderError(err.message ?? 'Failed to fetch providers.');
    } finally {
      setProviderLoading(false);
    }
  };

  const fetchProviderModels = async (providerId: string) => {
    setProviderError(null);
    try {
      const res = await fetch(`/api/providers/${providerId}/models`);
      if (!res.ok) throw new Error('Failed to fetch provider models.');
      const data = (await res.json()) as string[];
      setProviderModels(data);
      if (selectedModel && !data.includes(selectedModel)) {
        setSelectedModel('');
      }
    } catch (err: any) {
      setProviderModels([]);
      setProviderError(err.message ?? 'Failed to fetch provider models.');
    }
  };

  const extractVariables = (text: string) => {
    const matches = text.match(/{{[^{}]+}}/g);
    if (!matches) {
      setDetectedVariables([]);
      return;
    }
    const unique = Array.from(new Set(matches.map((match) => match.replace(/{{|}}/g, ''))));
    setDetectedVariables(unique);
  };

  const savePromptAndConfig = async () => {
    setSavingPrompt(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: prompt,
          providerId: selectedProviderId || undefined,
          model: selectedModel || undefined,
          skills: selectedSkillIds,
        }),
      });
      if (res.ok) {
        onSave();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingPrompt(false);
    }
  };

  const persistSkillOrder = async (nextSkills: string[]) => {
    const previous = selectedSkillIds;
    setSelectedSkillIds(nextSkills);
    setSkillsSaving(true);
    setSkillsError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: nextSkills,
          priority: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to save skills.');
      }
      onSave();
    } catch (error: any) {
      setSelectedSkillIds(previous);
      setSkillsError(error.message ?? 'Failed to save skills.');
    } finally {
      setSkillsSaving(false);
    }
  };

  const addSkill = async (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) return;
    await persistSkillOrder([...selectedSkillIds, skillId]);
  };

  const removeSkill = async (skillId: string) => {
    await persistSkillOrder(selectedSkillIds.filter((id) => id !== skillId));
  };

  const reorderSkills = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = selectedSkillIds.findIndex((id) => id === sourceId);
    const targetIndex = selectedSkillIds.findIndex((id) => id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reordered = [...selectedSkillIds];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    await persistSkillOrder(reordered);
  };

  const runSkillTest = async () => {
    setTestRunning(true);
    setSkillsError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/skills/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Run skill matrix validation' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Skill test failed.');
      }
      setTestResult((await res.json()) as SkillTestResponse);
    } catch (error: any) {
      setSkillsError(error.message ?? 'Skill test failed.');
    } finally {
      setTestRunning(false);
    }
  };

  const getRiskBadge = (skillId: string) => {
    const lower = skillId.toLowerCase();
    if (lower.includes('shell') || lower.includes('bash')) {
      return { label: '⚠ Shell', className: 'border-rose-500/30 bg-rose-500/10 text-rose-300' };
    }
    if (lower.includes('file') || lower.includes('edit') || lower.includes('write')) {
      return { label: '⚠ File', className: 'border-orange-500/30 bg-orange-500/10 text-orange-300' };
    }
    if (lower.includes('web_search') || lower.includes('web_fetch') || lower === 'web_search' || lower === 'web_fetch') {
      return { label: '⚠ Web', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
    }
    return { label: 'Safe', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-zinc-950">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-8 p-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                  <Code className="h-5 w-5 text-amber-500" />
                  System Prompt Editor
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Define the agent identity, constraints, and orchestration strategy.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-xs text-zinc-500">
                  {prompt.length} characters
                </div>
                <button
                  onClick={() => void savePromptAndConfig()}
                  disabled={savingPrompt}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-black transition-all hover:bg-amber-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingPrompt ? 'Saving...' : 'Save Brain'}
                </button>
              </div>
            </div>

            <div className="grid h-[500px] grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl ring-1 ring-white/5 lg:col-span-3">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  theme="vs-dark"
                  value={prompt}
                  onChange={(value) => setPrompt(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                  }}
                />
              </div>

              <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
                <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <Layers className="h-3.5 w-3.5" />
                  Variables
                </h4>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {detectedVariables.length === 0 ? (
                    <div className="rounded-lg bg-black/20 p-3 text-xs italic text-zinc-600">
                      No variables detected. Use {'{{VARIABLE_NAME}}'} syntax.
                    </div>
                  ) : (
                    detectedVariables.map((variable) => (
                      <div key={variable} className="rounded-lg border border-white/5 bg-zinc-800/50 p-2">
                        <div className="mb-1 text-[10px] text-zinc-500">Detected</div>
                        <div className="flex items-center justify-between text-xs font-mono text-amber-500">
                          {variable}
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 border-t border-white/5 pt-4 text-[10px] text-zinc-600">
                  Built-in runtime variables like {'{{DATE}}'} and {'{{USER_NAME}}'} are injected automatically.
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                <Settings className="h-5 w-5 text-amber-500" />
                Model & Provider
              </h3>
              <div className="space-y-5 rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
                {providerError && (
                  <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {providerError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={(event) => {
                      setSelectedProviderId(event.target.value);
                      setSelectedModel('');
                    }}
                    disabled={providerLoading || providers.length === 0}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm transition-colors focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {providerLoading
                        ? 'Loading providers...'
                        : providers.length === 0
                          ? 'No providers configured'
                          : 'Select a provider'}
                    </option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} ({provider.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    disabled={!selectedProviderId || providerModels.length === 0}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm transition-colors focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedProviderId
                        ? 'Select provider first'
                        : providerModels.length === 0
                          ? 'No models available'
                          : 'Select a model'}
                    </option>
                    {providerModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {providers.length === 0 && (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                    No providers available yet.{' '}
                    <Link to="/settings/providers" className="text-amber-400 underline hover:text-amber-300">
                      Connect a provider in Settings -&gt; Providers
                    </Link>
                    .
                  </div>
                )}

                {selectedProvider && selectedModel && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    <Cable className="h-3.5 w-3.5" />
                    Using: {selectedProvider.displayName} - {selectedModel}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                <Zap className="h-5 w-5 text-amber-500" />
                Skill Matrix - Drag to Reorder Priority
              </h3>
              <div className="space-y-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-6">
                {skillsError && (
                  <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {skillsError}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Enabled Skills (Priority Order)
                  </div>
                  {enabledSkills.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-zinc-900 p-3 text-xs text-zinc-500">
                      No skills enabled yet.
                    </div>
                  )}
                  {enabledSkills.map((skill, index) => {
                    const riskBadge = getRiskBadge(skill.id);
                    const isPreinstalled = skill.origin === 'preinstalled' || skill.preinstalled;
                    return (
                      <div
                        key={skill.id}
                        draggable
                        onDragStart={() => setDraggingSkillId(skill.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (!draggingSkillId) return;
                          void reorderSkills(draggingSkillId, skill.id);
                          setDraggingSkillId(null);
                        }}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-zinc-600" />
                          <span className="text-xs text-zinc-500">{index + 1}.</span>
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                              {skill.name}
                              {isPreinstalled && (
                                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-emerald-300">
                                  Pre-installed
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500">{skill.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] ${riskBadge.className}`}>
                            {riskBadge.label}
                          </span>
                          <button
                            onClick={() => void removeSkill(skill.id)}
                            disabled={skillsSaving}
                            className="rounded border border-white/10 bg-zinc-950 p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Available Skills (Click + to Enable)
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {availableSkills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900 p-2">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-zinc-200">{skill.name}</div>
                          <div className="truncate text-[10px] text-zinc-500">{skill.id}</div>
                        </div>
                        <button
                          onClick={() => void addSkill(skill.id)}
                          disabled={skillsSaving}
                          className="rounded border border-emerald-500/30 bg-emerald-500/10 p-1 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void runSkillTest()}
                    disabled={testRunning}
                    className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    {testRunning ? 'Testing...' : 'Test Skills'}
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${skillsSaving ? 'animate-pulse text-amber-300' : 'text-emerald-400'}`} />
                    {skillsSaving ? 'Saving skill order...' : 'Auto-save enabled'}
                  </div>
                </div>

                {testResult && (
                  <div className="rounded-md border border-white/10 bg-zinc-950 p-3">
                    <div className="text-xs text-zinc-300">
                      {testResult.message} ({testResult.safeMode ? 'SAFE_MODE' : 'LIVE'})
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">Dangerous skills: {testResult.dangerousSkills.join(', ') || 'none'}</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
