import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BacktestSummary } from '../components/BacktestSummary'
import { fetchBacktestByRange, listAllBacktests, type BacktestMetadata, type BacktestResults } from '../api/backtest'
import { useBacktestDashboardContext } from './BacktestDashboard'
import '../styles/dashboard-cards.css'

const ICON_BY_KEY: Record<string, string> = {
  brain: '🧠',
  bolt: '⚡',
  chart: '📈',
  target: '🎯',
  balance: '⚖️',
  layers: '🧪',
}

export const TraderStrategiesPage: React.FC = () => {
  const { t } = useTranslation()
  const { setSelectedTimestamp, strategyProfiles } = useBacktestDashboardContext()
  const traderProfiles = useMemo(
    () => strategyProfiles.filter((profile) => profile.is_trader_strategy),
    [strategyProfiles],
  )
  const [selectedTraderId, setSelectedTraderId] = useState('')
  const [summaryResult, setSummaryResult] = useState<BacktestResults | null>(null)
  const [availableBacktests, setAvailableBacktests] = useState<BacktestMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (traderProfiles.length === 0) {
      setSelectedTraderId('')
      return
    }

    if (traderProfiles.some((profile) => profile.strategy_name === selectedTraderId)) {
      return
    }

    setSelectedTraderId(traderProfiles[0].strategy_name)
  }, [selectedTraderId, traderProfiles])

  const selectedTrader = useMemo(
    () => traderProfiles.find((profile) => profile.strategy_name === selectedTraderId) ?? traderProfiles[0] ?? null,
    [selectedTraderId, traderProfiles],
  )

  useEffect(() => {
    if (!selectedTrader?.strategy_name) {
      setAvailableBacktests([])
      setSummaryResult(null)
      setLoading(false)
      return
    }

    let active = true

    const loadTraderData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [backtests, latest] = await Promise.all([
          listAllBacktests(selectedTrader.strategy_name),
          fetchBacktestByRange('ALL', selectedTrader.strategy_name),
        ])

        if (!active) return

        setAvailableBacktests(backtests)
        setSummaryResult(latest)
        setSelectedTimestamp(latest.timestamp)
      } catch (err) {
        if (!active) return
        setAvailableBacktests([])
        setSummaryResult(null)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTraderData()

    return () => {
      active = false
    }
  }, [selectedTrader, setSelectedTimestamp])

  if (!selectedTrader) {
    return <div className="dashboard-empty-panel">{t('dashboard.noBacktests')}</div>
  }

  return (
    <div className="dashboard-page-stack">
      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{t('dashboard.traderStrategiesRoute', 'Trader Strategies')}</h2>
            <p>{t('dashboard.traderStrategiesHint', 'Independent trader-inspired backtest profiles for mobile-friendly comparison.')}</p>
          </div>
        </div>

        <div className="trader-profile-grid">
          {traderProfiles.map((profile) => (
            <button
              key={profile.strategy_name}
              type="button"
              className={`trader-profile-button ${profile.strategy_name === selectedTrader.strategy_name ? 'active' : ''}`}
              onClick={() => setSelectedTraderId(profile.strategy_name)}
            >
              <span className="trader-profile-emoji" aria-hidden="true">{ICON_BY_KEY[profile.icon_key ?? ''] ?? '🧩'}</span>
              <span className="trader-profile-name">{profile.display_name}</span>
              <span className="trader-profile-short">{profile.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{selectedTrader.display_name}</h2>
            <p>{selectedTrader.title}</p>
          </div>
        </div>
        <p className="trader-description">{selectedTrader.description}</p>
        {error ? <p className="trader-error">{error}</p> : null}
        <BacktestSummary data={summaryResult?.summary ?? null} loading={loading} />
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{t('dashboard.experimentList')}</h2>
            <p>{t('dashboard.traderStrategyRunsHint', 'Latest recorded runs for the selected trader-inspired profile.')}</p>
          </div>
        </div>
        {availableBacktests.length > 0 ? (
          <div className="backtest-list">
            {availableBacktests.map((backtest) => (
              <button
                key={backtest.timestamp}
                type="button"
                className="backtest-item"
                onClick={() => setSelectedTimestamp(backtest.timestamp)}
              >
                <div className="item-period">
                  <strong>{backtest.period}</strong>
                  <span>{backtest.trade_count} trades</span>
                </div>
                <div className="item-metadata">
                  <span>{backtest.strategy_name ?? selectedTrader.strategy_name}</span>
                  {backtest.rule_profile ? <span>{backtest.rule_profile}</span> : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-list">{t('dashboard.noBacktests')}</p>
        )}
      </section>

      <style>{`
        .trader-profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .trader-profile-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-height: 104px;
          padding: 16px 12px;
          border-radius: 16px;
          border: 1px solid #dbe4f0;
          background: #f8fafc;
          cursor: pointer;
        }

        .trader-profile-button.active {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.12);
        }

        .trader-profile-emoji {
          font-size: 28px;
        }

        .trader-profile-name {
          font-weight: 700;
          color: #0f172a;
          text-align: center;
        }

        .trader-profile-short {
          color: #475569;
          font-size: 13px;
          text-align: center;
        }

        .trader-description {
          margin: 0;
          color: #475569;
          line-height: 1.6;
        }

        .trader-error {
          color: #b91c1c;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
