import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChartGallery } from './ChartGallery'

const charts = {
  top_AAPL: 'data:image/png;base64,a',
  top_MSFT: 'data:image/png;base64,b',
  bottom_TSLA: 'data:image/png;base64,c',
}

describe('ChartGallery', () => {
  it('opens modal when chart is clicked', () => {
    render(<ChartGallery charts={charts} />)

    fireEvent.click(screen.getByRole('button', { name: /top aapl/i }))

    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument()
  })

  it('navigates to next chart with button', () => {
    render(<ChartGallery charts={charts} />)

    fireEvent.click(screen.getByRole('button', { name: /top aapl/i }))
    fireEvent.click(screen.getByLabelText('Next chart'))

    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument()
  })

  it('navigates charts with keyboard arrows', () => {
    render(<ChartGallery charts={charts} />)

    fireEvent.click(screen.getByRole('button', { name: /top aapl/i }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument()
  })
})
