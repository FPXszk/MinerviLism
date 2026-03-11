import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BacktestMetadata } from '../api/backtest'

interface ExperimentListTableProps {
  backtests: BacktestMetadata[]
  selectedTimestamp: string | null
  onSelect: (timestamp: string) => void
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return value.toFixed(2)
}

export const ExperimentListTable: React.FC<ExperimentListTableProps> = ({
  backtests,
  selectedTimestamp,
  onSelect,
}) => {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = React.useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false))
  const [searchTerm, setSearchTerm] = React.useState('')
  const [pinnedFilter, setPinnedFilter] = React.useState<'all' | 'pinned' | 'regular'>('all')
  const [strategyFilter, setStrategyFilter] = React.useState('all')
  const [sortKey, setSortKey] = React.useState<'latest' | 'annualReturn' | 'informationRatio' | 'maxDrawdown' | 'tradeCount'>('latest')

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const strategyOptions = useMemo(() => {
    const values = new Set(
      backtests
        .map((backtest) => backtest.strategy_name?.trim())
        .filter((value): value is string => Boolean(value)),
    )
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))]
  }, [backtests])

  const filteredBacktests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch = (backtest: BacktestMetadata) => {
      if (!normalizedSearch) return true
      const haystack = [
        backtest.period,
        backtest.run_label,
        backtest.experiment_name,
        backtest.strategy_name,
        backtest.rule_profile,
        backtest.timestamp,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedSearch)
    }

    const matchesPinned = (backtest: BacktestMetadata) => {
      if (pinnedFilter === 'pinned') return backtest.is_pinned === true
      if (pinnedFilter === 'regular') return backtest.is_pinned !== true
      return true
    }

    const matchesStrategy = (backtest: BacktestMetadata) => {
      if (strategyFilter === 'all') return true
      return (backtest.strategy_name ?? '').trim() === strategyFilter
    }

    const sorted = backtests
      .filter((backtest) => matchesSearch(backtest) && matchesPinned(backtest) && matchesStrategy(backtest))
      .sort((left, right) => {
        if (sortKey === 'annualReturn') {
          return (right.headline_metrics?.annual_return_pct ?? Number.NEGATIVE_INFINITY)
            - (left.headline_metrics?.annual_return_pct ?? Number.NEGATIVE_INFINITY)
        }
        if (sortKey === 'informationRatio') {
          return (right.headline_metrics?.information_ratio ?? Number.NEGATIVE_INFINITY)
            - (left.headline_metrics?.information_ratio ?? Number.NEGATIVE_INFINITY)
        }
        if (sortKey === 'maxDrawdown') {
          return Math.abs(left.headline_metrics?.max_drawdown_pct ?? Number.POSITIVE_INFINITY)
            - Math.abs(right.headline_metrics?.max_drawdown_pct ?? Number.POSITIVE_INFINITY)
        }
        if (sortKey === 'tradeCount') {
          return right.trade_count - left.trade_count
        }
        return right.timestamp.localeCompare(left.timestamp)
      })

    return sorted
  }, [backtests, pinnedFilter, searchTerm, sortKey, strategyFilter])

  if (backtests.length === 0) {
    return <p className="empty-list">{t('dashboard.noBacktests')}</p>
  }

  const controls = (
    <div className="experiment-table-controls">
      <label className="experiment-control">
        <span>{t('dashboard.searchRunsLabel', 'Search runs')}</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('dashboard.searchRunsPlaceholder', 'Period, strategy, label...')}
        />
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.pinFilterLabel', 'Visibility')}</span>
        <select value={pinnedFilter} onChange={(event) => setPinnedFilter(event.target.value as typeof pinnedFilter)}>
          <option value="all">{t('dashboard.pinFilterAll', 'All runs')}</option>
          <option value="pinned">{t('dashboard.pinFilterPinned', 'Pinned only')}</option>
          <option value="regular">{t('dashboard.pinFilterRegular', 'Regular only')}</option>
        </select>
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.strategyFilterLabel', 'Strategy filter')}</span>
        <select value={strategyFilter} onChange={(event) => setStrategyFilter(event.target.value)}>
          {strategyOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? t('dashboard.strategyFilterAll', 'All strategies') : option}
            </option>
          ))}
        </select>
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.sortRunsLabel', 'Sort by')}</span>
        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}>
          <option value="latest">{t('dashboard.sortRunsLatest', 'Latest first')}</option>
          <option value="annualReturn">{t('dashboard.sortRunsAnnualReturn', 'Annual return')}</option>
          <option value="informationRatio">{t('dashboard.sortRunsInformationRatio', 'Information ratio')}</option>
          <option value="maxDrawdown">{t('dashboard.sortRunsMaxDrawdown', 'Lowest drawdown')}</option>
          <option value="tradeCount">{t('dashboard.sortRunsTradeCount', 'Trade count')}</option>
        </select>
      </label>
    </div>
  )

  if (filteredBacktests.length === 0) {
    return (
      <div className="experiment-table-stack">
        {controls}
        <p className="empty-list">{t('dashboard.noFilteredBacktests', 'No runs match the current filters.')}</p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="experiment-table-stack">
        {controls}
        <div className="experiment-mobile-list">
        {filteredBacktests.map((backtest) => {
          const isActive = backtest.timestamp === selectedTimestamp
          return (
            <button
              key={backtest.timestamp}
              type="button"
              className={`experiment-mobile-card ${isActive ? 'selected' : ''}`}
              onClick={() => onSelect(backtest.timestamp)}
            >
              <div className="experiment-mobile-header">
                <strong>{backtest.period}</strong>
                {backtest.is_pinned ? <span className="backtest-badge">{t('dashboard.pinnedLabel')}</span> : null}
              </div>
              <div className="experiment-mobile-subtitle">
                <span>{backtest.run_label ?? backtest.experiment_name ?? backtest.timestamp}</span>
                {backtest.experiment_name ? <span>{backtest.experiment_name}</span> : null}
              </div>
              <div className="experiment-mobile-tags">
                {backtest.strategy_name ? <span>{backtest.strategy_name}</span> : null}
                {backtest.rule_profile ? <span>{backtest.rule_profile}</span> : null}
                {backtest.benchmark_enabled === false ? <span>{t('dashboard.benchmarkDisabledShort')}</span> : null}
              </div>
              <div className="experiment-mobile-metrics">
                <span>{t('summary.annualReturn')}: {formatPercent(backtest.headline_metrics?.annual_return_pct)}</span>
                <span>{t('summary.informationRatio')}: {formatNumber(backtest.headline_metrics?.information_ratio)}</span>
                <span>{t('summary.maxDrawdown')}: {formatPercent(backtest.headline_metrics?.max_drawdown_pct)}</span>
              </div>
            </button>
          )
        })}
        </div>

        <style>{`
          .experiment-table-stack {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .experiment-table-controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
          }

          .experiment-control {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #334155;
          }

          .experiment-control input,
          .experiment-control select {
            min-height: 42px;
            padding: 9px 12px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            font-size: 14px;
          }

          .experiment-mobile-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .experiment-mobile-card {
            text-align: left;
            padding: 14px;
            border-radius: 14px;
            border: 1px solid #dbe4f0;
            background: #ffffff;
          }

          .experiment-mobile-card.selected {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          .experiment-mobile-header,
          .experiment-mobile-subtitle {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
          }

          .experiment-mobile-subtitle {
            margin-top: 8px;
            color: #475569;
            font-size: 13px;
          }

          .experiment-mobile-tags,
          .experiment-mobile-metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            color: #334155;
            font-size: 12px;
          }

          .experiment-mobile-tags span,
          .experiment-mobile-metrics span {
            display: inline-flex;
            padding: 4px 8px;
            border-radius: 999px;
            background: #e2e8f0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="experiment-table-stack">
      {controls}
      <div className="experiment-table-wrapper">
      <table className="experiment-table" aria-label={t('dashboard.experimentList')}>
        <thead>
          <tr>
            <th>{t('dashboard.periodColumn')}</th>
            <th>{t('dashboard.experimentColumn')}</th>
            <th>{t('dashboard.strategyColumn')}</th>
            <th>{t('dashboard.conditionColumn')}</th>
            <th>{t('dashboard.tradesColumn')}</th>
            <th>{t('summary.annualReturn')}</th>
            <th>{t('summary.informationRatio')}</th>
            <th>{t('summary.maxDrawdown')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredBacktests.map((backtest) => {
            const isActive = backtest.timestamp === selectedTimestamp
            const headlineMetrics = backtest.headline_metrics
            const availableRunCount = backtest.available_runs ?? 1
            return (
              <tr key={backtest.timestamp} className={isActive ? 'selected' : ''}>
                <td>
                  <div className="experiment-period-cell">
                    <button
                      type="button"
                      className="experiment-select-button"
                      onClick={() => onSelect(backtest.timestamp)}
                    >
                      <span>{backtest.period}</span>
                      {backtest.is_pinned ? <span className="backtest-badge">{t('dashboard.pinnedLabel')}</span> : null}
                    </button>
                    {availableRunCount > 1 ? (
                      <span className="experiment-period-note">{t('dashboard.availableRuns', { count: availableRunCount })}</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className="experiment-primary-cell">
                    <strong>{backtest.run_label ?? backtest.experiment_name ?? backtest.timestamp}</strong>
                    {backtest.experiment_name && backtest.experiment_name !== backtest.run_label ? (
                      <span>{backtest.experiment_name}</span>
                    ) : null}
                  </div>
                </td>
                <td>{backtest.strategy_name ?? '-'}</td>
                <td>
                  <div className="experiment-condition">
                    {backtest.rule_profile ? <span>{backtest.rule_profile}</span> : null}
                    {backtest.benchmark_enabled === false ? (
                      <span>{t('dashboard.benchmarkDisabledShort')}</span>
                    ) : null}
                  </div>
                </td>
                <td>{backtest.trade_count}</td>
                <td>{formatPercent(headlineMetrics?.annual_return_pct)}</td>
                <td>{formatNumber(headlineMetrics?.information_ratio)}</td>
                <td>{formatPercent(headlineMetrics?.max_drawdown_pct)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      <style>{`
        .experiment-table-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .experiment-table-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .experiment-control {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .experiment-control input,
        .experiment-control select {
          min-height: 42px;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 14px;
        }

        .experiment-table-wrapper {
          overflow-x: auto;
          max-width: 100%;
        }

        .experiment-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }

        .experiment-table th,
        .experiment-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          vertical-align: top;
          font-size: 13px;
        }

        .experiment-table th {
          color: #475569;
          font-weight: 700;
          background: #f8fafc;
        }

        .experiment-table tr.selected {
          background: #eff6ff;
        }

        .experiment-select-button {
          border: none;
          background: transparent;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }

        .experiment-period-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .experiment-period-note {
          color: #64748b;
          font-size: 12px;
        }

        .experiment-condition {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .experiment-primary-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .experiment-primary-cell strong {
          color: #0f172a;
        }

        .experiment-primary-cell span {
          color: #64748b;
          font-size: 12px;
        }

        .experiment-condition span {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #334155;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
