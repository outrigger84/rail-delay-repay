import { useState, useRef, useEffect } from 'react'
import type { Station } from '../../types'
import stationsData from '../../data/stations.json'

const stations = stationsData as Station[]

interface Props {
  value: string
  onChange: (station: Station) => void
  placeholder?: string
  id?: string
}

export function StationAutocomplete({ value, onChange, placeholder, id }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Station[]>([])
  const [highlighted, setHighlighted] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) { setResults([]); return }
    const filtered = stations.filter(s =>
      s.name.toLowerCase().includes(q) || s.crs.toLowerCase().startsWith(q)
    ).slice(0, 8)
    setResults(filtered)
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (s: Station) => {
    setQuery(s.name)
    setOpen(false)
    onChange(s)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); select(results[highlighted]) }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        className="input"
        value={query}
        placeholder={placeholder ?? 'Station name or CRS…'}
        autoComplete="off"
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-s2 border border-b2 rounded-lg shadow-xl overflow-hidden">
          {results.map((s, i) => (
            <li
              key={s.crs + s.name}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm ${
                i === highlighted ? 'bg-b2 text-white' : 'text-dim hover:bg-b1 hover:text-white'
              }`}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={() => select(s)}
            >
              <span className="font-sans">{s.name}</span>
              <span className="font-mono text-xs text-faint">{s.crs}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
