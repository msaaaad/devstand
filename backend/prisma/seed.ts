import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10)

  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Alex Manager', email: 'manager@devstand.app', password: await hash('password'), role: 'manager', color: '#6366f1' },
      { name: 'Sam Lead', email: 'lead@devstand.app', password: await hash('password'), role: 'team_lead', color: '#8b5cf6' },
      { name: 'Saad Dev', email: 'saad@devstand.app', password: await hash('password'), role: 'employee', color: '#14b8a6' },
      { name: 'Rahim Coder', email: 'rahim@devstand.app', password: await hash('password'), role: 'employee', color: '#f97316' },
      { name: 'Nadia UI', email: 'nadia@devstand.app', password: await hash('password'), role: 'employee', color: '#ec4899' },
    ],
  })

  console.log('✅ Seeded 5 users (password: "password" for all)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
