import { buildApiUrl } from './base'
import type {
  BacktestHeadlineMetrics,
  BacktestListResponse,
  BacktestMetadata,
  BacktestResults,
  BacktestSummary,
  BacktestVisualization,
  SignalEventPoint,
  StrategyProfile,
  StrategyProfileListResponse,
  TickerStats,
  TimeSeriesPoint,
  TradeRecord,
} from './generated/contracts'

export type {
  BacktestHeadlineMetrics,
  BacktestMetadata,
  BacktestResults,
  BacktestSummary,
  BacktestVisualization,
  SignalEventPoint,
  StrategyProfile,
  TickerStats,
  TimeSeriesPoint,
  TradeRecord,
}

/**
 * Fetch latest backtest results
 */
export async function fetchLatestBacktest(strategyName?: string): Promise<BacktestResults> {
  const params = new URLSearchParams()
  if (strategyName) {
    params.set('strategy_name', strategyName)
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(buildApiUrl(`/backtest/latest${suffix}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch latest backtest: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch backtest results by timestamp
 */
export async function fetchBacktestResults(timestamp: string): Promise<BacktestResults> {
  const response = await fetch(buildApiUrl(`/backtest/results/${timestamp}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch backtest results: ${response.statusText}`);
  }
  return response.json();
}

/**
 * List all available backtests
 */
export async function fetchBacktestByRange(selector: string, strategyName?: string): Promise<BacktestResults> {
  const params = new URLSearchParams()
  params.set('range', selector)
  if (strategyName) {
    params.set('strategy_name', strategyName)
  }
  const response = await fetch(buildApiUrl(`/backtest/latest?${params.toString()}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch backtest range: ${response.statusText}`)
  }
  return response.json()
}

export async function listAllBacktests(strategyName?: string): Promise<BacktestMetadata[]> {
  const params = new URLSearchParams()
  if (strategyName) {
    params.set('strategy_name', strategyName)
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(buildApiUrl(`/backtest/list${suffix}`));
  if (!response.ok) {
    throw new Error(`Failed to list backtests: ${response.statusText}`);
  }
  const data = (await response.json()) as BacktestListResponse;
  return data.backtests;
}

export async function listStrategyProfiles(): Promise<StrategyProfile[]> {
  const response = await fetch(buildApiUrl('/backtest/strategies'))
  if (!response.ok) {
    throw new Error(`Failed to list strategy profiles: ${response.statusText}`)
  }
  const data = (await response.json()) as StrategyProfileListResponse
  return data.strategies
}
