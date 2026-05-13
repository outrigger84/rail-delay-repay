import { useState } from 'react'
import type { Claim, ClaimStatus } from '../../types'
import { TocPill } from '../ui/TocPill'
import { SplitTypeBadge } from '../ui/SplitTypeBadge'
import { DelayBadge } from '../ui/DelayBadge'
import { getRule } from '../../lib/tocRules'

interface Props {
  claim: Claim
  onUpdate: (patch: Partial<Claim>) => void
  onRemove: () => void
}

const BORDER: Record<ClaimStatus, string> = {
  pending: 'border-l-4 border-l-faint',
  submitted: 'border-l-4 border-l-amber',
  settled: 'border-l-4 border-l-green',
}

export function ClaimRow({ claim, onUpdate, onRemove }: Props) {
  const [ref, setRef] = useState(claim.claimRef)
  const [settled, setSettled] = useState(claim.settledValue != null ? String(claim.settledValue) : '')
  const rule = getRule(claim.toc)

  const setStatus = (s: ClaimStatus) => onUpdate({ claimStatus: s })

  return (
    <div className={`card ${BORDER[claim.claimStatus]} pl-3 space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <TocPill toc={claim.toc} short />
            <SplitTypeBadge splitType={claim.splitType} />
            <DelayBadge mins={claim.delayMins} />
            {claim.detailsMissing && (
              <span className="text-xs text-amber font-mono">⚠ details missing</span>
            )}
          </div>
          <div className="text-sm font-sans">{claim.fromStn} → {claim.toStn}</div>
          <div className="text-xs text-dim font-sans">{claim.journeyDate} · {claim.type}</div>
        </div>
        <div className="text-right flex-shrink-0">
          {claim.compValue != null && (
            <div className="text-green font-mono font-semibold">£{claim.compValue.toFixed(2)}</div>
          )}
          <div className="text-xs text-dim">{claim.pct}% of £{claim.price.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['pending', 'submitted', 'settled'] as ClaimStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs font-mono px-2 py-1 rounded border transition-colors capitalize ${
              claim.claimStatus === s
                ? s === 'settled' ? 'border-green text-green bg-green/10'
                  : s === 'submitted' ? 'border-amber text-amber bg-amber/10'
                  : 'border-dim text-dim bg-dim/10'
                : 'border-b1 text-faint hover:text-dim'
            }`}
          >
            {s === 'pending' ? 'To Apply' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <a
          href={rule.drUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber hover:underline ml-auto"
        >
          {rule.scheme} ↗
        </a>
      </div>

      {(claim.claimStatus === 'submitted' || claim.claimStatus === 'settled') && (
        <div className="space-y-2">
          <input
            type="text"
            className="input text-xs"
            placeholder="Reference number…"
            value={ref}
            onChange={e => { setRef(e.target.value); onUpdate({ claimRef: e.target.value }) }}
          />
          {claim.claimStatus === 'settled' && (
            <input
              type="number"
              step="0.01"
              className="input text-xs"
              placeholder="Settled amount (£)…"
              value={settled}
              onChange={e => {
                setSettled(e.target.value)
                onUpdate({ settledValue: parseFloat(e.target.value) || null })
              }}
            />
          )}
        </div>
      )}

      <button
        onClick={onRemove}
        className="text-xs text-faint hover:text-red transition-colors"
      >
        Remove
      </button>
    </div>
  )
}
