import { useState } from 'react'
import type { Ticket, Leg, TicketAssessment, TicketType, TocCode } from '../../types'
import { TocPill } from '../ui/TocPill'
import { SplitTypeBadge } from '../ui/SplitTypeBadge'
import { DelayBadge } from '../ui/DelayBadge'
import { getRule } from '../../lib/tocRules'

interface Props {
  ticket: Ticket
  legs: Leg[]
  assessment: TicketAssessment
  onUpdate: (patch: Partial<Ticket>) => void
}

const TICKET_TYPES: TicketType[] = ['Advance', 'Off-Peak', 'Anytime', 'Season (Weekly)', 'Season (Monthly)']
const TOC_CODES: TocCode[] = ['GW', 'XC', 'LN', 'VT', 'SW', 'EM', 'TL', 'NT', 'TP', 'CS', 'TW', 'LW']

export function TicketClaimCard({ ticket, legs: _legs, assessment, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [priceInput, setPriceInput] = useState(ticket.price > 0 ? String(ticket.price) : '')
  const [claimStatus, setClaimStatus] = useState(ticket.claimStatus)
  const [claimRef, setClaimRef] = useState(ticket.claimRef)

  const compValue = ticket.price > 0 && assessment.pct ? (ticket.price * assessment.pct / 100) : null
  const rule = getRule(ticket.toc)

  const saveDetails = () => {
    const price = parseFloat(priceInput) || 0
    onUpdate({ price, detailsComplete: price > 0, toc: ticket.toc, type: ticket.type })
    setShowForm(false)
  }

  if (!assessment.eligible) {
    return (
      <div className="card opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <TocPill toc={ticket.toc} short />
          <SplitTypeBadge splitType={ticket.splitType} />
        </div>
        <div className="text-sm font-sans text-dim mt-1">
          {ticket.fromStn} → {ticket.toStn}
        </div>
        <div className="text-xs text-dim font-sans mt-1">{assessment.reason}</div>
      </div>
    )
  }

  return (
    <div className={`card border-amber/30 bg-amber/5`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TocPill toc={ticket.toc} short />
            <SplitTypeBadge splitType={ticket.splitType} />
            <DelayBadge mins={assessment.delayMins} />
          </div>
          <div className="text-sm font-sans">{ticket.fromStn} → {ticket.toStn}</div>
        </div>
        {compValue !== null && (
          <div className="text-right flex-shrink-0">
            <div className="text-green font-mono font-semibold text-lg">£{compValue.toFixed(2)}</div>
            <div className="text-xs text-dim">{assessment.pct}% comp</div>
          </div>
        )}
      </div>

      {assessment.splitType === 'virtual' && assessment.delayAtStart !== undefined && (
        <div className="bg-s3 rounded p-2 text-xs font-mono space-y-1 mb-2">
          <div className="flex justify-between"><span className="text-dim">Delay at segment start</span><span>+{assessment.delayAtStart}m</span></div>
          <div className="flex justify-between"><span className="text-dim">Delay accrued on segment</span><span>+{assessment.delayAccruedOnSegment}m</span></div>
          <div className="flex justify-between font-semibold"><span className="text-dim">Total arrival delay</span><span className="text-amber">+{assessment.delayMins}m</span></div>
        </div>
      )}

      {assessment.missedConnection && (
        <div className="text-xs text-amber font-sans bg-amber/10 rounded p-2 mb-2">
          ⚠ Missed connection — 100% compensation applicable<br />
          <span className="text-dim">{assessment.missedConnectionNote}</span>
        </div>
      )}

      {!ticket.detailsComplete && !showForm && (
        <div className="bg-amber/10 border border-amber/20 rounded p-3 flex items-center justify-between">
          <p className="text-xs text-amber font-sans">Enter ticket details to calculate compensation value</p>
          <button className="btn-ghost text-xs py-1 px-2" onClick={() => setShowForm(true)}>Add details →</button>
        </div>
      )}

      {showForm && (
        <div className="bg-s3 border border-b2 rounded p-3 space-y-3">
          <div className="text-xs text-dim font-sans">
            {rule.scheme} — {rule.thresholds.map(t => `${t.mins}m = ${t.pct}%`).join(' · ')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-dim mb-1">TOC</label>
              <select
                className="input text-xs"
                value={ticket.toc}
                onChange={e => onUpdate({ toc: e.target.value as TocCode })}
              >
                {TOC_CODES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-dim mb-1">Ticket price (£)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input text-xs"
                value={priceInput}
                placeholder="0.00"
                onChange={e => setPriceInput(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-dim mb-1">Ticket type</label>
            <select
              className="input text-xs"
              value={ticket.type}
              onChange={e => onUpdate({ type: e.target.value as TicketType })}
            >
              {TICKET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1 text-xs py-1.5" onClick={saveDetails}>Save</button>
            <button className="btn-ghost text-xs py-1.5" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {ticket.detailsComplete && compValue !== null && (
        <div className="mt-2 space-y-2">
          <a
            href={rule.drUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-amber hover:underline"
          >
            → Submit claim to {ticket.toc} ({rule.scheme}) ↗
          </a>
          <div className="flex items-center gap-2">
            {(['pending', 'submitted', 'settled'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setClaimStatus(s); onUpdate({ claimStatus: s }) }}
                className={`text-xs font-mono px-2 py-1 rounded border transition-colors capitalize ${
                  claimStatus === s ? 'border-amber text-amber bg-amber/10' : 'border-b1 text-faint hover:text-dim'
                }`}
              >
                {s === 'pending' ? 'To Apply' : s}
              </button>
            ))}
          </div>
          {(claimStatus === 'submitted' || claimStatus === 'settled') && (
            <input
              type="text"
              className="input text-xs"
              placeholder="Reference number…"
              value={claimRef}
              onChange={e => { setClaimRef(e.target.value); onUpdate({ claimRef: e.target.value }) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
