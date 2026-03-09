import React from 'react'
import { useTranslation } from 'react-i18next'
import { BacktestSummary } from '../components/BacktestSummary'
import { TradeTable } from '../components/TradeTable'
import { useBacktestDashboardContext } from './BacktestDashboard'

const TopBottomPurchaseCharts = React.lazy(() =>
  import('../components/TopBottomPurchaseCharts').then((module) => ({
    default: module.TopBottomPurchaseCharts,
  })),
)

function formatTimestampLabel(timestamp: string) {
  return timestamp.split('_').slice(0, -1).join('_')
}

export const BacktestAnalysisPage: React.FC = () => {
  const { t } = useTranslation()
  const { results, loading } = useBacktestDashboardContext()

  if (!results) {
    return <div className="analysis-empty">{loading ? t('common.loading') : t('dashboard.selectBacktest')}</div>
  }

  return (
    <div className="analysis-page">
      <section className="analysis-card analysis-summary-card">
        <div className="section-heading">
          <div>
            <h2>{t('dashboard.analysisRoute', 'Analysis & Results')}</h2>
            <p>{formatTimestampLabel(results.timestamp)}</p>
          </div>
        </div>
        <BacktestSummary data={results.summary} loading={loading} />
      </section>

      <section className="analysis-card">
        <div className="section-heading">
          <div>
            <h2>{t('dashboard.chartsTab')}</h2>
            <p>{t('dashboard.chartsRouteHint', 'Review the standard-size chart gallery for top and bottom performers.')}</p>
          </div>
        </div>
        <React.Suspense fallback={<div style={{ padding: 20 }}>{t('common.loading')}</div>}>
          <TopBottomPurchaseCharts
            trades={results.trades}
            tickerStats={results.ticker_stats}
            loading={loading}
          />
        </React.Suspense>
      </section>

      <section className="analysis-card">
        <div className="section-heading">
          <div>
            <h2>{t('dashboard.tradesTab')}</h2>
            <p>{t('dashboard.tradesRouteHint', 'Review trade outcomes with compact mobile cards and translated exit reasons.')}</p>
          </div>
        </div>
        <TradeTable trades={results.trades} loading={loading} />
      </section>

      <style>{`
        .analysis-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .analysis-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .analysis-summary-card {
          overflow: hidden;
        }

        .analysis-empty {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .section-heading {
          margin-bottom: 16px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .section-heading p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}
