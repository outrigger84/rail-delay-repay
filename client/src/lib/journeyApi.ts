import type { Journey, Leg, CallingPoint } from '../types'

const BASE = '/rail-delay-repay/api'

export async function searchJourneys(
  fromCrs: string,
  toCrs: string,
  date: string,
  time: string
): Promise<Journey[]> {
  const params = new URLSearchParams({ fromCrs, toCrs, date, time })
  const res = await fetch(`${BASE}/journey?${params}`)
  if (!res.ok) throw new Error(`Journey search failed: ${res.statusText}`)
  return res.json()
}

export async function fetchLiveService(serviceUid: string, date: string): Promise<Leg> {
  const res = await fetch(`${BASE}/live/${serviceUid}/${date}`)
  if (!res.ok) throw new Error(`Live fetch failed: ${res.statusText}`)
  return res.json()
}

export async function fetchNextService(
  fromCrs: string,
  toCrs: string,
  date: string,
  afterTime: string
): Promise<Journey[]> {
  const params = new URLSearchParams({ fromCrs, toCrs, date, time: afterTime })
  const res = await fetch(`${BASE}/journey?${params}`)
  if (!res.ok) throw new Error(`Next service fetch failed: ${res.statusText}`)
  return res.json()
}

export function buildTicketsFromSplits(journey: Journey, splitCrsCodes: string[]): import('../types').Ticket[] {
  const { legs } = journey
  const allCallingPoints: Array<{ station: string; crs: string; legId: string }> = []
  for (const leg of legs) {
    for (const cp of leg.callingPoints) {
      if (!allCallingPoints.some(p => p.crs === cp.crs)) {
        allCallingPoints.push({ station: cp.station, crs: cp.crs, legId: leg.id })
      }
    }
  }

  const origin = allCallingPoints[0]
  const dest = allCallingPoints[allCallingPoints.length - 1]
  const boundaries = [
    origin,
    ...splitCrsCodes
      .map(crs => allCallingPoints.find(p => p.crs === crs))
      .filter((p): p is typeof origin => p !== undefined),
    dest,
  ]

  return boundaries.slice(0, -1).map((from, i) => {
    const to = boundaries[i + 1]
    const fromLeg = legs.find(l => l.callingPoints.some(cp => cp.crs === from.crs))!
    const toLeg = legs.find(l => l.callingPoints.some(cp => cp.crs === to.crs))!
    const splitType = fromLeg.id === toLeg.id ? 'virtual' : 'physical'

    return {
      id: `ticket-${from.crs}-${to.crs}-${Date.now()}`,
      fromStn: from.station,
      toStn: to.station,
      fromCrs: from.crs,
      toCrs: to.crs,
      fromLegId: fromLeg.id,
      toLegId: toLeg.id,
      splitType,
      toc: fromLeg.toc,
      price: 0,
      type: 'Advance' as const,
      claimStatus: null,
      claimRef: '',
      detailsComplete: false,
    }
  })
}

export function calcDelayMins(cp: CallingPoint): number {
  if (cp.actualArr && cp.scheduledArr) {
    const [ah, am] = cp.actualArr.split(':').map(Number)
    const [sh, sm] = cp.scheduledArr.split(':').map(Number)
    return Math.max(0, (ah * 60 + am) - (sh * 60 + sm))
  }
  if (cp.actualDep && cp.scheduledDep) {
    const [ah, am] = cp.actualDep.split(':').map(Number)
    const [sh, sm] = cp.scheduledDep.split(':').map(Number)
    return Math.max(0, (ah * 60 + am) - (sh * 60 + sm))
  }
  return 0
}
