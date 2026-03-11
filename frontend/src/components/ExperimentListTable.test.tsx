import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location-display">{`${location.pathname}${location.search}`}</div>
}

function renderTable(initialEntry = '/dashboard/run') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocationDisplay />
      <ExperimentListTable
        backtests={backtests}
        selectedTimestamp="run-1"
        onSelect={vi.fn()}
      />
    </MemoryRouter>,
  )
}

async function typeAndFlush(user: ReturnType<typeof userEvent.setup>, target: Element, value: string) {
  await act(async () => {
    await user.type(target, value)
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function selectAndFlush(user: ReturnType<typeof userEvent.setup>, target: Element, value: string) {
  await act(async () => {
    await user.selectOptions(target, value)
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('ExperimentListTable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('filters and sorts runs from the table controls', async () => {
    const user = userEvent.setup()
    renderTable()

    expect(screen.getByDisplayValue('Latest first')).toBeInTheDocument()

    await typeAndFlush(user, screen.getByLabelText('Search runs'), 'momentum')
    expect(screen.getByRole('button', { name: /2023-01-01 to 2023-12-31/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2024-01-01 to 2024-12-31/i })).not.toBeInTheDocument()

    await act(async () => {
      await user.clear(screen.getByLabelText('Search runs'))
      await Promise.resolve()
      await Promise.resolve()
    })
    await selectAndFlush(user, screen.getByLabelText('Visibility'), 'pinned')
    expect(screen.getByRole('button', { name: /2024-01-01 to 2024-12-31/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2023-01-01 to 2023-12-31/i })).not.toBeInTheDocument()

    await selectAndFlush(user, screen.getByLabelText('Visibility'), 'all')
    await selectAndFlush(user, screen.getByLabelText('Sort by'), 'annualReturn')
    const periodButtons = screen.getAllByRole('button', { name: /to/i })
    expect(periodButtons[0]).toHaveTextContent('2023-01-01 to 2023-12-31')
  })

  it('persists filters to the URL and localStorage', async () => {
    const user = userEvent.setup()

    const { unmount } = renderTable('/dashboard/run?lang=en')

    await typeAndFlush(user, screen.getByLabelText('Search runs'), 'momentum')
    await selectAndFlush(user, screen.getByLabelText('Visibility'), 'pinned')
    await selectAndFlush(user, screen.getByLabelText('Sort by'), 'annualReturn')

    expect(screen.getByTestId('location-display')).toHaveTextContent('lang=en')
    expect(screen.getByTestId('location-display')).toHaveTextContent('runSearch=momentum')
    expect(screen.getByTestId('location-display')).toHaveTextContent('runPin=pinned')
    expect(screen.getByTestId('location-display')).toHaveTextContent('runSort=annualReturn')

    unmount()
    renderTable('/dashboard/run')

    expect(screen.getByLabelText('Search runs')).toHaveValue('momentum')
    expect(screen.getByLabelText('Visibility')).toHaveValue('pinned')
    expect(screen.getByLabelText('Sort by')).toHaveValue('annualReturn')
  })
})
