import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Network, RefreshCw, Save, Settings } from 'lucide-react'
import {
  buildApiUrl,
  getApiBaseUrl,
  normalizeApiBaseUrl,
  setApiBaseUrlOverride,
} from '../lib/apiRuntime'

interface GatewayConfigResponse {
  gatewayUrl: string
  hasToken: boolean
  connected: boolean
  safeMode: boolean
  reconnectAttempts: number
  latency: number
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const raw = await response.text()

  let payload: any = {}
  if (raw.trim().length > 0) {
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error(`Expected JSON from ${url}, received invalid response (status ${response.status}).`)
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`)
  }

  return payload as T
}

export default function SettingsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(getApiBaseUrl())
  const [gatewayUrl, setGatewayUrl] = useState<string>('')
  const [gatewayToken, setGatewayToken] = useState<string>('')
  const [gatewayConnected, setGatewayConnected] = useState<boolean | null>(null)
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [latency, setLatency] = useState<number>(0)
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0)
  const [hasToken, setHasToken] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadConnectivity = async (baseUrlInput: string) => {
    const baseUrl = normalizeApiBaseUrl(baseUrlInput) || getApiBaseUrl()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = await fetchJson<GatewayConfigResponse>(buildApiUrl(baseUrl, '/api/gateway/config'))
      setGatewayUrl(payload.gatewayUrl)
      setGatewayConnected(payload.connected)
      setSafeMode(payload.safeMode)
      setLatency(payload.latency)
      setReconnectAttempts(payload.reconnectAttempts)
      setHasToken(payload.hasToken)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load gateway config.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadConnectivity(apiBaseUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveConnectivity = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const normalizedApiBase = normalizeApiBaseUrl(apiBaseUrl)
      if (!normalizedApiBase) {
        throw new Error('Backend API URL must be a valid http:// or https:// address.')
      }

      if (!gatewayUrl.trim()) {
        throw new Error('Gateway URL is required.')
      }

      setApiBaseUrlOverride(normalizedApiBase)

      const payload = await fetchJson<GatewayConfigResponse>(
        buildApiUrl(normalizedApiBase, '/api/gateway/config'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gatewayUrl: gatewayUrl.trim(),
            gatewayToken: gatewayToken.trim() || undefined,
            reconnect: true,
          }),
        },
      )

      setGatewayConnected(payload.connected)
      setSafeMode(payload.safeMode)
      setLatency(payload.latency)
      setReconnectAttempts(payload.reconnectAttempts)
      setHasToken(payload.hasToken)
      setGatewayToken('')
      setSuccess(
        gatewayToken.trim().length > 0
          ? 'Connectivity updated. Gateway token accepted and stored in backend runtime (hidden).'
          : 'Connectivity updated. Backend reconnect requested with the new gateway target.',
      )
    } catch (err: any) {
      setError(err.message ?? 'Failed to save connectivity settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    const normalizedApiBase = normalizeApiBaseUrl(apiBaseUrl)
    if (!normalizedApiBase) {
      setError('Backend API URL must be valid before testing.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = await fetchJson<GatewayConfigResponse>(
        buildApiUrl(normalizedApiBase, '/api/gateway/config'),
      )
      setGatewayConnected(payload.connected)
      setSafeMode(payload.safeMode)
      setLatency(payload.latency)
      setReconnectAttempts(payload.reconnectAttempts)
      setHasToken(payload.hasToken)
      setGatewayUrl(payload.gatewayUrl)
      setSuccess(
        payload.connected
          ? 'Gateway connection is live.'
          : 'Backend reachable, but gateway is not connected yet.',
      )
    } catch (err: any) {
      setError(err.message ?? 'Connectivity check failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <Settings className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-zinc-400">
            Configure where the dashboard frontend sends API requests and which gateway URL the backend connects to.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

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

          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
            <div className="text-sm text-amber-400 font-medium">Connection Status</div>
            <h2 className="mt-1 text-lg font-semibold">Runtime Snapshot</h2>
            <div className="mt-3 space-y-1 text-sm text-zinc-300">
              <div>
                Backend ↔ Gateway:{' '}
                <span className={gatewayConnected ? 'text-emerald-300' : 'text-rose-300'}>
                  {gatewayConnected ? 'connected' : 'disconnected'}
                </span>
              </div>
              <div>SAFE_MODE: {safeMode ? 'ON' : 'OFF'}</div>
              <div>Latency: {latency}ms</div>
              <div>Reconnect attempts: {reconnectAttempts}</div>
              <div>Gateway token set: {hasToken ? 'yes' : 'no'}</div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSaveConnectivity}
          className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Connectivity</h2>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Backend API URL (frontend target)</span>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-zinc-100 outline-none focus:border-amber-500/40"
                placeholder="http://127.0.0.1:3001"
              />
            </div>
            <p className="text-xs text-zinc-500">
              This is stored in your browser and reroutes all `/api/*` calls to the selected backend.
            </p>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Gateway URL (backend target)</span>
            <input
              value={gatewayUrl}
              onChange={(event) => setGatewayUrl(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none focus:border-amber-500/40"
              placeholder="ws://127.0.0.1:18789"
            />
            <p className="text-xs text-zinc-500">
              Use `ws://` or `wss://`. Saving this triggers a backend reconnect in live mode.
            </p>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-zinc-400">Gateway Token (optional runtime override)</span>
            <input
              type="password"
              value={gatewayToken}
              onChange={(event) => setGatewayToken(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-zinc-100 outline-none focus:border-amber-500/40"
              placeholder={
                hasToken
                  ? 'Token currently stored (hidden). Enter a new token to replace it.'
                  : 'Leave blank to keep current backend token'
              }
            />
            {hasToken && (
              <p className="text-xs text-emerald-400/90">
                Backend runtime currently has a gateway token loaded.
              </p>
            )}
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save & Reconnect'}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {loading ? 'Checking...' : 'Test Connection'}
            </button>
          </div>

          <p className="text-xs text-zinc-500">
            Persist the same values in `.env` for reboot-safe production settings. Runtime changes here do not replace environment management.
          </p>
        </form>
      </div>
    </div>
  )
}
