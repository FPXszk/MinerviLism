"""
EntryCondition: Lightweight daily entry conditions for backtest.

Baseline behavior stays compatible with the existing daily entry checks while
allowing trader-inspired profiles to opt into a slightly different set of
conditions.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import pandas as pd
from loguru import logger

from backtest.state_conditions import (
    has_recent_price_breakout,
    has_recent_rs_new_high,
    is_low_volatility,
    is_near_52w_high,
    is_near_ema,
    is_sma_rising,
)


class EntryCondition:
    """Lightweight entry conditions for daily backtest evaluation."""

    DEFAULT_VOLUME_THRESHOLD = 500_000

    def __init__(
        self,
        config: Optional[Dict] = None,
        mode: str = 'strict',
        strategy_name: Optional[str] = None,
    ):
        if mode not in ['strict', 'relaxed']:
            raise ValueError(f"Invalid mode: {mode}. Must be 'strict' or 'relaxed'")

        self.config = config or {}
        self.mode = mode
        self.strategy_profile = self.config.get('strategy', {})
        self.strategy_name = (
            strategy_name
            or self.strategy_profile.get('name')
            or self.config.get('experiment', {}).get('strategy_name')
            or 'rule-based-stage2'
        )
        self.entry_profile = self.strategy_profile.get('entry_profile', 'baseline')

        entry_config = self.config.get('entry', {})
        stage_config = self.config.get('stage', {})
        mode_config = stage_config.get(mode, {})

        self.volume_threshold = float(
            self.strategy_profile.get(
                'min_volume',
                mode_config.get('min_volume', entry_config.get('min_volume', self.DEFAULT_VOLUME_THRESHOLD)),
            )
        )
        self.breakout_buffer = float(self.strategy_profile.get('breakout_buffer', entry_config.get('breakout_buffer', 0.0)))
        self.breakout_lookback = int(self.strategy_profile.get('breakout_lookback', 20))
        self.volume_spike_ratio = float(self.strategy_profile.get('volume_spike_ratio', 1.1))
        self.near_52w_high_ratio = float(self.strategy_profile.get('near_52w_high_ratio', 0.85))
        self.volatility_max = float(self.strategy_profile.get('volatility_max', 0.03))
        self.ema_tolerance = float(self.strategy_profile.get('ema_tolerance', 0.04))
        self.rs_new_high_window = int(self.strategy_profile.get('rs_new_high_window', 20))
        self.rs_new_high_threshold = float(self.strategy_profile.get('rs_new_high_threshold', 0.95))

        logger.debug(
            f"EntryCondition initialized: mode={self.mode}, strategy={self.strategy_name}, "
            f"profile={self.entry_profile}, volume_threshold={self.volume_threshold}"
        )

    def get_condition_names(self) -> List[str]:
        if self.entry_profile == 'quality':
            return [
                'price_above_sma200',
                'sma50_above_sma200',
                'sma200_rising',
                'stable_volatility',
                'sufficient_volume',
            ]
        if self.entry_profile == 'breakout':
            return [
                'price_above_sma50',
                'breakout_above_recent_high',
                'volume_spike',
                'sufficient_volume',
            ]
        if self.entry_profile == 'growth':
            return [
                'price_above_sma50',
                'sma50_above_sma150',
                'near_52w_high',
                'sufficient_volume',
            ]
        if self.entry_profile == 'trend':
            return [
                'price_above_sma50',
                'sma50_above_sma150',
                'sma50_above_sma200',
                'near_52w_high',
                'recent_rs_leadership',
                'volume_spike',
            ]
        if self.entry_profile == 'balanced':
            return [
                'price_above_sma200',
                'near_ema21',
                'stable_volatility',
                'sufficient_volume',
            ]

        conditions = [
            'price_above_sma50',
            'sma50_above_sma150',
            'sufficient_volume',
        ]
        if self.mode == 'strict':
            conditions.append('sma50_above_sma200')
        return conditions

    def evaluate(self, data: pd.DataFrame) -> Dict:
        if len(data) < 50:
            return {
                'passed': False,
                'conditions': {name: False for name in self.get_condition_names()},
                'mode': self.mode,
                'strategy_name': self.strategy_name,
                'reason': 'insufficient_data',
            }

        normalized = self._ensure_indicator_columns(data)
        latest = normalized.iloc[-1]
        conditions = self._evaluate_profile(normalized, latest)
        return {
            'passed': all(conditions.values()),
            'conditions': conditions,
            'mode': self.mode,
            'strategy_name': self.strategy_name,
        }

    def _evaluate_profile(self, data: pd.DataFrame, latest: pd.Series) -> Dict[str, bool]:
        if self.entry_profile == 'quality':
            return {
                'price_above_sma200': self._check_price_above_sma200(latest),
                'sma50_above_sma200': self._check_sma50_above_sma200(latest),
                'sma200_rising': is_sma_rising(data, 'sma_200', 20),
                'stable_volatility': is_low_volatility(data, self.volatility_max),
                'sufficient_volume': self._check_sufficient_volume(latest),
            }
        if self.entry_profile == 'breakout':
            return {
                'price_above_sma50': self._check_price_above_sma50(latest),
                'breakout_above_recent_high': has_recent_price_breakout(data, self.breakout_lookback, self.breakout_buffer),
                'volume_spike': self._check_volume_spike(latest),
                'sufficient_volume': self._check_sufficient_volume(latest),
            }
        if self.entry_profile == 'growth':
            return {
                'price_above_sma50': self._check_price_above_sma50(latest),
                'sma50_above_sma150': self._check_sma50_above_sma150(latest),
                'near_52w_high': is_near_52w_high(data, self.near_52w_high_ratio),
                'sufficient_volume': self._check_sufficient_volume(latest),
            }
        if self.entry_profile == 'trend':
            return {
                'price_above_sma50': self._check_price_above_sma50(latest),
                'sma50_above_sma150': self._check_sma50_above_sma150(latest),
                'sma50_above_sma200': self._check_sma50_above_sma200(latest),
                'near_52w_high': is_near_52w_high(data, self.near_52w_high_ratio),
                'recent_rs_leadership': has_recent_rs_new_high(
                    data['rs_line'] if 'rs_line' in data else pd.Series(dtype=float),
                    window=self.rs_new_high_window,
                    threshold=self.rs_new_high_threshold,
                ),
                'volume_spike': self._check_volume_spike(latest),
            }
        if self.entry_profile == 'balanced':
            return {
                'price_above_sma200': self._check_price_above_sma200(latest),
                'near_ema21': is_near_ema(data, self.ema_tolerance),
                'stable_volatility': is_low_volatility(data, self.volatility_max),
                'sufficient_volume': self._check_sufficient_volume(latest),
            }

        conditions = {
            'price_above_sma50': self._check_price_above_sma50(latest),
            'sma50_above_sma150': self._check_sma50_above_sma150(latest),
            'sufficient_volume': self._check_sufficient_volume(latest),
        }
        if self.mode == 'strict':
            conditions['sma50_above_sma200'] = self._check_sma50_above_sma200(latest)
        return conditions

    def _ensure_indicator_columns(self, data: pd.DataFrame) -> pd.DataFrame:
        normalized = data.copy()

        def ensure_column(column: str, series: pd.Series) -> None:
            if column not in normalized or normalized[column].isna().all():
                normalized[column] = series.values
            else:
                normalized[column] = normalized[column].fillna(pd.Series(series.values, index=normalized.index))

        close = normalized['close']
        ensure_column('sma_50', close.rolling(50, min_periods=1).mean())
        ensure_column('sma_150', close.rolling(150, min_periods=1).mean())
        ensure_column('sma_200', close.rolling(200, min_periods=1).mean())
        ensure_column('ema_21', close.ewm(span=21, adjust=False).mean())
        ensure_column('volatility_20', close.pct_change().rolling(20, min_periods=5).std().fillna(0.0))
        ensure_column('bb_middle', close.rolling(20, min_periods=1).mean())
        if 'volume' in normalized:
            ensure_column('volume_ma_50', normalized['volume'].rolling(50, min_periods=1).mean())
        return normalized

    @staticmethod
    def _has_value(latest: pd.Series, column: str) -> bool:
        return column in latest and not pd.isna(latest[column])

    def _check_price_above_sma50(self, latest: pd.Series) -> bool:
        return bool(self._has_value(latest, 'sma_50') and latest['close'] > latest['sma_50'])

    def _check_price_above_sma200(self, latest: pd.Series) -> bool:
        return bool(self._has_value(latest, 'sma_200') and latest['close'] > latest['sma_200'])

    def _check_sma50_above_sma150(self, latest: pd.Series) -> bool:
        return bool(self._has_value(latest, 'sma_50') and self._has_value(latest, 'sma_150') and latest['sma_50'] > latest['sma_150'])

    def _check_sma50_above_sma200(self, latest: pd.Series) -> bool:
        return bool(self._has_value(latest, 'sma_50') and self._has_value(latest, 'sma_200') and latest['sma_50'] > latest['sma_200'])

    def _check_sufficient_volume(self, latest: pd.Series) -> bool:
        if 'volume_ma_50' not in latest:
            return bool('volume' in latest and latest['volume'] >= self.volume_threshold)
        if pd.isna(latest['volume_ma_50']):
            return False
        return bool(latest['volume_ma_50'] >= self.volume_threshold)

    def _check_volume_spike(self, latest: pd.Series) -> bool:
        if 'volume' not in latest or 'volume_ma_50' not in latest:
            return False
        if pd.isna(latest['volume_ma_50']) or latest['volume_ma_50'] == 0:
            return False
        if latest['volume'] >= latest['volume_ma_50'] * self.volume_spike_ratio:
            return True
        return bool(latest['volume'] >= self.volume_threshold)
