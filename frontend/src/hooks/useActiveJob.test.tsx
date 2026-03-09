import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../api/jobs', () => ({
  getJob: vi.fn(),
  getJobLogs: vi.fn(),
}))

import { getJob, getJobLogs } from '../api/jobs'
import { useActiveJob } from './useActiveJob'

describe('useActiveJob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads a stored job and polls for updates', async () => {
    vi.mocked(getJob).mockResolvedValue({
      job_id: 'job-1',
      command: 'backtest',
      command_line: 'python main.py --mode backtest',
      status: 'running',
      created_at: '2026-01-01T00:00:00Z',
      timeout_seconds: 7200,
    })
    vi.mocked(getJobLogs).mockResolvedValue({ job_id: 'job-1', status: 'running', lines: ['first'] })
    localStorage.setItem('invest_active_job_id', 'job-1')

    const { result } = renderHook(() => useActiveJob(1000))

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.activeJob?.job_id).toBe('job-1')
    expect(result.current.logs).toEqual(['first'])

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(getJob).toHaveBeenCalledTimes(2)
    act(() => result.current.stopMonitoring())
  })

  it('starts monitoring manually and keeps errors non-fatal', async () => {
    vi.mocked(getJob)
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue({
        job_id: 'job-2',
        command: 'chart',
        command_line: 'python main.py --mode chart --ticker AAA',
        status: 'succeeded',
        created_at: '2026-01-01T00:00:00Z',
        timeout_seconds: 7200,
      })
    vi.mocked(getJobLogs).mockResolvedValue({ job_id: 'job-2', status: 'succeeded', lines: ['done'] })

    const { result } = renderHook(() => useActiveJob(1000))

    await act(async () => {
      await result.current.startMonitoring('job-2')
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(1000)
      await Promise.resolve()
    })

    expect(result.current.activeJob?.job_id).toBe('job-2')
    expect(result.current.logs).toEqual(['done'])
  })
})
