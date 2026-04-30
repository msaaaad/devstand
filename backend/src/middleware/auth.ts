import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'
import { AuthRequest, JwtPayload } from '../types'

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true,
        role: true, color: true, avatar: true,
        createdAt: true, updatedAt: true,
      },
    })
    if (!user) { res.status(401).json({ message: 'User not found' }); return }
    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }
    next()
  }

export const canApprove = requireRole('manager', 'team_lead')
export const canManageMilestones = requireRole('manager', 'team_lead')
export const managerOnly = requireRole('manager')