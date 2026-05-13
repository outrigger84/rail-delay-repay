import type { TocCode } from '../types'

export interface TocThreshold {
  mins: number
  pct: number
}

export interface TocRule {
  thresholds: TocThreshold[]
  scheme: string
  drUrl: string
}

export const TOC_RULES: Record<TocCode, TocRule> = {
  GW: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.gwr.com/help-and-support/making-a-claim/delay-repay' },
  XC: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.crosscountrytrains.co.uk/help-and-support/delay-repay' },
  LN: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.lner.co.uk/help/delay-repay/' },
  VT: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.avantwestcoast.co.uk/help/delay-repay' },
  SW: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.southwesternrailway.com/help-and-support/delay-repay' },
  EM: { thresholds: [{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}],                 scheme:'Delay Repay 30', drUrl:'https://www.eastmidlandsrailway.co.uk/help-and-support/delay-repay' },
  TL: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.thameslinkrailway.com/help-and-support/delay-repay' },
  NT: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.northernrailway.co.uk/help/delay-repay' },
  TP: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.tpexpress.co.uk/help/delay-repay' },
  CS: { thresholds: [{mins:60,pct:50},{mins:120,pct:100}],                                   scheme:'Delay Repay (Sleeper)', drUrl:'https://www.sleeper.scot/help/delay-repay/' },
  TW: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.tfwrail.wales/help-and-support/delay-repay' },
  LW: { thresholds: [{mins:15,pct:25},{mins:30,pct:50},{mins:60,pct:100},{mins:120,pct:100}], scheme:'Delay Repay 15', drUrl:'https://www.londonnorthwesternrailway.co.uk/help/delay-repay' },
}

export function getRule(toc: TocCode): TocRule {
  return TOC_RULES[toc]
}

export function getPct(toc: TocCode, delayMins: number): { pct: number; threshold: number } | null {
  const rule = getRule(toc)
  const hit = [...rule.thresholds].reverse().find(t => delayMins >= t.mins)
  if (!hit) return null
  return { pct: hit.pct, threshold: hit.mins }
}
