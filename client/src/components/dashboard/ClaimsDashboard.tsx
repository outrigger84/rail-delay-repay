import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClaimStatus } from '../../types'
import { useClaimsStore } from '../../store/claimsStore'
import { StatsBar } from './StatsBar'
import { ProgressBar } from './ProgressBar'
import { TocBreakdown } from './TocBreakdown'
import { ClaimRow } from './ClaimRow'

type Filter = 'all' | ClaimStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To Apply' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'settled', label: 'Settled' },
]

export function ClaimsDashboard() {
  const navigate = useNavigate()
  const { claims, updateClaim, removeClaim } = useClaimsStore()
  const [filter, setFilter] = useState<Filter>('all')

  const hasMissingDetails = claims.some(c => c.detailsMissing)
  const filtered = filter === 'all' ? claims : claims.filter(c => c.claimStatus === filter)

  if (claims.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <h1 className="text-base font-mono font-semibold mb-2">Claims Dashboard</h1>
        <p className="text-dim text-sm font-sans mb-4">No claims saved yet. Track a journey and save eligible claims.</p>
        <button onClick={() => navigate('/rail-delay-repay/')} className="btn-primary">
          Search a journey →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-base font-mono font-semibold mb-4">Claims Dashboard</h1>

      <StatsBar claims={claims} />
      <ProgressBar claims={claims} />

      {hasMissingDetails && (
        <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 mb-4 text-sm text-amber font-sans">
          ⚠ Some claims are missing ticket details — compensation values cannot be calculated
        </div>
      )}

      <TocBreakdown claims={claims} />

      <div className="flex gap-1 mb-4 bg-s1 border border-b1 rounded-lg p-1">
        {FILTERS.map(f => {
          const count = f.key === 'all' ? claims.length : claims.filter(c => c.claimStatus === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-xs font-mono py-1.5 rounded transition-colors ${
                filter === f.key ? 'bg-s3 text-white' : 'text-dim hover:text-white'
              }`}
            >
              {f.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {filtered.map(claim => (
          <ClaimRow
            key={claim.id}
            claim={claim}
            onUpdate={patch => updateClaim(claim.id, patch)}
            onRemove={() => removeClaim(claim.id)}
          />
        ))}
      </div>
    </div>
  )
}
