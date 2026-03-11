import pandas as pd

from backtest.exit_condition import ExitCondition
from backtest.engine import Position


def _position(entry_price: float = 100.0) -> Position:
    return Position(
        ticker='AAA',
        entry_date=pd.Timestamp('2024-01-01'),
        entry_price=entry_price,
        shares=10,
        stop_price=94.0,
        target_price=118.0,
        pivot=entry_price,
    )


def test_exit_condition_uses_hold_limit_for_dalio_balance():
    condition = ExitCondition(
        config={
            'strategy': {
                'name': 'dalio-balance',
                'exit_profile': 'balanced',
                'max_hold_days': 30,
            },
        },
        strategy_name='dalio-balance',
    )

    signal, reason = condition.evaluate(
        _position(),
        pd.Series({'close': 105.0, 'sma_50': 101.0, 'bb_middle': 100.0}),
        pd.Timestamp('2024-02-15'),
    )

    assert signal is True
    assert reason == 'max_hold_days'


def test_exit_condition_supports_breakout_failure_for_soros():
    condition = ExitCondition(
        config={
            'strategy': {
                'name': 'soros-breakout',
                'exit_profile': 'breakout',
            },
        },
        strategy_name='soros-breakout',
    )

    signal, reason = condition.evaluate(
        _position(),
        pd.Series({'close': 98.0, 'sma_50': 99.0, 'ema_21': 99.5}),
        pd.Timestamp('2024-01-12'),
    )

    assert signal is True
    assert reason == 'breakout_failure'
