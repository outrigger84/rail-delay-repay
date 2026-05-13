import { useState } from 'react'
import type { Journey, Leg } from '../../types'
import { TocPill } from '../ui/TocPill'
import { connectionMins } from '../../lib/timeHelpers'

function depTime(leg: Leg) {
  return leg.callingPoints[0]?.scheduledDep ?? '--:--'
}
function arrTime(leg: Leg) {
  return leg.callingPoints[leg.callingPoints.length - 1]?.scheduledArr ?? '--:--'
}

interface Props {
  journey: Journey
  onSelect: () => void
  onNextService?: (changeCrs: string, afterTime: string) => void
}

export function JourneyCard({ journey, onSelect, onNextService }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { legs } = journey
  const firstDep = depTime(legs[0])
  const lastArr = arrTime(legs[legs.length - 1])

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-semibold text-lg">{firstDep}</span>
            <span className="text-faint">→</span>
            <span className="font-mono font-semibold text-lg">{lastArr}</span>
            <span className="text-dim text-sm">{journey.totalMins}m</span>
            {journey.changes > 0 && (
              <span className="text-xs text-dim">{journey.changes} change{journey.changes > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {legs.map(leg => <TocPill key={leg.id} toc={leg.toc} short />)}
          </div>
          {journey.label && <p className="text-xs text-faint font-sans mt-1">{journey.label}</p>}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-dim text-xs hover:text-white transition-colors pt-1 flex-shrink-0"
        >
          {expanded ? '▲ Hide' : '▼ Details'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-b1 pt-3">
          {legs.map((leg, i) => {
            const prevLeg = legs[i - 1]
            const connMins = prevLeg ? connectionMins(arrTime(prevLeg), depTime(leg)) : null

            return (
              <div key={leg.id}>
                {connMins !== null && (
                  <div className={`flex items-center gap-2 my-2 text-xs ${connMins < 15 ? 'text-red' : 'text-dim'}`}>
                    <span>⟳</span>
                    <span>{connMins}m connection at {prevLeg.callingPoints[prevLeg.callingPoints.length - 1]?.station}</span>
                    {connMins < 15 && <span className="font-semibold">— tight!</span>}
                    {onNextService && (
                      <button
                        className="ml-auto text-amber hover:underline"
                        onClick={() => {
                          const cp = prevLeg.callingPoints[prevLeg.callingPoints.length - 1]
                          onNextService(cp.crs, arrTime(prevLeg))
                        }}
                      >
                        Next service →
                      </button>
                    )}
                  </div>
                )}
                <div className="bg-s2 border border-b1 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TocPill toc={leg.toc} />
                      <span className="text-xs text-dim font-mono">{leg.trainUid}</span>
                    </div>
                    <span className="text-xs text-dim">{leg.callingPoints.length} stops</span>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between text-dim">
                      <span>{leg.callingPoints[0]?.station}</span>
                      <span className="font-mono">{depTime(leg)}</span>
                    </div>
                    <div className="flex justify-between text-white mt-1">
                      <span>{leg.callingPoints[leg.callingPoints.length - 1]?.station}</span>
                      <span className="font-mono">{arrTime(leg)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={onSelect} className="btn-primary w-full text-sm">
        Lock in & set up tickets →
      </button>
    </div>
  )
}
