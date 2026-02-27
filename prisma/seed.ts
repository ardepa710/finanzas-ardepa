import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.configuracionSalario.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      monto: 22000,
      // Next Monday that is a payday - March 2, 2026
      fechaBaseProximoPago: new Date('2026-03-02T12:00:00.000Z'),
    },
  })
  console.log('✅ Seed completado: salario $22,000 MXN configurado')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
