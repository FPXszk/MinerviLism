import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BacktestVisualizationPanel } from './BacktestVisualizationPanel'

vi.mock('./useLazyPlotComponent', () => ({
  useLazyPlotComponent: () => ({
    PlotComponent: () => <div data-testid="plot-component" />,
    plotError: null,
  }),
}))

describe('BacktestVisualizationPanel', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
  })

  it('shows signal guidance and mobile list fallback', () => {
    render(
      <BacktestVisualizationPanel
        visualization={{
          equity_curve: [{ time: '2024-01-01', value: 100000 }],
          drawdown: [{ time: '2024-01-01', value: -0.02 }],
          signal_events: [
            { time: '2024-01-01', price: 101, action: 'ENTRY', ticker: 'AAA', signal: 1 },
            { time: '2024-01-02', price: 98, action: 'EXIT', ticker: 'AAA', signal: -1 },
          ],
        }}
      />,
    )

    expect(screen.getByText(/shows entry and exit price points/i)).toBeInTheDocument()
    expect(screen.getByText(/latest signal events/i)).toBeInTheDocument()
    expect(screen.getAllByText('AAA').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ENTRY|EXIT/).length).toBeGreaterThan(0)
  })
})
