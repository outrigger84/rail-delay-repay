import { Router } from 'express'
import fetch from 'node-fetch'

const router = Router()

router.get('/', async (req, res) => {
  const { fromCrs, toCrs, date, time } = req.query

  if (!fromCrs || !toCrs || !date || !time) {
    return res.status(400).json({ error: 'fromCrs, toCrs, date, time are required' })
  }

  const appId = process.env.TRANSPORT_API_APP_ID
  const appKey = process.env.TRANSPORT_API_APP_KEY

  if (!appId || !appKey) {
    return res.status(503).json({ error: 'TransportAPI credentials not configured' })
  }

  const url = new URL(`https://transportapi.com/v3/uk/public/journey/from/crs:${fromCrs}/to/crs:${toCrs}.json`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('date', date)
  url.searchParams.set('time', time)
  url.searchParams.set('time_is', 'departing')
  url.searchParams.set('service', 'train')

  try {
    const apiRes = await fetch(url.toString())
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `TransportAPI error: ${apiRes.statusText}` })
    }

    const data = await apiRes.json()
    const journeys = mapJourneys(data)
    res.json(journeys)
  } catch (err) {
    console.error('Journey search error:', err)
    res.status(500).json({ error: 'Failed to fetch journey data' })
  }
})

function mapJourneys(data) {
  const routes = data?.routes ?? []
  return routes.map((route, i) => {
    const legs = (route.legs ?? []).map((leg, j) => mapLeg(leg, `leg-${i}-${j}`))
    const firstDep = legs[0]?.callingPoints[0]?.scheduledDep ?? '00:00'
    const lastArr = legs[legs.length - 1]?.callingPoints.at(-1)?.scheduledArr ?? '00:00'
    const totalMins = calcMins(firstDep, lastArr)

    return {
      id: `journey-${i}-${Date.now()}`,
      legs,
      changes: Math.max(0, legs.length - 1),
      totalMins,
      label: route.description ?? undefined,
    }
  })
}

function mapLeg(leg, legId) {
  const stops = leg.stops ?? []
  const callingPoints = stops.map(stop => {
    const crs = extractCrs(stop)
    const scheduledArr = stop.aimed_arrival_time ?? null
    const scheduledDep = stop.aimed_departure_time ?? null
    const actualArr = stop.expected_arrival_time ?? null
    const actualDep = stop.expected_departure_time ?? null

    let delayMins = 0
    if (actualArr && scheduledArr) {
      delayMins = Math.max(0, toMins(actualArr) - toMins(scheduledArr))
    } else if (actualDep && scheduledDep) {
      delayMins = Math.max(0, toMins(actualDep) - toMins(scheduledDep))
    }

    return {
      station: stop.station_name ?? stop.name ?? 'Unknown',
      crs,
      scheduledArr,
      scheduledDep,
      actualArr,
      actualDep,
      delayMins,
      platform: stop.platform ?? null,
    }
  })

  const toc = leg.operator ?? leg.operator_code ?? 'GW'

  return {
    id: legId,
    trainUid: leg.train_uid ?? leg.service ?? legId,
    toc: normaliseToc(toc),
    origin: callingPoints[0]?.station ?? 'Unknown',
    destination: callingPoints[callingPoints.length - 1]?.station ?? 'Unknown',
    callingPoints,
  }
}

function extractCrs(stop) {
  if (stop.crs) return stop.crs
  if (stop.atcocode) {
    // Strip 9100 prefix if present
    return stop.atcocode.replace(/^9100/, '').slice(0, 3)
  }
  return 'UNK'
}

function normaliseToc(raw) {
  const map = {
    'GWR': 'GW', 'CrossCountry': 'XC', 'LNER': 'LN', 'Avanti': 'VT',
    'SWR': 'SW', 'EMR': 'EM', 'Thameslink': 'TL', 'Northern': 'NT',
    'TPE': 'TP', 'Caledonian': 'CS', 'TfW': 'TW', 'LNW': 'LW',
  }
  return map[raw] ?? raw.slice(0, 2).toUpperCase()
}

function toMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function calcMins(dep, arr) {
  return Math.max(0, toMins(arr) - toMins(dep))
}

export default router
