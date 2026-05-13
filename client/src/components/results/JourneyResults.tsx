import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Journey, Station } from '../../types'
import { searchJourneys, fetchNextService } from '../../lib/journeyApi'
import { JourneyCard } from './JourneyCard'

export function JourneyResults() {
  const { state } = useLocation() as { state: { from: Station; to: Station; date: string; time: string } | null }
  const navigate = useNavigate()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!state) return
    setLoading(true)
    setError('')
    searchJourneys(state.from.crs, state.to.crs, state.date, state.time)
      .then(setJourneys)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [state])

  const handleNextService = async (journey: Journey, legIndex: number, changeCrs: string, afterTime: string) => {
    if (!state) return
    try {
      const nextJourneys = await fetchNextService(changeCrs, state.to.crs, state.date, afterTime)
      if (!nextJourneys.length) return
      const nextLegs = nextJourneys[0].legs
      const updated: Journey = {
        ...journey,
        legs: [...journey.legs.slice(0, legIndex), ...nextLegs],
        changes: journey.legs.slice(0, legIndex).length - 1 + nextLegs.length - 1,
      }
      setJourneys(prev => prev.map(j => j.id === journey.id ? updated : j))
    } catch { /* ignore */ }
  }

  const handleSelect = (journey: Journey) => {
    navigate('/rail-delay-repay/wizard', { state: { journey, date: state?.date } })
  }

  if (!state) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-dim">No search parameters. <button className="text-amber hover:underline" onClick={() => navigate('/rail-delay-repay/')}>Go back to search</button></p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/rail-delay-repay/')} className="text-dim hover:text-white text-sm">← Back</button>
        <div>
          <h1 className="text-base font-mono font-semibold">{state.from.name} → {state.to.name}</h1>
          <p className="text-xs text-dim">{state.date} · departing {state.time}</p>
        </div>
      </div>

      {loading && (
        <div className="card text-center py-8">
          <div className="text-dim font-mono text-sm animate-pulse">Searching journeys…</div>
        </div>
      )}

      {error && (
        <div className="card border-red/30 bg-red/5">
          <p className="text-red text-sm font-sans">{error}</p>
          <p className="text-dim text-xs mt-1">Check that API credentials are configured in server .env</p>
        </div>
      )}

      {!loading && !error && journeys.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-dim text-sm">No journeys found for this route and time.</p>
        </div>
      )}

      <div className="space-y-4">
        {journeys.map((j, i) => (
          <JourneyCard
            key={j.id}
            journey={j}
            onSelect={() => handleSelect(j)}
            onNextService={(crs, time) => handleNextService(j, i, crs, time)}
          />
        ))}
      </div>
    </div>
  )
}
