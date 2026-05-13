export function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function fromMins(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function diffMins(actual: string, scheduled: string): number {
  return toMins(actual) - toMins(scheduled)
}

export function addMins(hhmm: string, n: number): string {
  return fromMins(toMins(hhmm) + n)
}

export function connectionMins(arrHhmm: string, depHhmm: string): number {
  return toMins(depHhmm) - toMins(arrHhmm)
}
