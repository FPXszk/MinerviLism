"""
State Conditions: Historical event conditions for backtesting.

These helpers describe recent state rather than point-in-time checks so that
strategy-specific entry rules can stay readable and testable.
"""
from __future__ import annotations

from typing import Optional

import pandas as pd
from loguru import logger


def has_recent_rs_new_high(
    rs_line: pd.Series,
    window: int = 20,
    threshold: float = 0.95,
) -> bool:
    if rs_line is None or len(rs_line) < 252:
        logger.debug("RS line has insufficient data for new high check")
        return False

    rs_clean = rs_line.dropna()
    if len(rs_clean) < 252:
        logger.debug(f"RS line has only {len(rs_clean)} valid data points")
        return False

    rs_52w_high = rs_clean.tail(252).max()
    target_level = rs_52w_high * threshold
    recent_data = rs_clean.tail(window)
    return bool((recent_data >= target_level).any())


def get_rs_new_high_date(
    rs_line: pd.Series,
    threshold: float = 0.95,
) -> Optional[pd.Timestamp]:
    if rs_line is None or len(rs_line) < 252:
        return None

    rs_clean = rs_line.dropna()
    if len(rs_clean) < 252:
        return None

    rs_52w_high = rs_clean.tail(252).max()
    target_level = rs_52w_high * threshold
    high_dates = rs_clean[rs_clean >= target_level].index
    if len(high_dates) == 0:
        return None
    return high_dates[-1]


def days_since_rs_new_high(
    rs_line: pd.Series,
    threshold: float = 0.95,
) -> Optional[int]:
    high_date = get_rs_new_high_date(rs_line, threshold)
    if high_date is None:
        return None

    rs_clean = rs_line.dropna()
    current_date = rs_clean.index[-1]
    days = len(rs_clean[(rs_clean.index > high_date) & (rs_clean.index <= current_date)])
    return days


def is_near_52w_high(data: pd.DataFrame, threshold: float = 0.85) -> bool:
    if data is None or data.empty or len(data) < 20:
        return False
    high_52w = data['high'].tail(min(len(data), 252)).max()
    latest_close = data['close'].iloc[-1]
    if pd.isna(high_52w) or pd.isna(latest_close) or high_52w <= 0:
        return False
    return bool(latest_close >= high_52w * threshold)


def has_recent_price_breakout(data: pd.DataFrame, lookback: int = 20, breakout_buffer: float = 0.0) -> bool:
    if data is None or data.empty or len(data) <= lookback:
        return False
    reference = data['high'].iloc[-(lookback + 1):-1].max()
    latest_close = data['close'].iloc[-1]
    if pd.isna(reference) or pd.isna(latest_close):
        return False
    return bool(latest_close >= reference * (1 + breakout_buffer))


def is_sma_rising(data: pd.DataFrame, column: str = 'sma_200', window: int = 20) -> bool:
    if data is None or data.empty or column not in data or len(data) <= window:
        return False
    latest = data[column].iloc[-1]
    prior = data[column].iloc[-(window + 1)]
    if pd.isna(latest) or pd.isna(prior):
        return False
    return bool(latest > prior)


def is_low_volatility(data: pd.DataFrame, max_value: float = 0.03, column: str = 'volatility_20') -> bool:
    if data is None or data.empty or column not in data:
        return False
    latest = data[column].iloc[-1]
    if pd.isna(latest):
        return False
    return bool(latest <= max_value)


def is_near_ema(data: pd.DataFrame, tolerance: float = 0.04, column: str = 'ema_21') -> bool:
    if data is None or data.empty or column not in data:
        return False
    latest_close = data['close'].iloc[-1]
    ema = data[column].iloc[-1]
    if pd.isna(latest_close) or pd.isna(ema) or ema == 0:
        return False
    return bool(abs(latest_close - ema) / ema <= tolerance)
