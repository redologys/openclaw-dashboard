const toBool = (value: unknown, fallback: boolean) => {
  if (typeof value !== 'string') return fallback
  return value.toLowerCase() === 'true'
}

export const clientConfig = {
  SAFE_MODE: toBool(import.meta.env.VITE_SAFE_MODE, false),
  SSH_HOST: import.meta.env.VITE_SSH_HOST ?? '18.227.140.90',
}
