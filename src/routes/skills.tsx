import { useEffect, useMemo, useState } from 'react'
import { Skill } from '../lib/types'
import { Download, PackageCheck, RefreshCw } from 'lucide-react'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'installed'>('installed')

  const loadSkills = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/skills')
      if (!res.ok) throw new Error(`Failed to load skills (${res.status})`)
      const data = (await res.json()) as Skill[]
      setSkills(data)
      setError(null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load skills.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSkills()
  }, [])

  const preinstalledCount = useMemo(
    () => skills.filter((skill) => skill.origin === 'preinstalled' || skill.preinstalled).length,
    [skills],
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Skills</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Installed capabilities available to agents when the gateway connects.
            </p>
          </div>
          <button
            onClick={() => {
              void loadSkills()
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Pre-installed skills: <span className="font-semibold">{preinstalledCount}</span> / {skills.length}
        </div>

        <div className="inline-flex rounded-xl border border-white/10 bg-zinc-900/60 p-1">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              activeTab === 'installed' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Installed
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
            <span className="col-span-3">Skill</span>
            <span className="col-span-4">Description</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-1">Version</span>
            <span className="col-span-2">Status</span>
          </div>

          <div className="divide-y divide-white/5">
            {skills.map((skill) => (
              <div key={skill.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm">
                <div className="col-span-3 min-w-0">
                  <div className="font-medium text-zinc-100 truncate">{skill.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{skill.id}</div>
                </div>

                <div className="col-span-4 text-zinc-300 text-xs leading-relaxed">
                  {skill.description || 'No description'}
                </div>

                <div className="col-span-2 text-xs text-zinc-400">{skill.category ?? 'general'}</div>

                <div className="col-span-1 text-xs text-zinc-300">{skill.version}</div>

                <div className="col-span-2 flex items-center gap-2">
                  {(skill.origin === 'preinstalled' || skill.preinstalled) ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      <PackageCheck className="w-3 h-3" />
                      Pre-installed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-400">
                      Installed
                    </span>
                  )}

                  {typeof skill.path === 'string' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                      <Download className="w-3 h-3" />
                      {skill.path}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {!loading && skills.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-zinc-500">No skills found.</div>
            )}
          </div>
        </div>

        {loading && <div className="text-xs text-zinc-500">Loading skills...</div>}
        {error && <div className="text-xs text-rose-400">{error}</div>}
      </div>
    </div>
  )
}
