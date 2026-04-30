import { Response } from 'express'
import { AuthRequest } from '../types'
import prisma from '../utils/prisma'
import { getIO } from '../socket'
import { uploadFile, deleteFile } from '../services/minio.service'

function fmtPost(p: any, userId: number) {
  const counts: Record<string, number> = {}
  ;(p.reactions ?? []).forEach((r: any) => { counts[r.type] = (counts[r.type] ?? 0) + 1 })
  const userReaction = (p.reactions ?? []).find((r: any) => r.userId === userId)?.type ?? null
  return {
    id: p.id, title: p.title, body: p.body, imageUrl: p.imageUrl,
    isPinned: p.isPinned, reactionCounts: counts, userReaction,
    user: p.user, createdAt: p.createdAt,
  }
}

export async function index(req: AuthRequest, res: Response) {
  const { keyword, page = '1' } = req.query
  const take = 15, skip = (parseInt(page as string) - 1) * take
  const where: any = keyword
    ? { OR: [{ title: { contains: keyword as string, mode: 'insensitive' } }, { body: { contains: keyword as string, mode: 'insensitive' } }] }
    : {}

  const [items, total] = await Promise.all([
    prisma.learningPost.findMany({
      where, skip, take,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { user: { select: { id: true, name: true, color: true, avatar: true } }, reactions: true },
    }),
    prisma.learningPost.count({ where }),
  ])

  res.json({
    data: items.map(p => fmtPost(p, req.user!.id)),
    meta: { page: parseInt(page as string), total, lastPage: Math.ceil(total / take) },
  })
}

export async function store(req: AuthRequest, res: Response) {
  const { title, body } = req.body
  if (!title || !body) { res.status(422).json({ message: 'Title and body required' }); return }

  const post = await prisma.learningPost.create({
    data: { userId: req.user!.id, title, body },
    include: { user: { select: { id: true, name: true, color: true, avatar: true } }, reactions: true },
  })

  if (req.file) {
    const key = `learning/${post.id}/${Date.now()}.${req.file.mimetype.split('/')[1]}`
    const url = await uploadFile(key, req.file.buffer, req.file.mimetype)
    await prisma.learningPost.update({ where: { id: post.id }, data: { minioKey: key, imageUrl: url } })
    post.imageUrl = url
  }

  getIO().to('learning:feed').emit('learning:new', { postId: post.id, title: post.title, userName: post.user.name })
  res.status(201).json({ post: fmtPost(post, req.user!.id) })
}

export async function update(req: AuthRequest, res: Response) {
  const post = await prisma.learningPost.findUnique({ where: { id: +req.params.id } })
  if (!post || post.userId !== req.user!.id) { res.status(403).json({ message: 'Forbidden' }); return }

  const updated = await prisma.learningPost.update({
    where: { id: post.id }, data: { title: req.body.title, body: req.body.body },
    include: { user: { select: { id: true, name: true, color: true, avatar: true } }, reactions: true },
  })
  res.json({ post: fmtPost(updated, req.user!.id) })
}

export async function destroy(req: AuthRequest, res: Response) {
  const post = await prisma.learningPost.findUnique({ where: { id: +req.params.id } })
  if (!post) { res.status(404).json({ message: 'Not found' }); return }

  const canDelete = post.userId === req.user!.id || ['manager','team_lead'].includes(req.user!.role)
  if (!canDelete) { res.status(403).json({ message: 'Forbidden' }); return }

  if (post.minioKey) await deleteFile(post.minioKey)
  await prisma.learningPost.delete({ where: { id: post.id } })
  res.json({ message: 'Deleted' })
}

export async function react(req: AuthRequest, res: Response) {
  const { type } = req.body
  const validTypes = ['insightful','impressive','question']
  if (!validTypes.includes(type)) { res.status(422).json({ message: 'Invalid type' }); return }

  const existing = await prisma.learningReaction.findUnique({
    where: { postId_userId_type: { postId: +req.params.id, userId: req.user!.id, type } },
  })

  if (existing) {
    await prisma.learningReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.learningReaction.create({ data: { postId: +req.params.id, userId: req.user!.id, type: type as any } })
  }

  const reactions = await prisma.learningReaction.findMany({ where: { postId: +req.params.id } })
  const counts: Record<string, number> = {}
  reactions.forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + 1 })
  const userReaction = reactions.find(r => r.userId === req.user!.id)?.type ?? null

  res.json({ action: existing ? 'removed' : 'added', reactionCounts: counts, userReaction })
}

export async function pin(req: AuthRequest, res: Response) {
  if (req.user!.role !== 'manager') { res.status(403).json({ message: 'Managers only' }); return }
  const post = await prisma.learningPost.findUnique({ where: { id: +req.params.id } })
  if (!post) { res.status(404).json({ message: 'Not found' }); return }
  const updated = await prisma.learningPost.update({ where: { id: post.id }, data: { isPinned: !post.isPinned } })
  res.json({ isPinned: updated.isPinned })
}
