import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BacktestSummary } from '../components/BacktestSummary'
import { fetchBacktestByRange, listAllBacktests, type BacktestMetadata, type BacktestResults } from '../api/backtest'
import { useBacktestDashboardContext } from './BacktestDashboard'
import '../styles/dashboard-cards.css'

type TraderProfile = {
  id: string
  name: string
  emoji: string
  title: string
  description: string
}

const TRADER_PROFILES: TraderProfile[] = [
  {
    id: 'buffett-quality',
    name: 'Warren Buffett',
    emoji: '🧠',
    title: 'Quality compounders',
    description: 'Looks for durable businesses with stable volatility, rising long-term trends, and patient holding periods.',
  },
  {
    id: 'soros-breakout',
    name: 'George Soros',
    emoji: '⚡',
    title: 'Reflexive breakout momentum',
    description: 'Emphasizes decisive breakouts, fast confirmation, and quicker exits when the breakout thesis loses momentum.',
  },
  {
    id: 'lynch-growth',
    name: 'Peter Lynch',
    emoji: '📈',
    title: 'Everyday growth leaders',
    description: 'Favors liquid growth names trending near highs while still maintaining a broad, understandable trend structure.',
  },
  {
    id: 'minervini-trend',
    name: 'Mark Minervini',
    emoji: '🎯',
    title: 'Trend template leadership',
    description: 'Tracks leadership names near 52-week highs with relative-strength confirmation and tighter breakout risk control.',
  },
  {
    id: 'dalio-balance',
    name: 'Ray Dalio',
    emoji: '⚖️',
    title: 'Balanced trend participation',
    description: 'Targets steadier trend participation with volatility control, tighter holding windows, and mean-reversion aware exits.',
  },
]

export const TraderStrategiesPage: React.FC = () => {
  const { t } = useTranslation()
  const { setSelectedTimestamp } = useBacktestDashboardContext()
  const [selectedTraderId, setSelectedTraderId] = useState(TRADER_PROFILES[0].id)
  const [summaryResult, setSummaryResult] = useState<BacktestResults | null>(null)
  const [availableBacktests, setAvailableBacktests] = useState<BacktestMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedTrader = useMemo(
    () => TRADER_PROFILES.find((profile) => profile.id === selectedTraderId) ?? TRADER_PROFILES[0],
    [selectedTraderId],
  )

  useEffect(() => {
    let active = true

    const loadTraderData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [backtests, latest] = await Promise.all([
          listAllBacktests(selectedTrader.id),
          fetchBacktestByRange('ALL', selectedTrader.id),
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
  }, [selectedTrader.id, setSelectedTimestamp])

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
          {TRADER_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={`trader-profile-button ${profile.id === selectedTrader.id ? 'active' : ''}`}
              onClick={() => setSelectedTraderId(profile.id)}
            >
              <span className="trader-profile-emoji" aria-hidden="true">{profile.emoji}</span>
              <span className="trader-profile-name">{profile.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{selectedTrader.name}</h2>
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
                  <span>{backtest.strategy_name ?? selectedTrader.id}</span>
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
