import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./base', () => ({
  buildApiUrl: (path: string) => `http://example.test/api${path}`,
}))

import { cancelJob, createJob, getJob, getJobLogs, listJobs } from './jobs'

const fetchMock = vi.fn()

describe('jobs api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('creates a job', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ job_id: 'job-1', status: 'queued' }) })

    const payload = await createJob({ command: 'backtest', start_date: '2026-01-01', end_date: '2026-01-31' })

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/jobs', expect.objectContaining({ method: 'POST' }))
    expect(payload.job_id).toBe('job-1')
  })

  it('includes backend error text when job creation fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' })

    await expect(createJob({ command: 'full' })).rejects.toThrow('Failed to create job: 500 boom')
  })

  it('fetches a single job', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ job_id: 'job-2', status: 'running' }) })

    const payload = await getJob('job-2')

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/jobs/job-2')
    expect(payload.status).toBe('running')
  })

  it('lists jobs with a limit', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [{ job_id: 'job-3', status: 'succeeded' }] })

    const payload = await listJobs(10)

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/jobs?limit=10')
    expect(payload).toHaveLength(1)
  })

  it('fetches job logs', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ job_id: 'job-4', status: 'running', lines: ['a'] }) })

    const payload = await getJobLogs('job-4', 50)

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/jobs/job-4/logs?tail=50')
    expect(payload.lines).toEqual(['a'])
  })

  it('cancels a running job', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ job_id: 'job-5', status: 'cancelled' }) })

    const payload = await cancelJob('job-5')

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/jobs/job-5/cancel', { method: 'POST' })
    expect(payload.status).toBe('cancelled')
  })

  it('throws when fetching a job fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })

    await expect(getJob('missing')).rejects.toThrow('Failed to fetch job: 404')
  })

  it('throws when listing jobs fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 })

    await expect(listJobs()).rejects.toThrow('Failed to list jobs: 503')
  })

  it('throws when fetching logs fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 })

    await expect(getJobLogs('job-4')).rejects.toThrow('Failed to fetch logs: 500')
  })

  it('throws when cancelling a job fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 409 })

    await expect(cancelJob('job-5')).rejects.toThrow('Failed to cancel job: 409')
  })
})
