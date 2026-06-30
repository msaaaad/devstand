import { Response } from 'express'
import { z } from 'zod'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { sendLeaveRequest } from '../services/email.service'
import { createNotification } from '../services/notification.service'

const requestSchema = z.object({
  type: z.enum(['casual', 'sick']),
  subject: z.string().min(3).max(200),
  description: z.string().min(5),
  fromDate: z.string(),
  toDate: z.string(),
})

const balanceSchema = z.object({
  casual: z.number().int().min(0),
  sick: z.number().int().min(0),
})

async function getOrCreateBalance(userId: number) {
  return prisma.leaveBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

export async function myBalance(req: AuthRequest, res: Response) {
  const balance = await getOrCreateBalance(req.user!.id)
  res.json({ balance })
}

export async function myRequests(req: AuthRequest, res: Response) {
  const requests = await prisma.leaveRequest.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ requests })
}

export async function submitRequest(req: AuthRequest, res: Response) {
  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten() }); return }

  const { type, subject, description, fromDate, toDate } = parsed.data

  const from = parseISO(fromDate)
  const to = parseISO(toDate)
  const days = differenceInCalendarDays(to, from) + 1
  if (days < 1) { res.status(422).json({ message: 'Invalid date range' }); return }

  const balance = await getOrCreateBalance(req.user!.id)
  if (balance[type] < days) {
    res.status(422).json({ message: `Insufficient ${type} leave balance (${balance[type]} day${balance[type] !== 1 ? 's' : ''} remaining)` })
    return
  }

  const leaveReq = await prisma.leaveRequest.create({
    data: { userId: req.user!.id, type, subject, description, fromDate: from, toDate: to, days },
  })

  sendLeaveRequest({
    subject, description, type,
    fromDate: from.toDateString(),
    toDate: to.toDateString(),
    days,
    user: { name: req.user!.name, email: req.user!.email },
  }).catch(() => {})

  res.status(201).json({ request: leaveReq })
}

// --- Admin ---

export async function allRequests(req: AuthRequest, res: Response) {
  const requests = await prisma.leaveRequest.findMany({
    include: { user: { select: { id: true, name: true, email: true, color: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ requests })
}

export async function approveRequest(req: AuthRequest, res: Response) {
  const leaveReq = await prisma.leaveRequest.findUnique({ where: { id: +req.params.id } })
  if (!leaveReq) { res.status(404).json({ message: 'Not found' }); return }
  if (leaveReq.status !== 'pending') { res.status(409).json({ message: 'Already actioned' }); return }

  const balance = await getOrCreateBalance(leaveReq.userId)
  if (balance[leaveReq.type] < leaveReq.days) {
    res.status(422).json({ message: 'Insufficient balance to approve' }); return
  }

  const [updated] = await prisma.$transaction([
    prisma.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'approved' } }),
    prisma.leaveBalance.update({
      where: { userId: leaveReq.userId },
      data: { [leaveReq.type]: { decrement: leaveReq.days } },
    }),
  ])

  createNotification(leaveReq.userId, 'leave_approved', {
    subject: leaveReq.subject,
    type: leaveReq.type,
    days: leaveReq.days,
  }).catch(() => {})

  res.json({ request: updated })
}

export async function rejectRequest(req: AuthRequest, res: Response) {
  const leaveReq = await prisma.leaveRequest.findUnique({ where: { id: +req.params.id } })
  if (!leaveReq) { res.status(404).json({ message: 'Not found' }); return }
  if (leaveReq.status !== 'pending') { res.status(409).json({ message: 'Already actioned' }); return }

  const updated = await prisma.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'rejected' } })

  createNotification(leaveReq.userId, 'leave_rejected', {
    subject: leaveReq.subject,
    type: leaveReq.type,
    days: leaveReq.days,
  }).catch(() => {})

  res.json({ request: updated })
}

export async function getUserBalance(req: AuthRequest, res: Response) {
  const balance = await getOrCreateBalance(+req.params.id)
  res.json({ balance })
}

export async function updateUserBalance(req: AuthRequest, res: Response) {
  const parsed = balanceSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten() }); return }

  const balance = await prisma.leaveBalance.upsert({
    where: { userId: +req.params.id },
    update: parsed.data,
    create: { userId: +req.params.id, ...parsed.data },
  })
  res.json({ balance })
}
