import { Response } from 'express'
import { AuthRequest } from '../types'
import prisma from '../utils/prisma'

export async function index(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string || '1')
  const take = 30, skip = (page - 1) * take

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take, skip,
    }),
    prisma.notification.count({ where: { userId: req.user!.id, readAt: null } }),
  ])

  res.json({ notifications, unreadCount })
}

export async function markRead(req: AuthRequest, res: Response) {
  const notif = await prisma.notification.findUnique({ where: { id: +req.params.id } })
  if (!notif || notif.userId !== req.user!.id) { res.status(403).json({ message: 'Forbidden' }); return }
  await prisma.notification.update({ where: { id: notif.id }, data: { readAt: new Date() } })
  res.json({ message: 'Read' })
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, readAt: null },
    data: { readAt: new Date() },
  })
  res.json({ message: 'All read' })
}
