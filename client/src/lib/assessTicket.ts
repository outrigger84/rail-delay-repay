import type { Ticket, Leg, TicketAssessment } from '../types'
import { getPct } from './tocRules'
import { toMins } from './timeHelpers'

export function assessTicket(ticket: Ticket, legs: Leg[]): TicketAssessment {
  const base: Omit<TicketAssessment, 'eligible' | 'delayMins' | 'pct' | 'threshold' | 'reason'> = {
    splitType: ticket.splitType,
    missedConnection: false,
    missedConnectionNote: '',
  }

  if (ticket.splitType === 'virtual') {
    return assessVirtual(ticket, legs, base)
  } else if (ticket.splitType === 'physical') {
    return assessPhysical(ticket, legs, base)
  } else {
    return assessExtendedWait(ticket, legs, base)
  }
}

function findCallingPoint(leg: Leg, crs: string) {
  return leg.callingPoints.find(cp => cp.crs === crs) ?? null
}

function computeDelay(cp: { actualArr: string | null; scheduledArr: string | null; actualDep: string | null; scheduledDep: string | null }): number {
  const arrDelay = cp.actualArr && cp.scheduledArr ? toMins(cp.actualArr) - toMins(cp.scheduledArr) : null
  const depDelay = cp.actualDep && cp.scheduledDep ? toMins(cp.actualDep) - toMins(cp.scheduledDep) : null
  if (arrDelay !== null) return Math.max(0, arrDelay)
  if (depDelay !== null) return Math.max(0, depDelay)
  return 0
}

function assessVirtual(
  ticket: Ticket,
  legs: Leg[],
  base: Omit<TicketAssessment, 'eligible' | 'delayMins' | 'pct' | 'threshold' | 'reason'>
): TicketAssessment {
  const leg = legs.find(l => l.id === ticket.fromLegId)
  if (!leg) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Leg data not available.' }
  }

  const startCp = findCallingPoint(leg, ticket.fromCrs)
  const endCp = findCallingPoint(leg, ticket.toCrs)

  if (!startCp || !endCp) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Calling point data not available.' }
  }

  const delayAtStart = computeDelay(startCp)
  const delayAtEnd = computeDelay(endCp)
  const delayAccruedOnSegment = Math.max(0, delayAtEnd - delayAtStart)

  if (delayAtEnd === 0) {
    return {
      ...base, eligible: false, delayMins: 0, pct: null, threshold: null,
      delayAtStart, delayAccruedOnSegment: 0,
      reason: 'On time — no claim needed.',
    }
  }

  if (delayAtStart === delayAtEnd) {
    return {
      ...base, eligible: false, delayMins: delayAtEnd, pct: null, threshold: null,
      delayAtStart, delayAccruedOnSegment: 0,
      reason: `+${delayAtEnd}m delay was already present before this ticket segment started — not eligible.`,
    }
  }

  const hit = getPct(ticket.toc, delayAtEnd)
  if (!hit) {
    return {
      ...base, eligible: false, delayMins: delayAtEnd, pct: null, threshold: null,
      delayAtStart, delayAccruedOnSegment,
      reason: `+${delayAtEnd}m total delay — below ${ticket.toc} threshold.`,
    }
  }

  return {
    ...base, eligible: true, delayMins: delayAtEnd, pct: hit.pct, threshold: hit.threshold,
    delayAtStart, delayAccruedOnSegment,
    reason: `+${delayAtEnd}m arrival delay (+${delayAccruedOnSegment}m on this segment) — ${hit.pct}% compensation.`,
  }
}

function assessPhysical(
  ticket: Ticket,
  legs: Leg[],
  base: Omit<TicketAssessment, 'eligible' | 'delayMins' | 'pct' | 'threshold' | 'reason'>
): TicketAssessment {
  const fromLeg = legs.find(l => l.id === ticket.fromLegId)
  const toLeg = legs.find(l => l.id === ticket.toLegId)

  if (!toLeg) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Leg data not available.' }
  }

  // Check for missed connection: did fromLeg arrive at change station after toLeg was scheduled to depart?
  let missedConnection = false
  let missedConnectionNote = ''

  if (fromLeg && fromLeg.id !== toLeg.id) {
    const changeStations = fromLeg.callingPoints
      .filter(cp => toLeg.callingPoints.some(tcp => tcp.crs === cp.crs))

    for (const changeCp of changeStations) {
      const fromLegArr = changeCp.actualArr ?? changeCp.scheduledArr
      const toLegStart = toLeg.callingPoints[0]
      const toLegSchedDep = toLegStart?.scheduledDep

      if (fromLegArr && toLegSchedDep) {
        const fromArrMins = toMins(fromLegArr)
        const toSchedDepMins = toMins(toLegSchedDep)
        if (fromArrMins > toSchedDepMins) {
          missedConnection = true
          missedConnectionNote = `Arrived ${changeCp.station} at ${fromLegArr}, connecting service departed at ${toLegSchedDep}.`
        }
      }
    }
  }

  if (missedConnection) {
    const endCp = findCallingPoint(toLeg, ticket.toCrs)
    const delayMins = endCp ? computeDelay(endCp) : 0
    return {
      ...base, eligible: true, delayMins, pct: 100, threshold: null,
      missedConnection: true, missedConnectionNote,
      reason: `Missed connection — 100% compensation. ${missedConnectionNote}`,
    }
  }

  const endCp = findCallingPoint(toLeg, ticket.toCrs)
  if (!endCp) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Destination calling point not found.' }
  }

  const delayAtEnd = computeDelay(endCp)
  if (delayAtEnd === 0) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'On time — no claim needed.' }
  }

  const hit = getPct(ticket.toc, delayAtEnd)
  if (!hit) {
    return { ...base, eligible: false, delayMins: delayAtEnd, pct: null, threshold: null, reason: `+${delayAtEnd}m delay — below ${ticket.toc} threshold.` }
  }

  return {
    ...base, eligible: true, delayMins: delayAtEnd, pct: hit.pct, threshold: hit.threshold,
    reason: `+${delayAtEnd}m arrival delay at ${ticket.toStn} — ${hit.pct}% compensation.`,
  }
}

function assessExtendedWait(
  ticket: Ticket,
  legs: Leg[],
  base: Omit<TicketAssessment, 'eligible' | 'delayMins' | 'pct' | 'threshold' | 'reason'>
): TicketAssessment {
  const toLeg = legs.find(l => l.id === ticket.toLegId)
  if (!toLeg) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Leg data not available.' }
  }

  const endCp = findCallingPoint(toLeg, ticket.toCrs)
  if (!endCp) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'Destination calling point not found.' }
  }

  const delayAtEnd = computeDelay(endCp)
  if (delayAtEnd === 0) {
    return { ...base, eligible: false, delayMins: 0, pct: null, threshold: null, reason: 'On time — no claim needed.' }
  }

  const hit = getPct(ticket.toc, delayAtEnd)
  if (!hit) {
    return { ...base, eligible: false, delayMins: delayAtEnd, pct: null, threshold: null, reason: `+${delayAtEnd}m delay — below ${ticket.toc} threshold.` }
  }

  return {
    ...base, eligible: true, delayMins: delayAtEnd, pct: hit.pct, threshold: hit.threshold,
    reason: `+${delayAtEnd}m arrival delay at ${ticket.toStn} — ${hit.pct}% compensation.`,
  }
}
