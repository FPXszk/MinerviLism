import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchLatestBacktest,
  fetchBacktestResults,
  listAllBacktests,
  type BacktestMetadata,
  type BacktestResults,
} from '../api/backtest'
import {
  cancelJob,
  createJob,
  getJob,
  getJobLogs,
  type JobCreateRequest,
  type JobResponse,
} from '../api/jobs'

export interface UseBacktestDashboardStateResult {
  results: BacktestResults | null
  backtests: BacktestMetadata[]
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

export function useBacktestDashboardState(): UseBacktestDashboardStateResult {
  const { t } = useTranslation()
  const [results, setResults] = useState<BacktestResults | null>(null)
  const [backtests, setBacktests] = useState<BacktestMetadata[]>([])
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeJob, setActiveJob] = useState<JobResponse | null>(null)
  const [jobLogs, setJobLogs] = useState<string[]>([])
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    const loadBacktests = async () => {
      try {
        const data = await listAllBacktests()
        setBacktests(data)
        if (data.length > 0) {
          setSelectedTimestamp((current) => current ?? data[0].timestamp)
        }
      } catch (err) {
        setError(t('dashboard.loadBacktestListError', { error: String(err) }))
      }
    }

    void loadBacktests()
  }, [t])

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
    } catch (err) {
      setError(t('dashboard.loadLatestError', { error: String(err) }))
    } finally {
      setLoading(false)
    }
  }, [t])

  const refreshJobLogs = async (jobId: string) => {
    const logs = await getJobLogs(jobId, 300)
    setJobLogs(logs.lines)
  }

  const handleRunCommand = async (request: JobCreateRequest) => {
    setRunError(null)
    try {
      const job = await createJob(request)
      setActiveJob(job)
      setJobLogs([])
      await refreshJobLogs(job.job_id)
    } catch (err) {
      setRunError(t('dashboard.startCommandError', { error: String(err) }))
    }
  }

  const handleCancelCommand = async () => {
    if (!activeJob) return
    try {
      const cancelled = await cancelJob(activeJob.job_id)
      setActiveJob(cancelled)
      await refreshJobLogs(cancelled.job_id)
    } catch (err) {
      setRunError(t('dashboard.cancelCommandError', { error: String(err) }))
    }
  }

  useEffect(() => {
    if (!activeJob) return
    if (activeJob.status !== 'queued' && activeJob.status !== 'running') return

    const timer = window.setInterval(async () => {
      try {
        const latest = await getJob(activeJob.job_id)
        setActiveJob(latest)
        await refreshJobLogs(latest.job_id)

        if (latest.status === 'succeeded') {
          await handleLoadLatest()
        }
      } catch (err) {
        setRunError(t('dashboard.pollJobStatusError', { error: String(err) }))
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [activeJob?.job_id, activeJob?.status, handleLoadLatest, t])

  return {
    results,
    backtests,
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
