import React from 'react'

type PlotComponentType = React.ComponentType<Record<string, unknown>>
type PlotComponentFactory = (plotly: unknown) => PlotComponentType

type PlotlyCore = {
  register?: (modules: unknown[]) => void
}

let plotComponentPromise: Promise<PlotComponentType> | null = null

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}

function loadPlotComponent(): Promise<PlotComponentType> {
  if (!plotComponentPromise) {
    plotComponentPromise = Promise.all([
      import('react-plotly.js/factory'),
      import('plotly.js/lib/core'),
      import('plotly.js/lib/scatter'),
    ]).then(([factoryModule, plotlyCoreModule, scatterModule]) => {
      const createPlotComponent = (factoryModule.default ?? factoryModule) as PlotComponentFactory
      const plotlyCore = (plotlyCoreModule.default ?? plotlyCoreModule) as PlotlyCore
      const scatter = scatterModule.default ?? scatterModule
      plotlyCore.register?.([scatter])
      return createPlotComponent(plotlyCore)
    })
  }

  return plotComponentPromise
}

export function useLazyPlotComponent(enabled = true) {
  const [PlotComponent, setPlotComponent] = React.useState<PlotComponentType | null>(null)
  const [plotError, setPlotError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled) {
      setPlotComponent(null)
      setPlotError(null)
      return
    }

    let mounted = true

    void loadPlotComponent()
      .then((component) => {
        if (!mounted) return
        setPlotComponent(() => component)
      })
      .catch((error: unknown) => {
        if (!mounted) return
        setPlotError(toErrorMessage(error))
      })

    return () => {
      mounted = false
    }
  }, [enabled])

  return { PlotComponent, plotError }
}
