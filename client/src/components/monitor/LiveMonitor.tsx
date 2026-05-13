import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Journey, Ticket, Leg, Claim } from '../../types'
import { fetchLiveService } from '../../lib/journeyApi'
import { assessTicket } from '../../lib/assessTicket'
import { LegMonitorCard } from './LegMonitorCard'
import { TicketClaimCard } from './TicketClaimCard'
import { useClaimsStore } from '../../store/claimsStore'


type Tab = 'trains' | 'claims'

export function LiveMonitor() {
  const { state } = useLocation() as { state: { journey: Journey; tickets: Ticket[]; date: string } | null }
  const navigate = useNavigate()
  const addClaims = useClaimsStore(s => s.addClaims)

  const [legs, setLegs] = useState<Leg[]>(state?.journey.legs ?? [])
  const [tickets, setTickets] = useState<Ticket[]>(state?.tickets ?? [])
  const [tab, setTab] = useState<Tab>('trains')

  const refreshLegs = useCallback(async () => {
    if (!state) return
    const updated = await Promise.all(
      legs.map(async leg => {
        try {
          const live = await fetchLiveService(leg.trainUid, state.date)
          return live
        } catch {
          return leg
        }
      })
    )
    setLegs(updated)
  }, [legs, state])

  useEffect(() => {
    const id = setInterval(refreshLegs, 60_000)
    return () => clearInterval(id)
  }, [refreshLegs])

  const assessments = tickets.map(t => assessTicket(t, legs))
  const eligibleCount = assessments.filter(a => a.eligible).length

  const updateTicket = (index: number, patch: Partial<Ticket>) => {
    setTickets(prev => prev.map((t, i) => i === index ? { ...t, ...patch } : t))
  }

  const saveClaims = () => {
    const claims: Claim[] = tickets
      .map((t, i) => ({ t, a: assessments[i] }))
      .filter(({ a }) => a.eligible)
      .map(({ t, a }) => {
        const pct = a.pct ?? 0
        const compValue = t.price > 0 ? t.price * pct / 100 : null
        return {
          id: t.id,
          journeyDate: state?.date ?? new Date().toISOString().slice(0, 10),
          route: `${t.fromStn} → ${t.toStn}`,
          fromStn: t.fromStn,
          toStn: t.toStn,
          toc: t.toc,
          tocShort: t.toc,
          price: t.price,
          type: t.type,
          splitType: t.splitType,
          delayMins: a.delayMins,
          pct,
          compValue,
          claimStatus: t.claimStatus ?? 'pending',
          claimRef: t.claimRef,
          settledValue: null,
          detailsMissing: !t.detailsComplete,
        } satisfies Claim
      })

    addClaims(claims)
    navigate('/rail-delay-repay/dashboard')
  }

  if (!state) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-dim">No journey to monitor. <button className="text-amber hover:underline" onClick={() => navigate('/rail-delay-repay/')}>Start over</button></p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-dim hover:text-white text-sm">← Back</button>
        <div>
          <h1 className="text-base font-mono font-semibold">Live Monitor</h1>
          <p className="text-xs text-dim">{state.journey.legs[0].origin} → {state.journey.legs[state.journey.legs.length - 1].destination} · {state.date}</p>
        </div>
      </div>

      {eligibleCount > 0 && (
        <div className="mb-4 bg-amber/10 border border-amber/30 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-amber font-mono font-semibold text-sm">
              {eligibleCount} ticket{eligibleCount > 1 ? 's' : ''} eligible for Delay Repay
            </span>
            <p className="text-xs text-dim font-sans mt-0.5">Check the Tickets & Claims tab for details</p>
          </div>
          <button className="text-amber text-xs hover:underline" onClick={() => setTab('claims')}>
            View →
          </button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-s1 border border-b1 rounded-lg p-1">
        <button
          onClick={() => setTab('trains')}
          className={`flex-1 text-sm font-mono py-1.5 rounded transition-colors ${tab === 'trains' ? 'bg-s3 text-white' : 'text-dim hover:text-white'}`}
        >
          Live Trains
        </button>
        <button
          onClick={() => setTab('claims')}
          className={`flex-1 text-sm font-mono py-1.5 rounded transition-colors ${tab === 'claims' ? 'bg-s3 text-white' : 'text-dim hover:text-white'}`}
        >
          Tickets & Claims {eligibleCount > 0 && <span className="text-amber">({eligibleCount})</span>}
        </button>
      </div>

      {tab === 'trains' && (
        <div className="space-y-4">
          {legs.map(leg => <LegMonitorCard key={leg.id} leg={leg} />)}
        </div>
      )}

      {tab === 'claims' && (
        <div className="space-y-4">
          {tickets.map((ticket, i) => (
            <TicketClaimCard
              key={ticket.id}
              ticket={ticket}
              legs={legs}
              assessment={assessments[i]}
              onUpdate={patch => updateTicket(i, patch)}
            />
          ))}
        </div>
      )}

      {eligibleCount > 0 && (
        <div className="mt-6 pt-4 border-t border-b1">
          <button onClick={saveClaims} className="btn-primary w-full">
            Save {eligibleCount} claim{eligibleCount > 1 ? 's' : ''} to dashboard →
          </button>
        </div>
      )}
    </div>
  )
}
