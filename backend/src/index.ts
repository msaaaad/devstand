import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { initSocket } from './socket'
import routes from './routes'
import { startJobs } from './jobs/standupLock'
import { ensureBucket } from './services/minio.service'

const app = express()
const server = http.createServer(app)

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Socket.io
initSocket(server)

// Start
const PORT = parseInt(process.env.PORT || '4000')

async function bootstrap() {
  try {
    await ensureBucket()
    console.log('✅ MinIO bucket ready')
  } catch (e) {
    console.warn('⚠️  MinIO not ready yet:', (e as Error).message)
  }

  startJobs()

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DevStand API running on http://0.0.0.0:${PORT}`)
  })
}

bootstrap()
