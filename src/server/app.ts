import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Agent, Playbook, ChatMessage, PermissionContext } from '../lib/types';
import { PlaybookRunner } from '../lib/playbookRunner';
import { SkillsRegistry } from '../lib/skillsRegistry';
import { ChatService } from '../lib/chatService';
import { AgentHeartbeat } from '../lib/agentHeartbeat';
import { CronRunner } from '../lib/cronRunner';
import { sshClient } from './sshClient';
import { config } from '../lib/config';
import { PermissionFirewall, PermissionEngine } from '../lib/permissions';
import { SentinelService } from '../lib/sentinelService';
import { getProviderById, listProviders, upsertProvider } from '../lib/providersStore';
import { mergeWithConfiguredSkills } from '../lib/skillsStore';
import {
  getContextHealthSnapshot,
  getLiveActivityFeed,
  getMemoryTimeline,
  getSecurityAlerts,
  getSystemResourceSnapshot,
  quickCaptureNote,
  restoreContextForAgent,
  runContextCompaction,
  searchMemorySmart,
} from '../lib/skillInsights';
import { getWorkspaceImportReport, resolveWorkspaceConflict, runWorkspaceImport } from '../lib/workspaceImporter';
import { safeWriteJSON } from '../lib/dataIntegrity';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createBrowserRouter } from './browserStream';
import { gateway } from './gateway';
import { imperialVaultRouter } from './imperialVaultAPI';
import { dataPath } from '../lib/paths';

export function createApp(
  playbookRunner: PlaybookRunner,
  skillsRegistry: SkillsRegistry,
  chatService: ChatService,
  agentHeartbeat: AgentHeartbeat,
  cronRunner: CronRunner,
  permissionFirewall: PermissionFirewall,
  permissionEngine: PermissionEngine,
  sentinelService: SentinelService,
) {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  const normalizeOptionalText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const buildPermissionContext = (body: Record<string, unknown> | undefined): PermissionContext => {
    const userRoleRaw = typeof body?.userRole === 'string' ? body.userRole : undefined;
    const userRole =
      userRoleRaw === 'root' || userRoleRaw === 'admin' || userRoleRaw === 'viewer' || userRoleRaw === 'user'
        ? userRoleRaw
        : 'admin';

    return {
      userRole,
      agentId: normalizeOptionalText(body?.agentId),
      safeMode: config.SAFE_MODE,
    };
  };

  const validateAgentProviderAssignment = (agent: Partial<Agent>): string | null => {
    const providerId = normalizeOptionalText(agent.providerId);
    const modelId = normalizeOptionalText(agent.model);

    if (!providerId) return null;

    const provider = getProviderById(providerId);
    if (!provider) {
      return `Provider "${providerId}" was not found.`;
    }

    if (modelId && !provider.models.includes(modelId)) {
      return `Model "${modelId}" is not available for provider "${providerId}".`;
    }

    return null;
  };

  // --- Gateway Status ---
  app.get('/api/gateway/status', (_req, res) => {
    const status = gateway.getConnectionStatus();
    res.json({
      connected: status.connected,
      latency: status.latency,
      reconnectAttempts: status.reconnectAttempts,
      safeMode: config.SAFE_MODE,
      gatewayUrl: config.GATEWAY_URL,
    });
  });

  // --- Sentinel Health ---

  app.get('/api/health/checks', (_req, res) => {
    res.json(sentinelService.getLatestChecks());
  });

  app.get('/api/health/summary', (_req, res) => {
    res.json(sentinelService.getSummary(config.SAFE_MODE));
  });

  app.post('/api/health/run', (req, res) => {
    try {
      const checkName = typeof req.body?.checkName === 'string' ? req.body.checkName : undefined;
      const source = checkName ? 'retry' : 'manual';
      const result = sentinelService.runHealthChecks({
        safeMode: config.SAFE_MODE,
        gatewayStatus: gateway.getConnectionStatus(),
        agentStatuses: agentHeartbeat.listStatuses(),
        source,
        checkName,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/health/config', (_req, res) => {
    res.json(sentinelService.getConfig());
  });

  app.post('/api/health/config', (req, res) => {
    try {
      const updated = sentinelService.updateConfig(req.body ?? {});
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Workspace Import ---

  app.get('/api/import/status', async (_req, res) => {
    const report = await getWorkspaceImportReport();
    if (!report) {
      return res.json({
        available: false,
        message: 'No import report available yet.',
      });
    }
    res.json({
      available: true,
      ...report,
    });
  });

  app.post('/api/import/run', async (req, res) => {
    try {
      const dryRunQuery = typeof req.query?.dryRun === 'string' ? req.query.dryRun : undefined;
      const dryRunBody = req.body?.dryRun;
      const dryRun =
        dryRunBody === true ||
        dryRunBody === 'true' ||
        dryRunQuery === 'true' ||
        dryRunQuery === '1';
      const report = await runWorkspaceImport({
        workspaceRoot: config.WORKSPACE_ROOT,
        dryRun,
      });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/import/conflicts/:id/resolve', async (req, res) => {
    const resolution = req.body?.resolution as 'keep_existing' | 'use_imported' | 'merge_both' | undefined;
    if (!resolution) return res.status(400).json({ error: 'resolution is required' });
    try {
      const report = await resolveWorkspaceConflict(req.params.id, resolution);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Providers ---

  app.get('/api/providers', (_req, res) => {
    res.json(listProviders());
  });

  app.get('/api/providers/:id/models', (req, res) => {
    const provider = getProviderById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider.models);
  });

  app.post('/api/providers', (req, res) => {
    try {
      const existing = typeof req.body?.id === 'string' ? getProviderById(req.body.id) : undefined;
      const saved = upsertProvider(req.body ?? {});
      res.status(existing ? 200 : 201).json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Agents CRUD ---

  type AgentRecord = Agent & {
    createdAt?: string;
    updatedAt?: string;
    subagents?: string[];
  };

  type SubAgentRecord = AgentRecord & {
    parentAgentId: string;
    taskScope: string;
    lifespan: 'task' | 'session' | 'permanent';
    spawnedAt: string;
    terminatesAt?: string;
    status: 'spawning' | 'active' | 'completing' | 'terminated';
    progress?: string;
  };

  type AgentsFileObject = {
    agents?: AgentRecord[];
    subagents?: SubAgentRecord[];
    updatedAt?: string;
    [key: string]: unknown;
  };

  type AgentsStore = {
    format: 'array' | 'object';
    root: AgentsFileObject;
    agents: AgentRecord[];
    subagents: SubAgentRecord[];
  };

  const AGENTS_FILE = dataPath('agents.json');
  const OPENCLAW_AGENTS_BASE_DIR = path.join(os.homedir(), '.openclaw', 'agents');

  const normalizeSkillIds = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return Array.from(
      new Set(
        value
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry) => entry.length > 0),
      ),
    );
  };

  const inferSkillsFromTask = (taskDescription: string): string[] => {
    const normalized = taskDescription.toLowerCase();
    const suggestions: string[] = [];

    if (normalized.includes('search') || normalized.includes('research') || normalized.includes('trend')) {
      suggestions.push('web_search');
    }
    if (normalized.includes('fetch') || normalized.includes('scrape')) {
      suggestions.push('web_fetch');
    }
    if (normalized.includes('analysis') || normalized.includes('analy')) {
      suggestions.push('chaos-mind');
    }
    if (normalized.includes('memory') || normalized.includes('recall')) {
      suggestions.push('brainrepo');
    }

    if (suggestions.length === 0) {
      suggestions.push('continuity');
    }

    return Array.from(new Set(suggestions));
  };

  const inferSubAgentName = (taskDescription: string): string => {
    const firstWords = taskDescription
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return firstWords ? `${firstWords} Helper` : 'Task Helper';
  };

  const getAgentsStore = async (): Promise<AgentsStore> => {
    const absolutePath = AGENTS_FILE;
    if (!fs.existsSync(absolutePath)) {
      return { format: 'object', root: { agents: [], subagents: [] }, agents: [], subagents: [] };
    }

    try {
      const raw = JSON.parse(await fsPromises.readFile(absolutePath, 'utf-8')) as unknown;
      if (Array.isArray(raw)) {
        return {
          format: 'array',
          root: {},
          agents: raw as AgentRecord[],
          subagents: [],
        };
      }

      if (raw && typeof raw === 'object') {
        const root = raw as AgentsFileObject;
        const agents = Array.isArray(root.agents) ? root.agents : [];
        const subagents = Array.isArray(root.subagents) ? root.subagents : [];
        return {
          format: 'object',
          root,
          agents,
          subagents,
        };
      }
    } catch (error) {
      console.warn(`[API] Failed to parse ${AGENTS_FILE}. Falling back to empty store.`, error);
    }

    return { format: 'object', root: { agents: [], subagents: [] }, agents: [], subagents: [] };
  };

  const saveAgentsStore = async (store: AgentsStore) => {
    if (store.format === 'array' && store.subagents.length === 0) {
      await safeWriteJSON(AGENTS_FILE, store.agents);
      return;
    }

    await safeWriteJSON(AGENTS_FILE, {
      ...store.root,
      agents: store.agents,
      subagents: store.subagents,
      updatedAt: new Date().toISOString(),
    });
  };

  const writeGeneratedAgentFiles = async (
    agent: AgentRecord,
    files: {
      agentMd?: string;
      heartbeatMd?: string;
      soulMd?: string;
    },
  ) => {
    const targetDir = path.join(OPENCLAW_AGENTS_BASE_DIR, agent.id);
    await fsPromises.mkdir(targetDir, { recursive: true });
    await fsPromises.writeFile(path.join(targetDir, 'agent.md'), files.agentMd ?? `# ${agent.name}\n\n${agent.description ?? ''}\n`);
    await fsPromises.writeFile(
      path.join(targetDir, 'heartbeat.md'),
      files.heartbeatMd ?? `# Heartbeat\n\n- status: active\n- cadence: 5m\n- owner: ${agent.name}\n`,
    );
    await fsPromises.writeFile(
      path.join(targetDir, 'soul.md'),
      files.soulMd ?? `# Soul\n\n## Personality\nFocused and reliable.\n\n## Values\nSafety, clarity, execution.\n`,
    );
    await fsPromises.writeFile(
      path.join(targetDir, 'config.json'),
      JSON.stringify(
        {
          id: agent.id,
          name: agent.name,
          model: agent.model,
          providerId: agent.providerId,
          systemPrompt: agent.systemPrompt,
          skills: agent.skills,
        },
        null,
        2,
      ),
    );
  };

  const buildGeneratedAgentDraft = (description: string) => {
    const availableSkillIds = mergeWithConfiguredSkills(skillsRegistry.listSkills()).map((skill) => skill.id);
    const inferredSkills = inferSkillsFromTask(description).filter((skillId) => availableSkillIds.includes(skillId));
    const skills = inferredSkills.length > 0 ? inferredSkills : availableSkillIds.slice(0, 3);
    const normalizedDescription = description.trim();
    const nameSeed = normalizedDescription
      .split(/\s+/)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const name = nameSeed.length > 0 ? nameSeed : 'Auto Agent';
    const suggestedCron =
      normalizedDescription.toLowerCase().includes('daily') || normalizedDescription.toLowerCase().includes('every day')
        ? '0 6 * * *'
        : normalizedDescription.toLowerCase().includes('weekly')
          ? '0 13 * * 0'
          : null;

    return {
      name,
      model: 'claude-sonnet-4-5',
      systemPrompt: `You are ${name}. Your mission is:\n\n${normalizedDescription}\n\nFollow safety policies and provide concise execution updates.`,
      skills,
      agentMd: `# ${name}\n\n## Purpose\n${normalizedDescription}\n\n## Capabilities\n- Execute assigned tasks reliably\n- Report progress and blockers clearly\n\n## Limitations\n- Must follow SAFE_MODE and permission firewall constraints`,
      heartbeatMd: `# Heartbeat\n\n## Health Checks\n- Gateway connectivity\n- Tool availability\n- Task queue depth\n\n## Metrics\n- completion_rate\n- error_rate\n\n## Schedule\n- every 5 minutes`,
      soulMd: `# Soul\n\n## Personality\nMethodical, calm, and execution-focused.\n\n## Values\nSafety first, then speed.\n\n## Decision Style\nPrefer deterministic and reversible actions.`,
      suggestedCron,
      suggestedWebhooks: [] as string[],
    };
  };

  const buildDangerousSkillList = (skillIds: string[]) =>
    skillIds.filter((skillId) => /(shell|bash|file|web_?search|web_?fetch)/i.test(skillId));

  app.get('/api/agents', async (_req, res) => {
    const store = await getAgentsStore();
    res.json(store.agents);
  });

  app.post('/api/agents/generate', async (req, res) => {
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    try {
      const draft = buildGeneratedAgentDraft(description);
      res.json(draft);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/agents', async (req, res) => {
    const incoming = req.body as Partial<AgentRecord> & {
      autoGenerateFiles?: boolean;
      agentMd?: string;
      heartbeatMd?: string;
      soulMd?: string;
    };

    const store = await getAgentsStore();
    const now = new Date().toISOString();
    const id = normalizeOptionalText(incoming.id) ?? randomUUID();
    const name = normalizeOptionalText(incoming.name);

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    if (store.agents.find((agent) => agent.id === id)) {
      return res.status(409).json({ error: 'Agent ID already exists' });
    }

    const newAgent: AgentRecord = {
      id,
      name,
      role: normalizeOptionalText(incoming.role) ?? 'Assistant',
      description: normalizeOptionalText(incoming.description),
      systemPrompt: normalizeOptionalText(incoming.systemPrompt) ?? 'You are a helpful assistant.',
      providerId: normalizeOptionalText(incoming.providerId),
      model: normalizeOptionalText(incoming.model),
      cliProfileId: normalizeOptionalText(incoming.cliProfileId),
      skills: normalizeSkillIds(incoming.skills),
      canTalkToAgents: incoming.canTalkToAgents ?? true,
      heartbeatEnabled: incoming.heartbeatEnabled ?? true,
      subagents: [],
      createdAt: now,
      updatedAt: now,
    };

    const providerValidationError = validateAgentProviderAssignment(newAgent);
    if (providerValidationError) {
      return res.status(400).json({ error: providerValidationError });
    }

    store.agents.push(newAgent);
    await saveAgentsStore(store);

    if (incoming.autoGenerateFiles) {
      await writeGeneratedAgentFiles(newAgent, {
        agentMd: incoming.agentMd,
        heartbeatMd: incoming.heartbeatMd,
        soulMd: incoming.soulMd,
      });
    }

    res.status(201).json(newAgent);
  });

  app.put('/api/agents/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body as Partial<AgentRecord>;
    const store = await getAgentsStore();
    const index = store.agents.findIndex((agent) => agent.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const normalizedUpdates: Partial<AgentRecord> = { ...updates };
    if (Object.prototype.hasOwnProperty.call(updates, 'providerId')) {
      normalizedUpdates.providerId = normalizeOptionalText(updates.providerId);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'model')) {
      normalizedUpdates.model = normalizeOptionalText(updates.model);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'cliProfileId')) {
      normalizedUpdates.cliProfileId = normalizeOptionalText(updates.cliProfileId);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'skills')) {
      normalizedUpdates.skills = normalizeSkillIds(updates.skills);
    }

    const mergedAgent: AgentRecord = {
      ...store.agents[index],
      ...normalizedUpdates,
      updatedAt: new Date().toISOString(),
    };

    const providerValidationError = validateAgentProviderAssignment(mergedAgent);
    if (providerValidationError) {
      return res.status(400).json({ error: providerValidationError });
    }

    store.agents[index] = mergedAgent;
    await saveAgentsStore(store);
    res.json(store.agents[index]);
  });

  app.put('/api/agents/:id/skills', async (req, res) => {
    const { id } = req.params;
    const skills = normalizeSkillIds(req.body?.skills);
    const store = await getAgentsStore();
    const index = store.agents.findIndex((agent) => agent.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    store.agents[index] = {
      ...store.agents[index],
      skills,
      updatedAt: new Date().toISOString(),
    };
    await saveAgentsStore(store);

    res.json({
      agent: store.agents[index],
      skillsEnabled: skills.length,
      dangerousSkills: buildDangerousSkillList(skills),
    });
  });

  app.post('/api/agents/:id/skills/test', async (req, res) => {
    const { id } = req.params;
    const store = await getAgentsStore();
    const agent = store.agents.find((entry) => entry.id === id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const testMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : 'Test current skill matrix';
    const dangerousSkills = buildDangerousSkillList(agent.skills ?? []);

    if (config.SAFE_MODE) {
      return res.json({
        safeMode: true,
        status: 'ok',
        message: 'Skill test simulated in SAFE_MODE.',
        testMessage,
        skills: agent.skills,
        dangerousSkills,
      });
    }

    res.json({
      safeMode: false,
      status: 'queued',
      message: 'Skill matrix test request accepted.',
      testMessage,
      skills: agent.skills,
      dangerousSkills,
    });
  });

  app.delete('/api/agents/:id', async (req, res) => {
    const { id } = req.params;
    const store = await getAgentsStore();
    const initialLength = store.agents.length;
    store.agents = store.agents.filter((agent) => agent.id !== id);
    if (store.agents.length === initialLength) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    store.subagents = store.subagents.filter((subagent) => subagent.parentAgentId !== id);
    await saveAgentsStore(store);
    res.status(204).send();
  });

  app.get('/api/agents/:parentId/subagents', async (req, res) => {
    const { parentId } = req.params;
    const store = await getAgentsStore();
    const parent = store.agents.find((agent) => agent.id === parentId);
    if (!parent) {
      return res.status(404).json({ error: 'Parent agent not found' });
    }

    const subagents = store.subagents
      .filter((subagent) => subagent.parentAgentId === parentId)
      .sort((a, b) => new Date(b.spawnedAt).getTime() - new Date(a.spawnedAt).getTime());
    res.json(subagents);
  });

  app.post('/api/agents/:parentId/subagents', async (req, res) => {
    const { parentId } = req.params;
    const store = await getAgentsStore();
    const parentIndex = store.agents.findIndex((agent) => agent.id === parentId);
    if (parentIndex === -1) {
      return res.status(404).json({ error: 'Parent agent not found' });
    }

    const taskDescription = normalizeOptionalText(req.body?.taskDescription);
    if (!taskDescription) {
      return res.status(400).json({ error: 'taskDescription is required' });
    }

    const lifespanRaw = normalizeOptionalText(req.body?.lifespan);
    const lifespan: SubAgentRecord['lifespan'] =
      lifespanRaw === 'session' || lifespanRaw === 'permanent' ? lifespanRaw : 'task';
    const requestedSkills = normalizeSkillIds(req.body?.skills);
    const subagentSkills = requestedSkills.length > 0 ? requestedSkills : inferSkillsFromTask(taskDescription);
    const now = new Date().toISOString();
    const subagentId = `sub-${randomUUID().slice(0, 8)}`;

    const subagent: SubAgentRecord = {
      id: subagentId,
      name: inferSubAgentName(taskDescription),
      role: 'Sub-Agent',
      description: `Spawned for task: ${taskDescription}`,
      systemPrompt: `You are a specialist sub-agent for: ${taskDescription}`,
      model: normalizeOptionalText(req.body?.model) ?? store.agents[parentIndex].model,
      providerId: normalizeOptionalText(req.body?.providerId) ?? store.agents[parentIndex].providerId,
      cliProfileId: normalizeOptionalText(req.body?.cliProfileId) ?? store.agents[parentIndex].cliProfileId,
      skills: subagentSkills,
      canTalkToAgents: true,
      heartbeatEnabled: true,
      parentAgentId: parentId,
      taskScope: taskDescription,
      lifespan,
      spawnedAt: now,
      status: config.SAFE_MODE ? 'active' : 'spawning',
      progress: '0%',
      createdAt: now,
      updatedAt: now,
    };

    const providerValidationError = validateAgentProviderAssignment(subagent);
    if (providerValidationError) {
      return res.status(400).json({ error: providerValidationError });
    }

    if (!Array.isArray(store.agents[parentIndex].subagents)) {
      store.agents[parentIndex].subagents = [];
    }
    store.agents[parentIndex].subagents = Array.from(
      new Set([...(store.agents[parentIndex].subagents ?? []), subagentId]),
    );
    store.agents[parentIndex].updatedAt = now;

    store.subagents.push(subagent);
    await saveAgentsStore(store);

    const subagentWorkspaceDir = path.join(OPENCLAW_AGENTS_BASE_DIR, parentId, 'subagents', subagentId);
    await fsPromises.mkdir(subagentWorkspaceDir, { recursive: true });
    await fsPromises.writeFile(path.join(subagentWorkspaceDir, 'agent.md'), `# ${subagent.name}\n\n${subagent.description}\n`);
    await fsPromises.writeFile(path.join(subagentWorkspaceDir, 'task.md'), `# Task Scope\n\n${taskDescription}\n`);
    await fsPromises.writeFile(
      path.join(subagentWorkspaceDir, 'parent.json'),
      JSON.stringify({ parentAgentId: parentId, parentName: store.agents[parentIndex].name }, null, 2),
    );

    res.status(201).json({ subagent });
  });

  app.delete('/api/agents/:parentId/subagents/:subagentId', async (req, res) => {
    const { parentId, subagentId } = req.params;
    const store = await getAgentsStore();
    const parentIndex = store.agents.findIndex((agent) => agent.id === parentId);
    if (parentIndex === -1) {
      return res.status(404).json({ error: 'Parent agent not found' });
    }

    const subagentIndex = store.subagents.findIndex(
      (subagent) => subagent.id === subagentId && subagent.parentAgentId === parentId,
    );
    if (subagentIndex === -1) {
      return res.status(404).json({ error: 'Sub-agent not found' });
    }

    const now = new Date().toISOString();
    store.subagents[subagentIndex] = {
      ...store.subagents[subagentIndex],
      status: 'terminated',
      terminatesAt: now,
      updatedAt: now,
    };
    store.agents[parentIndex].updatedAt = now;
    await saveAgentsStore(store);

    res.json({ subagent: store.subagents[subagentIndex] });
  });


  // --- Playbook Webhook ---

  const PLAYBOOKS_FILE = dataPath('playbooks.json');
  
  const getPlaybook = (id: string): Playbook | undefined => {
      if (!fs.existsSync(PLAYBOOKS_FILE)) return undefined;
      const playbooks: Playbook[] = JSON.parse(fs.readFileSync(PLAYBOOKS_FILE, 'utf-8'));
      return playbooks.find(p => p.id === id);
  }

  app.post('/api/webhooks/playbook/:id', async (req, res) => {
    const { id } = req.params;
    const variables = req.body;

    const playbook = getPlaybook(id);
    if (!playbook) {
      return res.status(404).json({ error: 'Playbook not found' });
    }

    try {
      const runId = await playbookRunner.run(playbook, variables);
      res.json({ runId, status: 'queued' });
    } catch (error: any) {
      console.error(`[API] Playbook trigger failed:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Chat & Conversations ---

  app.get('/api/conversations', async (req, res) => {
    const agentId = req.query.agentId as string | undefined;
    const list = await chatService.listConversations(agentId);
    res.json(list);
  });

  app.post('/api/conversations', async (req, res) => {
    const { agentId, title } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });
    const conv = await chatService.createConversation(agentId, title);
    res.status(201).json(conv);
  });

  app.get('/api/conversations/:id', async (req, res) => {
    const conv = await chatService.getConversation(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conv);
  });

  app.post('/api/conversations/:id/messages', async (req, res) => {
    const { id } = req.params;
    const message = req.body as ChatMessage;
    try {
      await chatService.addMessage(id, message);
      res.status(201).json({ status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/conversations/:id/agent', async (req, res) => {
    const { id } = req.params;
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });
    try {
      await chatService.switchAgent(id, agentId);
      res.json({ status: 'ok' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/conversations/:id', async (req, res) => {
    await chatService.deleteConversation(req.params.id);
    res.status(204).send();
  });

  // --- Heartbeat & Status ---

  app.get('/api/status/agents', (_req, res) => {
    res.json(agentHeartbeat.listStatuses());
  });

  app.post('/api/status/heartbeat/:agentId', (req, res) => {
    const { agentId } = req.params;
    agentHeartbeat.recordHeartbeat(agentId);
    res.json({ status: 'ok' });
  });

  // --- Cron Jobs ---

  app.get('/api/cron/jobs', (_req, res) => {
    res.json(cronRunner.listJobs());
  });

  app.post('/api/cron/jobs', (req, res) => {
    cronRunner.addJob(req.body);
    res.status(201).json({ status: 'ok' });
  });

  app.patch('/api/cron/jobs/:id/toggle', (req, res) => {
      const { id } = req.params;
      const { enabled } = req.body;
      cronRunner.toggleJob(id, enabled);
      res.json({ status: 'ok' });
  });

  // --- SSH ---
  app.post('/api/ssh/execute', async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Command is required' });

    try {
      const permission = await permissionFirewall.validateAndExecute(
        'execute',
        'shell',
        buildPermissionContext(req.body),
        { command },
      );
      if (!permission.granted) {
        const statusCode = permission.policy === 'ask' ? 202 : 403;
        return res.status(statusCode).json({
          error: permission.reason ?? 'Command blocked by Permission Firewall',
          policy: permission.policy,
          ruleId: permission.ruleId,
          approvalId: permission.approvalId,
          safeMode: config.SAFE_MODE,
        });
      }

      if (!sshClient['ssh'].isConnected() && !config.SAFE_MODE) {
        await sshClient.connect();
      }
      const result = await sshClient.executeCommand(command);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Browser ---
  app.use('/api/browser', createBrowserRouter(permissionFirewall));

  // --- Imperial Vault ---
  app.use('/api/imperial-vault', imperialVaultRouter);

  // --- Skills ---
  app.get('/api/skills', async (_req, res) => {
      await skillsRegistry.scan();
      const merged = mergeWithConfiguredSkills(skillsRegistry.listSkills()).map((skill, index) => ({
        ...skill,
        path: typeof skill.path === 'string' ? skill.path : null,
        source:
          typeof skill.source === 'string'
            ? skill.source
            : typeof skill.origin === 'string'
              ? skill.origin
              : 'configured',
        precedenceRank:
          typeof (skill as any).precedenceRank === 'number' && Number.isFinite((skill as any).precedenceRank)
            ? (skill as any).precedenceRank
            : 1000 + index,
      }));
      res.json(merged);
  });

  app.get('/api/skills/context-health', (_req, res) => {
    res.json(getContextHealthSnapshot(config.SAFE_MODE));
  });

  app.post('/api/skills/context-health/compact', (_req, res) => {
    res.json(runContextCompaction(config.SAFE_MODE));
  });

  app.get('/api/skills/live-activity', (_req, res) => {
    res.json(getLiveActivityFeed(config.SAFE_MODE));
  });

  app.get('/api/skills/system-resources', async (_req, res) => {
    try {
      res.json(await getSystemResourceSnapshot(config.SAFE_MODE));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/skills/security-alerts', (_req, res) => {
    res.json(getSecurityAlerts(config.SAFE_MODE));
  });

  app.post('/api/chat/:agentId/restore-context', (req, res) => {
    res.json(restoreContextForAgent(req.params.agentId, config.SAFE_MODE));
  });

  app.get('/api/memory/smart-search', (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(searchMemorySmart(query, config.SAFE_MODE));
  });

  app.get('/api/memory/timeline', (req, res) => {
    const agentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
    res.json(getMemoryTimeline(agentId, config.SAFE_MODE));
  });

  app.post('/api/memory/capture', (req, res) => {
    try {
      const note = typeof req.body?.note === 'string' ? req.body.note : '';
      res.json(quickCaptureNote(note, config.SAFE_MODE));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- Security & Permissions ---

  app.get('/api/permissions/rules', (_req, res) => {
    res.json(permissionEngine.getRules());
  });

  app.get('/api/permissions/approvals', async (_req, res) => {
    res.json(await permissionFirewall.getPendingApprovals());
  });

  app.post('/api/permissions/approvals/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'
    if (!status) return res.status(400).json({ error: 'Status is required' });
    await permissionFirewall.updateApproval(id, status);
    res.json({ status: 'ok' });
  });

  app.get('/api/permissions/audit', (_req, res) => {
    const auditFile = dataPath('audit.json');
    if (!fs.existsSync(auditFile)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(auditFile, 'utf-8')));
  });

  return app;
}
