import type { TocCode } from '../../types'

const TOC_COLOURS: Record<TocCode, string> = {
  GW: 'bg-green/20 text-green border-green/30',
  XC: 'bg-red/20 text-red border-red/30',
  LN: 'bg-amber/20 text-amber border-amber/30',
  VT: 'bg-red/20 text-red border-red/30',
  SW: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  EM: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
  TL: 'bg-pink-400/20 text-pink-300 border-pink-400/30',
  NT: 'bg-amber/20 text-amber border-amber/30',
  TP: 'bg-amber/20 text-amber border-amber/30',
  CS: 'bg-blue-800/30 text-blue-200 border-blue-800/40',
  TW: 'bg-green/20 text-green border-green/30',
  LW: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
}

const TOC_NAMES: Record<TocCode, string> = {
  GW: 'GWR', XC: 'CrossCountry', LN: 'LNER', VT: 'Avanti',
  SW: 'SWR', EM: 'EMR', TL: 'Thameslink', NT: 'Northern',
  TP: 'TPE', CS: 'Caledonian', TW: 'TfW', LW: 'LNW',
}

export function TocPill({ toc, short }: { toc: TocCode; short?: boolean }) {
  const colour = TOC_COLOURS[toc] ?? 'bg-dim/20 text-dim border-dim/30'
  const label = short ? toc : (TOC_NAMES[toc] ?? toc)
  return (
    <span className={`inline-flex items-center border rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${colour}`}>
      {label}
    </span>
  )
}
