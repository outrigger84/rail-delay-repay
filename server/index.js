import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import journeyRouter from './routes/journey.js'
import liveRouter from './routes/live.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const BASE = '/rail-delay-repay'

app.use(express.json())

app.use(`${BASE}/api/journey`, journeyRouter)
app.use(`${BASE}/api/live`, liveRouter)

app.use(BASE, express.static(join(__dirname, 'public')))

app.get(`${BASE}/*`, (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'))
})

app.get('/', (_req, res) => res.redirect(BASE + '/'))

app.listen(PORT, () => {
  console.log(`Rail Delay Repay server running on port ${PORT}`)
})
