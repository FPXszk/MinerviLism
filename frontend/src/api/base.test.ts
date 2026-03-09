import { afterEach, describe, expect, it, vi } from 'vitest'

describe('api base helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uses the browser origin for relative API paths by default', async () => {
    vi.unstubAllEnvs()
    vi.resetModules()

    const { getApiBaseUrl, buildApiUrl } = await import('./base')

    expect(getApiBaseUrl()).toBe('/api')
    expect(buildApiUrl('/jobs')).toBe('http://localhost:3000/api/jobs')
    expect(buildApiUrl('backtest/list')).toBe('http://localhost:3000/api/backtest/list')
  })
})
