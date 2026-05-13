export function DelayBadge({ mins }: { mins: number }) {
  if (mins === 0) {
    return <span className="delay-badge bg-green/10 text-green border border-green/20">On time</span>
  }
  if (mins < 5) {
    return <span className="delay-badge bg-amber/10 text-amber border border-amber/20">+{mins}m</span>
  }
  if (mins < 15) {
    return <span className="delay-badge bg-red/10 text-red border border-red/20">+{mins}m</span>
  }
  if (mins < 30) {
    return <span className="delay-badge bg-red/20 text-red border border-red/30 font-bold">+{mins}m</span>
  }
  return <span className="delay-badge bg-amber/20 text-amber border border-amber/30 font-bold animate-pulse">+{mins}m ✓</span>
}
