import pandas as pd
import numpy as np

from backtest.entry_condition import EntryCondition


def _make_strategy_frame(length: int = 260, breakout: bool = False) -> pd.DataFrame:
    dates = pd.date_range('2024-01-01', periods=length)
    close = np.linspace(100, 135, length)
    if breakout:
        close[-1] = close[-21:-1].max() * 1.03
    volume = np.full(length, 900_000.0)
    data = pd.DataFrame({
        'close': close,
        'high': close * 1.01,
        'low': close * 0.99,
        'volume': volume,
        'volume_ma_50': volume,
        'sma_50': pd.Series(close).rolling(50, min_periods=1).mean(),
        'sma_150': pd.Series(close).rolling(150, min_periods=1).mean(),
        'sma_200': pd.Series(close).rolling(200, min_periods=1).mean(),
        'ema_21': pd.Series(close).ewm(span=21, adjust=False).mean(),
        'volatility_20': np.full(length, 0.015),
        'rs_line': np.linspace(1.0, 1.4, length),
        'bb_middle': pd.Series(close).rolling(20, min_periods=1).mean(),
        'bb_upper': pd.Series(close).rolling(20, min_periods=1).mean() * 1.03,
        'bb_lower': pd.Series(close).rolling(20, min_periods=1).mean() * 0.97,
        'atr_14': np.full(length, 2.0),
    }, index=dates)
    return data


def test_buffett_quality_uses_quality_compounder_conditions():
    entry = EntryCondition(
        config={
            'entry': {'min_volume': 300000},
            'strategy': {
                'name': 'buffett-quality',
                'entry_profile': 'quality',
                'volatility_max': 0.03,
            },
        },
        strategy_name='buffett-quality',
    )

    result = entry.evaluate(_make_strategy_frame())

    assert result['passed'] is True
    assert 'price_above_sma200' in result['conditions']
    assert 'stable_volatility' in result['conditions']


def test_soros_breakout_requires_recent_breakout_signal():
    entry = EntryCondition(
        config={
            'entry': {'min_volume': 300000},
            'strategy': {
                'name': 'soros-breakout',
                'entry_profile': 'breakout',
                'breakout_buffer': 0.01,
                'volume_spike_ratio': 1.1,
            },
        },
        strategy_name='soros-breakout',
    )

    result = entry.evaluate(_make_strategy_frame(breakout=True))

    assert result['passed'] is True
    assert result['conditions']['breakout_above_recent_high'] is True
