import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('i18n initialization', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
    vi.resetModules()
  })

  it('prefers the lang query parameter during initialization', async () => {
    window.history.replaceState({}, '', '/dashboard?lang=ja')

    const { default: i18n } = await import('./i18n')

    expect(i18n.language).toBe('ja')
  })

  it('falls back to stored language when the query parameter is missing', async () => {
    localStorage.setItem('app_lang', 'ja')

    const { default: i18n } = await import('./i18n')

    expect(i18n.language).toBe('ja')
  })

  it('defaults to english for unsupported languages and updates storage when changed', async () => {
    localStorage.setItem('app_lang', 'de')
    window.history.replaceState({}, '', '/dashboard?lang=de')

    const module = await import('./i18n')

    expect(module.default.language).toBe('en')

    module.setAppLanguage('ja')

    expect(localStorage.getItem('app_lang')).toBe('ja')
    expect(window.location.search).toContain('lang=ja')
  })
})
