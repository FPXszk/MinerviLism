import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExperimentListTable } from './ExperimentListTable'

const backtests = [
  {
    timestamp: 'run-1',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    period: '2024-01-01 to 2024-12-31',
    trade_count: 12,
    dir_name: 'run-1',
    is_pinned: true,
    available_runs: 2,
    run_label: 'baseline-alpha',
    experiment_name: 'alpha',
    strategy_name: 'buffett-quality',
    rule_profile: 'quality',
    headline_metrics: {
      annual_return_pct: 0.11,
      information_ratio: 0.8,
      max_drawdown_pct: -0.09,
    },
  },
  {
    timestamp: 'run-2',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    period: '2023-01-01 to 2023-12-31',
    trade_count: 6,
    dir_name: 'run-2',
    is_pinned: false,
    available_runs: 1,
    run_label: 'momentum-beta',
    experiment_name: 'beta',
    strategy_name: 'soros-breakout',
    rule_profile: 'breakout',
    headline_metrics: {
      annual_return_pct: 0.24,
      information_ratio: 1.6,
      max_drawdown_pct: -0.14,
    },
  },
]

describe('ExperimentListTable', () => {
  it('filters and sorts runs from the table controls', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <ExperimentListTable
        backtests={backtests}
        selectedTimestamp="run-1"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByDisplayValue('Latest first')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search runs'), 'momentum')
    expect(screen.getByRole('button', { name: /2023-01-01 to 2023-12-31/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2024-01-01 to 2024-12-31/i })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Search runs'))
    await user.selectOptions(screen.getByLabelText('Visibility'), 'pinned')
    expect(screen.getByRole('button', { name: /2024-01-01 to 2024-12-31/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2023-01-01 to 2023-12-31/i })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Visibility'), 'all')
    await user.selectOptions(screen.getByLabelText('Sort by'), 'annualReturn')
    const periodButtons = screen.getAllByRole('button', { name: /to/i })
    expect(periodButtons[0]).toHaveTextContent('2023-01-01 to 2023-12-31')
  })
})
