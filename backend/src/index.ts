import http from 'http'
import app from './app'
import { initSocket } from './socket'
import { startJobs } from './jobs/standupLock'
import { ensureBucket } from './services/minio.service'

const server = http.createServer(app)

initSocket(server)

const PORT = parseInt(process.env.PORT || '4000')

async function bootstrap() {
  try {
    await ensureBucket()
    console.log('✅ MinIO bucket ready')
  } catch (e) {
    console.warn('⚠️  MinIO not ready:', (e as Error).message)
  }

  startJobs()

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DevStand API running on http://0.0.0.0:${PORT}`)
  })
}

bootstrap()
