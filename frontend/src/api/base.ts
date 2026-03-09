type ApiImportMetaEnv = {
  VITE_API_URL?: string
}

const configuredApiBaseUrl = ((import.meta as { env?: ApiImportMetaEnv }).env?.VITE_API_URL ?? '').trim()
const normalizedApiBaseUrl = (configuredApiBaseUrl || '/api').replace(/\/$/, '')

function resolveOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost'
}

export function getApiBaseUrl(): string {
  return normalizedApiBaseUrl
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (/^https?:\/\//.test(normalizedApiBaseUrl)) {
    return `${normalizedApiBaseUrl}${normalizedPath}`
  }
  return new URL(`${normalizedApiBaseUrl}${normalizedPath}`, resolveOrigin()).toString()
}
