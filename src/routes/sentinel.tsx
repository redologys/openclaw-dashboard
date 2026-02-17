import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Siren,
  Wrench,
} from 'lucide-react'
import { AuditLogEntry, HealthCheck, HealthSummary, SentinelConfig } from '../lib/types'

function formatDateTime(value: string | null): string {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

function statusTone(status: 'OK' | 'DEGRADED' | 'DOWN') {
  if (status === 'OK') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (status === 'DEGRADED') return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10'
}

function checkTone(status: HealthCheck['status']) {
  if (status === 'ok') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (status === 'degraded') return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10'
}

export default function SentinelPage() {
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [checks, setChecks] = useState<HealthCheck[]>([])
  const [config, setConfig] = useState<SentinelConfig | null>(null)
  const [events, setEvents] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [runningChecks, setRunningChecks] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSentinelData = async () => {
    try {
      const [summaryRes, checksRes, configRes, auditRes] = await Promise.all([
        fetch('/api/health/summary'),
        fetch('/api/health/checks'),
        fetch('/api/health/config'),
        fetch('/api/permissions/audit'),
      ])

      if (!summaryRes.ok || !checksRes.ok || !configRes.ok || !auditRes.ok) {
        throw new Error('Failed to fetch Sentinel data from backend.')
      }

      const summaryData = await summaryRes.json() as HealthSummary
      const checksData = await checksRes.json() as HealthCheck[]
      const configData = await configRes.json() as SentinelConfig
      const auditData = await auditRes.json() as AuditLogEntry[]

      const reliabilityEvents = auditData
        .filter((entry) => typeof entry.action === 'string' && entry.action.startsWith('sentinel:'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)

      setSummary(summaryData)
      setChecks(checksData)
      setConfig(configData)
      setEvents(reliabilityEvents)
      setError(null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load Sentinel data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSentinelData()
    const timer = setInterval(fetchSentinelData, 15000)
    return () => clearInterval(timer)
  }, [])

  const triggerRun = async (checkName?: string) => {
    try {
      setRunningChecks(true)
      const res = await fetch('/api/health/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkName ? { checkName } : {}),
      })
      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error ?? 'Health run failed.')
      }
      await fetchSentinelData()
    } catch (err: any) {
      setError(err.message ?? 'Failed to run health checks.')
    } finally {
      setRunningChecks(false)
    }
  }

  const saveThresholds = async () => {
    if (!config) return
    try {
      setSavingConfig(true)
      const res = await fetch('/api/health/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error ?? 'Failed to save Sentinel config.')
      }
      await fetchSentinelData()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save Sentinel config.')
    } finally {
      setSavingConfig(false)
    }
  }

  const failingChecks = summary?.failingChecks ?? 0
  const topStatus = summary?.overallStatus ?? 'OK'

  const nextRun = useMemo(() => formatDateTime(summary?.nextRunAt ?? null), [summary?.nextRunAt])
  const lastRun = useMemo(() => formatDateTime(summary?.lastRunAt ?? null), [summary?.lastRunAt])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading Sentinel reliability surface...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
            Self-Healing Sentinel
          </h1>
          <p className="text-zinc-500 mt-1">Reliability control plane for gateway, agents, tools, and providers.</p>
        </div>
        <button
          onClick={() => triggerRun()}
          disabled={runningChecks}
          className="px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${runningChecks ? 'animate-spin' : ''}`} />
            Run Full Check
          </span>
        </button>
      </div>

      {error && (
        <div className="border border-rose-500/30 bg-rose-500/10 text-rose-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-2">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Overall Status</div>
          <div className={`inline-flex px-2.5 py-1 rounded-full border text-sm font-semibold ${statusTone(topStatus)}`}>
            {topStatus}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-2">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Last Run</div>
          <div className="text-sm text-zinc-200">{lastRun}</div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-2">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Next Run</div>
          <div className="text-sm text-zinc-200">{nextRun}</div>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-2">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Failing Checks</div>
          <div className="text-2xl font-semibold text-rose-400">{failingChecks}</div>
          <div className={`text-xs ${summary?.safeMode ? 'text-amber-300' : 'text-emerald-400'}`}>
            SAFE_MODE: {summary?.safeMode ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-zinc-900/50 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Health Checks
            </h2>
            <span className="text-xs text-zinc-500">{checks.length} checks</span>
          </div>

          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check.checkName} className="border border-white/10 rounded-lg p-4 bg-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100 capitalize">{check.checkName}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs ${checkTone(check.status)}`}>
                        {check.status.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-zinc-500">severity: {check.severity}</span>
                    </div>
                    <div className="text-sm text-zinc-400">
                      {check.errorSummary || 'No active error.'}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-4">
                      <span>Retries: {check.retryCount}</span>
                      <span>Last update: {formatDateTime(check.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => triggerRun(check.checkName)}
                      disabled={runningChecks}
                      className="px-3 py-1.5 text-xs rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      Retry
                    </button>
                    <Link
                      to={`/dev?source=sentinel&check=${encodeURIComponent(check.checkName)}`}
                      className="px-3 py-1.5 text-xs rounded border border-white/10 text-zinc-300 hover:bg-white/5"
                    >
                      View Logs
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Sentinel Controls
            </h2>

            <label className="flex items-center justify-between text-sm text-zinc-300">
              <span>Enable scheduled checks</span>
              <input
                type="checkbox"
                checked={config?.enabled ?? true}
                onChange={(e) => setConfig((prev) => (prev ? { ...prev, enabled: e.target.checked } : prev))}
              />
            </label>

            <label className="block text-sm text-zinc-300 space-y-1">
              <span>Retries before escalation</span>
              <input
                type="number"
                min={1}
                max={20}
                value={config?.retriesBeforeEscalation ?? 3}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setConfig((prev) => (prev ? { ...prev, retriesBeforeEscalation: value } : prev))
                }}
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm text-zinc-300 space-y-1">
              <span>Check interval (minutes)</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={config?.checkIntervalMinutes ?? 5}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setConfig((prev) => (prev ? { ...prev, checkIntervalMinutes: value } : prev))
                }}
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
              />
            </label>

            <button
              onClick={saveThresholds}
              disabled={savingConfig}
              className="w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-50"
            >
              {savingConfig ? 'Saving...' : 'Save Thresholds'}
            </button>

            <div className="pt-2 border-t border-white/10 space-y-2 text-sm">
              <div className="text-zinc-500 text-xs uppercase tracking-widest">Deep Links</div>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-amber-300 hover:text-amber-200 inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mission Control
                </Link>
                <Link to="/" className="text-amber-300 hover:text-amber-200 inline-flex items-center gap-2">
                  <Siren className="w-4 h-4" />
                  Gateway Debug
                </Link>
                <Link to="/pipelines" className="text-amber-300 hover:text-amber-200 inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Playbooks
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-blue-400" />
              Reliability Timeline
            </h2>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {events.length === 0 && (
                <div className="text-sm text-zinc-500">No Sentinel events yet.</div>
              )}
              {events.map((event) => (
                <div key={event.id} className="border border-white/10 rounded-lg p-3 bg-black/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-200">{event.action}</span>
                    <span className="text-[11px] text-zinc-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{new Date(event.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
