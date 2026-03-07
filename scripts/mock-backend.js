const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const sampleTrades = [
  { ticker: 'AAA', entry_date: '2026-01-01T00:00:00Z', entry_price: 100, exit_date: '2026-01-10T00:00:00Z', exit_price: 110, exit_reason: 'rule', shares: 2, pnl: 20, pnl_pct: 0.1 },
  { ticker: 'CCC', entry_date: '2026-01-03T00:00:00Z', entry_price: 50, exit_date: '2026-01-09T00:00:00Z', exit_price: 45, exit_reason: 'rule', shares: 4, pnl: -20, pnl_pct: -0.1 },
];

const sampleStats = [
  { ticker: 'AAA', total_pnl: 300, trade_count: 3 },
  { ticker: 'BBB', total_pnl: 100, trade_count: 2 },
  { ticker: 'CCC', total_pnl: -200, trade_count: 4 },
];

function makeResults(timestamp = '2026-03-07_000000') {
  return {
    timestamp,
    summary: { total_trades: 2, winning_trades: 1, losing_trades: 1, win_rate: 0.5, total_pnl: 280, avg_win: 20, avg_loss: -20 },
    trades: sampleTrades,
    ticker_stats: sampleStats,
    charts: {},
  };
}

app.get('/api/backtest/list', (req, res) => {
  res.json({ backtests: [ { timestamp: '2026-03-07_000000', start_date: '2026-01-01', end_date: '2026-02-01', period: '2026-01', trade_count: 2, dir_name: '' } ] });
});

app.get('/api/backtest/latest', (req, res) => {
  res.json(makeResults());
});

app.get('/api/backtest/results/:timestamp', (req, res) => {
  res.json(makeResults(req.params.timestamp));
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Mock backend listening on ${port}`));
