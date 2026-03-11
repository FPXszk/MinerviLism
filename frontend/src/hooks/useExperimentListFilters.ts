import React from 'react'
import { useSearchParams } from 'react-router-dom'

export type ExperimentPinnedFilter = 'all' | 'pinned' | 'regular'
export type ExperimentSortKey = 'latest' | 'annualReturn' | 'informationRatio' | 'maxDrawdown' | 'tradeCount'

const STORAGE_KEY = 'invest_experiment_list_filters'
const SEARCH_PARAM_KEYS = {
  search: 'runSearch',
  pinned: 'runPin',
  strategy: 'runStrategy',
  sort: 'runSort',
} as const

const VALID_PINNED_FILTERS: ExperimentPinnedFilter[] = ['all', 'pinned', 'regular']
const VALID_SORT_KEYS: ExperimentSortKey[] = ['latest', 'annualReturn', 'informationRatio', 'maxDrawdown', 'tradeCount']

interface StoredExperimentFilters {
  searchTerm?: string
  pinnedFilter?: ExperimentPinnedFilter
  strategyFilter?: string
  sortKey?: ExperimentSortKey
}

function readStoredFilters(): StoredExperimentFilters {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return {}
    }
    const parsed = JSON.parse(stored) as StoredExperimentFilters
    return parsed ?? {}
  } catch {
    return {}
  }
}

function parsePinnedFilter(value: string | null | undefined): ExperimentPinnedFilter | undefined {
  return VALID_PINNED_FILTERS.find((candidate) => candidate === value)
}

function parseSortKey(value: string | null | undefined): ExperimentSortKey | undefined {
  return VALID_SORT_KEYS.find((candidate) => candidate === value)
}

function setOrDelete(searchParams: URLSearchParams, key: string, value: string, defaultValue = '') {
  if (!value || value === defaultValue) {
    searchParams.delete(key)
    return
  }
  searchParams.set(key, value)
}

export function useExperimentListFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const storedFilters = React.useMemo(() => readStoredFilters(), [])
  const searchKey = searchParams.toString()

  const [searchTerm, setSearchTerm] = React.useState(
    () => searchParams.get(SEARCH_PARAM_KEYS.search) ?? storedFilters.searchTerm ?? '',
  )
  const [pinnedFilter, setPinnedFilter] = React.useState<ExperimentPinnedFilter>(
    () => parsePinnedFilter(searchParams.get(SEARCH_PARAM_KEYS.pinned))
      ?? parsePinnedFilter(storedFilters.pinnedFilter)
      ?? 'all',
  )
  const [strategyFilter, setStrategyFilter] = React.useState(
    () => searchParams.get(SEARCH_PARAM_KEYS.strategy) ?? storedFilters.strategyFilter ?? 'all',
  )
  const [sortKey, setSortKey] = React.useState<ExperimentSortKey>(
    () => parseSortKey(searchParams.get(SEARCH_PARAM_KEYS.sort))
      ?? parseSortKey(storedFilters.sortKey)
      ?? 'latest',
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ searchTerm, pinnedFilter, strategyFilter, sortKey }),
    )
  }, [pinnedFilter, searchTerm, sortKey, strategyFilter])

  React.useEffect(() => {
    const next = new URLSearchParams(searchParams)
    setOrDelete(next, SEARCH_PARAM_KEYS.search, searchTerm.trim())
    setOrDelete(next, SEARCH_PARAM_KEYS.pinned, pinnedFilter, 'all')
    setOrDelete(next, SEARCH_PARAM_KEYS.strategy, strategyFilter, 'all')
    setOrDelete(next, SEARCH_PARAM_KEYS.sort, sortKey, 'latest')

    const nextKey = next.toString()
    if (nextKey !== searchKey) {
      setSearchParams(next, { replace: true })
    }
  }, [pinnedFilter, searchKey, searchParams, searchTerm, setSearchParams, sortKey, strategyFilter])

  const resetFilters = React.useCallback(() => {
    setSearchTerm('')
    setPinnedFilter('all')
    setStrategyFilter('all')
    setSortKey('latest')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    pinnedFilter,
    setPinnedFilter,
    strategyFilter,
    setStrategyFilter,
    sortKey,
    setSortKey,
    resetFilters,
    hasActiveFilters:
      searchTerm.trim().length > 0
      || pinnedFilter !== 'all'
      || strategyFilter !== 'all'
      || sortKey !== 'latest',
  }
}
