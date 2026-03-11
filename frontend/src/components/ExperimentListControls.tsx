import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ExperimentPinnedFilter, ExperimentSortKey } from '../hooks/useExperimentListFilters'

interface ExperimentListControlsProps {
  searchTerm: string
  pinnedFilter: ExperimentPinnedFilter
  strategyFilter: string
  sortKey: ExperimentSortKey
  strategyOptions: string[]
  hasActiveFilters: boolean
  onSearchTermChange: (value: string) => void
  onPinnedFilterChange: (value: ExperimentPinnedFilter) => void
  onStrategyFilterChange: (value: string) => void
  onSortKeyChange: (value: ExperimentSortKey) => void
  onReset: () => void
}

export const ExperimentListControls: React.FC<ExperimentListControlsProps> = ({
  searchTerm,
  pinnedFilter,
  strategyFilter,
  sortKey,
  strategyOptions,
  hasActiveFilters,
  onSearchTermChange,
  onPinnedFilterChange,
  onStrategyFilterChange,
  onSortKeyChange,
  onReset,
}) => {
  const { t } = useTranslation()

  return (
    <div className="experiment-table-controls">
      <label className="experiment-control">
        <span>{t('dashboard.searchRunsLabel', 'Search runs')}</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder={t('dashboard.searchRunsPlaceholder', 'Period, strategy, label...')}
        />
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.pinFilterLabel', 'Visibility')}</span>
        <select value={pinnedFilter} onChange={(event) => onPinnedFilterChange(event.target.value as ExperimentPinnedFilter)}>
          <option value="all">{t('dashboard.pinFilterAll', 'All runs')}</option>
          <option value="pinned">{t('dashboard.pinFilterPinned', 'Pinned only')}</option>
          <option value="regular">{t('dashboard.pinFilterRegular', 'Regular only')}</option>
        </select>
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.strategyFilterLabel', 'Strategy filter')}</span>
        <select value={strategyFilter} onChange={(event) => onStrategyFilterChange(event.target.value)}>
          {strategyOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? t('dashboard.strategyFilterAll', 'All strategies') : option}
            </option>
          ))}
        </select>
      </label>
      <label className="experiment-control">
        <span>{t('dashboard.sortRunsLabel', 'Sort by')}</span>
        <select value={sortKey} onChange={(event) => onSortKeyChange(event.target.value as ExperimentSortKey)}>
          <option value="latest">{t('dashboard.sortRunsLatest', 'Latest first')}</option>
          <option value="annualReturn">{t('dashboard.sortRunsAnnualReturn', 'Annual return')}</option>
          <option value="informationRatio">{t('dashboard.sortRunsInformationRatio', 'Information ratio')}</option>
          <option value="maxDrawdown">{t('dashboard.sortRunsMaxDrawdown', 'Lowest drawdown')}</option>
          <option value="tradeCount">{t('dashboard.sortRunsTradeCount', 'Trade count')}</option>
        </select>
      </label>
      <div className="experiment-control experiment-control--actions">
        <span>{t('dashboard.savedFiltersLabel', 'Saved filters')}</span>
        <button
          type="button"
          className="experiment-reset-button"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          {t('dashboard.resetRunFilters', 'Reset filters')}
        </button>
      </div>
    </div>
  )
}
