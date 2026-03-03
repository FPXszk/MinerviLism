/**
 * Backtest Summary Component
 * Displays key metrics from backtest results
 */
import React from 'react';
import { BacktestSummary as BacktestSummaryData } from '../api/backtest';

interface BacktestSummaryProps {
  data: BacktestSummaryData | null;
  loading?: boolean;
}

export const BacktestSummary: React.FC<BacktestSummaryProps> = ({ data, loading = false }) => {
  if (loading) {
    return <div className="backtest-summary loading">Loading...</div>;
  }

  if (!data) {
    return <div className="backtest-summary empty">No data available</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  return (
    <div className="backtest-summary">
      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-label">Total P&L</div>
          <div className={`card-value ${data.total_pnl >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(data.total_pnl)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-label">Total Trades</div>
          <div className="card-value">{data.total_trades}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Win Rate</div>
          <div className="card-value">{formatPercent(data.win_rate)}</div>
          <div className="card-subtext">
            {data.winning_trades}W / {data.losing_trades}L
          </div>
        </div>

        <div className="summary-card">
          <div className="card-label">Avg Win</div>
          <div className={`card-value ${data.avg_win >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(data.avg_win)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-label">Avg Loss</div>
          <div className={`card-value ${data.avg_loss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(data.avg_loss)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-label">Profit Factor</div>
          <div className="card-value">
            {data.avg_win !== 0 && data.avg_loss !== 0
              ? (Math.abs(data.avg_win) / Math.abs(data.avg_loss)).toFixed(2)
              : 'N/A'}
          </div>
        </div>
      </div>

      <style>{`
        .backtest-summary {
          padding: 20px;
        }

        .backtest-summary.loading,
        .backtest-summary.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #666;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
        }

        .summary-card {
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }

        .card-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .card-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .card-value.positive {
          color: #22c55e;
        }

        .card-value.negative {
          color: #ef4444;
        }

        .card-subtext {
          font-size: 12px;
          color: #999;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};
