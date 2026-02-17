import * as fs from 'fs'
import { randomUUID } from 'crypto'
import { getMockSystemStats, getSystemStats } from './monitoring'
import { AuditLogEntry, SystemStats } from './types'
import { DATA_DIR, dataPath } from './paths'

export interface SkillActivityEvent {
  id: string
  timestamp: string
  source: string
  severity: 'info' | 'warning' | 'critical'
  message: string
}

export interface ContextHealthSnapshot {
  safeMode: boolean
  utilizationPct: number
  compactionThresholdPct: number
  autoCompactionEligible: boolean
  lastCompactionAt: string | null
  compactedToday: number
  history: Array<{
    timestamp: string
    utilizationPct: number
    action: 'check' | 'compact'
    status: 'ok' | 'warning'
  }>
}

export interface SecurityAlertItem {
  id: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  title: string
  details: string
}

export interface RestoreContextResult {
  safeMode: boolean
  restored: boolean
  summary: string
  anchorPoints: Array<{
    id: string
    timestamp: string
    snippet: string
  }>
}

export interface SmartSearchResult {
  id: string
  title: string
  snippet: string
  score: number
  source: string
  timestamp: string
}

export interface MemoryTimelineItem {
  id: string
  timestamp: string
  title: string
  summary: string
  confidence: number
}

export interface QuickCaptureResult {
  safeMode: boolean
  saved: boolean
  id: string
  message: string
}

interface ConversationMessage {
  id: string
  text: string
  createdAt: string
  senderType: 'user' | 'agent' | 'system'
}

interface ConversationRecord {
  id: string
  agentId: string
  title?: string
  updatedAt?: string
  messages?: ConversationMessage[]
}

const AUDIT_FILE = dataPath('audit.json')
const CONVERSATIONS_FILE = dataPath('conversations.json')
const MEMORY_INDEX_FILE = dataPath('memoryIndex.json')

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

const readJson = <T>(filePath: string, fallback: T): T => {
  try {
    if (!fs.existsSync(filePath)) return fallback
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const writeJson = <T>(filePath: string, payload: T) => {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2))
}

const appendAudit = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const audit = readJson<AuditLogEntry[]>(AUDIT_FILE, [])
  const next: AuditLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  }
  audit.unshift(next)
  writeJson(AUDIT_FILE, audit.slice(0, 400))
}

const readConversations = (): ConversationRecord[] => {
  return readJson<ConversationRecord[]>(CONVERSATIONS_FILE, [])
}

const flattenMessages = (agentId?: string): ConversationMessage[] => {
  const conversations = readConversations()
  return conversations
    .filter((conversation) => !agentId || conversation.agentId === agentId)
    .flatMap((conversation) => conversation.messages ?? [])
    .filter((message) => typeof message.text === 'string' && typeof message.createdAt === 'string')
}

const sampleTimeline = (): MemoryTimelineItem[] => [
  {
    id: 'timeline-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    title: 'Continuity Reflection',
    summary: 'Extracted preference memory for concise deployment updates.',
    confidence: 0.91,
  },
  {
    id: 'timeline-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    title: 'Session Insight',
    summary: 'Linked reliability incidents with gateway reconnect spikes.',
    confidence: 0.87,
  },
  {
    id: 'timeline-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    title: 'Memory Consolidation',
    summary: 'Generated follow-up questions for the next agent session.',
    confidence: 0.83,
  },
]

export const getContextHealthSnapshot = (safeMode: boolean): ContextHealthSnapshot => {
  const messages = flattenMessages()
  const messageCount = messages.length
  const utilizationFromMessages = Math.min(98, Math.max(18, Math.round(messageCount * 1.8)))
  const utilizationPct = safeMode
    ? 58 + (new Date().getMinutes() % 21)
    : utilizationFromMessages

  const audit = readJson<AuditLogEntry[]>(AUDIT_FILE, [])
  const compactions = audit.filter((entry) => entry.action === 'skill.context_compaction')
  const lastCompactionAt = compactions.length > 0 ? compactions[0].timestamp : null

  const todayPrefix = new Date().toISOString().slice(0, 10)
  const compactedToday = compactions.filter((entry) => entry.timestamp.startsWith(todayPrefix)).length

  const history: ContextHealthSnapshot['history'] = []
  for (let index = 0; index < 6; index += 1) {
    const minutesBack = (index + 1) * 30
    const value = Math.max(20, utilizationPct - index * 6)
    history.unshift({
      timestamp: new Date(Date.now() - minutesBack * 60_000).toISOString(),
      utilizationPct: value,
      action: 'check',
      status: value >= 75 ? 'warning' : 'ok',
    })
  }

  if (lastCompactionAt) {
    history.push({
      timestamp: lastCompactionAt,
      utilizationPct: Math.max(15, utilizationPct - 35),
      action: 'compact',
      status: 'ok',
    })
  }

  return {
    safeMode,
    utilizationPct,
    compactionThresholdPct: 75,
    autoCompactionEligible: utilizationPct >= 75,
    lastCompactionAt,
    compactedToday,
    history,
  }
}

export const runContextCompaction = (safeMode: boolean) => {
  const snapshotBefore = getContextHealthSnapshot(safeMode)

  appendAudit({
    actor: 'sophie-optimizer',
    action: 'skill.context_compaction',
    params: {
      safeMode,
      utilizationPct: snapshotBefore.utilizationPct,
    },
    resultSummary: safeMode
      ? 'SAFE_MODE: simulated context compaction run.'
      : 'Context compaction checkpoint recorded (non-destructive).',
  })

  return {
    ok: true,
    safeMode,
    message: safeMode
      ? 'Compaction simulated in SAFE_MODE.'
      : 'Compaction run recorded. No destructive file reset was performed by dashboard.',
    snapshot: getContextHealthSnapshot(safeMode),
  }
}

export const getLiveActivityFeed = (safeMode: boolean): SkillActivityEvent[] => {
  if (safeMode) {
    return [
      {
        id: 'activity-safe-1',
        timestamp: new Date(Date.now() - 60_000).toISOString(),
        source: 'public',
        severity: 'info',
        message: 'Agent orchestration heartbeat nominal.',
      },
      {
        id: 'activity-safe-2',
        timestamp: new Date(Date.now() - 4 * 60_000).toISOString(),
        source: 'sophie-optimizer',
        severity: 'warning',
        message: 'Context utilization approaching compaction threshold.',
      },
      {
        id: 'activity-safe-3',
        timestamp: new Date(Date.now() - 7 * 60_000).toISOString(),
        source: 'system-monitor',
        severity: 'info',
        message: 'CPU and memory telemetry refreshed.',
      },
    ]
  }

  const audit = readJson<AuditLogEntry[]>(AUDIT_FILE, [])
  const events = audit.slice(0, 20).map<SkillActivityEvent>((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    source: entry.actor,
    severity: entry.action.includes('denied') || entry.action.includes('security') ? 'critical' : 'info',
    message: entry.resultSummary ?? entry.action,
  }))

  return events
}

export const getSystemResourceSnapshot = async (safeMode: boolean): Promise<SystemStats> => {
  if (safeMode) {
    return getMockSystemStats()
  }

  return getSystemStats()
}

export const getSecurityAlerts = (safeMode: boolean): SecurityAlertItem[] => {
  if (safeMode) {
    return [
      {
        id: 'sec-safe-1',
        timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
        severity: 'medium',
        title: 'Suspicious Shell Pattern',
        details: 'SAFE_MODE simulation blocked potentially unsafe shell invocation.',
      },
      {
        id: 'sec-safe-2',
        timestamp: new Date(Date.now() - 17 * 60_000).toISOString(),
        severity: 'low',
        title: 'Policy Verification',
        details: 'Permission Firewall rule audit completed without escalation.',
      },
    ]
  }

  const audit = readJson<AuditLogEntry[]>(AUDIT_FILE, [])
  const alerts = audit
    .filter((entry) => entry.action.includes('permission') || entry.action.includes('security'))
    .slice(0, 12)
    .map<SecurityAlertItem>((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      severity: entry.action.includes('denied') ? 'high' : 'medium',
      title: entry.action,
      details: entry.resultSummary ?? 'Security telemetry event.',
    }))

  return alerts.length > 0
    ? alerts
    : [
        {
          id: 'sec-live-default',
          timestamp: new Date().toISOString(),
          severity: 'low',
          title: 'No Active Security Incidents',
          details: 'No recent permission or security anomalies found in audit history.',
        },
      ]
}

export const restoreContextForAgent = (agentId: string, safeMode: boolean): RestoreContextResult => {
  if (safeMode) {
    return {
      safeMode,
      restored: true,
      summary: 'Recovered anchor points from SAFE_MODE memory snapshots.',
      anchorPoints: [
        {
          id: 'anchor-safe-1',
          timestamp: new Date(Date.now() - 90 * 60_000).toISOString(),
          snippet: 'Reviewed Sentinel reliability thresholds and escalation policy.',
        },
        {
          id: 'anchor-safe-2',
          timestamp: new Date(Date.now() - 170 * 60_000).toISOString(),
          snippet: 'Validated provider latency dashboard with mock gateway events.',
        },
      ],
    }
  }

  const recentMessages = flattenMessages(agentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const anchorPoints = recentMessages.map((message) => ({
    id: message.id,
    timestamp: message.createdAt,
    snippet: message.text.slice(0, 180),
  }))

  appendAudit({
    actor: 'context-anchor',
    action: 'skill.context_restore',
    params: { agentId },
    resultSummary: `Recovered ${anchorPoints.length} context anchors for ${agentId}.`,
  })

  return {
    safeMode,
    restored: anchorPoints.length > 0,
    summary:
      anchorPoints.length > 0
        ? `Recovered ${anchorPoints.length} recent context anchors.`
        : 'No prior context anchors were found for this agent.',
    anchorPoints,
  }
}

export const searchMemorySmart = (query: string, safeMode: boolean): SmartSearchResult[] => {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length === 0) return []

  const sourceMessages = safeMode
    ? [
        {
          id: 'safe-memory-1',
          text: 'Escalation should trigger after three failed retries on gateway heartbeat.',
          createdAt: new Date(Date.now() - 50 * 60_000).toISOString(),
          senderType: 'agent' as const,
        },
        {
          id: 'safe-memory-2',
          text: 'Imperial Vault publish automation paused until safety audit completes.',
          createdAt: new Date(Date.now() - 120 * 60_000).toISOString(),
          senderType: 'system' as const,
        },
      ]
    : flattenMessages()

  const scored = sourceMessages
    .map((message) => {
      const lower = message.text.toLowerCase()
      const hits = lower.split(trimmed).length - 1
      const score = hits > 0 ? Math.min(1, 0.35 + hits * 0.2) : lower.includes(trimmed.slice(0, 3)) ? 0.25 : 0
      return {
        message,
        score,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  return scored.map((entry, index) => ({
    id: `${entry.message.id}-${index}`,
    title: `Memory Match ${index + 1}`,
    snippet: entry.message.text.slice(0, 220),
    score: Number(entry.score.toFixed(2)),
    source: safeMode ? 'chaos-mind (mock)' : 'chaos-mind',
    timestamp: entry.message.createdAt,
  }))
}

export const getMemoryTimeline = (agentId: string | undefined, safeMode: boolean): MemoryTimelineItem[] => {
  if (safeMode) {
    return sampleTimeline()
  }

  const messages = flattenMessages(agentId)
  if (messages.length === 0) {
    return []
  }

  return messages
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map((message, index) => ({
      id: `${message.id}-${index}`,
      timestamp: message.createdAt,
      title: message.senderType === 'agent' ? 'Agent Reflection' : 'Session Input',
      summary: message.text.slice(0, 160),
      confidence: Number((0.68 + Math.max(0, 4 - index) * 0.05).toFixed(2)),
    }))
}

export const quickCaptureNote = (note: string, safeMode: boolean): QuickCaptureResult => {
  const trimmed = note.trim()
  if (trimmed.length === 0) {
    throw new Error('Capture note must not be empty.')
  }

  const id = randomUUID()

  if (safeMode) {
    return {
      safeMode,
      saved: false,
      id,
      message: 'SAFE_MODE: quick capture simulated only (no persistent write).',
    }
  }

  const existing = readJson<Array<Record<string, unknown>>>(MEMORY_INDEX_FILE, [])
  existing.unshift({
    id,
    type: 'quick_capture',
    content: trimmed,
    createdAt: new Date().toISOString(),
    source: 'brainrepo',
  })
  writeJson(MEMORY_INDEX_FILE, existing.slice(0, 1000))

  appendAudit({
    actor: 'brainrepo',
    action: 'skill.quick_capture',
    params: { length: trimmed.length },
    resultSummary: 'Stored quick capture note in memory index.',
  })

  return {
    safeMode,
    saved: true,
    id,
    message: 'Quick capture saved to memory index.',
  }
}

