import { Router } from 'express'
import fetch from 'node-fetch'

const router = Router()

router.get('/:serviceUid/:date', async (req, res) => {
  const { serviceUid, date } = req.params
  const apiKey = process.env.REALTIME_TRAINS_API_KEY

  if (!apiKey) {
    return res.status(503).json({ error: 'Realtime Trains API key not configured' })
  }

  const url = `https://api.rtt.io/api/v1/json/service/${serviceUid}/${date.replace(/-/g, '/')}`

  try {
    const apiRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `RTT error: ${apiRes.statusText}` })
    }

    const data = await apiRes.json()
    const leg = mapRttToLeg(data, serviceUid)
    res.json(leg)
  } catch (err) {
    console.error('Live fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch live data' })
  }
})

function mapRttToLeg(data, serviceUid) {
  const locations = data?.locations ?? []
  const callingPoints = locations.map(loc => {
    const scheduledArr = formatTime(loc.gbttBookedArrival)
    const scheduledDep = formatTime(loc.gbttBookedDeparture)
    const actualArr = formatTime(loc.realtimeArrival ?? loc.realtimeArrivalActual)
    const actualDep = formatTime(loc.realtimeDeparture ?? loc.realtimeDepartureActual)

    let delayMins = 0
    if (actualArr && scheduledArr) {
      delayMins = Math.max(0, toMins(actualArr) - toMins(scheduledArr))
    } else if (actualDep && scheduledDep) {
      delayMins = Math.max(0, toMins(actualDep) - toMins(scheduledDep))
    }

    return {
      station: loc.description ?? loc.tiploc ?? 'Unknown',
      crs: loc.crs ?? loc.tiploc?.slice(0, 3) ?? 'UNK',
      scheduledArr,
      scheduledDep,
      actualArr,
      actualDep,
      delayMins,
      platform: loc.platform ?? null,
    }
  })

  const toc = data?.atocCode ?? 'GW'

  return {
    id: serviceUid,
    trainUid: data?.serviceUid ?? serviceUid,
    toc: normaliseToc(toc),
    origin: callingPoints[0]?.station ?? 'Unknown',
    destination: callingPoints[callingPoints.length - 1]?.station ?? 'Unknown',
    callingPoints,
  }
}

function formatTime(raw) {
  if (!raw) return null
  // RTT returns times as "HHMM" or "HH:MM"
  if (raw.includes(':')) return raw
  if (raw.length === 4) return `${raw.slice(0, 2)}:${raw.slice(2)}`
  return null
}

function toMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function normaliseToc(raw) {
  const map = {
    'GW': 'GW', 'XC': 'XC', 'LN': 'LN', 'VT': 'VT', 'SW': 'SW',
    'EM': 'EM', 'TL': 'TL', 'NT': 'NT', 'TP': 'TP', 'CS': 'CS',
    'TW': 'TW', 'LW': 'LW',
  }
  return map[raw] ?? raw.slice(0, 2)
}

export default router
