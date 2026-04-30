import prisma from '../utils/prisma'
import { NotificationType } from '@prisma/client'
import { Server as SocketServer } from 'socket.io'

let io: SocketServer

export function setSocketServer(socketIo: SocketServer) {
  io = socketIo
}

export async function createNotification(
  userId: number,
  type: NotificationType,
  data: Record<string, unknown>
) {
  const notification = await prisma.notification.create({
    data: { userId, type, data },
  })

  // Push to user's socket room
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification)
  }

  return notification
}
