import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopBottomGrid from './TopBottomGrid'

const chartMock = vi.fn(
  ({ title, data }: { title?: string; data?: Array<{ timestamp: string; price: number; amount: number }> }) => (
    <div data-testid="purchase-chart-card">
      {title}:{data ? data.length : 'missing'}
    </div>
  ),
)

vi.mock('./TopBottomPurchaseChart', () => ({
  default: (props: {
    title?: string
    data?: Array<{ timestamp: string; price: number; amount: number }>
  }) => chartMock(props),
}))

describe('TopBottomGrid', () => {
  beforeEach(() => {
    chartMock.mockClear()
  })

  it('shows an empty message when there are no charts', () => {
    render(<TopBottomGrid top={[]} bottom={[]} />)

    expect(screen.getByRole('status')).toHaveTextContent('No charts to display.')
  })

  it('combines top and bottom items, maps purchases, and limits output to ten cards', () => {
    const top = Array.from({ length: 6 }, (_, index) => ({
      assetId: `TOP-${index}`,
      purchases: [{ timestamp: `2024-01-0${index + 1}`, price: 100 + index, amount: index + 1 }],
    }))
    const bottom = Array.from({ length: 5 }, (_, index) => ({
      assetId: index === 0 ? '' : `BOTTOM-${index}`,
      purchases:
        index === 0
          ? (undefined as unknown as Array<{ timestamp: string; price: number; amount: number }>)
          : [{ timestamp: `2024-02-0${index + 1}`, price: 80 + index, amount: index + 2 }],
    })) as Array<{ assetId: string; purchases: Array<{ timestamp: string; price: number; amount: number }> }>

    render(<TopBottomGrid top={top} bottom={bottom} />)

    expect(screen.getAllByTestId('purchase-chart-card')).toHaveLength(10)
    expect(chartMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        title: 'TOP-0',
        data: [{ timestamp: '2024-01-01', price: 100, amount: 1 }],
      }),
    )
    expect(chartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'asset-6',
        data: undefined,
      }),
    )
  })
})
