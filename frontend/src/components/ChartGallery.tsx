/**
 * Chart Gallery Component
 * Displays backtest chart images in a grid
 */
import React, { useEffect, useMemo, useState } from 'react'

interface ChartGalleryProps {
  charts: Record<string, string | null>
  loading?: boolean
}

export const ChartGallery: React.FC<ChartGalleryProps> = ({ charts, loading = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  if (loading) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-slate-300">Loading charts...</div>
  }

  const chartEntries = Object.entries(charts).filter(([, image]) => image !== null) as [string, string][]

  const topCharts = useMemo(() => chartEntries.filter(([key]) => key.startsWith('top_')), [chartEntries])
  const bottomCharts = useMemo(() => chartEntries.filter(([key]) => key.startsWith('bottom_')), [chartEntries])
  const otherCharts = useMemo(
    () => chartEntries.filter(([key]) => !key.startsWith('top_') && !key.startsWith('bottom_')),
    [chartEntries],
  )

  const orderedEntries = useMemo(
    () => [...topCharts, ...bottomCharts, ...otherCharts],
    [topCharts, bottomCharts, otherCharts],
  )

  const indexByKey = useMemo(() => {
    const indexMap = new Map<string, number>()
    orderedEntries.forEach(([key], index) => indexMap.set(key, index))
    return indexMap
  }, [orderedEntries])

  if (chartEntries.length === 0) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-slate-300">No charts available</div>
  }

  const selectedChart = selectedIndex === null ? null : orderedEntries[selectedIndex]
  const canNavigate = orderedEntries.length > 1

  const openChartByKey = (key: string) => {
    const index = indexByKey.get(key)
    if (index === undefined) {
      return
    }
    setSelectedIndex(index)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const moveChart = (delta: number) => {
    if (selectedIndex === null || orderedEntries.length === 0) {
      return
    }
    const next = (selectedIndex + delta + orderedEntries.length) % orderedEntries.length
    setSelectedIndex(next)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const closeModal = () => {
    setSelectedIndex(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setIsDragging(false)
  }

  useEffect(() => {
    if (selectedIndex === null) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        moveChart(1)
      } else if (event.key === 'ArrowLeft') {
        moveChart(-1)
      } else if (event.key === 'Escape') {
        closeModal()
      } else if (event.key === '+' || event.key === '=') {
        setZoom((prev) => Math.min(6, Number((prev + 0.2).toFixed(2))))
      } else if (event.key === '-') {
        setZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedIndex, orderedEntries.length])

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const zoomDelta = event.deltaY < 0 ? 0.15 : -0.15
    setZoom((prev) => Math.max(1, Math.min(6, Number((prev + zoomDelta).toFixed(2)))))
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) {
      return
    }
    setIsDragging(true)
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) {
      return
    }
    setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const renderSection = (title: string, entries: [string, string][]) => {
    if (entries.length === 0) {
      return null
    }

    return (
      <section className="mb-8" key={title}>
        <h3 className="mb-3 border-b border-slate-700 pb-2 text-sm font-semibold text-slate-200">{title}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(([key, image]) => (
            <button
              key={key}
              type="button"
              className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-left transition hover:-translate-y-0.5 hover:border-sky-500/50"
              onClick={() => openChartByKey(key)}
            >
              <img src={image} alt={key} className="h-auto w-full" />
              <div className="border-t border-slate-800 px-3 py-2 text-xs text-slate-400 group-hover:text-slate-200">
                {key.replace(/_/g, ' ')}
              </div>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      {renderSection('Top Winners', topCharts)}
      {renderSection('Bottom Losers', bottomCharts)}
      {renderSection('Other Charts', otherCharts)}

      {selectedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onClick={closeModal}>
          <div className="relative max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">{selectedChart[0].replace(/_/g, ' ')}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))))}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(6, Number((prev + 0.2).toFixed(2))))}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1)
                    setPan({ x: 0, y: 0 })
                  }}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              className={`relative h-[78vh] overflow-hidden ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={selectedChart[1]}
                alt={selectedChart[0]}
                className="h-full w-full select-none object-contain"
                draggable={false}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}
              />
            </div>

            {canNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => moveChart(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-500 bg-slate-900/80 px-3 py-2 text-lg text-slate-100 hover:bg-slate-800"
                  aria-label="Previous chart"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveChart(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-500 bg-slate-900/80 px-3 py-2 text-lg text-slate-100 hover:bg-slate-800"
                  aria-label="Next chart"
                >
                  ›
                </button>
              </>
            )}

            <div className="border-t border-slate-700 bg-slate-950/80 px-4 py-2 text-xs text-slate-400">
              {selectedIndex !== null ? `${selectedIndex + 1} / ${orderedEntries.length}` : ''} ・ ← → で移動 / ホイールで拡大縮小 / Escで閉じる
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
