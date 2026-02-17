import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Clock3, Cpu, HardDrive, MemoryStick, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { ContextHealthSnapshot, SkillActivityEvent, SystemStats } from '../../lib/types'

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const usePolling = <T,>(url: string, intervalMs: number, initial: T) => {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const payload = (await res.json()) as T
        if (!mounted) return
        setData(payload)
        setError(null)
      } catch (err: any) {
        if (!mounted) return
        setError(err.message ?? 'Failed to fetch widget data.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()
    const timer = window.setInterval(() => {
      void load()
    }, intervalMs)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [url, intervalMs])

  return { data, loading, error, setData }
}

const emptyContextHealth: ContextHealthSnapshot = {
  safeMode: true,
  utilizationPct: 0,
  compactionThresholdPct: 75,
  autoCompactionEligible: false,
  lastCompactionAt: null,
  compactedToday: 0,
  history: [],
}

const emptySystemStats: SystemStats = {
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  dockerContainers: [],
  timestamp: Date.now(),
}

export function ContextHealthWidget() {
  const { data, loading, error, setData } = usePolling<ContextHealthSnapshot>(
    '/api/skills/context-health',
    15_000,
    emptyContextHealth,
  )
  const [actioning, setActioning] = useState(false)
  const autoTriggeredRef = useRef(false)

  const runCompaction = async () => {
    setActioning(true)
    try {
      const res = await fetch('/api/skills/context-health/compact', { method: 'POST' })
      if (!res.ok) throw new Error(`Compaction failed (${res.status})`)
      const payload = (await res.json()) as { snapshot?: ContextHealthSnapshot }
      if (payload.snapshot) {
        setData(payload.snapshot)
      }
    } catch (err) {
      console.error('Compaction request failed:', err)
    } finally {
      setActioning(false)
    }
  }

  useEffect(() => {
    if (loading || actioning) return
    if (!data.autoCompactionEligible) {
      autoTriggeredRef.current = false
      return
    }

    if (autoTriggeredRef.current) return
    autoTriggeredRef.current = true
    void runCompaction()
  }, [data.autoCompactionEligible, loading, actioning])

  const badgeTone = data.utilizationPct >= data.compactionThresholdPct ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'

  return (
    <div className="h-full rounded-lg border border-white/5 bg-zinc-900/50 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          Context Health
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeTone}`}>
          {data.safeMode ? 'SAFE_MODE' : 'LIVE'}
        </span>
      </div>

      <div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-black text-zinc-100">{numberFormat.format(data.utilizationPct)}%</span>
          <span className="text-[10px] text-zinc-500 uppercase">Threshold {data.compactionThresholdPct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-black/30 overflow-hidden">
          <div
            className={`h-full ${data.utilizationPct >= data.compactionThresholdPct ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, data.utilizationPct)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
        <div className="rounded border border-white/5 bg-black/20 p-2">
          <div className="text-zinc-500 uppercase">Last Compaction</div>
          <div className="mt-1 text-zinc-200">{data.lastCompactionAt ? new Date(data.lastCompactionAt).toLocaleTimeString() : 'None'}</div>
        </div>
        <div className="rounded border border-white/5 bg-black/20 p-2">
          <div className="text-zinc-500 uppercase">Compacted Today</div>
          <div className="mt-1 text-zinc-200">{data.compactedToday}</div>
        </div>
      </div>

      <button
        onClick={() => {
          void runCompaction()
        }}
        disabled={actioning}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
      >
        <Wrench className="w-3.5 h-3.5" />
        {actioning ? 'Running...' : 'Run Compaction'}
      </button>

      {loading && <div className="text-[10px] text-zinc-500">Loading context telemetry...</div>}
      {error && <div className="text-[10px] text-rose-400">{error}</div>}
    </div>
  )
}

export function LiveActivityWidget() {
  const { data, loading, error } = usePolling<SkillActivityEvent[]>('/api/skills/live-activity', 8_000, [])

  return (
    <div className="h-full rounded-lg border border-white/5 bg-zinc-900/50 p-4 flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-blue-400" />
        Live Activity
      </div>

      <div className="space-y-2 overflow-auto pr-1">
        {data.slice(0, 5).map((event) => (
          <div key={event.id} className="rounded border border-white/5 bg-black/20 p-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="uppercase text-zinc-500">{event.source}</span>
              <span className={event.severity === 'critical' ? 'text-rose-300' : event.severity === 'warning' ? 'text-amber-300' : 'text-emerald-300'}>
                {event.severity}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-200 leading-snug">{event.message}</div>
            <div className="mt-1 text-[10px] text-zinc-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      {loading && <div className="text-[10px] text-zinc-500">Streaming activity...</div>}
      {error && <div className="text-[10px] text-rose-400">{error}</div>}
    </div>
  )
}

export function SystemResourcesWidget() {
  const { data, loading, error } = usePolling<SystemStats>('/api/skills/system-resources', 30_000, emptySystemStats)

  const bars = useMemo(
    () => [
      { label: 'CPU', value: Math.round(data.cpuUsage), icon: <Cpu className="w-3.5 h-3.5" /> },
      { label: 'RAM', value: Math.round(data.memoryUsage), icon: <MemoryStick className="w-3.5 h-3.5" /> },
      { label: 'Disk', value: Math.round(data.diskUsage), icon: <HardDrive className="w-3.5 h-3.5" /> },
    ],
    [data.cpuUsage, data.memoryUsage, data.diskUsage],
  )

  return (
    <div className="h-full rounded-lg border border-white/5 bg-zinc-900/50 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          System Resources
        </div>
        <div className="text-[10px] text-zinc-500 inline-flex items-center gap-1">
          <Clock3 className="w-3 h-3" />
          {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span className="inline-flex items-center gap-1.5">{bar.icon}{bar.label}</span>
              <span>{bar.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
              <div
                className={bar.value >= 80 ? 'h-full bg-rose-500' : bar.value >= 60 ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'}
                style={{ width: `${Math.min(100, bar.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-[10px] text-zinc-500">Loading system metrics...</div>}
      {error && <div className="text-[10px] text-rose-400">{error}</div>}
    </div>
  )
}
