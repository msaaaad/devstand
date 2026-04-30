import { Response } from 'express'
import { AuthRequest } from '../types'
import prisma from '../utils/prisma'
import { getIO } from '../socket'
import { startOfDay } from 'date-fns'

const todayDate = () => startOfDay(new Date())

function fmtTask(t: any) {
  const h = Math.floor(t.timeSpentMinutes / 60)
  const m = t.timeSpentMinutes % 60
  return {
    ...t,
    timeFormatted: h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`,
  }
}

function fmtStandup(s: any) {
  return {
    id: s.id, date: s.date, eodSummary: s.eodSummary,
    isLocked: s.isLocked, submittedAt: s.submittedAt,
    taskCount: s.tasks?.length ?? 0,
    totalTime: s.tasks?.reduce((a: number, t: any) => a + t.timeSpentMinutes, 0) ?? 0,
    tasks: (s.tasks ?? []).map(fmtTask),
  }
}

async function getOrCreate(userId: number) {
  return prisma.standup.upsert({
    where: { userId_date: { userId, date: todayDate() } },
    create: { userId, date: todayDate() },
    update: {},
    include: { tasks: { orderBy: { order: 'asc' } } },
  })
}

export async function todayBoard(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, color: true, avatar: true, role: true,
      standups: { where: { date: todayDate() }, include: { tasks: { orderBy: { order: 'asc' } } }, take: 1 } },
  })

  const board = users.map(u => ({
    user: { id: u.id, name: u.name, color: u.color, avatar: u.avatar, role: u.role },
    standup: u.standups[0] ? fmtStandup(u.standups[0]) : null,
    hasUpdate: !!u.standups[0]?.submittedAt,
    isLocked: !!u.standups[0]?.isLocked,
  }))

  res.json({ date: todayDate().toISOString().split('T')[0], board })
}

export async function mine(req: AuthRequest, res: Response) {
  const standup = await prisma.standup.findUnique({
    where: { userId_date: { userId: req.user!.id, date: todayDate() } },
    include: { tasks: { orderBy: { order: 'asc' } } },
  })
  res.json({ standup: standup ? fmtStandup(standup) : null })
}

export async function addTask(req: AuthRequest, res: Response) {
  const { title, timeSpentMinutes, challenge, learned } = req.body
  if (!title) { res.status(422).json({ message: 'Title is required' }); return }

  const standup = await getOrCreate(req.user!.id)
  if (standup.isLocked) { res.status(403).json({ message: 'Standup is locked' }); return }

  const task = await prisma.standupTask.create({
    data: { standupId: standup.id, title, timeSpentMinutes: timeSpentMinutes ?? 0, challenge, learned, order: standup.tasks.length },
  })

  getIO().to('standup:board').emit('standup:updated', { userId: req.user!.id })
  res.status(201).json({ task: fmtTask(task) })
}

export async function updateTask(req: AuthRequest, res: Response) {
  const task = await prisma.standupTask.findUnique({ where: { id: +req.params.id }, include: { standup: true } })
  if (!task || task.standup.userId !== req.user!.id) { res.status(403).json({ message: 'Forbidden' }); return }
  if (task.standup.isLocked) { res.status(403).json({ message: 'Standup is locked' }); return }

  const updated = await prisma.standupTask.update({ where: { id: task.id }, data: req.body })
  getIO().to('standup:board').emit('standup:updated', { userId: req.user!.id })
  res.json({ task: fmtTask(updated) })
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const task = await prisma.standupTask.findUnique({ where: { id: +req.params.id }, include: { standup: true } })
  if (!task || task.standup.userId !== req.user!.id) { res.status(403).json({ message: 'Forbidden' }); return }
  if (task.standup.isLocked) { res.status(403).json({ message: 'Standup is locked' }); return }

  await prisma.standupTask.delete({ where: { id: task.id } })
  getIO().to('standup:board').emit('standup:updated', { userId: req.user!.id })
  res.json({ message: 'Deleted' })
}

export async function updateEod(req: AuthRequest, res: Response) {
  const standup = await getOrCreate(req.user!.id)
  if (standup.isLocked) { res.status(403).json({ message: 'Standup is locked' }); return }
  const updated = await prisma.standup.update({
    where: { id: standup.id }, data: { eodSummary: req.body.eodSummary },
    include: { tasks: { orderBy: { order: 'asc' } } },
  })
  getIO().to('standup:board').emit('standup:updated', { userId: req.user!.id })
  res.json({ standup: fmtStandup(updated) })
}

export async function submit(req: AuthRequest, res: Response) {
  const standup = await getOrCreate(req.user!.id)
  if (standup.submittedAt) { res.status(422).json({ message: 'Already submitted' }); return }
  const updated = await prisma.standup.update({
    where: { id: standup.id }, data: { submittedAt: new Date() },
    include: { tasks: { orderBy: { order: 'asc' } } },
  })
  getIO().to('standup:board').emit('standup:updated', { userId: req.user!.id })
  res.json({ standup: fmtStandup(updated) })
}

export async function lockAll(_req: any, res: Response) {
  await prisma.standup.updateMany({ where: { date: todayDate(), isLocked: false }, data: { isLocked: true } })
  res.json({ message: 'All standups locked' })
}
