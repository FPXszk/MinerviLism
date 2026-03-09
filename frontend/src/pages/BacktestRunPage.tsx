import React from 'react'
import { useTranslation } from 'react-i18next'
import { RunPanel } from '../components/RunPanel'
import { useBacktestDashboardContext } from './BacktestDashboard'

export const BacktestRunPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    backtests,
    selectedTimestamp,
    setSelectedTimestamp,
    activeJob,
    jobLogs,
    runError,
    handleRunCommand,
    handleCancelCommand,
  } = useBacktestDashboardContext()

  return (
    <div className="run-page">
      <section className="run-card">
        <div className="section-heading">
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

      <section className="run-card">
        <div className="section-heading">
          <div>
            <h2>{t('dashboard.availableTests')}</h2>
            <p>{t('dashboard.pinnedHint')}</p>
          </div>
        </div>

        <div className="backtest-list">
          {backtests.length === 0 ? (
            <p className="empty-list">{t('dashboard.noBacktests')}</p>
          ) : (
            backtests.map((backtest) => {
              const availableRunCount = backtest.available_runs ?? 1

              return (
                <button
                  type="button"
                  key={backtest.timestamp}
                  className={`backtest-item ${selectedTimestamp === backtest.timestamp ? 'active' : ''}`}
                  onClick={() => setSelectedTimestamp(backtest.timestamp)}
                >
                  <div className="item-period">
                    <span>{backtest.period}</span>
                    {backtest.is_pinned && <span className="backtest-badge">{t('dashboard.pinnedLabel')}</span>}
                  </div>
                  <div className="item-details">
                    <span>{t('dashboard.tradesCount', { count: backtest.trade_count })}</span>
                    {availableRunCount > 1 && (
                      <span title={t('dashboard.availableRunsHint')}>
                        {t('dashboard.availableRuns', { count: availableRunCount })}
                      </span>
                    )}
                  </div>
                  <div className="item-timestamp">{backtest.timestamp}</div>
                </button>
              )
            })
          )}
        </div>
      </section>

      <style>{`
        .run-page {
          display: grid;
          grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
          gap: 20px;
        }

        .run-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
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

        .backtest-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .backtest-item {
          width: 100%;
          text-align: left;
          border: 1px solid #dbe4f0;
          border-radius: 12px;
          padding: 14px 16px;
          background: #f8fafc;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .backtest-item.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .item-period,
        .item-details {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .backtest-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
        }

        .item-details,
        .item-timestamp,
        .empty-list {
          color: #64748b;
          font-size: 13px;
        }

        @media (max-width: 900px) {
          .run-page {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
