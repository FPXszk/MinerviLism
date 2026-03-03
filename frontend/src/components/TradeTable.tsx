/**
 * Trade Table Component
 * Displays detailed trade records with sorting and pagination
 */
import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../api/backtest';

interface TradeTableProps {
  trades: TradeRecord[];
  loading?: boolean;
}

type SortField = keyof TradeRecord;
type SortDirection = 'asc' | 'desc';

export const TradeTable: React.FC<TradeTableProps> = ({ trades, loading = false }) => {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('exit_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const itemsPerPage = 20;

  const sortedTrades = useMemo(() => {
    const sorted = [...trades];
    sorted.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [trades, sortField, sortDirection]);

  const paginatedTrades = useMemo(() => {
    const start = page * itemsPerPage;
    return sortedTrades.slice(start, start + itemsPerPage);
  }, [sortedTrades, page]);

  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return <div className="trade-table loading">Loading trades...</div>;
  }

  if (trades.length === 0) {
    return <div className="trade-table empty">No trades found</div>;
  }

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
      {label}
      {sortField === field && (
        <span style={{ marginLeft: '5px' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );

  return (
    <div className="trade-table">
      <div className="table-info">
        <span>
          Showing {page * itemsPerPage + 1} to {Math.min((page + 1) * itemsPerPage, sortedTrades.length)} of{' '}
          {sortedTrades.length} trades
        </span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <SortableHeader field="ticker" label="Ticker" />
              <SortableHeader field="entry_date" label="Entry Date" />
              <SortableHeader field="entry_price" label="Entry Price" />
              <SortableHeader field="exit_date" label="Exit Date" />
              <SortableHeader field="exit_price" label="Exit Price" />
              <SortableHeader field="shares" label="Shares" />
              <SortableHeader field="pnl" label="P&L" />
              <SortableHeader field="pnl_pct" label="Return %" />
              <SortableHeader field="exit_reason" label="Exit Reason" />
            </tr>
          </thead>
          <tbody>
            {paginatedTrades.map((trade, idx) => (
              <tr key={idx}>
                <td className="ticker">{trade.ticker}</td>
                <td>{trade.entry_date}</td>
                <td className="number">{formatCurrency(trade.entry_price)}</td>
                <td>{trade.exit_date}</td>
                <td className="number">{formatCurrency(trade.exit_price)}</td>
                <td className="number">{trade.shares}</td>
                <td className={`number ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(trade.pnl)}
                </td>
                <td className={`number ${trade.pnl_pct >= 0 ? 'positive' : 'negative'}`}>
                  {(trade.pnl_pct * 100).toFixed(2)}%
                </td>
                <td className="reason">{trade.exit_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="pagination-button"
        >
          ← Previous
        </button>

        <div className="page-info">
          Page {page + 1} of {totalPages}
        </div>

        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="pagination-button"
        >
          Next →
        </button>
      </div>

      <style>{`
        .trade-table {
          padding: 20px;
        }

        .trade-table.loading,
        .trade-table.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #666;
        }

        .table-info {
          margin-bottom: 15px;
          font-size: 12px;
          color: #666;
        }

        .table-wrapper {
          overflow-x: auto;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        thead {
          background: #f5f5f5;
          position: sticky;
          top: 0;
        }

        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
          user-select: none;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        tbody tr:hover {
          background: #f9f9f9;
        }

        .ticker {
          font-weight: 600;
          color: #0066cc;
        }

        .number {
          text-align: right;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .positive {
          color: #22c55e;
          font-weight: 500;
        }

        .negative {
          color: #ef4444;
          font-weight: 500;
        }

        .reason {
          font-size: 12px;
          color: #999;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }

        .pagination-button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .pagination-button:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #999;
        }

        .pagination-button:disabled {
          color: #ccc;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 13px;
          color: #666;
          min-width: 100px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
