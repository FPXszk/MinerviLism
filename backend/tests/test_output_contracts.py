import sys
from pathlib import Path

import pandas as pd

_backend_dir = str(Path(__file__).parent.parent)
_python_dir = str(Path(__file__).parent.parent.parent / 'python')
if _backend_dir in sys.path:
    sys.path.remove(_backend_dir)
sys.path.insert(0, _backend_dir)
if _python_dir not in sys.path:
    sys.path.append(_python_dir)

FIXTURE_DIR = Path(__file__).resolve().parents[2] / 'tests' / 'fixtures' / 'backtest_sample' / 'backtest_2026-01-01_to_2026-01-31_20260131-000000'


def test_trade_log_contract_columns_present():
    df = pd.read_csv(FIXTURE_DIR / 'trade_log.csv')
    assert {'date', 'action', 'ticker', 'price', 'shares', 'pnl'}.issubset(df.columns)


def test_ticker_stats_contract_columns_present():
    df = pd.read_csv(FIXTURE_DIR / 'ticker_stats.csv')
    assert {'ticker', 'total_pnl', 'trade_count'}.issubset(df.columns)


def test_trades_contract_columns_present():
    df = pd.read_csv(FIXTURE_DIR / 'trades.csv')
    assert {'ticker', 'entry_date', 'entry_price', 'exit_date', 'exit_price', 'shares', 'pnl', 'pnl_pct'}.issubset(df.columns)
