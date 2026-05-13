import { useState } from 'react'
import type { Journey, SplitType } from '../../types'

interface SplitPoint {
  crs: string
  station: string
  splitType: SplitType
}

interface CallingPointEntry {
  station: string
  crs: string
  legId: string
  isChange: boolean
  isOrigin: boolean
  isDest: boolean
}

interface Props {
  journey: Journey
  onConfirm: (splits: SplitPoint[]) => void
}

export function SplitPointSelector({ journey, onConfirm }: Props) {
  const [splits, setSplits] = useState<Record<string, SplitType>>({})

  const changeStationCrs = new Set(
    journey.legs.slice(0, -1).map(leg => leg.callingPoints[leg.callingPoints.length - 1].crs)
  )

  const allPoints: CallingPointEntry[] = []
  for (let i = 0; i < journey.legs.length; i++) {
    const leg = journey.legs[i]
    for (let j = 0; j < leg.callingPoints.length; j++) {
      const cp = leg.callingPoints[j]
      const isFirst = i === 0 && j === 0
      const isLast = i === journey.legs.length - 1 && j === leg.callingPoints.length - 1
      if (!allPoints.some(p => p.crs === cp.crs)) {
        allPoints.push({
          station: cp.station,
          crs: cp.crs,
          legId: leg.id,
          isChange: changeStationCrs.has(cp.crs) && !isFirst && !isLast,
          isOrigin: isFirst,
          isDest: isLast,
        })
      }
    }
  }

  const toggle = (crs: string, isChange: boolean) => {
    setSplits(prev => {
      if (prev[crs]) {
        const next = { ...prev }; delete next[crs]; return next
      }
      return { ...prev, [crs]: isChange ? 'physical' : 'virtual' }
    })
  }

  const setSplitType = (crs: string, type: SplitType) => {
    setSplits(prev => ({ ...prev, [crs]: type }))
  }

  const confirm = () => {
    const result: SplitPoint[] = Object.entries(splits).map(([crs, splitType]) => ({
      crs,
      station: allPoints.find(p => p.crs === crs)?.station ?? crs,
      splitType,
    }))
    onConfirm(result)
  }

  const splitCount = Object.keys(splits).length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-mono font-semibold mb-1">Select split points</h2>
        <p className="text-sm text-dim font-sans">Mark where your tickets begin and end. Physical changes are pre-flagged.</p>
      </div>

      <div className="card space-y-0 p-0 overflow-hidden">
        {allPoints.map((point, idx) => {
          const isSelected = !!splits[point.crs]
          const isEndpoint = point.isOrigin || point.isDest

          return (
            <div key={point.crs}>
              {idx > 0 && <div className="mx-4 border-t border-b1" />}
              <div className={`px-4 py-3 ${isEndpoint ? 'bg-s2' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    point.isOrigin || point.isDest ? 'bg-amber' :
                    point.isChange ? 'bg-amber/60 ring-1 ring-amber/40' : 'bg-b2'
                  }`} />
                  <span className={`flex-1 text-sm font-sans ${isEndpoint ? 'text-white font-semibold' : 'text-dim'}`}>
                    {point.station}
                    {point.isChange && <span className="ml-2 text-xs text-amber/70 font-mono">change here</span>}
                  </span>
                  <span className="text-xs text-faint font-mono">{point.crs}</span>
                  {!isEndpoint && (
                    <button
                      onClick={() => toggle(point.crs, point.isChange)}
                      className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                        isSelected
                          ? 'border-amber text-amber bg-amber/10'
                          : 'border-b2 text-faint hover:border-dim hover:text-dim'
                      }`}
                    >
                      {isSelected ? '✓ Split' : '+ Split'}
                    </button>
                  )}
                </div>
                {isSelected && (
                  <div className="mt-2 ml-5 flex gap-2">
                    {(['virtual', 'physical', 'extended-wait'] as SplitType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setSplitType(point.crs, t)}
                        className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                          splits[point.crs] === t
                            ? 'border-amber bg-amber/10 text-amber'
                            : 'border-b1 text-faint hover:text-dim'
                        }`}
                      >
                        {t === 'virtual' ? 'Virtual' : t === 'physical' ? 'Physical' : 'Extended wait'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {splitCount > 0 && (
        <p className="text-xs text-dim font-sans">
          {splitCount} split point{splitCount > 1 ? 's' : ''} selected — creates {splitCount + 1} tickets
        </p>
      )}

      <button onClick={confirm} className="btn-primary w-full">
        Confirm splits & start monitoring →
      </button>
    </div>
  )
}
