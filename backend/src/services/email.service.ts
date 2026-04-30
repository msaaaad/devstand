import nodemailer from 'nodemailer'
import { MilestoneTask } from '@prisma/client'

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '2525'),
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
})

const base = (content: string) => `
<!DOCTYPE html>
<html>
<body style="font-family:'DM Sans',sans-serif;background:#0D1117;padding:40px;margin:0">
<div style="max-width:480px;margin:0 auto;background:#161B22;border:1px solid #30363D;border-radius:12px;padding:32px">
  <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#6366f1;margin-bottom:24px">DevStand</div>
  ${content}
  <p style="color:#484F58;font-size:12px;margin-top:32px">— The DevStand Team</p>
</div>
</body>
</html>`

type TaskWithRelations = MilestoneTask & {
  assignedTo?: { name: string; email: string } | null
  createdBy?: { name: string; email: string }
  milestone?: { title: string }
}

export async function sendTaskAssigned(task: TaskWithRelations) {
  if (!task.assignedTo) return
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: task.assignedTo.email,
    subject: `[DevStand] New task assigned: ${task.title}`,
    html: base(`
      <h2 style="color:#E6EDF3;margin-top:0">📋 You've been assigned a task</h2>
      <p style="color:#8B949E">Hi ${task.assignedTo.name},</p>
      <div style="background:#0D1117;border-left:4px solid #6366f1;padding:16px;border-radius:4px;margin:16px 0">
        <strong style="color:#E6EDF3">${task.title}</strong>
        ${task.description ? `<p style="color:#8B949E;margin:8px 0 0">${task.description}</p>` : ''}
      </div>
      <p style="color:#8B949E">Milestone: <strong style="color:#E6EDF3">${task.milestone?.title}</strong></p>
    `),
  })
}

export async function sendTaskApproved(task: TaskWithRelations) {
  if (!task.createdBy) return
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: task.createdBy.email,
    subject: `[DevStand] Task approved: ${task.title}`,
    html: base(`
      <h2 style="color:#22c55e;margin-top:0">✅ Task Approved</h2>
      <p style="color:#8B949E">Hi ${task.createdBy.name},</p>
      <div style="background:#0D1117;border-left:4px solid #22c55e;padding:16px;border-radius:4px;margin:16px 0">
        <strong style="color:#E6EDF3">${task.title}</strong>
      </div>
      <p style="color:#8B949E">Your task has been approved and added to the backlog for <strong style="color:#E6EDF3">${task.milestone?.title}</strong>.</p>
    `),
  })
}

export async function sendTaskRejected(task: TaskWithRelations) {
  if (!task.createdBy) return
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: task.createdBy.email,
    subject: `[DevStand] Task rejected: ${task.title}`,
    html: base(`
      <h2 style="color:#ef4444;margin-top:0">❌ Task Rejected</h2>
      <p style="color:#8B949E">Hi ${task.createdBy.name},</p>
      <div style="background:#0D1117;border-left:4px solid #ef4444;padding:16px;border-radius:4px;margin:16px 0">
        <strong style="color:#E6EDF3">${task.title}</strong>
        ${task.rejectionNote ? `<p style="color:#f87171;margin:8px 0 0"><strong>Reason:</strong> ${task.rejectionNote}</p>` : ''}
      </div>
    `),
  })
}
