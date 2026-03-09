import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notification } from './Notification'

describe('Notification', () => {
  it('renders message and dismiss button when provided', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()

    render(<Notification type="success" message="Saved" onDismiss={onDismiss} />)

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders without dismiss button by default', () => {
    render(<Notification type="error" message="Failed" />)

    expect(screen.getByText('✕')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'dismiss' })).not.toBeInTheDocument()
  })
})
