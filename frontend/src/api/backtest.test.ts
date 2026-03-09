import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchBacktestResults,
  fetchLatestBacktest,
  listAllBacktests,
} from './backtest';

describe('listAllBacktests', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('uses browser-origin API URL by default', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ backtests: [] }),
    });

    await listAllBacktests();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/backtest/list');
  });

  it('fetches the latest backtest results', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ timestamp: 'latest', summary: {}, trades: [], ticker_stats: [], charts: {} }),
    });

    const payload = await fetchLatestBacktest();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/backtest/latest');
    expect(payload.timestamp).toBe('latest');
  });

  it('fetches backtest results for a timestamp', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ timestamp: 'run-1', summary: {}, trades: [], ticker_stats: [], charts: {} }),
    });

    const payload = await fetchBacktestResults('run-1');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/backtest/results/run-1');
    expect(payload.timestamp).toBe('run-1');
  });

  it('throws when latest results cannot be loaded', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable',
    });

    await expect(fetchLatestBacktest()).rejects.toThrow(
      'Failed to fetch latest backtest: Service Unavailable',
    );
  });

  it('throws when a timestamped backtest cannot be loaded', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(fetchBacktestResults('missing')).rejects.toThrow(
      'Failed to fetch backtest results: Not Found',
    );
  });
});
