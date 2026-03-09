import React from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Notification } from '../components/Notification'
import { BacktestStatus } from '../components/BacktestStatus'
import {
  useBacktestDashboardState,
  type UseBacktestDashboardStateResult,
} from '../hooks/useBacktestDashboardState'

export type BacktestDashboardContextValue = UseBacktestDashboardStateResult

export function useBacktestDashboardContext() {
  return useOutletContext<BacktestDashboardContextValue>()
}

export const BacktestDashboard: React.FC = () => {
  const { t } = useTranslation()
  const dashboard = useBacktestDashboardState()

  return (
    <div className="backtest-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-copy">
          <h1>{t('dashboard.title')}</h1>
          <BacktestStatus activeJob={dashboard.activeJob} logs={dashboard.jobLogs} />
        </div>
        <button onClick={() => void dashboard.handleLoadLatest()} className="button-primary" disabled={dashboard.loading}>
          {dashboard.loading ? t('common.loading') : t('dashboard.loadLatest')}
        </button>
      </header>

      <nav className="dashboard-route-nav" aria-label={t('dashboard.routeNavigation', 'Backtest sections')}>
        <NavLink to="/dashboard/run" className={({ isActive }) => `route-tab ${isActive ? 'active' : ''}`}>
          {t('dashboard.runRoute', 'Run & Manage')}
        </NavLink>
        <NavLink to="/dashboard/analysis" className={({ isActive }) => `route-tab ${isActive ? 'active' : ''}`}>
          {t('dashboard.analysisRoute', 'Analysis & Results')}
        </NavLink>
      </nav>

      {dashboard.error && (
        <div className="dashboard-notification">
          <Notification type="error" message={dashboard.error} onDismiss={() => dashboard.setError(null)} />
        </div>
      )}

      <main className="dashboard-shell">
        <Outlet context={dashboard} />
      </main>

      <style>{`
        .backtest-dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-page, #f8fafc);
          font-family: var(--font-sans, 'Segoe UI', sans-serif);
        }

        .dashboard-header {
          background: var(--bg-nav, #0f172a);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 16px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.3);
        }

        .dashboard-header-copy {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .dashboard-route-nav {
          display: flex;
          gap: 12px;
          padding: 12px 28px 0;
          background: var(--bg-page, #f8fafc);
        }

        .route-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-radius: 999px;
          text-decoration: none;
          color: #334155;
          background: #e2e8f0;
          font-weight: 600;
        }

        .route-tab.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .dashboard-notification {
          padding: 12px 20px 0;
        }

        .dashboard-shell {
          flex: 1;
          padding: 16px 20px 24px;
        }

        .button-primary {
          padding: 8px 18px;
          background: var(--primary, #3b82f6);
          color: white;
          border: none;
          border-radius: var(--radius-sm, 4px);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .button-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            padding: 16px 20px;
          }

          .dashboard-route-nav {
            padding: 12px 20px 0;
            flex-direction: column;
          }

          .route-tab {
            width: 100%;
          }

          .dashboard-shell {
            padding: 16px 12px 24px;
          }
        }
      `}</style>
    </div>
  )
}
