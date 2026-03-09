import React from 'react'

type PlotComponentType = React.ComponentType<Record<string, unknown>>

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}

export function useLazyPlotComponent() {
  const [PlotComponent, setPlotComponent] = React.useState<PlotComponentType | null>(null)
  const [plotError, setPlotError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true

    void import('react-plotly.js')
      .then((module) => {
        if (!mounted) return
        const component = module.default ?? module
        setPlotComponent(() => component as PlotComponentType)
      })
      .catch((error: unknown) => {
        if (!mounted) return
        setPlotError(toErrorMessage(error))
      })

    return () => {
      mounted = false
    }
  }, [])

  return { PlotComponent, plotError }
}
