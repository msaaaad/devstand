// ---- history.controller.ts ----
import { Response } from 'express'
import { AuthRequest } from '../types'
import prisma from '../utils/prisma'
import { startOfDay } from 'date-fns'

function fmtTask(t: any) {
  const h = Math.floor(t.timeSpentMinutes / 60), m = t.timeSpentMinutes % 60
  return { ...t, timeFormatted: h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m` }
}

export async function historyIndex(req: AuthRequest, res: Response) {
  const { userId, dateFrom, dateTo, keyword, page = '1' } = req.query
  const take = 20, skip = (parseInt(page as string) - 1) * take

  const where: any = {}
  if (userId) where.userId = parseInt(userId as string)
  if (dateFrom) where.date = { ...where.date, gte: new Date(dateFrom as string) }
  if (dateTo)   where.date = { ...where.date, lte: new Date(dateTo as string) }
  if (keyword) {
    const kw = keyword as string
    where.OR = [
      { eodSummary: { contains: kw, mode: 'insensitive' } },
      { tasks: { some: { OR: [
        { title: { contains: kw, mode: 'insensitive' } },
        { challenge: { contains: kw, mode: 'insensitive' } },
        { learned: { contains: kw, mode: 'insensitive' } },
      ] } } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.standup.findMany({
      where, skip, take,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, color: true, avatar: true } },
        tasks: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.standup.count({ where }),
  ])

  res.json({
    data: items.map(s => ({
      id: s.id, date: s.date, eodSummary: s.eodSummary, isLocked: s.isLocked, submittedAt: s.submittedAt,
      user: s.user,
      tasks: s.tasks.map(fmtTask),
      totalTime: s.tasks.reduce((a, t) => a + t.timeSpentMinutes, 0),
      taskCount: s.tasks.length,
    })),
    meta: { page: parseInt(page as string), total, lastPage: Math.ceil(total / take) },
  })
}

export async function historyShow(req: AuthRequest, res: Response) {
  const s = await prisma.standup.findUnique({
    where: { id: +req.params.id },
    include: { user: { select: { id: true, name: true, color: true, avatar: true } }, tasks: { orderBy: { order: 'asc' } } },
  })
  if (!s) { res.status(404).json({ message: 'Not found' }); return }
  res.json({ standup: { ...s, tasks: s.tasks.map(fmtTask) } })
}
