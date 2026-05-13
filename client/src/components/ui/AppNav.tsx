import { NavLink } from 'react-router-dom'
import { useClaimsStore } from '../../store/claimsStore'

export function AppNav() {
  const toApply = useClaimsStore(s => s.claims.filter(c => c.claimStatus === 'pending').length)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `font-mono text-sm px-3 py-1.5 rounded transition-colors ${
      isActive ? 'text-amber border-b border-amber' : 'text-dim hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-bg border-b border-b1 px-4 py-3 flex items-center justify-between">
      <span className="text-white font-mono font-semibold text-sm tracking-wider">
        RAIL <span className="text-amber">DELAY REPAY</span>
      </span>
      <div className="flex items-center gap-1">
        <NavLink to="/rail-delay-repay/" end className={navClass}>Search</NavLink>
        <NavLink to="/rail-delay-repay/dashboard" className={navClass}>
          Claims
          {toApply > 0 && (
            <span className="ml-1.5 bg-amber text-bg text-xs font-bold px-1.5 py-0.5 rounded-full">
              {toApply}
            </span>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
