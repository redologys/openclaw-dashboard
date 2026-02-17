import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { AgentStatus } from './agentHeartbeat'
import {
  AuditLogEntry,
  HealthCheck,
  HealthRunSource,
  HealthSeverity,
  HealthStatus,
  HealthSummary,
  SentinelConfig,
} from './types'
import { DATA_DIR } from './paths'

interface GatewayConnectionSnapshot {
  connected: boolean
  latency: number
  reconnectAttempts: number
}

interface HealthRunContext {
  safeMode: boolean
  gatewayStatus: GatewayConnectionSnapshot
  agentStatuses: AgentStatus[]
  source: HealthRunSource
  checkName?: string
}

interface HealthRunResult {
  checks: HealthCheck[]
  summary: HealthSummary
}

interface BaseCheckDescriptor {
  checkName: string
  status: HealthStatus
  errorSummary: string
  severity: HealthSeverity
}

const DEFAULT_SENTINEL_CONFIG: SentinelConfig = {
  enabled: true,
  retriesBeforeEscalation: 3,
  checkIntervalMinutes: 5,
  maxStoredChecks: 500,
}

export class SentinelService {
  private healthFile: string
  private configFile: string
  private auditFile: string

  constructor() {
    this.healthFile = path.join(DATA_DIR, 'system_health.json')
    this.configFile = path.join(DATA_DIR, 'sentinel_config.json')
    this.auditFile = path.join(DATA_DIR, 'audit.json')
    this.ensureFiles()
  }

  private ensureFiles() {
    const dataDir = path.dirname(this.healthFile)
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    if (!fs.existsSync(this.healthFile)) fs.writeFileSync(this.healthFile, JSON.stringify([], null, 2))
    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify(DEFAULT_SENTINEL_CONFIG, null, 2))
    }
    if (!fs.existsSync(this.auditFile)) fs.writeFileSync(this.auditFile, JSON.stringify([], null, 2))
  }

  private readJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) return fallback
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
    } catch {
      return fallback
    }
  }

  private writeJson<T>(filePath: string, value: T) {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
  }

  private getHealthHistory(): HealthCheck[] {
    const history = this.readJson<HealthCheck[]>(this.healthFile, [])
    return [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  private saveHealthHistory(history: HealthCheck[]) {
    this.writeJson(this.healthFile, history)
  }

  getConfig(): SentinelConfig {
    const raw = this.readJson<Partial<SentinelConfig>>(this.configFile, DEFAULT_SENTINEL_CONFIG)
    return {
      enabled: raw.enabled ?? DEFAULT_SENTINEL_CONFIG.enabled,
      retriesBeforeEscalation: this.clampNumber(raw.retriesBeforeEscalation, 1, 20, DEFAULT_SENTINEL_CONFIG.retriesBeforeEscalation),
      checkIntervalMinutes: this.clampNumber(raw.checkIntervalMinutes, 1, 1440, DEFAULT_SENTINEL_CONFIG.checkIntervalMinutes),
      maxStoredChecks: this.clampNumber(raw.maxStoredChecks, 50, 5000, DEFAULT_SENTINEL_CONFIG.maxStoredChecks),
    }
  }

  updateConfig(partial: Partial<SentinelConfig>): SentinelConfig {
    const current = this.getConfig()
    const updated: SentinelConfig = {
      enabled: partial.enabled ?? current.enabled,
      retriesBeforeEscalation: this.clampNumber(partial.retriesBeforeEscalation, 1, 20, current.retriesBeforeEscalation),
      checkIntervalMinutes: this.clampNumber(partial.checkIntervalMinutes, 1, 1440, current.checkIntervalMinutes),
      maxStoredChecks: this.clampNumber(partial.maxStoredChecks, 50, 5000, current.maxStoredChecks),
    }

    this.writeJson(this.configFile, updated)
    this.appendAudit([
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        actor: 'sentinel',
        action: 'sentinel:config_update',
        params: updated,
        resultSummary: 'ok',
      },
    ])

    return updated
  }

  getLatestChecks(): HealthCheck[] {
    const history = this.getHealthHistory()
    const latestByName = new Map<string, HealthCheck>()
    for (const check of history) {
      if (!latestByName.has(check.checkName)) {
        latestByName.set(check.checkName, check)
      }
    }
    return Array.from(latestByName.values()).sort((a, b) => a.checkName.localeCompare(b.checkName))
  }

  getSummary(safeMode: boolean): HealthSummary {
    const checks = this.getLatestChecks()
    const config = this.getConfig()

    let ok = 0
    let degraded = 0
    let down = 0

    for (const check of checks) {
      if (check.status === 'ok') ok += 1
      else if (check.status === 'degraded') degraded += 1
      else down += 1
    }

    let overallStatus: 'OK' | 'DEGRADED' | 'DOWN' = 'OK'
    if (down > 0) overallStatus = 'DOWN'
    else if (degraded > 0) overallStatus = 'DEGRADED'

    const lastRunAt = checks.length > 0
      ? checks.reduce((latest, check) => (new Date(check.timestamp).getTime() > new Date(latest).getTime() ? check.timestamp : latest), checks[0].timestamp)
      : null

    let nextRunAt: string | null = null
    if (config.enabled) {
      const base = lastRunAt ? new Date(lastRunAt).getTime() : Date.now()
      nextRunAt = new Date(base + config.checkIntervalMinutes * 60_000).toISOString()
    }

    return {
      overallStatus,
      counts: { ok, degraded, down },
      failingChecks: degraded + down,
      totalChecks: checks.length,
      lastRunAt,
      nextRunAt,
      safeMode,
    }
  }

  runHealthChecks(context: HealthRunContext): HealthRunResult {
    const config = this.getConfig()
    const history = this.getHealthHistory()
    const previousByName = new Map<string, HealthCheck>()

    for (const item of history) {
      if (!previousByName.has(item.checkName)) previousByName.set(item.checkName, item)
    }

    const baseChecks = this.createBaseChecks(context)
    const filtered = context.checkName
      ? baseChecks.filter((check) => check.checkName === context.checkName)
      : baseChecks

    if (filtered.length === 0) {
      throw new Error(`Unknown check name: ${context.checkName}`)
    }

    const timestamp = new Date().toISOString()
    const executedChecks: HealthCheck[] = filtered.map((base) => {
      const previous = previousByName.get(base.checkName)
      const retryCount = base.status === 'ok'
        ? 0
        : previous && previous.status !== 'ok'
          ? previous.retryCount + 1
          : 1

      const escalated = base.status !== 'ok' && retryCount >= config.retriesBeforeEscalation
      const severity = escalated
        ? (base.status === 'down' ? 'critical' : 'high')
        : base.severity

      return {
        id: uuidv4(),
        timestamp,
        checkName: base.checkName,
        status: base.status,
        errorSummary: base.errorSummary,
        retryCount,
        severity,
        source: context.source,
      }
    })

    const mergedHistory = [...executedChecks, ...history].slice(0, config.maxStoredChecks)
    this.saveHealthHistory(mergedHistory)
    this.appendReliabilityAudit(executedChecks, previousByName, context)

    return {
      checks: executedChecks,
      summary: this.getSummary(context.safeMode),
    }
  }

  runScheduledHealthChecks(snapshot: Omit<HealthRunContext, 'source' | 'checkName'>): HealthRunResult | null {
    const config = this.getConfig()
    if (!config.enabled) return null

    const summary = this.getSummary(snapshot.safeMode)
    if (!summary.lastRunAt) {
      return this.runHealthChecks({ ...snapshot, source: 'cron' })
    }

    if (!summary.nextRunAt) return null
    const nextRunTs = new Date(summary.nextRunAt).getTime()
    if (Date.now() < nextRunTs) return null

    return this.runHealthChecks({ ...snapshot, source: 'cron' })
  }

  private createBaseChecks(context: Omit<HealthRunContext, 'source' | 'checkName'>): BaseCheckDescriptor[] {
    const offlineAgents = context.agentStatuses.filter((agent) => agent.status === 'offline').length
    const hasHeartbeatData = context.agentStatuses.length > 0

    const gatewayCheck: BaseCheckDescriptor = context.safeMode
      ? {
          checkName: 'gateway',
          status: 'ok',
          errorSummary: '',
          severity: 'low',
        }
      : !context.gatewayStatus.connected
        ? {
            checkName: 'gateway',
            status: 'down',
            errorSummary: 'Gateway bridge is disconnected.',
            severity: 'critical',
          }
        : context.gatewayStatus.reconnectAttempts > 2
          ? {
              checkName: 'gateway',
              status: 'degraded',
              errorSummary: `Gateway reconnect attempts: ${context.gatewayStatus.reconnectAttempts}.`,
              severity: 'high',
            }
          : {
              checkName: 'gateway',
              status: 'ok',
              errorSummary: '',
              severity: 'low',
            }

    const agentCheck: BaseCheckDescriptor = !hasHeartbeatData
      ? {
          checkName: 'agents',
          status: 'degraded',
          errorSummary: 'No active agent heartbeats recorded.',
          severity: 'medium',
        }
      : offlineAgents > 0
        ? {
            checkName: 'agents',
            status: 'degraded',
            errorSummary: `${offlineAgents} agent(s) are offline.`,
            severity: 'medium',
          }
        : {
            checkName: 'agents',
            status: 'ok',
            errorSummary: '',
            severity: 'low',
          }

    const toolCheck: BaseCheckDescriptor = context.safeMode
      ? {
          checkName: 'tools',
          status: 'ok',
          errorSummary: '',
          severity: 'low',
        }
      : !context.gatewayStatus.connected
        ? {
            checkName: 'tools',
            status: 'degraded',
            errorSummary: 'Tool bridge is blocked by gateway disconnect.',
            severity: 'high',
          }
        : {
            checkName: 'tools',
            status: 'ok',
            errorSummary: '',
            severity: 'low',
          }

    const providerCheck: BaseCheckDescriptor = context.safeMode
      ? {
          checkName: 'providers',
          status: 'ok',
          errorSummary: '',
          severity: 'low',
        }
      : !context.gatewayStatus.connected
        ? {
            checkName: 'providers',
            status: 'down',
            errorSummary: 'Provider status unavailable while gateway is disconnected.',
            severity: 'high',
          }
        : context.gatewayStatus.latency > 1200
          ? {
              checkName: 'providers',
              status: 'degraded',
              errorSummary: `Gateway latency high (${context.gatewayStatus.latency}ms).`,
              severity: 'high',
            }
          : {
              checkName: 'providers',
              status: 'ok',
              errorSummary: '',
              severity: 'low',
            }

    return [gatewayCheck, agentCheck, toolCheck, providerCheck]
  }

  private appendReliabilityAudit(
    checks: HealthCheck[],
    previousByName: Map<string, HealthCheck>,
    context: HealthRunContext,
  ) {
    const entries: AuditLogEntry[] = [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        actor: 'sentinel',
        action: 'sentinel:run',
        params: {
          source: context.source,
          checkName: context.checkName ?? null,
          safeMode: context.safeMode,
          checkCount: checks.length,
        },
        resultSummary: 'ok',
      },
    ]

    const config = this.getConfig()

    for (const check of checks) {
      const previous = previousByName.get(check.checkName)
      if (check.status !== 'ok') {
        entries.push({
          id: uuidv4(),
          timestamp: check.timestamp,
          actor: 'sentinel',
          action: check.retryCount >= config.retriesBeforeEscalation ? 'sentinel:escalation' : 'sentinel:incident',
          params: {
            checkName: check.checkName,
            status: check.status,
            errorSummary: check.errorSummary,
            retryCount: check.retryCount,
            severity: check.severity,
            source: check.source,
          },
          resultSummary: check.status,
        })
      } else if (previous && previous.status !== 'ok') {
        entries.push({
          id: uuidv4(),
          timestamp: check.timestamp,
          actor: 'sentinel',
          action: 'sentinel:recovery',
          params: {
            checkName: check.checkName,
            previousStatus: previous.status,
            previousRetryCount: previous.retryCount,
            source: check.source,
          },
          resultSummary: 'ok',
        })
      }
    }

    this.appendAudit(entries)
  }

  private appendAudit(entries: AuditLogEntry[]) {
    const existing = this.readJson<AuditLogEntry[]>(this.auditFile, [])
    const merged = [...existing, ...entries].slice(-2000)
    this.writeJson(this.auditFile, merged)
  }

  private clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback
    return Math.min(max, Math.max(min, Math.round(value)))
  }
}
