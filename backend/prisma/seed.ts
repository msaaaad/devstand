import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Super Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'superadmin',
      isApproved: true,
      color: '#6366f1',
    },
  })

  console.log(`✅ Seeded superadmin — ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
