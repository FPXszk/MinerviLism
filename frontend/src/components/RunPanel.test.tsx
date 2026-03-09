import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RunPanel } from './RunPanel'

const baseProps = {
  onRun: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn().mockResolvedValue(undefined),
  activeJob: null,
  logs: [],
  runError: null,
}

describe('RunPanel', () => {
  it('submits a backtest request with optional parameters', async () => {
    const onRun = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<RunPanel {...baseProps} onRun={onRun} />)

    await user.type(screen.getByLabelText('Tickers (comma-separated, optional)'), 'AAPL,MSFT')
    await user.click(screen.getByLabelText('Skip chart generation (--no-charts)'))
    await user.clear(screen.getByLabelText('Timeout (seconds)'))
    await user.type(screen.getByLabelText('Timeout (seconds)'), '1800')
    await user.click(screen.getByRole('button', { name: 'Run Command' }))

    await waitFor(() => {
      expect(onRun).toHaveBeenCalledWith({
        command: 'backtest',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        tickers: 'AAPL,MSFT',
        no_charts: true,
        timeout_seconds: 1800,
      })
    })
  })

  it('submits stage2, chart, and update_tickers requests', async () => {
    const onRun = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<RunPanel {...baseProps} onRun={onRun} />)

    await user.selectOptions(screen.getByLabelText('Command'), 'stage2')
    await user.click(screen.getByLabelText('Include fundamentals (--with-fundamentals)'))
    await user.click(screen.getByRole('button', { name: 'Run Command' }))

    await user.selectOptions(screen.getByLabelText('Command'), 'chart')
    await user.clear(screen.getByLabelText('Ticker'))
    await user.type(screen.getByLabelText('Ticker'), 'nvda')
    await user.click(screen.getByRole('button', { name: 'Run Command' }))

    await user.selectOptions(screen.getByLabelText('Command'), 'update_tickers')
    await user.clear(screen.getByLabelText('Min Market Cap'))
    await user.type(screen.getByLabelText('Min Market Cap'), '1000000')
    await user.type(screen.getByLabelText('Max Tickers (optional)'), '25')
    await user.click(screen.getByRole('button', { name: 'Run Command' }))

    await waitFor(() => expect(onRun).toHaveBeenCalledTimes(3))
    expect(onRun.mock.calls[0][0]).toEqual({
      command: 'stage2',
      timeout_seconds: 7200,
      with_fundamentals: true,
    })
    expect(onRun.mock.calls[1][0]).toEqual({
      command: 'chart',
      ticker: 'NVDA',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      timeout_seconds: 7200,
    })
    expect(onRun.mock.calls[2][0]).toEqual({
      command: 'update_tickers',
      timeout_seconds: 7200,
      min_market_cap: 1000000,
      max_tickers: 25,
    })
  })

  it('shows running state, errors, and cancel action', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <RunPanel
        {...baseProps}
        onCancel={onCancel}
        activeJob={{
          job_id: 'job-1',
          command: 'backtest',
          command_line: 'python main.py --mode backtest',
          status: 'running',
          created_at: '2026-01-01T00:00:00Z',
          timeout_seconds: 7200,
        }}
        logs={['line 1', 'line 2']}
        runError="Runner failed"
      />,
    )

    expect(screen.getByText('Status: running')).toBeInTheDocument()
    expect(screen.getByText(/Job ID:/)).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.tagName === 'PRE' && element.textContent === 'line 1\nline 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel Running Job' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
