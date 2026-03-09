from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd
from loguru import logger


OUTPUT_DIR_ENV_VAR = "INVEST_OUTPUT_DIR"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parents[2] / "python" / "output" / "backtest"


def get_backtest_output_dir() -> Path:
    override = os.getenv(OUTPUT_DIR_ENV_VAR)
    if override:
        return Path(override).expanduser().resolve()
    return DEFAULT_OUTPUT_DIR


@dataclass(frozen=True)
class BacktestRun:
    dir_name: str
    result_dir: Path
    start_date: str
    end_date: str
    timestamp: str
    period: str
    trade_count: int
    trades_path: Optional[Path]
    trade_log_path: Optional[Path]
    ticker_stats_path: Optional[Path]
    charts_dir: Optional[Path]


class ResultStore:
    def __init__(self, output_dir: Optional[str | Path] = None) -> None:
        self.output_dir = Path(output_dir).resolve() if output_dir else get_backtest_output_dir()
        self._snapshot: Optional[tuple[tuple[str, int], ...]] = None
        self._runs: list[BacktestRun] = []

    def list_runs(self) -> list[BacktestRun]:
        self._ensure_cache()
        return list(self._runs)

    def list_backtests(self) -> list[dict]:
        return [
            {
                "timestamp": run.timestamp,
                "start_date": run.start_date,
                "end_date": run.end_date,
                "period": run.period,
                "trade_count": run.trade_count,
                "dir_name": run.dir_name,
            }
            for run in self.list_runs()
        ]

    def get_latest_run(self) -> Optional[BacktestRun]:
        runs = self.list_runs()
        return runs[0] if runs else None

    def get_run_by_dir_name(self, dir_name: str) -> Optional[BacktestRun]:
        for run in self.list_runs():
            if run.dir_name == dir_name:
                return run
        return None

    def get_run_by_timestamp(self, timestamp: str) -> Optional[BacktestRun]:
        for run in self.list_runs():
            if run.timestamp == timestamp or timestamp in run.dir_name:
                return run
        return None

    def get_run_by_range(self, range_value: Optional[str]) -> Optional[BacktestRun]:
        runs = self.list_runs()
        if not runs:
            return None
        if not range_value:
            return runs[0]

        normalized = range_value.strip()
        if not normalized or normalized.upper() == "ALL":
            return runs[0]

        for run in runs:
            if normalized in run.dir_name:
                return run

        if len(normalized) == 4 and normalized.isdigit():
            for run in runs:
                if run.start_date.startswith(normalized):
                    return run

        return runs[0]

    def _ensure_cache(self) -> None:
        snapshot = self._build_snapshot()
        if snapshot == self._snapshot:
            return

        self._runs = self._scan_runs()
        self._snapshot = snapshot

    def _build_snapshot(self) -> tuple[tuple[str, int], ...]:
        if not self.output_dir.exists():
            return tuple()

        entries: list[tuple[str, int]] = []
        for child in self.output_dir.iterdir():
            if child.is_dir() and child.name.startswith("backtest_"):
                entries.append((child.name, child.stat().st_mtime_ns))
        entries.sort(reverse=True)
        return tuple(entries)

    def _scan_runs(self) -> list[BacktestRun]:
        if not self.output_dir.exists():
            logger.warning(f"Output directory not found: {self.output_dir}")
            return []

        runs: list[BacktestRun] = []
        for child in sorted(self.output_dir.iterdir(), key=lambda item: item.name, reverse=True):
            if not child.is_dir() or not child.name.startswith("backtest_"):
                continue

            parsed = self._parse_dir_name(child.name)
            if parsed is None:
                continue

            start_date, end_date, timestamp = parsed
            ticker_stats_path = child / "ticker_stats.csv"
            trades_path = child / "trades.csv"
            trade_log_path = child / "trade_log.csv"
            charts_dir = child / "charts"

            runs.append(
                BacktestRun(
                    dir_name=child.name,
                    result_dir=child,
                    start_date=start_date,
                    end_date=end_date,
                    timestamp=timestamp,
                    period=f"{start_date} to {end_date}",
                    trade_count=self._read_trade_count(ticker_stats_path),
                    trades_path=trades_path if trades_path.exists() else None,
                    trade_log_path=trade_log_path if trade_log_path.exists() else None,
                    ticker_stats_path=ticker_stats_path if ticker_stats_path.exists() else None,
                    charts_dir=charts_dir if charts_dir.exists() else None,
                )
            )
        return runs

    @staticmethod
    def _parse_dir_name(dir_name: str) -> Optional[tuple[str, str, str]]:
        if not dir_name.startswith("backtest_"):
            return None
        try:
            payload = dir_name.replace("backtest_", "", 1)
            start_date, remaining = payload.split("_to_", 1)
            end_date, timestamp = remaining.split("_", 1)
        except ValueError:
            logger.warning(f"Failed to parse backtest directory name: {dir_name}")
            return None
        return start_date, end_date, timestamp

    @staticmethod
    def _read_trade_count(ticker_stats_path: Path) -> int:
        if not ticker_stats_path.exists():
            return 0
        try:
            df = pd.read_csv(ticker_stats_path)
        except (OSError, ValueError, pd.errors.EmptyDataError) as exc:
            logger.warning(f"Failed to read ticker stats from {ticker_stats_path}: {exc}")
            return 0
        return len(df.index)
