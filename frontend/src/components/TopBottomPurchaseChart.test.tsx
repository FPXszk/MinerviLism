import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopBottomPurchaseChart from './TopBottomPurchaseChart'

const { useLazyPlotComponentMock } = vi.hoisted(() => ({
  useLazyPlotComponentMock: vi.fn(),
}))

const plotCalls: unknown[] = []

vi.mock('./useLazyPlotComponent', () => ({
  useLazyPlotComponent: useLazyPlotComponentMock,
}))

function PlotMock(props: unknown) {
  plotCalls.push(props)
  return <div data-testid="plotly-chart" />
}

describe('TopBottomPurchaseChart', () => {
  beforeEach(() => {
    plotCalls.length = 0
    useLazyPlotComponentMock.mockReturnValue({
      PlotComponent: PlotMock,
      plotError: null,
    })
  })

  it('shows a loading state before the Plotly chunk resolves', () => {
    useLazyPlotComponentMock.mockReturnValue({
      PlotComponent: null,
      plotError: null,
    })
    render(<TopBottomPurchaseChart title="AAA purchases" data={[]} />)

    expect(screen.getByTestId('plotly-loading')).toBeInTheDocument()
  })

  it('renders a scatter chart with clamped marker sizes', () => {
    render(
      <TopBottomPurchaseChart
        title="AAA purchases"
        data={[
          { timestamp: '2024-01-01', price: 100, amount: 1 },
          { timestamp: '2024-01-02', price: 101, amount: 10_000 },
          { timestamp: '2024-01-03', price: 102, amount: 0 },
        ]}
      />,
    )

    expect(screen.getByTestId('plotly-chart')).toBeInTheDocument()

    const firstCall = plotCalls[0] as {
      data: Array<{ type: string; marker: { size: number[] } }>
    }

    expect(screen.getByText('AAA purchases')).toBeInTheDocument()
    expect(firstCall.data[0].type).toBe('scatter')
    expect(firstCall.data[0].marker.size).toEqual([6, 28, 8])
  })

  it('switches to scattergl for large datasets', () => {
    const data = Array.from({ length: 201 }, (_, index) => ({
      timestamp: `2024-01-${String((index % 30) + 1).padStart(2, '0')}`,
      price: 100 + index,
      amount: 50 + index,
    }))

    render(<TopBottomPurchaseChart title="Large chart" data={data} />)
    expect(screen.getByTestId('plotly-chart')).toBeInTheDocument()

    const firstCall = plotCalls[0] as {
      data: Array<{ type: string }>
    }

    expect(firstCall.data[0].type).toBe('scattergl')
  })
})
