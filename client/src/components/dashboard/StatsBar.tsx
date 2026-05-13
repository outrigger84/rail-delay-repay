import type { Claim } from '../../types'

interface Props { claims: Claim[] }

export function StatsBar({ claims }: Props) {
  const eligible = claims.length
  const settled = claims.filter(c => c.claimStatus === 'settled').length
  const submitted = claims.filter(c => c.claimStatus === 'submitted').length
  const pending = claims.filter(c => c.claimStatus === 'pending').length

  const totalValue = claims.reduce((sum, c) => sum + (c.compValue ?? 0), 0)
  const settledValue = claims.filter(c => c.claimStatus === 'settled').reduce((sum, c) => sum + (c.settledValue ?? c.compValue ?? 0), 0)

  const cells = [
    { label: 'Total eligible', value: eligible, sub: `£${totalValue.toFixed(2)}` },
    { label: 'Settled', value: settled, sub: `£${settledValue.toFixed(2)}`, colour: 'text-green' },
    { label: 'Submitted', value: submitted, colour: 'text-amber' },
    { label: 'To apply', value: pending, colour: pending > 0 ? 'text-amber animate-pulse' : undefined },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {cells.map(cell => (
        <div key={cell.label} className="card text-center py-3">
          <div className={`text-xl font-mono font-semibold ${cell.colour ?? 'text-white'}`}>{cell.value}</div>
          <div className="text-xs text-dim font-sans">{cell.label}</div>
          {cell.sub && <div className="text-xs text-faint font-mono mt-0.5">{cell.sub}</div>}
        </div>
      ))}
    </div>
  )
}
