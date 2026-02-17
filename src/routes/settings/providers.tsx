import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Plus, Settings, Unplug, XCircle } from 'lucide-react'
import { ProviderConnection, ProviderType } from '../../lib/types'

interface ProviderFormState {
  id?: string
  provider: ProviderType
  displayName: string
  modelsText: string
}

const DEFAULT_FORM: ProviderFormState = {
  provider: 'openai',
  displayName: '',
  modelsText: '',
}

function parseModels(modelsText: string): string[] {
  return Array.from(
    new Set(
      modelsText
        .split(/[\n,]/g)
        .map((model) => model.trim())
        .filter((model) => model.length > 0),
    ),
  )
}

function statusBadge(status: ProviderConnection['status']) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        connected
      </span>
    )
  }

  if (status === 'disabled') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-0.5 text-xs text-zinc-300">
        <Unplug className="h-3.5 w-3.5" />
        disabled
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">
      <XCircle className="h-3.5 w-3.5" />
      error
    </span>
  )
}

export default function ProviderSettingsPage() {
  const [providers, setProviders] = useState<ProviderConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProviderFormState>(DEFAULT_FORM)

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [providers],
  )

  const refreshProviders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/providers')
      if (!response.ok) throw new Error('Failed to load providers.')
      const data = (await response.json()) as ProviderConnection[]
      setProviders(data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load providers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshProviders()
  }, [])

  const openCreateDialog = () => {
    setForm(DEFAULT_FORM)
    setIsDialogOpen(true)
  }

  const openEditDialog = (provider: ProviderConnection) => {
    setForm({
      id: provider.id,
      provider: provider.provider,
      displayName: provider.displayName,
      modelsText: provider.models.join('\n'),
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        id: form.id,
        provider: form.provider,
        displayName: form.displayName.trim(),
        models: parseModels(form.modelsText),
      }

      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Failed to save provider.')

      setIsDialogOpen(false)
      setForm(DEFAULT_FORM)
      await refreshProviders()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save provider.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Settings</div>
            <h1 className="mt-2 text-2xl font-semibold flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-500" />
              Providers
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Manage OAuth-backed provider metadata and model catalogs for per-agent assignment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Back to Settings
            </Link>
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-zinc-900/80">
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Display Name</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Models</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Loading providers...
                  </td>
                </tr>
              )}

              {!loading && sortedProviders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No providers connected yet.
                  </td>
                </tr>
              )}

              {!loading &&
                sortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="font-medium text-zinc-100">{provider.displayName}</div>
                      <div className="text-xs text-zinc-500">{provider.id}</div>
                    </td>
                    <td className="px-4 py-4 text-zinc-300">{provider.provider}</td>
                    <td className="px-4 py-4">{statusBadge(provider.status)}</td>
                    <td className="px-4 py-4 text-zinc-300">{provider.models.length}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openEditDialog(provider)}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-4 rounded-xl border border-white/10 bg-zinc-900 p-5"
          >
            <div>
              <h2 className="text-lg font-semibold">{form.id ? 'Edit Provider' : 'Add Provider'}</h2>
              <p className="mt-1 text-xs text-zinc-500">
                OAuth token handling is intentionally not implemented here; this stores metadata only.
              </p>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-400">Display Name</span>
              <input
                required
                value={form.displayName}
                onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none focus:border-amber-500/40"
                placeholder="OpenAI - Main Account"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-400">Provider Type</span>
              <select
                value={form.provider}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, provider: event.target.value as ProviderType }))
                }
                className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none focus:border-amber-500/40"
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="google">google</option>
                <option value="custom">custom</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-zinc-400">Model IDs (comma or newline separated)</span>
              <textarea
                value={form.modelsText}
                onChange={(event) => setForm((prev) => ({ ...prev, modelsText: event.target.value }))}
                className="min-h-[120px] w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none focus:border-amber-500/40"
                placeholder="gpt-4o-mini&#10;gpt-4.1"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Provider'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

