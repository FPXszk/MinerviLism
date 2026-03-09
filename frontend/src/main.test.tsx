import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createRootMock, renderMock } = vi.hoisted(() => {
  const render = vi.fn()
  return {
    renderMock: render,
    createRootMock: vi.fn(() => ({ render })),
  }
})

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock,
}))

vi.mock('./App', () => ({
  default: () => <div data-testid="app-root">App</div>,
}))

describe('main entrypoint', () => {
  beforeEach(() => {
    vi.resetModules()
    createRootMock.mockClear()
    renderMock.mockClear()
    document.body.innerHTML = ''
  })

  it('throws when the root container is missing', async () => {
    await expect(import('./main')).rejects.toThrow('Root container not found')
  })

  it('creates a React root and renders the app', async () => {
    document.body.innerHTML = '<div id="root"></div>'

    await import('./main')

    expect(createRootMock).toHaveBeenCalledWith(document.getElementById('root'))
    expect(renderMock).toHaveBeenCalledTimes(1)
  })
})
