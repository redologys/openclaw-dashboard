import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <Settings className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-zinc-400">
            Configure provider metadata, environment behavior, and operational controls.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/settings/providers"
            className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 hover:bg-zinc-900/80 transition-colors"
          >
            <div className="text-sm text-amber-400 font-medium">Providers</div>
            <h2 className="mt-1 text-lg font-semibold">OAuth Connections & Models</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Add provider connections and model catalogs for per-agent assignment.
            </p>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
            <div className="text-sm text-zinc-400 font-medium">More Settings</div>
            <h2 className="mt-1 text-lg font-semibold">In Progress</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Additional global controls are still being finalized.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
