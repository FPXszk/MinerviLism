import React from 'react'
import { useTranslation } from 'react-i18next'
import { RunPanel } from '../components/RunPanel'
import { BacktestSummary } from '../components/BacktestSummary'
import { ConditionComparisonPanel } from '../components/ConditionComparisonPanel'
import { ExperimentListTable } from '../components/ExperimentListTable'
import { useBacktestDashboardContext } from './BacktestDashboard'
import '../styles/dashboard-cards.css'

function formatMetricPercent(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

function formatMetricNumber(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return value.toFixed(2)
}

export const BacktestRunPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    backtests,
    results,
    loading,
    selectedTimestamp,
    setSelectedTimestamp,
    pinnedAnnualResults = [],
    activeJob,
    jobLogs,
    runError,
    handleRunCommand,
    handleCancelCommand,
  } = useBacktestDashboardContext()

  return (
    <div className="dashboard-page-stack">
      <section className="dashboard-card dashboard-card--summary">
        <div className="dashboard-section-heading">
          <div>
            <h2>{t('dashboard.overviewTitle')}</h2>
            <p>{t('dashboard.overviewHint')}</p>
          </div>
        </div>
        <BacktestSummary data={results?.summary ?? null} loading={loading} />
      </section>

      <div className="dashboard-page-grid dashboard-page-grid--run">
        <section className="dashboard-card">
          <div className="dashboard-section-heading">
            <div>
              <h2>{t('dashboard.runRoute', 'Run & Manage')}</h2>
              <p>{t('dashboard.runRouteHint', 'Manage command execution, pinned annual results, and live logs from one screen.')}</p>
            </div>
          </div>
          <RunPanel
            onRun={handleRunCommand}
            onCancel={handleCancelCommand}
            activeJob={activeJob}
            logs={jobLogs}
            runError={runError}
          />
        </section>

        <section className="dashboard-card">
          <div className="dashboard-section-heading">
            <div>
              <h2>{t('dashboard.conditionComparison')}</h2>
              <p>{t('dashboard.conditionComparisonHint')}</p>
            </div>
          </div>
          <ConditionComparisonPanel
            backtests={backtests}
            selectedTimestamp={selectedTimestamp}
          />
        </section>
      </div>

      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{t('dashboard.pinnedAnnualResults', 'Pinned Annual Results')}</h2>
            <p>{t('dashboard.pinnedAnnualResultsHint', 'Quick access to the fixed 2020 and 2021 benchmark periods.')}</p>
          </div>
        </div>
        <div className="pinned-results-grid">
          {pinnedAnnualResults.map((entry) => (
            <article key={entry.period} className="pinned-result-card">
              <div className="pinned-result-header">
                <strong>{entry.period}</strong>
                {entry.result ? (
                  <button
                    type="button"
                    className="button-secondary pinned-result-button"
                    onClick={() => setSelectedTimestamp(entry.result?.timestamp ?? null)}
                  >
                    {t('dashboard.openRun', 'Open run')}
                  </button>
                ) : null}
              </div>
              {entry.result ? (
                <div className="pinned-result-metrics">
                  <div>
                    <span>{t('summary.annualReturn')}</span>
                    <strong>{formatMetricPercent(entry.result.summary?.annual_return_pct)}</strong>
                  </div>
                  <div>
                    <span>{t('summary.informationRatio')}</span>
                    <strong>{formatMetricNumber(entry.result.summary?.information_ratio)}</strong>
                  </div>
                  <div>
                    <span>{t('summary.maxDrawdown')}</span>
                    <strong>{formatMetricPercent(entry.result.summary?.max_drawdown_pct)}</strong>
                  </div>
                </div>
              ) : (
                <p className="pinned-result-error">{entry.error ?? t('dashboard.noBacktests')}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h2>{t('dashboard.experimentList')}</h2>
            <p>{t('dashboard.pinnedHint')} {t('dashboard.experimentListHint')}</p>
          </div>
        </div>
        <ExperimentListTable
          backtests={backtests}
          selectedTimestamp={selectedTimestamp}
          onSelect={setSelectedTimestamp}
        />
      </section>

      <style>{`
        .pinned-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .pinned-result-card {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid #dbe4f0;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }

        .pinned-result-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .pinned-result-button {
          min-height: 40px;
        }

        .pinned-result-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .pinned-result-metrics div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pinned-result-metrics span {
          color: #64748b;
          font-size: 12px;
        }

        .pinned-result-metrics strong {
          color: #0f172a;
          font-size: 16px;
        }

        .pinned-result-error {
          margin: 0;
          color: #b91c1c;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .pinned-result-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
