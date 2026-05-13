import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StationAutocomplete } from './StationAutocomplete'
import type { Station } from '../../types'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function SearchScreen() {
  const navigate = useNavigate()
  const [from, setFrom] = useState<Station | null>(null)
  const [to, setTo] = useState<Station | null>(null)
  const [fromVal, setFromVal] = useState('')
  const [toVal, setToVal] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState(nowTime())
  const [error, setError] = useState('')

  const swap = () => {
    const tmpS = from, tmpV = fromVal
    setFrom(to); setFromVal(toVal)
    setTo(tmpS); setToVal(tmpV)
  }

  const search = () => {
    if (!from || !to) { setError('Please select both origin and destination stations.'); return }
    if (from.crs === to.crs) { setError('Origin and destination cannot be the same station.'); return }
    setError('')
    navigate('/rail-delay-repay/results', { state: { from, to, date, time } })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-mono font-semibold text-white mb-1">Journey Search</h1>
        <p className="text-sm text-dim font-sans">Find journeys and track Delay Repay eligibility</p>
      </div>

      <div className="card space-y-4">
        <div className="relative space-y-3">
          <div>
            <label className="block text-xs text-dim mb-1.5 font-mono uppercase tracking-wider">From</label>
            <StationAutocomplete
              value={fromVal}
              onChange={s => { setFrom(s); setFromVal(s.name) }}
              placeholder="Departure station…"
              id="from"
            />
          </div>

          <button
            onClick={swap}
            className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1 bg-s3 border border-b2 rounded p-1.5 text-dim hover:text-white hover:border-amber transition-colors"
            title="Swap stations"
          >
            ⇅
          </button>

          <div>
            <label className="block text-xs text-dim mb-1.5 font-mono uppercase tracking-wider">To</label>
            <StationAutocomplete
              value={toVal}
              onChange={s => { setTo(s); setToVal(s.name) }}
              placeholder="Destination station…"
              id="to"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-dim mb-1.5 font-mono uppercase tracking-wider">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-dim mb-1.5 font-mono uppercase tracking-wider">Departs</label>
            <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-red text-sm font-sans">{error}</p>}

        <button onClick={search} className="btn-primary w-full">
          Search journeys →
        </button>
      </div>
    </div>
  )
}
