import { Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'
import { formatUser } from './auth.controller'

const roleSchema = z.object({
  role: z.enum(['manager', 'team_lead', 'employee']),
})

export async function listUsers(req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: { not: 'superadmin' } },
    select: { id: true, name: true, email: true, role: true, color: true, avatar: true, isApproved: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ users })
}

export async function approveUser(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: +req.params.id } })
  if (!user || user.role === 'superadmin') { res.status(404).json({ message: 'User not found' }); return }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isApproved: true },
  })
  res.json({ user: formatUser(updated) })
}

export async function updateRole(req: AuthRequest, res: Response) {
  const parsed = roleSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten() }); return }

  const user = await prisma.user.findUnique({ where: { id: +req.params.id } })
  if (!user || user.role === 'superadmin') { res.status(404).json({ message: 'User not found' }); return }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: parsed.data.role },
  })
  res.json({ user: formatUser(updated) })
}

export async function removeUser(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: +req.params.id } })
  if (!user || user.role === 'superadmin') { res.status(404).json({ message: 'User not found' }); return }

  await prisma.user.delete({ where: { id: user.id } })
  res.json({ message: 'User removed' })
}
