import { buildApiUrl } from './base'
import type { JobCreateRequest, JobLogsResponse, JobResponse } from './generated/contracts'

export type { JobCreateRequest, JobLogsResponse, JobResponse }

export async function createJob(request: JobCreateRequest): Promise<JobResponse> {
  const response = await fetch(buildApiUrl('/jobs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create job: ${response.status} ${text}`)
  }
  return response.json()
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(buildApiUrl(`/jobs/${jobId}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.status}`)
  }
  return response.json()
}

export async function listJobs(limit = 30): Promise<JobResponse[]> {
  const response = await fetch(buildApiUrl(`/jobs?limit=${limit}`))
  if (!response.ok) {
    throw new Error(`Failed to list jobs: ${response.status}`)
  }
  return response.json()
}

export async function getJobLogs(jobId: string, tail = 200): Promise<JobLogsResponse> {
  const response = await fetch(buildApiUrl(`/jobs/${jobId}/logs?tail=${tail}`))
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.status}`)
  }
  return response.json()
}

export async function cancelJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(buildApiUrl(`/jobs/${jobId}/cancel`), {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.status}`)
  }
  return response.json()
}
