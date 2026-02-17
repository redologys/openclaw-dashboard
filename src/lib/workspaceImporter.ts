import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'
import { safeWriteJSON } from './dataIntegrity'
import { dataPath } from './paths'

export const WORKSPACE_SCAN_PATHS = {
  agents: [
    '~/.openclaw/agents/*.json',
    '~/.openclaw/agents/*/agent.md',
    '~/.openclaw/workspace/agents/*.json',
  ],
  subagents: [
    '~/.openclaw/agents/*/subagents/*.json',
    '~/.openclaw/agents/*/subagents/*/agent.md',
  ],
  agentMetadata: [
    '~/.openclaw/agents/*/agent.md',
    '~/.openclaw/agents/*/heartbeat.md',
    '~/.openclaw/agents/*/soul.md',
  ],
  skills: [
    '~/.openclaw/skills/*/SKILL.md',
    '~/.openclaw/skills/*/skill.json',
    '~/.openclaw/workspace/skills/*',
  ],
  workflows: [
    '~/.openclaw/playbooks/*.json',
    '~/.openclaw/playbooks/*.yaml',
    '~/.openclaw/workflows/*.json',
  ],
  crons: ['~/.openclaw/crons.json', '~/.openclaw/workspace/cron.json'],
  swarms: ['~/.openclaw/swarms/*.json', '~/.openclaw/multiagent/*.json'],
  memory: ['~/.openclaw/memory/*.md', '~/.openclaw/memory/*.json', '~/.openclaw/workspace/memory.md'],
  imperialVault: {
    basePath: '/home/ubuntu/imperial-vault',
    scripts: '/home/ubuntu/imperial-vault/scripts',
    state: '/home/ubuntu/imperial-vault/state',
    deliverables: '/home/ubuntu/imperial-vault/DELIVERABLES',
  },
} as const

export type ConflictResolution = 'pending' | 'keep_existing' | 'use_imported' | 'merge_both'

export interface WorkspaceImportConflict {
  id: string
  key: 'agents' | 'subagents' | 'skills' | 'workflows' | 'crons' | 'swarms'
  targetFile: string
  name: string
  existing: Record<string, unknown>
  imported: Record<string, unknown>
  resolution: ConflictResolution
  createdAt: string
}

export interface WorkspaceImportReport {
  timestamp: string
  success: boolean
  dryRun?: boolean
  summary: {
    agents: { found: number; imported: number; skipped: number; conflicts: number }
    subagents: { found: number; imported: number; skipped: number }
    skills: { found: number; imported: number; skipped: number }
    workflows: { found: number; imported: number; skipped: number }
    crons: { found: number; imported: number; skipped: number }
    swarms: { found: number; imported: number; skipped: number }
    imperialVault: { detected: boolean; agents: string[] }
  }
  conflicts: WorkspaceImportConflict[]
  errors: string[]
}

type ImportEntity = Record<string, unknown> & {
  id?: string
  name?: string
  updatedAt?: string
  origin?: string
  importedAt?: string
  _importConflict?: boolean
  _conflictWith?: string
}

interface CollectionStore {
  format: 'array' | 'object'
  key?: string
  root: Record<string, unknown> | ImportEntity[]
  items: ImportEntity[]
}

const AGENTS_DATA_FILE = dataPath('agents.json')
const SKILLS_DATA_FILE = dataPath('skills.json')
const CRON_DATA_FILE = dataPath('cron.json')
const PLAYBOOKS_DATA_FILE = dataPath('playbooks.json')
const SWARMS_DATA_FILE = dataPath('swarms.json')
const DATA_IMPORT_REPORT_FILE = dataPath('import_report.json')
const DATA_IMPERIAL_VAULT_FILE = dataPath('imperialVault.json')

const nowIso = () => new Date().toISOString()

const expandHome = (inputPath: string): string => {
  if (!inputPath.startsWith('~')) return inputPath
  return path.join(os.homedir(), inputPath.slice(1))
}

const parseFrontmatter = (raw: string): Record<string, string> => {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith('---')) return {}
  const lines = trimmed.split(/\r?\n/)
  const map: Record<string, string> = {}
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() === '---') break
    const separator = line.indexOf(':')
    if (separator > 0) {
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (key && value) map[key] = value
    }
  }
  return map
}

const exists = async (targetPath: string) => {
  try {
    await fsPromises.access(targetPath)
    return true
  } catch {
    return false
  }
}

const listMatches = async (baseDir: string, segments: string[], index = 0): Promise<string[]> => {
  if (index >= segments.length) {
    return [baseDir]
  }

  const segment = segments[index]
  if (segment === '') {
    return listMatches(baseDir, segments, index + 1)
  }

  if (!segment.includes('*')) {
    return listMatches(path.join(baseDir, segment), segments, index + 1)
  }

  const regex = new RegExp(`^${segment.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`)
  if (!(await exists(baseDir))) {
    return []
  }

  const entries = await fsPromises.readdir(baseDir, { withFileTypes: true })
  const matches: string[] = []

  for (const entry of entries) {
    if (!regex.test(entry.name)) continue
    const nextPath = path.join(baseDir, entry.name)
    const nested = await listMatches(nextPath, segments, index + 1)
    matches.push(...nested)
  }

  return matches
}

const scanPattern = async (pattern: string) => {
  const expanded = expandHome(pattern)
  const normalized = expanded.replace(/\\/g, '/')
  const absolute = path.isAbsolute(normalized) ? normalized : path.resolve(process.cwd(), normalized)

  const parts = absolute.split('/').filter((segment) => segment.length > 0)
  const rootPrefix = absolute.startsWith('/') ? '/' : parts.shift() ?? ''
  const base = rootPrefix === '/' ? '/' : `${rootPrefix}/`

  const matches = await listMatches(base, parts)
  return matches.filter((entry) => fs.existsSync(entry))
}

const readJsonSafe = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const normalizeName = (item: ImportEntity) =>
  typeof item.name === 'string' ? item.name.trim().toLowerCase() : undefined

const mergeImportedData = (
  existing: ImportEntity[],
  imported: ImportEntity[],
  key: WorkspaceImportConflict['key'],
  targetFile: string,
  conflicts: WorkspaceImportConflict[],
  counters: { imported: number; skipped: number; conflicts?: number },
) => {
  const merged = [...existing]

  for (const item of imported) {
    const incomingName = normalizeName(item)

    const existingIndex = merged.findIndex((entry) => {
      const existingName = normalizeName(entry)
      return (incomingName && existingName === incomingName) || (item.id && entry.id === item.id)
    })

    if (existingIndex >= 0) {
      const existingEntry = merged[existingIndex]
      const existingUpdated = new Date((existingEntry.updatedAt as string | undefined) ?? 0)
      const importedUpdated = new Date((item.updatedAt as string | undefined) ?? 0)

      if (importedUpdated > existingUpdated) {
        const conflict: WorkspaceImportConflict = {
          id: randomUUID(),
          key,
          targetFile,
          name: (item.name as string | undefined) ?? (item.id as string | undefined) ?? 'unknown',
          existing: existingEntry,
          imported: {
            ...item,
            _importConflict: true,
            _conflictWith: (existingEntry.id as string | undefined) ?? 'unknown',
          },
          resolution: 'pending',
          createdAt: nowIso(),
        }

        conflicts.push(conflict)
        counters.skipped += 1
        if (typeof counters.conflicts === 'number') counters.conflicts += 1
      } else {
        counters.skipped += 1
      }

      continue
    }

    merged.push({
      ...item,
      origin: 'imported',
      importedAt: nowIso(),
    })
    counters.imported += 1
  }

  return merged
}

const loadCollection = async (filePath: string, objectKey?: string): Promise<CollectionStore> => {
  const raw = await readJsonSafe<Record<string, unknown> | ImportEntity[]>(filePath, objectKey ? { [objectKey]: [] } : [])

  if (Array.isArray(raw)) {
    return { format: 'array', root: raw, items: raw as ImportEntity[] }
  }

  const objectRoot = raw as Record<string, unknown>
  const key = objectKey ?? 'items'
  const items = Array.isArray(objectRoot[key]) ? (objectRoot[key] as ImportEntity[]) : []
  return { format: 'object', key, root: objectRoot, items }
}

const saveCollection = async (filePath: string, store: CollectionStore, items: ImportEntity[]) => {
  if (store.format === 'array') {
    await safeWriteJSON(filePath, items)
    return
  }

  const root = { ...(store.root as Record<string, unknown>), [store.key ?? 'items']: items, updatedAt: nowIso() }
  await safeWriteJSON(filePath, root)
}

const parseAgentFile = async (filePath: string): Promise<ImportEntity | null> => {
  try {
    if (filePath.endsWith('.json')) {
      const data = await readJsonSafe<ImportEntity | null>(filePath, null)
      if (!data) return null
      const id = (data.id as string | undefined) ?? path.basename(filePath, '.json')
      return {
        ...data,
        id,
        name: (data.name as string | undefined) ?? id,
        updatedAt: (data.updatedAt as string | undefined) ?? nowIso(),
      }
    }

    if (filePath.endsWith('agent.md')) {
      const content = await fsPromises.readFile(filePath, 'utf-8')
      const frontmatter = parseFrontmatter(content)
      const id = path.basename(path.dirname(filePath))
      const name = frontmatter.name ?? id
      return {
        id,
        name,
        description: frontmatter.description ?? content.split('\n').slice(0, 8).join('\n'),
        systemPrompt: content,
        skills: [],
        canTalkToAgents: true,
        updatedAt: nowIso(),
      }
    }

    return null
  } catch {
    return null
  }
}

const parseSubagentFile = async (filePath: string): Promise<ImportEntity | null> => {
  const parsed = await parseAgentFile(filePath)
  if (!parsed) return null

  const segments = filePath.replace(/\\/g, '/').split('/')
  const subagentIndex = segments.findIndex((segment) => segment === 'subagents')
  const parentId = subagentIndex > 0 ? segments[subagentIndex - 1] : 'unknown-parent'

  return {
    ...parsed,
    parentAgentId: parentId,
    taskScope: 'Imported from workspace subagent definition',
    lifespan: 'task',
    spawnedAt: nowIso(),
    status: 'active',
  }
}

const parseSkillFile = async (filePath: string): Promise<ImportEntity | null> => {
  try {
    if (filePath.endsWith('skill.json')) {
      const data = await readJsonSafe<ImportEntity | null>(filePath, null)
      if (!data) return null
      const id = (data.id as string | undefined) ?? path.basename(path.dirname(filePath))
      return {
        ...data,
        id,
        name: (data.name as string | undefined) ?? id,
        version: (data.version as string | undefined) ?? '1.0.0',
        updatedAt: nowIso(),
      }
    }

    if (filePath.endsWith('SKILL.md')) {
      const content = await fsPromises.readFile(filePath, 'utf-8')
      const frontmatter = parseFrontmatter(content)
      const id = path.basename(path.dirname(filePath))
      return {
        id,
        name: frontmatter.name ?? id,
        description: frontmatter.description ?? content.split('\n').slice(0, 4).join('\n'),
        version: frontmatter.version ?? '1.0.0',
        inputsSchemaName: 'default',
        permissions: [],
        updatedAt: nowIso(),
        path: filePath,
      }
    }

    return null
  } catch {
    return null
  }
}

const parseWorkflowFile = async (filePath: string): Promise<ImportEntity | null> => {
  try {
    if (filePath.endsWith('.json')) {
      const data = await readJsonSafe<ImportEntity | null>(filePath, null)
      if (!data) return null
      const id = (data.id as string | undefined) ?? path.basename(filePath, '.json')
      return {
        ...data,
        id,
        name: (data.name as string | undefined) ?? id,
        updatedAt: (data.updatedAt as string | undefined) ?? nowIso(),
      }
    }

    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      const content = await fsPromises.readFile(filePath, 'utf-8')
      const id = path.basename(filePath, path.extname(filePath))
      return {
        id,
        name: id,
        format: 'yaml',
        content,
        updatedAt: nowIso(),
      }
    }

    return null
  } catch {
    return null
  }
}

const parseSwarmFile = async (filePath: string): Promise<ImportEntity | null> => {
  const data = await readJsonSafe<ImportEntity | null>(filePath, null)
  if (!data) return null
  const id = (data.id as string | undefined) ?? path.basename(filePath, '.json')
  return {
    ...data,
    id,
    name: (data.name as string | undefined) ?? id,
    updatedAt: (data.updatedAt as string | undefined) ?? nowIso(),
  }
}

const parseCronFiles = async (filePaths: string[]): Promise<ImportEntity[]> => {
  const jobs: ImportEntity[] = []
  for (const cronPath of filePaths) {
    const parsed = await readJsonSafe<unknown>(cronPath, null)
    if (Array.isArray(parsed)) {
      jobs.push(...(parsed as ImportEntity[]))
      continue
    }

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>
      if (Array.isArray(obj.jobs)) {
        jobs.push(...(obj.jobs as ImportEntity[]))
      }
    }
  }
  return jobs
}

const dedupeByIdentity = (items: ImportEntity[]) => {
  const map = new Map<string, ImportEntity>()
  for (const item of items) {
    const key = (item.id as string | undefined) ?? normalizeName(item) ?? randomUUID()
    if (!map.has(key)) {
      map.set(key, item)
    }
  }
  return Array.from(map.values())
}

const gatherPaths = async (patterns: readonly string[]) => {
  const all = await Promise.all(patterns.map((pattern) => scanPattern(pattern)))
  return dedupeByIdentity(all.flat().map((entry) => ({ id: entry, name: entry }))).map((entry) => entry.id as string)
}

const extractImperialVaultAgents = (scriptFiles: string[]) => {
  const names = new Set<string>()
  for (const scriptFile of scriptFiles) {
    const lower = path.basename(scriptFile).toLowerCase()
    if (lower.includes('intel')) names.add('intel')
    if (lower.includes('historian')) names.add('historian')
    if (lower.includes('footage')) names.add('footage')
    if (lower.includes('music')) names.add('music')
  }
  return Array.from(names)
}

export interface RunWorkspaceImportOptions {
  workspaceRoot?: string
  dryRun?: boolean
}

const resolveImportOptions = (
  options?: string | RunWorkspaceImportOptions,
): RunWorkspaceImportOptions => {
  if (typeof options === 'string') {
    return { workspaceRoot: options, dryRun: false }
  }
  return {
    workspaceRoot: options?.workspaceRoot,
    dryRun: options?.dryRun ?? false,
  }
}

export const runWorkspaceImport = async (
  options?: string | RunWorkspaceImportOptions,
): Promise<WorkspaceImportReport> => {
  const { workspaceRoot, dryRun } = resolveImportOptions(options)
  const report: WorkspaceImportReport = {
    timestamp: nowIso(),
    success: true,
    dryRun,
    summary: {
      agents: { found: 0, imported: 0, skipped: 0, conflicts: 0 },
      subagents: { found: 0, imported: 0, skipped: 0 },
      skills: { found: 0, imported: 0, skipped: 0 },
      workflows: { found: 0, imported: 0, skipped: 0 },
      crons: { found: 0, imported: 0, skipped: 0 },
      swarms: { found: 0, imported: 0, skipped: 0 },
      imperialVault: { detected: false, agents: [] },
    },
    conflicts: [],
    errors: [],
  }

  try {
    const overrides = workspaceRoot
      ? {
          agents: [path.join(workspaceRoot, 'agents', '*.json')],
          skills: [path.join(workspaceRoot, 'skills', '*', 'SKILL.md')],
        }
      : null

    const agentPatterns = overrides?.agents ?? WORKSPACE_SCAN_PATHS.agents
    const skillPatterns = overrides?.skills ?? WORKSPACE_SCAN_PATHS.skills

    const [agentFiles, subagentFiles, skillFiles, workflowFiles, cronFiles, swarmFiles] = await Promise.all([
      gatherPaths(agentPatterns),
      gatherPaths(WORKSPACE_SCAN_PATHS.subagents),
      gatherPaths(skillPatterns),
      gatherPaths(WORKSPACE_SCAN_PATHS.workflows),
      gatherPaths(WORKSPACE_SCAN_PATHS.crons),
      gatherPaths(WORKSPACE_SCAN_PATHS.swarms),
    ])

    const [existingAgentsStore, existingSkillsStore, existingCronStore, existingWorkflowStore, existingSwarmsStore] = await Promise.all([
      loadCollection(AGENTS_DATA_FILE, 'agents'),
      loadCollection(SKILLS_DATA_FILE, 'skills'),
      loadCollection(CRON_DATA_FILE),
      loadCollection(PLAYBOOKS_DATA_FILE),
      loadCollection(SWARMS_DATA_FILE),
    ])

    const parsedAgents = dedupeByIdentity((await Promise.all(agentFiles.map((file) => parseAgentFile(file)))).filter((item): item is ImportEntity => !!item))
    const parsedSubagents = dedupeByIdentity((await Promise.all(subagentFiles.map((file) => parseSubagentFile(file)))).filter((item): item is ImportEntity => !!item))
    const parsedSkills = dedupeByIdentity((await Promise.all(skillFiles.map((file) => parseSkillFile(file)))).filter((item): item is ImportEntity => !!item))
    const parsedWorkflows = dedupeByIdentity((await Promise.all(workflowFiles.map((file) => parseWorkflowFile(file)))).filter((item): item is ImportEntity => !!item))
    const parsedCrons = dedupeByIdentity(await parseCronFiles(cronFiles))
    const parsedSwarms = dedupeByIdentity((await Promise.all(swarmFiles.map((file) => parseSwarmFile(file)))).filter((item): item is ImportEntity => !!item))

    report.summary.agents.found = parsedAgents.length
    report.summary.subagents.found = parsedSubagents.length
    report.summary.skills.found = parsedSkills.length
    report.summary.workflows.found = parsedWorkflows.length
    report.summary.crons.found = parsedCrons.length
    report.summary.swarms.found = parsedSwarms.length

    const mergedAgents = mergeImportedData(
      existingAgentsStore.items,
      parsedAgents,
      'agents',
      AGENTS_DATA_FILE,
      report.conflicts,
      report.summary.agents,
    )

    const existingSubagents = Array.isArray((existingAgentsStore.root as Record<string, unknown>).subagents)
      ? ((existingAgentsStore.root as Record<string, unknown>).subagents as ImportEntity[])
      : []
    const subagentCounters = { imported: 0, skipped: 0 }
    const mergedSubagents = mergeImportedData(
      existingSubagents,
      parsedSubagents,
      'subagents',
      AGENTS_DATA_FILE,
      report.conflicts,
      subagentCounters,
    )
    report.summary.subagents.imported = subagentCounters.imported
    report.summary.subagents.skipped = subagentCounters.skipped

    const mergedSkills = mergeImportedData(
      existingSkillsStore.items,
      parsedSkills,
      'skills',
      SKILLS_DATA_FILE,
      report.conflicts,
      report.summary.skills,
    )

    const mergedWorkflows = mergeImportedData(
      existingWorkflowStore.items,
      parsedWorkflows,
      'workflows',
      PLAYBOOKS_DATA_FILE,
      report.conflicts,
      report.summary.workflows,
    )

    const mergedCrons = mergeImportedData(
      existingCronStore.items,
      parsedCrons,
      'crons',
      CRON_DATA_FILE,
      report.conflicts,
      report.summary.crons,
    )

    const mergedSwarms = mergeImportedData(
      existingSwarmsStore.items,
      parsedSwarms,
      'swarms',
      SWARMS_DATA_FILE,
      report.conflicts,
      report.summary.swarms,
    )

    if (!dryRun) {
      if (existingAgentsStore.format === 'object') {
        const agentsRoot = existingAgentsStore.root as Record<string, unknown>
        await safeWriteJSON(AGENTS_DATA_FILE, {
          ...agentsRoot,
          agents: mergedAgents,
          subagents: mergedSubagents,
          updatedAt: nowIso(),
        })
      } else {
        await safeWriteJSON(AGENTS_DATA_FILE, mergedAgents)
      }

      await saveCollection(SKILLS_DATA_FILE, existingSkillsStore, mergedSkills)
      await saveCollection(PLAYBOOKS_DATA_FILE, existingWorkflowStore, mergedWorkflows)
      await saveCollection(CRON_DATA_FILE, existingCronStore, mergedCrons)
      await saveCollection(SWARMS_DATA_FILE, existingSwarmsStore, mergedSwarms)
    }

    const ivPaths = WORKSPACE_SCAN_PATHS.imperialVault
    const [baseExists, scriptsExists, stateExists, deliverablesExists] = await Promise.all([
      exists(ivPaths.basePath),
      exists(ivPaths.scripts),
      exists(ivPaths.state),
      exists(ivPaths.deliverables),
    ])

    if (baseExists) {
      const scriptFiles = scriptsExists
        ? (await fsPromises.readdir(ivPaths.scripts)).filter((entry) => entry.endsWith('.py')).map((entry) => path.join(ivPaths.scripts, entry))
        : []

      const agents = extractImperialVaultAgents(scriptFiles)
      report.summary.imperialVault = {
        detected: true,
        agents,
      }

      const imperialVaultCrons: ImportEntity[] = [
        {
          id: 'imperial-vault-weekly-intel',
          name: 'Weekly Intel',
          schedule: '0 13 * * 0',
          agent: 'imperial-vault-intel',
          command: `python3 ${path.join(ivPaths.scripts, 'weekly_intel.py')}`,
          enabled: true,
          origin: 'imperial-vault',
          updatedAt: nowIso(),
        },
        {
          id: 'imperial-vault-daily-historian',
          name: 'Daily Historian',
          schedule: '0 14 * * *',
          agent: 'imperial-vault-historian',
          command: `python3 ${path.join(ivPaths.scripts, 'daily_historian.py')}`,
          enabled: true,
          origin: 'imperial-vault',
          updatedAt: nowIso(),
        },
        {
          id: 'imperial-vault-daily-footage',
          name: 'Daily Footage',
          schedule: '30 14 * * *',
          agent: 'imperial-vault-footage',
          command: `python3 ${path.join(ivPaths.scripts, 'daily_footage.py')}`,
          enabled: true,
          origin: 'imperial-vault',
          updatedAt: nowIso(),
        },
      ]

      const cronIdentity = new Set(
        mergedCrons.map((entry) => ((entry.id as string | undefined) ?? normalizeName(entry) ?? '').toLowerCase()),
      )
      let ivCronImported = 0
      for (const ivCron of imperialVaultCrons) {
        const identity = ((ivCron.id as string | undefined) ?? normalizeName(ivCron) ?? '').toLowerCase()
        if (!identity || cronIdentity.has(identity)) continue
        cronIdentity.add(identity)
        mergedCrons.push(ivCron)
        ivCronImported += 1
      }

      if (ivCronImported > 0) {
        report.summary.crons.imported += ivCronImported
        if (!dryRun) {
          await saveCollection(CRON_DATA_FILE, existingCronStore, mergedCrons)
        }
      }

      if (!dryRun) {
        await safeWriteJSON(DATA_IMPERIAL_VAULT_FILE, {
          detected: true,
          basePath: ivPaths.basePath,
          scriptsPath: ivPaths.scripts,
          statePath: ivPaths.state,
          deliverablesPath: ivPaths.deliverables,
          scriptsFound: scriptFiles,
          stateDetected: stateExists,
          deliverablesDetected: deliverablesExists,
          agents,
          updatedAt: nowIso(),
        })
      }
    }

    if (!dryRun) {
      await safeWriteJSON(DATA_IMPORT_REPORT_FILE, report)
    }
  } catch (error: any) {
    report.success = false
    report.errors.push(error.message)
    if (!dryRun) {
      await safeWriteJSON(DATA_IMPORT_REPORT_FILE, report)
    }
  }

  return report
}

export const getWorkspaceImportReport = async (): Promise<WorkspaceImportReport | null> => {
  return readJsonSafe<WorkspaceImportReport | null>(DATA_IMPORT_REPORT_FILE, null)
}

export const resolveWorkspaceConflict = async (
  conflictId: string,
  resolution: Exclude<ConflictResolution, 'pending'>,
): Promise<WorkspaceImportReport> => {
  const report = (await getWorkspaceImportReport()) ?? {
    timestamp: nowIso(),
    success: false,
    summary: {
      agents: { found: 0, imported: 0, skipped: 0, conflicts: 0 },
      subagents: { found: 0, imported: 0, skipped: 0 },
      skills: { found: 0, imported: 0, skipped: 0 },
      workflows: { found: 0, imported: 0, skipped: 0 },
      crons: { found: 0, imported: 0, skipped: 0 },
      swarms: { found: 0, imported: 0, skipped: 0 },
      imperialVault: { detected: false, agents: [] },
    },
    conflicts: [],
    errors: [],
  }

  const conflict = report.conflicts.find((entry) => entry.id === conflictId)
  if (!conflict) {
    throw new Error('Conflict not found')
  }

  if (conflict.resolution !== 'pending') {
    return report
  }

  const store = await loadCollection(conflict.targetFile, conflict.targetFile.endsWith('agents.json') ? 'agents' : conflict.targetFile.endsWith('skills.json') ? 'skills' : undefined)
  const identity = ((conflict.existing.id as string | undefined) ?? (conflict.existing.name as string | undefined) ?? '').toLowerCase()

  const items = [...store.items]
  const existingIndex = items.findIndex((entry) => {
    const id = (entry.id as string | undefined)?.toLowerCase()
    const name = (entry.name as string | undefined)?.toLowerCase()
    return id === identity || name === identity
  })

  if (resolution === 'use_imported') {
    const nextValue = { ...conflict.imported }
    delete nextValue._importConflict
    delete nextValue._conflictWith
    if (existingIndex >= 0) {
      items[existingIndex] = nextValue
    } else {
      items.push(nextValue)
    }
  }

  if (resolution === 'merge_both') {
    const merged = { ...conflict.imported }
    delete merged._importConflict
    delete merged._conflictWith
    merged.id = `${(merged.id as string | undefined) ?? 'imported'}-imported-${Date.now().toString(36)}`
    items.push(merged)
  }

  if (resolution !== 'keep_existing') {
    await saveCollection(conflict.targetFile, store, items)
  }

  conflict.resolution = resolution
  await safeWriteJSON(DATA_IMPORT_REPORT_FILE, report)
  return report
}
