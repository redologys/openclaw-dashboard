import { useEffect, useState } from 'react'

export interface GatewayStatus {
  connected: boolean
  latency: number
  reconnectAttempts: number
  safeMode: boolean
  gatewayUrl: string
}

const DEFAULT_STATUS: GatewayStatus = {
  connected: false,
  latency: 0,
  reconnectAttempts: 0,
  safeMode: false,
  gatewayUrl: 'ws://127.0.0.1:18789',
}

export function useGatewayStatus(pollIntervalMs = 5000) {
  const [status, setStatus] = useState<GatewayStatus>(DEFAULT_STATUS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/gateway/status')
        const payload = (await response.json()) as Partial<GatewayStatus> & { error?: string }
        if (!response.ok) {
          throw new Error(payload.error ?? `Gateway status request failed (${response.status})`)
        }
        if (cancelled) return
        setStatus((prev) => ({
          ...prev,
          ...payload,
        }))
        setError(null)
      } catch (err: any) {
        if (cancelled) return
        setError(err.message ?? 'Failed to load gateway status')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    const timer = window.setInterval(() => {
      void load()
    }, pollIntervalMs)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [pollIntervalMs])

  return { status, loading, error }
}
