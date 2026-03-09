import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartGallery } from './ChartGallery'

describe('ChartGallery', () => {
  it('renders loading and empty states', () => {
    const { rerender } = render(<ChartGallery charts={{}} loading />)
    expect(screen.getByText('Loading charts...')).toBeInTheDocument()

    rerender(<ChartGallery charts={{}} />)
    expect(screen.getByText('No charts available')).toBeInTheDocument()
  })

  it('groups charts and opens a modal when clicked', async () => {
    const user = userEvent.setup()

    render(
      <ChartGallery
        charts={{
          top_AAA: 'data:image/png;base64,aaa',
          bottom_CCC: 'data:image/png;base64,ccc',
          equity_curve: 'data:image/png;base64,eq',
        }}
      />,
    )

    expect(screen.getByText('Top Winners')).toBeInTheDocument()
    expect(screen.getByText('Bottom Losers')).toBeInTheDocument()
    expect(screen.getByText('Other Charts')).toBeInTheDocument()

    await user.click(screen.getByAltText('top_AAA'))
    expect(screen.getAllByText('top AAA')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: '×' }))
    expect(screen.getAllByText('top AAA')).toHaveLength(1)
  })
})
