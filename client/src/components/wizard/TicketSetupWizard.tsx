import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Journey, Ticket, SplitType } from '../../types'
import { SplitQuestion } from './SplitQuestion'
import { SplitPointSelector } from './SplitPointSelector'
import { buildTicketsFromSplits } from '../../lib/journeyApi'

interface SplitPoint {
  crs: string
  station: string
  splitType: SplitType
}

export function TicketSetupWizard() {
  const { state } = useLocation() as { state: { journey: Journey; date: string } | null }
  const navigate = useNavigate()
  const [step, setStep] = useState<'question' | 'splits'>('question')

  if (!state) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-dim">No journey selected. <button className="text-amber hover:underline" onClick={() => navigate('/rail-delay-repay/')}>Start over</button></p>
      </div>
    )
  }

  const { journey, date } = state

  const handleNoSplits = () => {
    const firstCp = journey.legs[0].callingPoints[0]
    const lastLeg = journey.legs[journey.legs.length - 1]
    const lastCp = lastLeg.callingPoints[lastLeg.callingPoints.length - 1]

    const ticket: Ticket = {
      id: `ticket-${firstCp.crs}-${lastCp.crs}-${Date.now()}`,
      fromStn: firstCp.station,
      toStn: lastCp.station,
      fromCrs: firstCp.crs,
      toCrs: lastCp.crs,
      fromLegId: journey.legs[0].id,
      toLegId: lastLeg.id,
      splitType: journey.legs.length > 1 ? 'physical' : 'virtual',
      toc: journey.legs[0].toc,
      price: 0,
      type: 'Advance',
      claimStatus: null,
      claimRef: '',
      detailsComplete: false,
    }

    navigate('/rail-delay-repay/monitor', { state: { journey, tickets: [ticket], date } })
  }

  const handleSplits = (splitPoints: SplitPoint[]) => {
    const tickets = buildTicketsFromSplits(journey, splitPoints.map(s => s.crs))
    const updatedTickets = tickets.map(t => {
      const sp = splitPoints.find(s => s.crs === t.fromCrs || s.crs === t.toCrs)
      return sp ? { ...t, splitType: sp.splitType } : t
    })
    navigate('/rail-delay-repay/monitor', { state: { journey, tickets: updatedTickets, date } })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-dim hover:text-white text-sm">← Back</button>
        <div>
          <h1 className="text-base font-mono font-semibold">Ticket Setup</h1>
          <p className="text-xs text-dim">{journey.legs[0].origin} → {journey.legs[journey.legs.length - 1].destination}</p>
        </div>
      </div>

      {step === 'question' ? (
        <SplitQuestion onAnswer={hasSplits => {
          if (hasSplits) setStep('splits')
          else handleNoSplits()
        }} />
      ) : (
        <SplitPointSelector journey={journey} onConfirm={handleSplits} />
      )}
    </div>
  )
}
