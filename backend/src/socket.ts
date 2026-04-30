import { Server as SocketServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { setSocketServer } from './services/notification.service'

let io: SocketServer

export function initSocket(server: any) {
  io = new SocketServer(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string
    if (!token) { next(new Error('No token')); return }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
      socket.data.userId = payload.userId
      socket.data.role = payload.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    const role = socket.data.role

    // Always join personal room
    socket.join(`user:${userId}`)

    // Always join board rooms
    socket.join('standup:board')
    socket.join('milestones')
    socket.join('learning:feed')

    // Join specific milestone rooms on demand
    socket.on('milestone:join', (milestoneId: number) => {
      socket.join(`milestone:${milestoneId}`)
    })
    socket.on('milestone:leave', (milestoneId: number) => {
      socket.leave(`milestone:${milestoneId}`)
    })
  })

  setSocketServer(io)
  return io
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket not initialized')
  return io
}
