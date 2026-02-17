import { Link } from 'react-router-dom'
import { ContextHealthWidget, LiveActivityWidget, SystemResourcesWidget } from '../components/dashboard/SkillWidgets'
import { Terminal, ShieldCheck, Workflow } from 'lucide-react'

export default function Monitoring() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Monitoring</h1>
          <p className="text-sm text-zinc-400">
            SAFE_MODE-aware reliability telemetry powered by sophie-optimizer, public, and system-monitor.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ContextHealthWidget />
          <SystemResourcesWidget />
          <LiveActivityWidget />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/sentinel" className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 hover:bg-zinc-900/80 transition-colors">
            <div className="inline-flex items-center gap-2 text-amber-300 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Reliability Console
            </div>
            <p className="mt-2 text-xs text-zinc-400">Open Sentinel to inspect escalations and run targeted checks.</p>
          </Link>

          <Link to="/dev" className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 hover:bg-zinc-900/80 transition-colors">
            <div className="inline-flex items-center gap-2 text-sky-300 text-sm font-medium">
              <Terminal className="w-4 h-4" />
              Gateway Debug
            </div>
            <p className="mt-2 text-xs text-zinc-400">Inspect logs, approvals, and security alert history in Dev tools.</p>
          </Link>

          <Link to="/pipelines" className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 hover:bg-zinc-900/80 transition-colors">
            <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <Workflow className="w-4 h-4" />
              Playbooks
            </div>
            <p className="mt-2 text-xs text-zinc-400">Use automated playbooks for deeper recovery and incident workflows.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
