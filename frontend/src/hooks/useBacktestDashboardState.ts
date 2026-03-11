import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchLatestBacktest,
  fetchBacktestByRange,
  fetchBacktestResults,
  listAllBacktests,
  type BacktestMetadata,
  type BacktestResults,
} from '../api/backtest'
import { type JobCreateRequest, type JobResponse } from '../api/jobs'
import { useBacktestJobManagement } from './useBacktestJobManagement'

export interface UseBacktestDashboardStateResult {
  results: BacktestResults | null
  backtests: BacktestMetadata[]
  pinnedAnnualResults: Array<{
    period: string
    result: BacktestResults | null
    error: string | null
  }>
  selectedTimestamp: string | null
  setSelectedTimestamp: Dispatch<SetStateAction<string | null>>
  loading: boolean
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  activeJob: JobResponse | null
  jobLogs: string[]
  runError: string | null
  handleLoadLatest: () => Promise<void>
  handleRunCommand: (request: JobCreateRequest) => Promise<void>
  handleCancelCommand: () => Promise<void>
}

const PINNED_ANNUAL_PERIODS = [
  '2020-01-01 to 2020-12-31',
  '2021-01-01 to 2021-12-31',
]

export function useBacktestDashboardState(): UseBacktestDashboardStateResult {
  const { t } = useTranslation()
  const [results, setResults] = useState<BacktestResults | null>(null)
  const [backtests, setBacktests] = useState<BacktestMetadata[]>([])
  const [pinnedAnnualResults, setPinnedAnnualResults] = useState<
    Array<{ period: string; result: BacktestResults | null; error: string | null }>
  >([])
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBacktests = useCallback(async () => {
    const data = await listAllBacktests()
    setBacktests(data)
    if (data.length > 0) {
      setSelectedTimestamp((current) => current ?? data[0].timestamp)
    }
  }, [])

  const loadPinnedAnnualResults = useCallback(async () => {
    const entries = await Promise.all(
      PINNED_ANNUAL_PERIODS.map(async (period) => {
        try {
          const result = await fetchBacktestByRange(period)
          return { period, result, error: null }
        } catch (err) {
          return {
            period,
            result: null,
            error: err instanceof Error ? err.message : String(err),
          }
        }
      }),
    )
    setPinnedAnnualResults(entries)
  }, [])

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        await Promise.all([loadBacktests(), loadPinnedAnnualResults()])
      } catch (err) {
        setError(t('dashboard.loadBacktestListError', { error: String(err) }))
      }
    }

    void loadInitialState()
  }, [loadBacktests, loadPinnedAnnualResults, t])

  useEffect(() => {
    if (!selectedTimestamp) return

    const loadResults = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchBacktestResults(selectedTimestamp)
        setResults(data)
      } catch (err) {
        setError(t('dashboard.loadBacktestResultsError', { error: String(err) }))
      } finally {
        setLoading(false)
      }
    }

    void loadResults()
  }, [selectedTimestamp, t])

  const handleLoadLatest = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLatestBacktest()
      setResults(data)
      setSelectedTimestamp(data.timestamp)
      await Promise.all([loadBacktests(), loadPinnedAnnualResults()])
    } catch (err) {
      setError(t('dashboard.loadLatestError', { error: String(err) }))
    } finally {
      setLoading(false)
    }
  }, [loadBacktests, loadPinnedAnnualResults, t])

  const {
    activeJob,
    jobLogs,
    runError,
    handleRunCommand,
    handleCancelCommand,
  } = useBacktestJobManagement({
    onJobSucceeded: handleLoadLatest,
  })

  return {
    results,
    backtests,
    pinnedAnnualResults,
    selectedTimestamp,
    setSelectedTimestamp,
    loading,
    error,
    setError,
    activeJob,
    jobLogs,
    runError,
    handleLoadLatest,
    handleRunCommand,
    handleCancelCommand,
  }
}
