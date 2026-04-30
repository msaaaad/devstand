import cron from 'node-cron'
import prisma from '../utils/prisma'
import { startOfDay } from 'date-fns'

export function startJobs() {
  // Lock all standups at 6PM every day
  cron.schedule('0 18 * * *', async () => {
    const today = startOfDay(new Date())
    const result = await prisma.standup.updateMany({
      where: { date: today, isLocked: false },
      data: { isLocked: true },
    })
    console.log(`[CRON] Locked ${result.count} standups for ${today.toISOString().split('T')[0]}`)
  }, { timezone: 'UTC' })

  console.log('[CRON] Standup lock job scheduled at 18:00 UTC')
}
