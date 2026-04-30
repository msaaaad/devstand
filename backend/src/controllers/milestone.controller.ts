import { Response } from 'express'
import { AuthRequest } from '../types'
import prisma from '../utils/prisma'
import { getIO } from '../socket'
import { createNotification } from '../services/notification.service'
import * as email from '../services/email.service'
import { MilestoneTask, User } from '@prisma/client'

const taskIncludes = {
  assignedTo: { select: { id: true, name: true, color: true, avatar: true } },
  createdBy:  { select: { id: true, name: true, email: true } },
  milestone:  { select: { title: true } },
}

function fmtTask(t: any) {
  return {
    id: t.id, milestoneId: t.milestoneId, title: t.title, description: t.description,
    stage: t.stage, approvalStatus: t.approvalStatus, rejectionNote: t.rejectionNote,
    order: t.order, assignedTo: t.assignedTo, createdBy: t.createdBy,
    createdAt: t.createdAt,
  }
}

function calcProgress(tasks: MilestoneTask[]) {
  const approved = tasks.filter(t => t.approvalStatus === 'approved')
  if (!approved.length) return 0
  return Math.round((approved.filter(t => t.stage === 'deployed').length / approved.length) * 100)
}

function fmtMilestone(m: any, withTasks = false) {
  const approvedTasks = (m.tasks ?? []).filter((t: any) => t.approvalStatus === 'approved')
  const counts = ['backlog','todo','doing','done','deployed'].reduce((acc: any, s) => {
    acc[s] = approvedTasks.filter((t: any) => t.stage === s).length
    return acc
  }, {})
  return {
    id: m.id, title: m.title, description: m.description, deadline: m.deadline,
    status: m.status, progress: calcProgress(m.tasks ?? []),
    taskCounts: counts,
    creator: { id: m.createdBy.id, name: m.createdBy.name },
    createdAt: m.createdAt,
    ...(withTasks ? { tasks: (m.tasks ?? []).map(fmtTask) } : {}),
  }
}

// GET /milestones
export async function index(req: AuthRequest, res: Response) {
  const status = (req.query.status as string) || 'active'
  const milestones = await prisma.milestone.findMany({
    where: { status: status as any },
    include: { createdBy: { select: { id: true, name: true } }, tasks: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ milestones: milestones.map(m => fmtMilestone(m)) })
}

// GET /milestones/archived
export async function archived(_req: AuthRequest, res: Response) {
  const milestones = await prisma.milestone.findMany({
    where: { status: { in: ['completed','archived'] } },
    include: { createdBy: { select: { id: true, name: true } }, tasks: true },
    orderBy: { updatedAt: 'desc' },
  })
  res.json({ milestones: milestones.map(m => fmtMilestone(m)) })
}

// GET /milestones/:id
export async function show(req: AuthRequest, res: Response) {
  const m = await prisma.milestone.findUnique({
    where: { id: +req.params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      tasks: { include: taskIncludes, orderBy: { order: 'asc' } },
    },
  })
  if (!m) { res.status(404).json({ message: 'Not found' }); return }
  res.json({ milestone: fmtMilestone(m, true) })
}

// POST /milestones
export async function store(req: AuthRequest, res: Response) {
  const { title, description, deadline } = req.body
  if (!title) { res.status(422).json({ message: 'Title required' }); return }

  const m = await prisma.milestone.create({
    data: { title, description, deadline: deadline ? new Date(deadline) : null, createdById: req.user!.id },
    include: { createdBy: { select: { id: true, name: true } }, tasks: true },
  })
  res.status(201).json({ milestone: fmtMilestone(m) })
}

// PUT /milestones/:id
export async function update(req: AuthRequest, res: Response) {
  const { title, description, deadline } = req.body
  const m = await prisma.milestone.update({
    where: { id: +req.params.id },
    data: { title, description, deadline: deadline ? new Date(deadline) : undefined },
    include: { createdBy: { select: { id: true, name: true } }, tasks: true },
  })
  res.json({ milestone: fmtMilestone(m) })
}

// PUT /milestones/:id/archive
export async function archive(req: AuthRequest, res: Response) {
  await prisma.milestone.update({ where: { id: +req.params.id }, data: { status: 'archived' } })
  res.json({ message: 'Archived' })
}

// GET /milestones/:id/tasks/pending
export async function pendingTasks(req: AuthRequest, res: Response) {
  const tasks = await prisma.milestoneTask.findMany({
    where: { milestoneId: +req.params.id, approvalStatus: 'pending' },
    include: taskIncludes,
    orderBy: { createdAt: 'asc' },
  })
  res.json({ tasks: tasks.map(fmtTask) })
}

// POST /milestones/:id/tasks
export async function storeTask(req: AuthRequest, res: Response) {
  const { title, description, assignedToId, stage } = req.body
  if (!title) { res.status(422).json({ message: 'Title required' }); return }

  const canApprove = ['manager','team_lead'].includes(req.user!.role)
  const count = await prisma.milestoneTask.count({ where: { milestoneId: +req.params.id } })

  const task = await prisma.milestoneTask.create({
    data: {
      milestoneId: +req.params.id, title, description, order: count,
      assignedToId: assignedToId ?? null, stage: stage ?? 'backlog',
      approvalStatus: canApprove ? 'approved' : 'pending',
      approvedById: canApprove ? req.user!.id : null,
      createdById: req.user!.id,
    },
    include: taskIncludes,
  })

  if (task.assignedToId) {
    await notifyAndEmail(task as any, 'task_assigned', req.user!.name)
  }

  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(task))
  res.status(201).json({ task: fmtTask(task) })
}

// PUT /tasks/:id/stage
export async function moveStage(req: AuthRequest, res: Response) {
  const { stage } = req.body
  const validStages = ['backlog','todo','doing','done','deployed']
  if (!validStages.includes(stage)) { res.status(422).json({ message: 'Invalid stage' }); return }

  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id } })
  if (!task || task.approvalStatus !== 'approved') { res.status(403).json({ message: 'Not allowed' }); return }

  const isEmployee = req.user!.role === 'employee'
  if (isEmployee && task.assignedToId !== req.user!.id) { res.status(403).json({ message: 'Forbidden' }); return }

  const updated = await prisma.milestoneTask.update({
    where: { id: task.id }, data: { stage: stage as any }, include: taskIncludes,
  })

  // Check milestone completion
  if (stage === 'deployed') await checkMilestoneComplete(task.milestoneId)

  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(updated))
  res.json({ task: fmtTask(updated) })
}

// PUT /tasks/:id/assign
export async function assignTask(req: AuthRequest, res: Response) {
  const { assignedToId } = req.body
  const task = await prisma.milestoneTask.update({
    where: { id: +req.params.id }, data: { assignedToId },
    include: taskIncludes,
  })

  await notifyAndEmail(task as any, 'task_assigned', req.user!.name)
  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(task))
  res.json({ task: fmtTask(task) })
}

// PUT /tasks/:id/self-assign
export async function selfAssign(req: AuthRequest, res: Response) {
  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id } })
  if (!task || task.approvalStatus !== 'approved') { res.status(403).json({ message: 'Not allowed' }); return }

  const updated = await prisma.milestoneTask.update({
    where: { id: task.id }, data: { assignedToId: req.user!.id, stage: 'doing' },
    include: taskIncludes,
  })

  const leads = await prisma.user.findMany({ where: { role: 'team_lead' }, select: { id: true } })
  for (const lead of leads) {
    await createNotification(lead.id, 'task_self_assigned', {
      taskId: task.id, taskTitle: task.title, milestoneId: task.milestoneId,
      actorName: req.user!.name, message: `${req.user!.name} self-assigned: ${task.title}`,
    })
  }

  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(updated))
  res.json({ task: fmtTask(updated) })
}

// PUT /tasks/:id/approve
export async function approveTask(req: AuthRequest, res: Response) {
  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id }, include: taskIncludes })
  if (!task || task.approvalStatus !== 'pending') { res.status(422).json({ message: 'Not pending' }); return }

  const updated = await prisma.milestoneTask.update({
    where: { id: task.id },
    data: { approvalStatus: 'approved', approvedById: req.user!.id, stage: 'backlog' },
    include: taskIncludes,
  })

  await createNotification(task.createdById, 'task_approved', {
    taskId: task.id, taskTitle: task.title, milestoneId: task.milestoneId,
    actorName: req.user!.name, message: `Your task was approved: ${task.title}`,
  })
  await email.sendTaskApproved(updated as any)

  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(updated))
  res.json({ task: fmtTask(updated) })
}

// PUT /tasks/:id/reject
export async function rejectTask(req: AuthRequest, res: Response) {
  const { rejectionNote } = req.body
  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id }, include: taskIncludes })
  if (!task) { res.status(404).json({ message: 'Not found' }); return }

  const updated = await prisma.milestoneTask.update({
    where: { id: task.id },
    data: { approvalStatus: 'rejected', rejectionNote },
    include: taskIncludes,
  })

  await createNotification(task.createdById, 'task_rejected', {
    taskId: task.id, taskTitle: task.title, milestoneId: task.milestoneId,
    actorName: req.user!.name, rejectionNote,
    message: `Your task was rejected: ${task.title}`,
  })
  await email.sendTaskRejected(updated as any)

  getIO().to(`milestone:${task.milestoneId}`).emit('task:updated', fmtTask(updated))
  res.json({ task: fmtTask(updated) })
}

// PUT /tasks/:id
export async function updateTask(req: AuthRequest, res: Response) {
  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id } })
  if (!task) { res.status(404).json({ message: 'Not found' }); return }

  const canEdit = task.createdById === req.user!.id || ['manager','team_lead'].includes(req.user!.role)
  if (!canEdit) { res.status(403).json({ message: 'Forbidden' }); return }

  const updated = await prisma.milestoneTask.update({
    where: { id: task.id }, data: { title: req.body.title, description: req.body.description },
    include: taskIncludes,
  })
  res.json({ task: fmtTask(updated) })
}

// DELETE /tasks/:id
export async function deleteTask(req: AuthRequest, res: Response) {
  const task = await prisma.milestoneTask.findUnique({ where: { id: +req.params.id } })
  if (!task) { res.status(404).json({ message: 'Not found' }); return }

  await prisma.milestoneTask.delete({ where: { id: task.id } })
  getIO().to(`milestone:${task.milestoneId}`).emit('task:deleted', { taskId: task.id })
  res.json({ message: 'Deleted' })
}

// --- Helpers ---
async function checkMilestoneComplete(milestoneId: number) {
  const tasks = await prisma.milestoneTask.findMany({ where: { milestoneId, approvalStatus: 'approved' } })
  if (!tasks.length) return
  const allDeployed = tasks.every(t => t.stage === 'deployed')
  if (allDeployed) {
    const m = await prisma.milestone.update({ where: { id: milestoneId }, data: { status: 'completed' } })
    getIO().to('milestones').emit('milestone:completed', { milestoneId, title: m.title })

    const leads = await prisma.user.findMany({ where: { role: { in: ['manager','team_lead'] } }, select: { id: true } })
    for (const u of leads) {
      await createNotification(u.id, 'milestone_completed', {
        milestoneId, message: `Milestone completed: ${m.title}`,
      })
    }
  }
}

async function notifyAndEmail(
  task: MilestoneTask & { assignedTo?: User | null; createdBy?: User; milestone?: { title: string } },
  type: 'task_assigned',
  actorName: string
) {
  if (!task.assignedToId) return
  await createNotification(task.assignedToId, type, {
    taskId: task.id, taskTitle: task.title, milestoneId: task.milestoneId,
    actorName, message: `You were assigned: ${task.title}`,
  })
  await email.sendTaskAssigned(task)
}
