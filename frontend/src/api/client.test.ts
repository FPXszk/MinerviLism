import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./base', () => ({
  buildApiUrl: (path: string) => `http://example.test/api${path}`,
}))

import { getBacktestResults, getChartData, getTopBottomTickers, getTradeMarkers, runBacktest } from './client'

const fetchMock = vi.fn()

describe('legacy api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('runs a backtest', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'started', message: 'queued' }) })

    const payload = await runBacktest({ start_date: '2026-01-01', end_date: '2026-01-31' })

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/backtest/run', expect.objectContaining({ method: 'POST' }))
    expect(payload.status).toBe('started')
  })

  it('loads backtest results', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ trade_log: [], ticker_stats: [], has_results: true }) })

    const payload = await getBacktestResults()

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/backtest/results')
    expect(payload.has_results).toBe(true)
  })

  it('loads top and bottom tickers', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ top: [{ ticker: 'AAA', total_pnl: 10 }], bottom: [] }) })

    const payload = await getTopBottomTickers()

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/backtest/tickers')
    expect(payload.top?.[0].ticker).toBe('AAA')
  })

  it('builds chart query parameters', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ticker: 'AAA', dates: [] }) })

    await getChartData('AAA', '2026-01-01', '2026-01-31')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://example.test/api/charts/AAA?start_date=2026-01-01&end_date=2026-01-31',
    )
  })

  it('loads trade markers', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ entries: [], exits: [] }) })

    const payload = await getTradeMarkers('AAA')

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/charts/AAA/trades')
    expect(payload.entries).toEqual([])
  })

  it('throws when chart data fetch fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 })

    await expect(getChartData('AAA')).rejects.toThrow('Failed to fetch chart data: 503')
  })
})
