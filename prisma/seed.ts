import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed default salary income source if none exists
  const existing = await prisma.fuenteIngreso.count()
  if (existing === 0) {
    await prisma.fuenteIngreso.create({
      data: {
        nombre: 'Salario',
        monto: 22000,
        frecuencia: 'QUINCENAL',
        diaMes: 2,
        fechaBase: new Date('2026-03-02T12:00:00.000Z'),
        activo: true,
      },
    })
    console.log('Seed completado: fuente de ingreso Salario $22,000 MXN configurada')
  } else {
    console.log('Seed omitido: ya existen fuentes de ingreso')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
