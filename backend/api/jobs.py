from typing import List

from fastapi import APIRouter, HTTPException, Query

from services.job_runner import job_runner
from schemas.jobs import JobCreateRequest, JobLogsResponse, JobResponse


router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("", response_model=JobResponse)
def create_job(request: JobCreateRequest):
    payload = request.model_dump()
    try:
        job = job_runner.create_job(payload)
        return JobResponse(**job)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=List[JobResponse])
def list_jobs(limit: int = Query(default=50, ge=1, le=200)):
    jobs = job_runner.list_jobs(limit=limit)
    return [JobResponse(**item) for item in jobs]


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    try:
        return JobResponse(**job_runner.get_job(job_id))
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")


@router.get("/{job_id}/logs", response_model=JobLogsResponse)
def get_job_logs(job_id: str, tail: int = Query(default=200, ge=10, le=2000)):
    try:
        return JobLogsResponse(**job_runner.get_job_logs(job_id=job_id, tail=tail))
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")


@router.post("/{job_id}/cancel", response_model=JobResponse)
def cancel_job(job_id: str):
    try:
        return JobResponse(**job_runner.cancel_job(job_id))
    except KeyError:
        raise HTTPException(status_code=404, detail="Job not found")
