import type { SplitType } from '../../types'

const LABELS: Record<SplitType, string> = {
  virtual: 'Virtual split',
  physical: 'Physical split',
  'extended-wait': 'Extended wait',
}

const COLOURS: Record<SplitType, string> = {
  virtual: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  physical: 'bg-amber/10 text-amber border-amber/20',
  'extended-wait': 'bg-purple-400/10 text-purple-300 border-purple-400/20',
}

export function SplitTypeBadge({ splitType }: { splitType: SplitType }) {
  return (
    <span className={`inline-flex items-center border rounded px-1.5 py-0.5 text-xs font-mono ${COLOURS[splitType]}`}>
      {LABELS[splitType]}
    </span>
  )
}
