import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthRequest } from '../types'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#14b8a6','#3b82f6','#f59e0b']

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['manager','team_lead','employee']).optional(),
  color: z.string().length(7).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function signToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

export function formatUser(user: any) {
  const { password, ...rest } = user
  return rest
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten() }); return }

  const { name, email, password, role, color } = parsed.data

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) { res.status(409).json({ message: 'Email already registered' }); return }

  const usedColors = (await prisma.user.findMany({ select: { color: true } })).map(u => u.color)
  const available = COLORS.filter(c => !usedColors.includes(c))
  const assignedColor = color ?? (available[0] ?? COLORS[Math.floor(Math.random() * COLORS.length)])

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10), role: role ?? 'employee', color: assignedColor },
  })

  res.status(201).json({ user: formatUser(user), token: signToken(user.id, user.role) })
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(422).json({ errors: parsed.error.flatten() }); return }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' }); return
  }

  res.json({ user: formatUser(user), token: signToken(user.id, user.role) })
}

export async function me(req: AuthRequest, res: Response) {
  res.json({ user: req.user })
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { name, color } = req.body
  const update: any = {}
  if (name) update.name = name
  if (color) update.color = color

  if (req.file) {
    const { uploadFile } = await import('../services/minio.service')
    const key = `avatars/${req.user!.id}/${Date.now()}.${req.file.mimetype.split('/')[1]}`
    const url = await uploadFile(key, req.file.buffer, req.file.mimetype)
    update.avatar = url
  }

  const updated = await prisma.user.update({ where: { id: req.user!.id }, data: update })
  res.json({ user: formatUser(updated) })
}

export async function listUsers(req: AuthRequest, res: Response) {
  const { role } = req.query
  const users = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: { id: true, name: true, email: true, role: true, color: true, avatar: true },
    orderBy: { name: 'asc' },
  })
  res.json({ users })
}
