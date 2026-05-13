import type { Claim, TocCode } from '../../types'
import { TocPill } from '../ui/TocPill'

interface Props { claims: Claim[] }

export function TocBreakdown({ claims }: Props) {
  const byToc = claims.reduce<Record<string, { count: number; value: number }>>((acc, c) => {
    const key = c.toc
    if (!acc[key]) acc[key] = { count: 0, value: 0 }
    acc[key].count++
    acc[key].value += c.compValue ?? 0
    return acc
  }, {})

  const sorted = Object.entries(byToc).sort((a, b) => b[1].value - a[1].value)
  if (sorted.length === 0) return null

  const maxValue = Math.max(...sorted.map(([, v]) => v.value))

  return (
    <div className="card mb-4">
      <h3 className="text-xs text-dim font-mono uppercase tracking-wider mb-3">By operator</h3>
      <div className="space-y-2">
        {sorted.map(([toc, data]) => (
          <div key={toc} className="flex items-center gap-3">
            <TocPill toc={toc as TocCode} short />
            <div className="flex-1">
              <div className="h-2 bg-s3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber/50 rounded-full"
                  style={{ width: `${(data.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-dim w-10 text-right">{data.count}×</span>
            <span className="text-xs font-mono text-white w-16 text-right">£{data.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
