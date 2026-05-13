export interface CallingPoint {
  station: string
  crs: string
  scheduledArr: string | null
  scheduledDep: string | null
  actualArr: string | null
  actualDep: string | null
  delayMins: number
  platform: string | null
}

export interface Leg {
  id: string
  trainUid: string
  toc: TocCode
  origin: string
  destination: string
  callingPoints: CallingPoint[]
}

export interface Journey {
  id: string
  legs: Leg[]
  changes: number
  totalMins: number
  price?: number
  label?: string
}

export type SplitType = 'virtual' | 'physical' | 'extended-wait'

export interface Ticket {
  id: string
  fromStn: string
  toStn: string
  fromCrs: string
  toCrs: string
  fromLegId: string
  toLegId: string
  splitType: SplitType
  toc: TocCode
  price: number
  type: TicketType
  claimStatus: ClaimStatus | null
  claimRef: string
  detailsComplete: boolean
}

export type TicketType = 'Advance' | 'Off-Peak' | 'Anytime' | 'Season (Weekly)' | 'Season (Monthly)'
export type ClaimStatus = 'pending' | 'submitted' | 'settled'
export type TocCode = 'GW' | 'XC' | 'LN' | 'VT' | 'SW' | 'EM' | 'TL' | 'NT' | 'TP' | 'CS' | 'TW' | 'LW'

export interface TicketAssessment {
  eligible: boolean
  delayMins: number
  pct: number | null
  threshold: number | null
  splitType: SplitType
  missedConnection: boolean
  missedConnectionNote: string
  delayAtStart?: number
  delayAccruedOnSegment?: number
  reason: string
}

export interface Claim {
  id: string
  journeyDate: string
  route: string
  fromStn: string
  toStn: string
  toc: TocCode
  tocShort: string
  price: number
  type: TicketType
  splitType: SplitType
  delayMins: number
  pct: number
  compValue: number | null
  claimStatus: ClaimStatus
  claimRef: string
  settledValue: number | null
  detailsMissing: boolean
}

export interface Station {
  name: string
  crs: string
  toc: string
}
