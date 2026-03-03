import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Strip channel_binding param — not supported by the pg Node.js driver
  const connectionString = (process.env.DATABASE_URL ?? '').replace(/[?&]channel_binding=[^&]*/g, (m) =>
    m.startsWith('?') ? '?' : ''
  )
  const isNeon = connectionString.includes('neon.tech')
  const pool = new Pool({
    connectionString,
    ...(isNeon ? { ssl: true } : {}),
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
