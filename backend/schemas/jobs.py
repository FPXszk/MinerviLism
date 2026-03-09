from typing import Literal, Optional

from pydantic import BaseModel, Field


JobCommand = Literal["backtest", "stage2", "full", "chart", "update_tickers"]


class JobCreateRequest(BaseModel):
    command: JobCommand
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tickers: Optional[str] = None
    no_charts: bool = False
    ticker: Optional[str] = None
    with_fundamentals: bool = False
    min_market_cap: Optional[int] = None
    max_tickers: Optional[int] = None
    timeout_seconds: int = Field(default=7200, ge=30, le=86400)


class JobResponse(BaseModel):
    job_id: str
    command: str
    command_line: str
    status: Literal["queued", "running", "succeeded", "failed", "cancelled", "timeout"]
    created_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    return_code: Optional[int] = None
    error: Optional[str] = None
    timeout_seconds: int


class JobLogsResponse(BaseModel):
    job_id: str
    status: str
    lines: list[str]
