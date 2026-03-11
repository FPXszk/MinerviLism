"""Strategy-aware exit conditions for trader-inspired backtests."""
from __future__ import annotations

from typing import Dict, Optional, TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from backtest.engine import Position


class ExitCondition:
    def __init__(self, config: Optional[Dict] = None, strategy_name: Optional[str] = None):
        self.config = config or {}
        self.strategy_profile = self.config.get('strategy', {})
        self.strategy_name = (
            strategy_name
            or self.strategy_profile.get('name')
            or self.config.get('experiment', {}).get('strategy_name')
            or 'rule-based-stage2'
        )
        self.exit_profile = self.strategy_profile.get('exit_profile', 'baseline')
        self.stop_loss_pct = float(self.strategy_profile.get('stop_loss_pct', 0.03))
        self.target_pct = float(self.strategy_profile.get('target_pct', 0.25))
        self.max_hold_days = int(self.strategy_profile.get('max_hold_days', 90))
        self.atr_stop_multiplier = self.strategy_profile.get('atr_stop_multiplier')

    def initial_stop_price(self, entry_price: float, current_bar: pd.Series) -> float:
        stop_from_pct = entry_price * (1 - self.stop_loss_pct)
        if self.atr_stop_multiplier is not None and 'atr_14' in current_bar and pd.notna(current_bar['atr_14']):
            stop_from_atr = entry_price - (float(current_bar['atr_14']) * float(self.atr_stop_multiplier))
            return max(stop_from_pct, stop_from_atr)
        return stop_from_pct

    def initial_target_price(self, entry_price: float) -> float:
        return entry_price * (1 + self.target_pct)

    def evaluate(self, pos: 'Position', current_bar: pd.Series, current_date: pd.Timestamp) -> tuple[bool, str]:
        close = current_bar['close']
        holding_days = int((current_date - pos.entry_date).days)

        if close <= pos.stop_price:
            return True, 'stop_loss'

        if self.exit_profile == 'quality':
            if 'sma_200' in current_bar and pd.notna(current_bar['sma_200']) and close < current_bar['sma_200']:
                return True, 'sma200_break'
            if holding_days >= self.max_hold_days:
                return True, 'max_hold_days'
        elif self.exit_profile == 'breakout':
            if 'ema_21' in current_bar and pd.notna(current_bar['ema_21']) and close < current_bar['ema_21']:
                return True, 'breakout_failure'
            if holding_days >= self.max_hold_days:
                return True, 'max_hold_days'
        elif self.exit_profile == 'growth':
            if 'sma_50' in current_bar and pd.notna(current_bar['sma_50']) and close < current_bar['sma_50']:
                return True, 'sma50_break'
            if holding_days >= self.max_hold_days:
                return True, 'max_hold_days'
        elif self.exit_profile == 'trend':
            if 'ema_21' in current_bar and pd.notna(current_bar['ema_21']) and close < current_bar['ema_21']:
                return True, 'ema21_break'
        elif self.exit_profile == 'balanced':
            if 'bb_middle' in current_bar and pd.notna(current_bar['bb_middle']) and close < current_bar['bb_middle']:
                return True, 'mean_reversion_complete'
            if holding_days >= self.max_hold_days:
                return True, 'max_hold_days'
        else:
            if 'sma_50' in current_bar and pd.notna(current_bar['sma_50']) and close < current_bar['sma_50']:
                return True, 'ma50_break'

        if close >= pos.target_price:
            return True, 'target_reached'

        return False, ''
