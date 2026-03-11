import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  type BacktestVisualization,
  type SignalEventPoint,
  type TimeSeriesPoint,
} from '../api/backtest'
import { useLazyPlotComponent } from './useLazyPlotComponent'

interface BacktestVisualizationPanelProps {
  visualization?: BacktestVisualization | null
}

function toSeriesValue(points: TimeSeriesPoint[] | undefined, key: 'time' | 'value') {
  return (points ?? []).map((point) => point[key])
}

function toSignalValues(points: SignalEventPoint[] | undefined, key: 'time' | 'price' | 'action') {
  return (points ?? []).map((point) => point[key])
}

export const BacktestVisualizationPanel: React.FC<BacktestVisualizationPanelProps> = ({ visualization }) => {
  const { t } = useTranslation()
  const { PlotComponent, plotError } = useLazyPlotComponent(true)
  const [isMobile, setIsMobile] = React.useState(false)

  const equityCurve = visualization?.equity_curve ?? []
  const drawdown = visualization?.drawdown ?? []
  const signalEvents = visualization?.signal_events ?? []

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const markerSize = signalEvents.length > 30 ? 6 : signalEvents.length > 12 ? 8 : 10

  if (!equityCurve.length && !drawdown.length && !signalEvents.length) {
    return <div className="dashboard-deferred-placeholder">{t('dashboard.noVisualization')}</div>
  }

  if (!PlotComponent || plotError) {
    return (
      <div className="visualization-fallback">
        <p>{plotError ? t('dashboard.visualizationLoadError', { error: plotError }) : t('dashboard.visualizationFallback')}</p>
        <ul>
          {signalEvents.map((event) => (
            <li key={`${event.time}-${event.ticker}-${event.action}`}>
              {event.time} / {event.ticker} / {event.action} / {event.price}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="visualization-panel-grid">
      <div className="visualization-chart-card">
        <h3>{t('dashboard.equityCurveTitle')}</h3>
        <PlotComponent
          data={[
            {
              type: 'scatter',
              mode: 'lines',
              x: toSeriesValue(equityCurve, 'time'),
              y: toSeriesValue(equityCurve, 'value'),
              line: { color: '#2563eb', width: 3 },
              fill: 'tozeroy',
              fillcolor: 'rgba(37, 99, 235, 0.12)',
            },
          ]}
          layout={{
            autosize: true,
            margin: { t: 16, r: 12, b: 36, l: 48 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { color: '#0f172a', family: 'Segoe UI, sans-serif' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '280px' }}
        />
      </div>

      <div className="visualization-chart-card">
        <h3>{t('dashboard.drawdownTitle')}</h3>
        <PlotComponent
          data={[
            {
              type: 'scatter',
              mode: 'lines',
              x: toSeriesValue(drawdown, 'time'),
              y: toSeriesValue(drawdown, 'value'),
              line: { color: '#ef4444', width: 2 },
              fill: 'tozeroy',
              fillcolor: 'rgba(239, 68, 68, 0.15)',
            },
          ]}
          layout={{
            autosize: true,
            margin: { t: 16, r: 12, b: 36, l: 48 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { color: '#0f172a', family: 'Segoe UI, sans-serif' },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '280px' }}
        />
      </div>

      <div className="visualization-chart-card visualization-chart-card--wide">
        <h3>{t('dashboard.signalEventsTitle')}</h3>
        <p className="signal-caption">
          {t(
            'dashboard.signalEventsCaption',
            'Shows entry and exit price points over time so you can quickly confirm when the strategy opened and closed positions.',
          )}
        </p>
        {isMobile ? (
          <div className="signal-mobile-list">
            <h4>{t('dashboard.latestSignalEvents', 'Latest signal events')}</h4>
            <ul>
              {signalEvents.slice(0, 20).map((event) => (
                <li key={`${event.time}-${event.ticker}-${event.action}`}>
                  <strong>{event.ticker}</strong>
                  <span>{event.action}</span>
                  <span>{event.time}</span>
                  <span>${event.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <PlotComponent
            data={[
              {
                type: 'scatter',
                mode: 'markers',
                x: toSignalValues(signalEvents, 'time'),
                y: toSignalValues(signalEvents, 'price'),
                text: signalEvents.map((event) => `${event.ticker} • ${event.action}`),
                hovertemplate: '%{text}<br>%{x}<br>$%{y}<extra></extra>',
                marker: {
                  size: markerSize,
                  color: signalEvents.map((event) => event.action === 'ENTRY' ? '#16a34a' : '#dc2626'),
                },
              },
            ]}
            layout={{
              autosize: true,
              margin: { t: 16, r: 12, b: 36, l: 48 },
              paper_bgcolor: '#ffffff',
              plot_bgcolor: '#ffffff',
              font: { color: '#0f172a', family: 'Segoe UI, sans-serif' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '320px' }}
          />
        )}
      </div>

      <style>{`
        .visualization-panel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .visualization-chart-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          padding: 14px;
        }

        .visualization-chart-card--wide {
          grid-column: 1 / -1;
        }

        .visualization-chart-card h3 {
          margin: 0 0 12px;
          font-size: 15px;
          color: #0f172a;
        }

        .signal-caption {
          margin: 0 0 12px;
          color: #475569;
          font-size: 13px;
          line-height: 1.5;
        }

        .signal-mobile-list {
          border: 1px solid #dbe4f0;
          border-radius: 12px;
          background: #f8fafc;
          padding: 12px;
        }

        .signal-mobile-list h4 {
          margin: 0 0 10px;
          color: #0f172a;
          font-size: 14px;
        }

        .signal-mobile-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .signal-mobile-list li {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 12px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          font-size: 13px;
          color: #334155;
        }

        .visualization-fallback {
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 16px;
          background: #f8fafc;
          color: #475569;
        }

        .visualization-fallback ul {
          margin: 12px 0 0;
          padding-left: 18px;
        }

        @media (max-width: 900px) {
          .visualization-panel-grid {
            grid-template-columns: 1fr;
          }

          .visualization-chart-card--wide {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  )
}
