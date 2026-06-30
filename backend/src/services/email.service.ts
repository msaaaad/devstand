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

export async function sendLeaveRequest(req: {
  subject: string
  description: string
  type: string
  fromDate: string
  toDate: string
  days: number
  user: { name: string; email: string }
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: adminEmail,
    subject: `[Leave Request] ${req.subject} — ${req.user.name}`,
    html: base(`
      <h2 style="color:#E6EDF3;margin-top:0;font-size:18px">📋 Leave Request Submitted</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="color:#8B949E;padding:6px 0;width:120px;font-size:13px">Employee</td>
            <td style="color:#E6EDF3;font-size:13px;font-weight:600">${req.user.name}</td></tr>
        <tr><td style="color:#8B949E;padding:6px 0;font-size:13px">Email</td>
            <td style="color:#E6EDF3;font-size:13px">${req.user.email}</td></tr>
        <tr><td style="color:#8B949E;padding:6px 0;font-size:13px">Leave Type</td>
            <td style="color:#E6EDF3;font-size:13px;text-transform:capitalize">${req.type}</td></tr>
        <tr><td style="color:#8B949E;padding:6px 0;font-size:13px">Period</td>
            <td style="color:#E6EDF3;font-size:13px">${req.fromDate} → ${req.toDate} <span style="color:#6366f1">(${req.days} day${req.days > 1 ? 's' : ''})</span></td></tr>
      </table>
      <div style="background:#0D1117;border-left:4px solid #6366f1;padding:16px;border-radius:4px;margin:16px 0">
        <p style="color:#8B949E;font-size:12px;margin:0 0 6px">Subject</p>
        <p style="color:#E6EDF3;font-size:14px;font-weight:600;margin:0">${req.subject}</p>
      </div>
      <div style="background:#0D1117;border-left:4px solid #30363D;padding:16px;border-radius:4px;margin:16px 0">
        <p style="color:#8B949E;font-size:12px;margin:0 0 6px">Description</p>
        <p style="color:#E6EDF3;font-size:13px;margin:0;line-height:1.6">${req.description}</p>
      </div>
      <p style="color:#8B949E;font-size:12px">Please log in to DevStand to approve or reject this request.</p>
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
