import type { Claim } from '../../types'

interface Props { claims: Claim[] }

export function ProgressBar({ claims }: Props) {
  const total = claims.reduce((sum, c) => sum + (c.compValue ?? 0), 0)
  if (total === 0) return null

  const settled = claims.filter(c => c.claimStatus === 'settled').reduce((s, c) => s + (c.compValue ?? 0), 0)
  const submitted = claims.filter(c => c.claimStatus === 'submitted').reduce((s, c) => s + (c.compValue ?? 0), 0)

  const settledPct = (settled / total) * 100
  const submittedPct = (submitted / total) * 100

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-dim font-mono mb-1.5">
        <span>£0</span>
        <span>£{total.toFixed(2)} total eligible</span>
      </div>
      <div className="h-3 bg-s3 rounded-full overflow-hidden flex">
        <div className="bg-green transition-all" style={{ width: `${settledPct}%` }} />
        <div className="bg-amber transition-all" style={{ width: `${submittedPct}%` }} />
      </div>
      <div className="flex gap-4 mt-1.5 text-xs text-dim font-sans">
        <span><span className="text-green">■</span> Settled £{settled.toFixed(2)}</span>
        <span><span className="text-amber">■</span> Submitted £{submitted.toFixed(2)}</span>
        <span><span className="text-faint">■</span> Pending £{(total - settled - submitted).toFixed(2)}</span>
      </div>
    </div>
  )
}
