import { useState } from 'react'
import type { Leg } from '../../types'
import { TocPill } from '../ui/TocPill'
import { DelayBadge } from '../ui/DelayBadge'

interface Props {
  leg: Leg
}

export function LegMonitorCard({ leg }: Props) {
  const [expanded, setExpanded] = useState(false)
  const lastCp = leg.callingPoints[leg.callingPoints.length - 1]
  const maxDelay = Math.max(...leg.callingPoints.map(cp => cp.delayMins))
  const firstCp = leg.callingPoints[0]

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <TocPill toc={leg.toc} />
            <span className="text-xs text-dim font-mono">{leg.trainUid}</span>
            <DelayBadge mins={maxDelay} />
          </div>
          <div className="text-sm font-sans">
            <div className="text-dim">{leg.origin}</div>
            <div className="text-white font-semibold">{leg.destination}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-sm">
            <span className="text-dim">{firstCp?.scheduledDep ?? '--:--'}</span>
            {firstCp?.actualDep && firstCp.actualDep !== firstCp.scheduledDep && (
              <span className="ml-1 text-red">{firstCp.actualDep}</span>
            )}
          </div>
          <div className="font-mono text-sm mt-0.5">
            <span className="text-dim">{lastCp?.scheduledArr ?? '--:--'}</span>
            {lastCp?.actualArr && lastCp.actualArr !== lastCp.scheduledArr && (
              <span className="ml-1 text-red">{lastCp.actualArr}</span>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-dim hover:text-white mt-1"
          >
            {expanded ? '▲' : '▼'} {leg.callingPoints.length} stops
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-b1 pt-3 space-y-1">
          {leg.callingPoints.map((cp, i) => (
            <div key={cp.crs + i} className="flex items-center gap-3 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cp.delayMins >= 30 ? 'bg-amber' : cp.delayMins >= 5 ? 'bg-red' : 'bg-green'}`} />
              <span className="font-sans text-dim flex-1">{cp.station}</span>
              <span className="font-mono text-faint">{cp.scheduledArr ?? cp.scheduledDep ?? ''}</span>
              {cp.actualArr && cp.actualArr !== cp.scheduledArr && (
                <span className="font-mono text-red">{cp.actualArr}</span>
              )}
              {cp.delayMins > 0 && <DelayBadge mins={cp.delayMins} />}
              {cp.platform && <span className="text-faint">Plt {cp.platform}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
