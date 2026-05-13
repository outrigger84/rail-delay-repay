import { describe, it, expect } from 'vitest'
import { assessTicket } from './assessTicket'
import type { Ticket, Leg, CallingPoint } from '../types'

function makeLeg(id: string, callingPoints: Partial<CallingPoint>[]): Leg {
  return {
    id,
    trainUid: 'C99999',
    toc: 'GW',
    origin: callingPoints[0]?.station ?? 'A',
    destination: callingPoints[callingPoints.length - 1]?.station ?? 'Z',
    callingPoints: callingPoints.map(cp => ({
      station: cp.station ?? 'Unknown',
      crs: cp.crs ?? 'UNK',
      scheduledArr: cp.scheduledArr ?? null,
      scheduledDep: cp.scheduledDep ?? null,
      actualArr: cp.actualArr ?? null,
      actualDep: cp.actualDep ?? null,
      delayMins: cp.delayMins ?? 0,
      platform: cp.platform ?? null,
    })),
  }
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    fromStn: 'A',
    toStn: 'B',
    fromCrs: 'AAA',
    toCrs: 'BBB',
    fromLegId: 'leg1',
    toLegId: 'leg1',
    splitType: 'virtual',
    toc: 'GW',
    price: 0,
    type: 'Advance',
    claimStatus: null,
    claimRef: '',
    detailsComplete: false,
    ...overrides,
  }
}

describe('assessTicket', () => {
  it('on-time journey is not eligible', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:00' },
    ])
    const result = assessTicket(makeTicket(), [leg])
    expect(result.eligible).toBe(false)
    expect(result.delayMins).toBe(0)
  })

  it('14-minute delay is not eligible on GWR DR15', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:14' },
    ])
    const result = assessTicket(makeTicket(), [leg])
    expect(result.eligible).toBe(false)
  })

  it('15-minute delay → 25% on GWR DR15', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:15' },
    ])
    const result = assessTicket(makeTicket(), [leg])
    expect(result.eligible).toBe(true)
    expect(result.pct).toBe(25)
    expect(result.threshold).toBe(15)
  })

  it('30-minute delay → 50%', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:30' },
    ])
    const result = assessTicket(makeTicket(), [leg])
    expect(result.eligible).toBe(true)
    expect(result.pct).toBe(50)
  })

  it('60-minute delay → 100%', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '11:00' },
    ])
    const result = assessTicket(makeTicket(), [leg])
    expect(result.eligible).toBe(true)
    expect(result.pct).toBe(100)
  })

  it('virtual split: inherited delay at start does not make A→B eligible', () => {
    // Train already 20m late at A; arrives B still 20m late — no additional delay
    const leg = makeLeg('leg1', [
      { station: 'Origin', crs: 'ORI', scheduledDep: '08:00', actualDep: '08:20' },
      { station: 'A', crs: 'AAA', scheduledArr: '09:00', actualArr: '09:20' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:20' },
    ])
    const ticket = makeTicket({ fromCrs: 'AAA', fromStn: 'A', toCrs: 'BBB', toStn: 'B' })
    const result = assessTicket(ticket, [leg])
    expect(result.eligible).toBe(false)
    expect(result.delayAtStart).toBe(20)
    expect(result.delayAccruedOnSegment).toBe(0)
  })

  it('virtual split: additional delay on B→C segment makes it eligible', () => {
    // Train 5m late at B but picks up further delay; arrives C 20m late
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:05' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:05' },
      { station: 'C', crs: 'CCC', scheduledArr: '11:00', actualArr: '11:20' },
    ])
    const ticket = makeTicket({ fromCrs: 'BBB', fromStn: 'B', toCrs: 'CCC', toStn: 'C' })
    const result = assessTicket(ticket, [leg])
    expect(result.eligible).toBe(true)
    expect(result.delayAtStart).toBe(5)
    expect(result.delayAccruedOnSegment).toBe(15)
    expect(result.delayMins).toBe(20)
    expect(result.pct).toBe(25)
  })

  it('physical split: missed connection causes 100% on second ticket', () => {
    const leg1 = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      // Arrives Bristol 30m late — too late for connecting service
      { station: 'Bristol', crs: 'BRI', scheduledArr: '10:00', actualArr: '10:35' },
    ])
    const leg2 = makeLeg('leg2', [
      { station: 'Bristol', crs: 'BRI', scheduledDep: '10:15', actualDep: '10:15' },
      { station: 'C', crs: 'CCC', scheduledArr: '11:30', actualArr: '11:30' },
    ])
    const ticket = makeTicket({
      fromCrs: 'BRI', fromStn: 'Bristol',
      toCrs: 'CCC', toStn: 'C',
      fromLegId: 'leg1', toLegId: 'leg2',
      splitType: 'physical',
    })
    const result = assessTicket(ticket, [leg1, leg2])
    expect(result.eligible).toBe(true)
    expect(result.missedConnection).toBe(true)
    expect(result.pct).toBe(100)
  })

  it('EMR: 29-minute delay is not eligible (DR30 operator)', () => {
    const leg = makeLeg('leg1', [
      { station: 'A', crs: 'AAA', scheduledDep: '09:00', actualDep: '09:00' },
      { station: 'B', crs: 'BBB', scheduledArr: '10:00', actualArr: '10:29' },
    ])
    const ticket = makeTicket({ toc: 'EM' })
    const result = assessTicket(ticket, [leg])
    expect(result.eligible).toBe(false)
  })
})
