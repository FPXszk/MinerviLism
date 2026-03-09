from typing import Optional

from pydantic import BaseModel, Field


class ChartData(BaseModel):
    ticker: str
    dates: list[str] = Field(default_factory=list)
    open: list[float] = Field(default_factory=list)
    high: list[float] = Field(default_factory=list)
    low: list[float] = Field(default_factory=list)
    close: list[float] = Field(default_factory=list)
    volume: list[int] = Field(default_factory=list)
    sma20: list[Optional[float]] = Field(default_factory=list)
    sma50: list[Optional[float]] = Field(default_factory=list)
    sma200: list[Optional[float]] = Field(default_factory=list)


class TradeMarkerPoint(BaseModel):
    date: str
    price: float
    pnl: Optional[float] = None
    holding_days: Optional[int] = None
    entry_date: Optional[str] = None
    entry_price: Optional[float] = None


class TradeMarkers(BaseModel):
    entries: list[TradeMarkerPoint] = Field(default_factory=list)
    exits: list[TradeMarkerPoint] = Field(default_factory=list)


class OhlcPoint(BaseModel):
    time: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None


class OhlcResponse(BaseModel):
    data: list[OhlcPoint] = Field(default_factory=list)
