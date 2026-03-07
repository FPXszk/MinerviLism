"""
Result Loader Service

Loads backtest results from CSV files (trade_log.csv, ticker_stats.csv)
and provides data access for the API layer.
"""
import os
from typing import Dict, List, Optional

import pandas as pd
from loguru import logger


def load_trade_log(csv_path: str) -> List[Dict]:
    """
    Load trade log from CSV file.

    Args:
        csv_path: Path to trade_log.csv

    Returns:
        List of trade records as dictionaries
    """
    if not os.path.exists(csv_path):
        # Attempt to find the file in the latest available backtest directory under the same output root
        def _find_latest_csv_in_sibling_backtests(missing_path, filename):
            parent = os.path.dirname(missing_path)
            output_root = os.path.dirname(parent)
            if not os.path.exists(output_root):
                return None
            for d in sorted(os.listdir(output_root), reverse=True):
                candidate_dir = os.path.join(output_root, d)
                if not os.path.isdir(candidate_dir):
                    continue
                candidate = os.path.join(candidate_dir, filename)
                if os.path.exists(candidate):
                    return candidate
            return None

        found = _find_latest_csv_in_sibling_backtests(csv_path, os.path.basename(csv_path))
        if found:
            logger.info(f"Trade log not found at {csv_path}, falling back to latest: {found}")
            csv_path = found
        else:
            logger.warning(f"Trade log not found: {csv_path}")
            return []

    try:
        df = pd.read_csv(csv_path)
        if df.empty:
            return []
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Failed to load trade log: {e}")
        return []


def load_ticker_stats(csv_path: str) -> List[Dict]:
    """
    Load ticker statistics from CSV file.

    Args:
        csv_path: Path to ticker_stats.csv

    Returns:
        List of ticker stat records as dictionaries
    """
    if not os.path.exists(csv_path):
        # Try to locate ticker_stats in the latest backtest sibling directories
        def _find_latest_csv_in_sibling_backtests(missing_path, filename):
            parent = os.path.dirname(missing_path)
            output_root = os.path.dirname(parent)
            if not os.path.exists(output_root):
                return None
            for d in sorted(os.listdir(output_root), reverse=True):
                candidate_dir = os.path.join(output_root, d)
                if not os.path.isdir(candidate_dir):
                    continue
                candidate = os.path.join(candidate_dir, filename)
                if os.path.exists(candidate):
                    return candidate
            return None

        found = _find_latest_csv_in_sibling_backtests(csv_path, os.path.basename(csv_path))
        if found:
            logger.info(f"Ticker stats not found at {csv_path}, falling back to latest: {found}")
            csv_path = found
        else:
            logger.warning(f"Ticker stats not found: {csv_path}")
            return []

    try:
        df = pd.read_csv(csv_path)
        if df.empty:
            return []
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Failed to load ticker stats: {e}")
        return []


def get_top_bottom_tickers(
    csv_path: str,
    top_n: int = 5,
    bottom_n: int = 5,
) -> Dict[str, List[Dict]]:
    """
    Extract top N winners and bottom N losers from ticker_stats.csv.

    Args:
        csv_path: Path to ticker_stats.csv
        top_n: Number of top tickers to return
        bottom_n: Number of bottom tickers to return

    Returns:
        Dict with 'top' and 'bottom' lists of ticker records
    """
    if not os.path.exists(csv_path):
        logger.warning(f"Ticker stats not found: {csv_path}")
        return {"top": [], "bottom": []}

    try:
        df = pd.read_csv(csv_path)
        if df.empty:
            return {"top": [], "bottom": []}

        # Sort by total_pnl descending
        df_sorted = df.sort_values("total_pnl", ascending=False)

        # Top N winners
        top_df = df_sorted.head(min(top_n, len(df_sorted)))
        top_records = top_df.to_dict(orient="records")

        # Bottom N losers (sorted ascending for bottom)
        bottom_df = df_sorted.tail(min(bottom_n, len(df_sorted)))
        # Re-sort ascending for the bottom list
        bottom_df = bottom_df.sort_values("total_pnl", ascending=True)
        bottom_records = bottom_df.to_dict(orient="records")

        return {"top": top_records, "bottom": bottom_records}

    except Exception as e:
        logger.error(f"Failed to load ticker stats for top/bottom: {e}")
        return {"top": [], "bottom": []}


def get_enriched_trade_markers(
    csv_path: str,
    ticker: str,
) -> Dict[str, List[Dict]]:
    """
    Get enriched trade markers with tooltip data for a specific ticker.

    Each exit marker includes:
    - date: Exit date
    - price: Exit price
    - pnl: Profit/Loss
    - holding_days: Number of days from entry to exit
    - entry_date: Corresponding entry date
    - entry_price: Corresponding entry price

    Args:
        csv_path: Path to trade_log.csv
        ticker: Ticker symbol to filter

    Returns:
        Dict with 'entries' and 'exits' lists
    """
    if not os.path.exists(csv_path):
        # Try to locate trade_log in sibling backtest directories under the same output root
        def _find_latest_csv_in_sibling_backtests(missing_path, filename):
            parent = os.path.dirname(missing_path)
            output_root = os.path.dirname(parent)
            if not os.path.exists(output_root):
                return None
            for d in sorted(os.listdir(output_root), reverse=True):
                candidate_dir = os.path.join(output_root, d)
                if not os.path.isdir(candidate_dir):
                    continue
                candidate = os.path.join(candidate_dir, filename)
                if os.path.exists(candidate):
                    return candidate
            return None

        found = _find_latest_csv_in_sibling_backtests(csv_path, os.path.basename(csv_path))
        if found:
            logger.info(f"Trade log not found at {csv_path}, falling back to latest: {found}")
            csv_path = found
        else:
            logger.warning(f"Trade log not found: {csv_path}")
            return {"entries": [], "exits": []}

    try:
        df = pd.read_csv(csv_path)
        if df.empty:
            return {"entries": [], "exits": []}

        # Filter by ticker
        ticker_trades = df[df["ticker"] == ticker].copy()
        if ticker_trades.empty:
            return {"entries": [], "exits": []}

        # Convert dates
        ticker_trades["date"] = pd.to_datetime(ticker_trades["date"])

        # Separate entries and exits
        entries_df = ticker_trades[ticker_trades["action"] == "ENTRY"].reset_index(
            drop=True
        )
        exits_df = ticker_trades[ticker_trades["action"] == "EXIT"].reset_index(
            drop=True
        )

        # Build entry markers
        entries = []
        for _, row in entries_df.iterrows():
            entries.append(
                {
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "price": float(row["price"]),
                }
            )

        # Build exit markers with enriched data
        # Pair each exit with its corresponding entry (by order)
        exits = []
        for i, (_, row) in enumerate(exits_df.iterrows()):
            exit_marker = {
                "date": row["date"].strftime("%Y-%m-%d"),
                "price": float(row["price"]),
                "pnl": float(row.get("pnl", 0)),
            }

            # Match with corresponding entry (by index)
            if i < len(entries_df):
                entry_row = entries_df.iloc[i]
                entry_date = entry_row["date"]
                exit_date = row["date"]
                holding_days = (exit_date - entry_date).days

                exit_marker["holding_days"] = int(holding_days)
                exit_marker["entry_date"] = entry_date.strftime("%Y-%m-%d")
                exit_marker["entry_price"] = float(entry_row["price"])
            else:
                exit_marker["holding_days"] = 0
                exit_marker["entry_date"] = ""
                exit_marker["entry_price"] = 0.0

            exits.append(exit_marker)

        return {"entries": entries, "exits": exits}

    except Exception as e:
        logger.error(f"Failed to load enriched trade markers: {e}")
        return {"entries": [], "exits": []}


def get_chart_as_base64(chart_path: str) -> Optional[str]:
    """
    Convert chart image to base64 string.

    Args:
        chart_path: Path to chart image file

    Returns:
        Base64 encoded string or None if file not found
    """
    import base64

    if not os.path.exists(chart_path):
        logger.warning(f"Chart not found: {chart_path}")
        return None

    try:
        with open(chart_path, "rb") as f:
            image_data = f.read()
            base64_string = base64.b64encode(image_data).decode("utf-8")
            return f"data:image/png;base64,{base64_string}"
    except Exception as e:
        logger.error(f"Failed to encode chart as base64: {e}")
        return None


def list_available_backtests(output_dir: str) -> List[Dict]:
    """
    List all available backtest results with metadata.

    Args:
        output_dir: Path to backtest output directory

    Returns:
        List of backtest metadata dictionaries
    """
    if not os.path.exists(output_dir):
        logger.warning(f"Output directory not found: {output_dir}")
        return []

    backtests = []
    try:
        for dir_name in sorted(os.listdir(output_dir), reverse=True):
            dir_path = os.path.join(output_dir, dir_name)
            if not os.path.isdir(dir_path):
                continue

            # Parse timestamp from directory name
            # Format: backtest_YYYY-MM-DD_to_YYYY-MM-DD_YYYYmmdd-HHMMSS
            if not dir_name.startswith("backtest_"):
                continue

            try:
                parts = dir_name.replace("backtest_", "").split("_to_")
                if len(parts) < 2:
                    continue

                start_date = parts[0]
                remaining = parts[1]
                end_date_parts = remaining.split("_")
                end_date = end_date_parts[0]
                timestamp = "_".join(end_date_parts[1:]) if len(end_date_parts) > 1 else ""

                # Load statistics from CSV
                ticker_stats_path = os.path.join(dir_path, "ticker_stats.csv")
                trade_count = 0
                if os.path.exists(ticker_stats_path):
                    try:
                        df = pd.read_csv(ticker_stats_path)
                        trade_count = len(df)
                    except Exception:
                        pass

                backtests.append({
                    "timestamp": timestamp,
                    "start_date": start_date,
                    "end_date": end_date,
                    "period": f"{start_date} to {end_date}",
                    "trade_count": trade_count,
                    "dir_name": dir_name,
                })
            except Exception as e:
                logger.warning(f"Failed to parse backtest directory {dir_name}: {e}")
                continue

        return backtests
    except Exception as e:
        logger.error(f"Failed to list backtests: {e}")
        return []


def load_backtest_summary(output_dir: str) -> Dict:
    """
    Load backtest summary metrics from CSV files.

    Args:
        output_dir: Path to specific backtest output directory

    Returns:
        Dictionary with summary metrics
    """
    if not os.path.exists(output_dir):
        return {}

    summary = {}
    try:
        # Load trades.csv for gross statistics
        trades_path = os.path.join(output_dir, "trades.csv")
        if os.path.exists(trades_path):
            df = pd.read_csv(trades_path)
            if not df.empty:
                # Calculate metrics
                total_pnl = float(df["pnl"].sum())
                winning_trades = len(df[df["pnl"] > 0])
                losing_trades = len(df[df["pnl"] <= 0])
                total_trades = len(df)

                summary["total_trades"] = total_trades
                summary["winning_trades"] = winning_trades
                summary["losing_trades"] = losing_trades
                summary["win_rate"] = winning_trades / total_trades if total_trades > 0 else 0
                summary["total_pnl"] = total_pnl
                summary["avg_win"] = float(df[df["pnl"] > 0]["pnl"].mean()) if winning_trades > 0 else 0
                summary["avg_loss"] = float(df[df["pnl"] <= 0]["pnl"].mean()) if losing_trades > 0 else 0

        return summary
    except Exception as e:
        logger.error(f"Failed to load backtest summary: {e}")
        return {}
