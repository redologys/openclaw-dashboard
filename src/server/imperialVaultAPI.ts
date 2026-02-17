import { Router } from 'express'
import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { config } from '../lib/config'

const execAsync = promisify(exec)
const nowIso = () => new Date().toISOString()

const ivBasePath = process.env.IV_BASE_PATH || '/home/ubuntu/imperial-vault'
const ivScriptsPath = process.env.IV_SCRIPTS_DIR || path.join(ivBasePath, 'scripts')
const ivStatePath = process.env.IV_STATE_DIR || path.join(ivBasePath, 'state')
const ivDeliverablesPath = process.env.IV_DELIVERABLES_DIR || path.join(ivBasePath, 'DELIVERABLES')
const IV_AGENTS = ['intel', 'historian', 'footage', 'music'] as const
type IVAgent = (typeof IV_AGENTS)[number]

type AgentRunState = 'idle' | 'running' | 'completed' | 'error'

interface IVAgentStatus {
  agent: IVAgent
  state: AgentRunState
  progress: number
  startedAt: string | null
  finishedAt: string | null
  lastRunAt: string | null
  lastExitCode: number | null
  lastError: string | null
  stdout: string
  stderr: string
  logs: string[]
  safeMode: boolean
}

const stateFiles = [
  path.join(ivStatePath, 'daily_batch.json'),
  path.join(ivStatePath, 'competitive-intel.md'),
  path.join(ivStatePath, 'music_intel.json'),
  path.join(ivStatePath, 'published_titles.json'),
]

const stateEvents = new EventEmitter()
let watchersAttached = false
const agentStatuses = new Map<IVAgent, IVAgentStatus>(
  IV_AGENTS.map((agent) => [
    agent,
    {
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
      safeMode: config.SAFE_MODE,
    },
  ]),
)

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getAgentStatus = (agent: IVAgent): IVAgentStatus =>
  agentStatuses.get(agent) ?? {
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
    safeMode: config.SAFE_MODE,
  }

const updateAgentStatus = (
  agent: IVAgent,
  partial: Partial<Omit<IVAgentStatus, 'agent' | 'logs'>>,
  logLine?: string,
) => {
  const current = getAgentStatus(agent)
  const updated: IVAgentStatus = {
    ...current,
    ...partial,
    safeMode: config.SAFE_MODE,
    logs: logLine ? [...current.logs, `[${nowIso()}] ${logLine}`].slice(-200) : current.logs,
  }
  agentStatuses.set(agent, updated)
  stateEvents.emit('update', {
    type: 'agent-status',
    agent,
    status: updated,
    timestamp: nowIso(),
  })
}

const appendStateFileEvent = (file: string) => {
  stateEvents.emit('update', {
    type: 'state-file',
    file,
    timestamp: nowIso(),
  })
}

const ensureWatchers = () => {
  if (watchersAttached) return
  watchersAttached = true

  for (const filePath of stateFiles) {
    try {
      fs.watchFile(filePath, { interval: 2000 }, () => {
        appendStateFileEvent(filePath)
      })
    } catch {
      // ignore missing watch targets
    }
  }
}

const exists = async (targetPath: string) => {
  try {
    await fsPromises.access(targetPath)
    return true
  } catch {
    return false
  }
}

const runPythonScript = async (scriptPath: string, args: string[] = []) => {
  const escapedArgs = args.map((arg) => `"${String(arg).replace(/"/g, '\\"')}"`).join(' ')
  const command = `python3 "${scriptPath}" ${escapedArgs}`.trim()

  const { stdout, stderr } = await execAsync(command)
  return {
    exitCode: 0,
    stdout,
    stderr,
  }
}

const runInlinePython = async (source: string) => {
  const escaped = source.replace(/"/g, '\\"').replace(/\n/g, '; ')
  const command = `python3 -c "${escaped}"`
  const { stdout, stderr } = await execAsync(command)
  return {
    exitCode: 0,
    stdout,
    stderr,
  }
}

export const imperialVaultRouter = Router()

imperialVaultRouter.get('/status', async (_req, res) => {
  const [baseExists, scriptsExists, stateExists, deliverablesExists] = await Promise.all([
    exists(ivBasePath),
    exists(ivScriptsPath),
    exists(ivStatePath),
    exists(ivDeliverablesPath),
  ])

  ensureWatchers()

  res.json({
    detected: baseExists,
    safeMode: config.SAFE_MODE,
    paths: {
      basePath: ivBasePath,
      scriptsPath: ivScriptsPath,
      statePath: ivStatePath,
      deliverablesPath: ivDeliverablesPath,
    },
    availability: {
      scriptsExists,
      stateExists,
      deliverablesExists,
    },
    agents: IV_AGENTS.map((agent) => getAgentStatus(agent)),
  })
})

imperialVaultRouter.get('/status/:agent', (req, res) => {
  const agent = req.params.agent as IVAgent
  if (!IV_AGENTS.includes(agent)) {
    return res.status(400).json({ error: `Unknown Imperial Vault agent: ${req.params.agent}` })
  }

  return res.json(getAgentStatus(agent))
})

imperialVaultRouter.get('/batch', async (_req, res) => {
  const batchPath = path.join(ivStatePath, 'daily_batch.json')

  if (config.SAFE_MODE) {
    return res.json({
      safeMode: true,
      batch: { generated: 5, approved: 5, uploaded: 4, pending: 1 },
      source: 'mock',
    })
  }

  try {
    const raw = await fsPromises.readFile(batchPath, 'utf-8')
    return res.json({ safeMode: false, batch: JSON.parse(raw), source: batchPath })
  } catch (error: any) {
    return res.status(404).json({ error: `Batch file not found: ${batchPath}`, details: error.message })
  }
})

imperialVaultRouter.get('/calendar', async (_req, res) => {
  if (config.SAFE_MODE) {
    return res.json({
      safeMode: true,
      days: [
        { date: '2026-02-15', deliverables: 5 },
        { date: '2026-02-16', deliverables: 4 },
      ],
      source: 'mock',
    })
  }

  try {
    const entries = await fsPromises.readdir(ivDeliverablesPath, { withFileTypes: true })
    const days: Array<{ date: string; deliverables: number }> = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dayPath = path.join(ivDeliverablesPath, entry.name)
      const files = await fsPromises.readdir(dayPath)
      days.push({ date: entry.name, deliverables: files.length })
    }

    res.json({ safeMode: false, days: days.sort((a, b) => b.date.localeCompare(a.date)) })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

imperialVaultRouter.get('/intel', async (_req, res) => {
  const intelPath = path.join(ivStatePath, 'competitive-intel.md')

  if (config.SAFE_MODE) {
    return res.json({
      safeMode: true,
      content: '# SAFE_MODE Intel\n\n- Competitor velocity up 12%\n- History shorts outperforming listicles',
      source: 'mock',
    })
  }

  try {
    const content = await fsPromises.readFile(intelPath, 'utf-8')
    res.json({ safeMode: false, content, source: intelPath })
  } catch (error: any) {
    res.status(404).json({ error: `Intel file not found: ${intelPath}`, details: error.message })
  }
})

imperialVaultRouter.post('/run/:agent', async (req, res) => {
  const agent = req.params.agent as IVAgent

  if (!IV_AGENTS.includes(agent)) {
    return res.status(400).json({ error: `Unknown Imperial Vault agent: ${req.params.agent}` })
  }

  const scriptMap: Record<typeof agent, string> = {
    intel: path.join(ivScriptsPath, 'weekly_intel.py'),
    historian: path.join(ivScriptsPath, 'daily_historian.py'),
    footage: path.join(ivScriptsPath, 'daily_footage.py'),
    music: path.join(ivScriptsPath, 'music_scraper.py'),
  }

  const scriptPath = scriptMap[agent]
  const currentStatus = getAgentStatus(agent)
  if (currentStatus.state === 'running') {
    return res.status(409).json({
      error: `${agent} is already running`,
      status: currentStatus,
    })
  }

  updateAgentStatus(
    agent,
    {
      state: 'running',
      progress: 5,
      startedAt: nowIso(),
      finishedAt: null,
      lastError: null,
      stderr: '',
      stdout: '',
    },
    `Run requested for ${agent}`,
  )

  if (config.SAFE_MODE) {
    await sleep(250)
    updateAgentStatus(agent, { progress: 50 }, `SAFE_MODE execution simulated for ${agent}`)
    await sleep(250)
    const finishedAt = nowIso()
    const safeResult = {
      agent,
      exitCode: 0,
      stdout: `[SAFE_MODE] Simulated run for ${agent}`,
      stderr: '',
      timestamp: finishedAt,
      safeMode: true,
    }
    updateAgentStatus(
      agent,
      {
        state: 'completed',
        progress: 100,
        finishedAt,
        lastRunAt: finishedAt,
        lastExitCode: 0,
        stdout: safeResult.stdout,
        stderr: '',
      },
      `Run completed in SAFE_MODE`,
    )
    return res.json({
      ...safeResult,
      status: getAgentStatus(agent),
    })
  }

  try {
    updateAgentStatus(agent, { progress: 20 }, `Executing script ${path.basename(scriptPath)}`)
    const result = await runPythonScript(scriptPath)
    const finishedAt = nowIso()
    updateAgentStatus(
      agent,
      {
        state: result.exitCode === 0 ? 'completed' : 'error',
        progress: 100,
        finishedAt,
        lastRunAt: finishedAt,
        lastExitCode: result.exitCode,
        lastError: result.exitCode === 0 ? null : (result.stderr || 'Unknown execution error'),
        stdout: result.stdout,
        stderr: result.stderr,
      },
      `Run finished (exitCode=${result.exitCode})`,
    )
    return res.json({
      agent,
      ...result,
      timestamp: finishedAt,
      safeMode: false,
      status: getAgentStatus(agent),
    })
  } catch (error: any) {
    const finishedAt = nowIso()
    updateAgentStatus(
      agent,
      {
        state: 'error',
        progress: 100,
        finishedAt,
        lastRunAt: finishedAt,
        lastExitCode: 1,
        lastError: error.message,
        stdout: '',
        stderr: error.message,
      },
      `Run failed: ${error.message}`,
    )
    return res.status(500).json({
      agent,
      exitCode: 1,
      stdout: '',
      stderr: error.message,
      timestamp: finishedAt,
      safeMode: false,
      status: getAgentStatus(agent),
    })
  }
})

imperialVaultRouter.post('/overlay/render', async (req, res) => {
  const text = String(req.body?.text ?? '')
  const factSlug = String(req.body?.factSlug ?? 'fact')
  const category = String(req.body?.category ?? 'general')

  if (!text.trim()) {
    return res.status(400).json({ error: 'text is required' })
  }

  if (config.SAFE_MODE) {
    return res.json({
      success: true,
      overlayPath: `DELIVERABLES/mock/${factSlug}/overlay.png`,
      output: '[SAFE_MODE] overlay render simulated',
      safeMode: true,
    })
  }

  const overlayScript = path.join(ivScriptsPath, 'render_overlay.py')
  const output = path.join(ivDeliverablesPath, 'latest', factSlug, 'overlay.png')

  try {
    const result = await runPythonScript(overlayScript, [
      '--text',
      text,
      '--series',
      factSlug,
      '--category',
      category,
      '--output',
      output,
    ])

    return res.json({
      success: result.exitCode === 0,
      overlayPath: output,
      output: result.stdout,
      stderr: result.stderr,
      safeMode: false,
    })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message, safeMode: false })
  }
})

imperialVaultRouter.post('/footage/search', async (req, res) => {
  const factText = String(req.body?.factText ?? '')
  const category = String(req.body?.category ?? 'general')

  if (!factText.trim()) {
    return res.status(400).json({ error: 'factText is required' })
  }

  if (config.SAFE_MODE) {
    return res.json({
      safeMode: true,
      results: [
        { title: 'Mock Archive Clip', source: 'SAFE_MODE', score: 0.91 },
        { title: 'Mock Battlefield Footage', source: 'SAFE_MODE', score: 0.84 },
      ],
    })
  }

  try {
    const python = `import json; from scripts.daily_footage import search_footage_brave; print(json.dumps(search_footage_brave(${JSON.stringify(
      factText,
    )}, ${JSON.stringify(category)})))`

    const result = await runInlinePython(python)
    return res.json({ safeMode: false, results: JSON.parse(result.stdout) })
  } catch (error: any) {
    return res.status(500).json({ error: error.message, safeMode: false })
  }
})

imperialVaultRouter.get('/stream', (req, res) => {
  ensureWatchers()

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const push = (payload: unknown) => {
    res.write(`event: imperial-vault-update\n`)
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  const listener = (payload: unknown) => push(payload)
  stateEvents.on('update', listener)

  push({
    type: 'initial',
    timestamp: nowIso(),
    safeMode: config.SAFE_MODE,
    agents: IV_AGENTS.map((agent) => getAgentStatus(agent)),
  })

  req.on('close', () => {
    stateEvents.off('update', listener)
    res.end()
  })
})
