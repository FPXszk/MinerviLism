import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JobCreateRequest, JobResponse } from '../api/jobs';

type RunPanelProps = {
  onRun: (request: JobCreateRequest) => Promise<void>;
  onCancel: () => Promise<void>;
  activeJob: JobResponse | null;
  logs: string[];
  runError: string | null;
};

const COMMAND_OPTIONS = [
  { value: 'backtest', labelKey: 'runPanel.options.backtest' },
  { value: 'stage2', labelKey: 'runPanel.options.stage2' },
  { value: 'full', labelKey: 'runPanel.options.full' },
  { value: 'chart', labelKey: 'runPanel.options.chart' },
  { value: 'update_tickers', labelKey: 'runPanel.options.updateTickers' },
] as const;

const STRATEGY_OPTIONS = [
  { value: 'rule-based-stage2', label: 'Baseline Stage2' },
  { value: 'buffett-quality', label: 'Warren Buffett' },
  { value: 'soros-breakout', label: 'George Soros' },
  { value: 'lynch-growth', label: 'Peter Lynch' },
  { value: 'minervini-trend', label: 'Mark Minervini' },
  { value: 'dalio-balance', label: 'Ray Dalio' },
] as const;

const YEAR_PRESETS = [
  { label: '2020', start: '2020-01-01', end: '2020-12-31' },
  { label: '2021', start: '2021-01-01', end: '2021-12-31' },
] as const;

export const RunPanel: React.FC<RunPanelProps> = ({
  onRun,
  onCancel,
  activeJob,
  logs,
  runError,
}) => {
  const { t } = useTranslation();
  const [command, setCommand] = useState<JobCreateRequest['command']>('backtest');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [tickers, setTickers] = useState('');
  const [singleTicker, setSingleTicker] = useState('AAPL');
  const [noCharts, setNoCharts] = useState(false);
  const [withFundamentals, setWithFundamentals] = useState(false);
  const [strategyName, setStrategyName] = useState<JobCreateRequest['strategy_name']>('rule-based-stage2');
  const [minMarketCap, setMinMarketCap] = useState('5000000000');
  const [maxTickers, setMaxTickers] = useState('');
  const [timeoutSeconds, setTimeoutSeconds] = useState('7200');
  const [submitting, setSubmitting] = useState(false);

  const isRunning = activeJob?.status === 'queued' || activeJob?.status === 'running';
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const statusColor = useMemo(() => {
    switch (activeJob?.status) {
      case 'queued':
        return '#7c3aed';
      case 'running':
        return '#2563eb';
      case 'succeeded':
        return '#15803d';
      case 'failed':
      case 'timeout':
        return '#b91c1c';
      case 'cancelled':
        return '#b45309';
      default:
        return '#4b5563';
    }
  }, [activeJob?.status]);

  const buildRequest = (): JobCreateRequest => {
    const req: JobCreateRequest = {
      command,
      timeout_seconds: Number(timeoutSeconds) || 7200,
    };

    if (command === 'backtest') {
      req.start_date = startDate;
      req.end_date = endDate;
      req.strategy_name = strategyName;
      if (tickers.trim()) {
        req.tickers = tickers.trim();
      }
      req.no_charts = noCharts;
    }

    if (command === 'stage2') {
      req.with_fundamentals = withFundamentals;
    }

    if (command === 'chart') {
      req.ticker = singleTicker.trim().toUpperCase();
      req.start_date = startDate;
      req.end_date = endDate;
    }

    if (command === 'update_tickers') {
      const minValue = Number(minMarketCap);
      if (!Number.isNaN(minValue) && minValue > 0) {
        req.min_market_cap = minValue;
      }
      const maxValue = Number(maxTickers);
      if (!Number.isNaN(maxValue) && maxValue > 0) {
        req.max_tickers = maxValue;
      }
    }

    return req;
  };

  const handleRun = async () => {
    setSubmitting(true);
    try {
      await onRun(buildRequest());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={"run-panel" + (isMobile ? ' run-panel-mobile' : '')}>
      <div className="run-panel-header">
        <h3>{t('runPanel.title')}</h3>
        <div className="status-line">
          <span className="status-dot" style={{ background: statusColor }} />
          <span>
            {activeJob
              ? `${t('runPanel.status')}: ${activeJob.status}`
              : `${t('runPanel.status')}: ${t('runPanel.idle')}`}
          </span>
        </div>
      </div>

      <div className="run-grid">
        <label className="run-field">
          <span>{t('runPanel.command')}</span>
          <select
            value={command}
            onChange={(e) => setCommand(e.target.value as JobCreateRequest['command'])}
            disabled={isRunning || submitting}
          >
            {COMMAND_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>
        </label>

        {command === 'backtest' && (
          <label className="run-field run-field--highlight">
            <span>{t('runPanel.strategy', 'Strategy')}</span>
            <select
              value={strategyName ?? 'rule-based-stage2'}
              onChange={(e) => setStrategyName(e.target.value)}
              disabled={isRunning || submitting}
            >
              {STRATEGY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {(command === 'backtest' || command === 'chart') && (
          <>
            <label className="run-field run-field--highlight">
              <span>{t('runPanel.startDate')}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isRunning || submitting}
              />
            </label>
            <label className="run-field run-field--highlight">
              <span>{t('runPanel.endDate')}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isRunning || submitting}
              />
            </label>
            {command === 'backtest' && (
              <div className="run-preset-group" aria-label={t('runPanel.periodPresets', 'Period presets')}>
                <span className="run-preset-label">{t('runPanel.periodPresets', 'Period presets')}</span>
                <div className="run-preset-buttons">
                  {YEAR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="button-secondary run-preset-button"
                      onClick={() => {
                        setStartDate(preset.start)
                        setEndDate(preset.end)
                      }}
                      disabled={isRunning || submitting}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {command === 'backtest' && (
          <>
            <label className="run-field run-field--highlight run-field--full">
              <span>{t('runPanel.tickersOptional')}</span>
              <input
                type="text"
                value={tickers}
                placeholder="AAPL,MSFT,NVDA"
                onChange={(e) => setTickers(e.target.value)}
                disabled={isRunning || submitting}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={noCharts}
                onChange={(e) => setNoCharts(e.target.checked)}
                disabled={isRunning || submitting}
              />
              {t('runPanel.skipCharts')}
            </label>
          </>
        )}

        {command === 'stage2' && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={withFundamentals}
              onChange={(e) => setWithFundamentals(e.target.checked)}
              disabled={isRunning || submitting}
            />
            {t('runPanel.includeFundamentals')}
          </label>
        )}

        {command === 'chart' && (
          <label className="run-field run-field--highlight">
            <span>{t('runPanel.ticker')}</span>
            <input
              type="text"
              value={singleTicker}
              placeholder="AAPL"
              onChange={(e) => setSingleTicker(e.target.value.toUpperCase())}
              disabled={isRunning || submitting}
            />
          </label>
        )}

        {command === 'update_tickers' && (
          <>
            <label className="run-field run-field--highlight">
              <span>{t('runPanel.minMarketCap')}</span>
              <input
                type="number"
                value={minMarketCap}
                onChange={(e) => setMinMarketCap(e.target.value)}
                disabled={isRunning || submitting}
              />
            </label>
            <label className="run-field run-field--highlight">
              <span>{t('runPanel.maxTickersOptional')}</span>
              <input
                type="number"
                value={maxTickers}
                onChange={(e) => setMaxTickers(e.target.value)}
                disabled={isRunning || submitting}
              />
            </label>
          </>
        )}

        <label className="run-field run-field--highlight">
          <span>{t('runPanel.timeoutSeconds')}</span>
          <input
            type="number"
            min={30}
            max={86400}
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(e.target.value)}
            disabled={isRunning || submitting}
          />
        </label>
      </div>

      <div className="run-actions">
        <button className="button-primary" onClick={handleRun} disabled={isRunning || submitting}>
          {submitting ? t('runPanel.starting') : t('runPanel.runCommand')}
        </button>
        <button className="button-secondary" onClick={onCancel} disabled={!isRunning || submitting}>
          {t('runPanel.cancelRunningJob')}
        </button>
      </div>

      {activeJob && (
        <div className="job-meta">
          <div><strong>{t('runPanel.jobId')}:</strong> {activeJob.job_id}</div>
          <div><strong>{t('runPanel.commandLine')}:</strong> {activeJob.command_line}</div>
          {activeJob.error && <div className="run-error"><strong>{t('runPanel.error')}:</strong> {activeJob.error}</div>}
        </div>
      )}

      {runError && <div className="run-error"><strong>{t('runPanel.runError')}:</strong> {runError}</div>}

      <div className="log-panel">
        <h4>{t('runPanel.liveLogs')}</h4>
        <pre>{logs.length ? logs.join('\n') : t('runPanel.noLogsYet')}</pre>
      </div>

      <style>{`
        .run-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .run-panel-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .status-line {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
        }

        .run-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .run-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #dbe4f0;
          background: #f8fafc;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .run-field--highlight {
          border-color: #93c5fd;
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.12);
        }

        .run-field--full {
          grid-column: 1 / -1;
        }

        .run-field input,
        .run-field select {
          min-height: 44px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 14px;
        }

        .run-preset-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          border-radius: 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .run-preset-label {
          font-size: 13px;
          font-weight: 700;
          color: #1d4ed8;
        }

        .run-preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .run-preset-button {
          min-height: 40px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #dbe4f0;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 600;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
        }

        .run-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .button-primary,
        .button-secondary {
          min-height: 44px;
          padding: 10px 16px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }

        .button-secondary {
          background: #e2e8f0;
          color: #1e293b;
        }

        .job-meta,
        .log-panel {
          padding: 14px;
          border-radius: 14px;
          background: #0f172a;
          color: #e2e8f0;
        }

        .job-meta {
          display: grid;
          gap: 8px;
        }

        .run-error {
          color: #fecaca;
        }

        .log-panel pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .run-panel-mobile .run-panel-header,
          .run-panel-header {
            flex-direction: column;
          }

          .run-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
