import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BacktestStatus } from './BacktestStatus'
import type { JobResponse } from '../api/jobs'

const baseJob: JobResponse = {
  job_id: 'job-1',
  command: 'python',
  command_line: 'python -m backend.app',
  status: 'running',
  created_at: '2024-01-01T09:00:00Z',
  started_at: '2024-01-01T09:00:00Z',
  finished_at: null,
  return_code: null,
  error: null,
  timeout_seconds: 600,
}

describe('BacktestStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T10:05:30Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows idle state and empty logs when no job is active', () => {
    const { container } = render(<BacktestStatus activeJob={null} logs={[]} />)

    expect(screen.getByText('IDLE')).toBeInTheDocument()
    expect(screen.getByText('No recent logs')).toBeInTheDocument()
    expect(container.querySelector('.status-dot')).toHaveStyle({ background: '#6b7280' })
  })

  it('shows elapsed time and only the latest log lines for a running job', () => {
    render(
      <BacktestStatus
        activeJob={baseJob}
        logs={['line-1', 'line-2', 'line-3']}
        latestLines={2}
      />,
    )

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(screen.getByText('1h 5m 30s')).toBeInTheDocument()
    expect(screen.queryByText('line-1')).not.toBeInTheDocument()
    expect(screen.getByText(/line-2/)).toBeInTheDocument()
    expect(screen.getByText(/line-3/)).toBeInTheDocument()
  })

  it('uses distinct colors for queued, succeeded, and failed jobs', () => {
    const { container, rerender } = render(
      <BacktestStatus activeJob={{ ...baseJob, status: 'queued' }} logs={[]} />,
    )
    expect(container.querySelector('.status-dot')).toHaveStyle({ background: '#f59e0b' })

    rerender(<BacktestStatus activeJob={{ ...baseJob, status: 'succeeded' }} logs={[]} />)
    expect(container.querySelector('.status-dot')).toHaveStyle({ background: '#3b82f6' })

    rerender(<BacktestStatus activeJob={{ ...baseJob, status: 'failed' }} logs={[]} />)
    expect(container.querySelector('.status-dot')).toHaveStyle({ background: '#ef4444' })
  })
})
