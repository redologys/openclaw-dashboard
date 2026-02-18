const API_BASE_STORAGE_KEY = 'openclaw.apiBaseUrl'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const defaultApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:3001'
  return `${window.location.protocol}//${window.location.hostname}:3001`
}

export const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    return trimTrailingSlash(`${parsed.protocol}//${parsed.host}`)
  } catch {
    return ''
  }
}

export const getApiBaseUrlOverride = () => {
  if (typeof window === 'undefined') return ''
  return normalizeApiBaseUrl(window.localStorage.getItem(API_BASE_STORAGE_KEY) ?? '')
}

export const getApiBaseUrl = () => {
  return getApiBaseUrlOverride() || defaultApiBaseUrl()
}

export const setApiBaseUrlOverride = (value: string) => {
  if (typeof window === 'undefined') return
  const normalized = normalizeApiBaseUrl(value)
  if (!normalized) {
    window.localStorage.removeItem(API_BASE_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized)
}

export const buildApiUrl = (baseUrl: string, path: string) => {
  const normalizedBase = normalizeApiBaseUrl(baseUrl)
  if (!normalizedBase) return path
  return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`
}

export const installApiBaseUrlFetchShim = () => {
  if (typeof window === 'undefined') return

  const globalWindow = window as Window & { __openclawFetchShimInstalled?: boolean }
  if (globalWindow.__openclawFetchShimInstalled) return

  const originalFetch = window.fetch.bind(window)

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      const baseUrl = getApiBaseUrl()
      return originalFetch(`${baseUrl}${input}`, init)
    }
    return originalFetch(input, init)
  }) as typeof window.fetch

  globalWindow.__openclawFetchShimInstalled = true
}
