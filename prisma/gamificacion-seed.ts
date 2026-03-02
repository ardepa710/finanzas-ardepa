import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const LOGROS_SEED = [
  { codigo: 'PRIMER_GASTO', nombre: 'Primer Registro', descripcion: 'Registraste tu primer gasto', icono: '📝', categoria: 'GASTO' as const, xp: 10 },
  { codigo: 'CREDITO_PRIMERO', nombre: 'Conoce tu Deuda', descripcion: 'Agregaste tu primer crédito', icono: '💳', categoria: 'DEUDA' as const, xp: 20 },
  { codigo: 'META_PRIMERA', nombre: 'Primer Objetivo', descripcion: 'Creaste tu primera meta de ahorro', icono: '🎯', categoria: 'META' as const, xp: 30 },
  { codigo: 'INVERSION_PRIMERA', nombre: 'Primer Inversor', descripcion: 'Registraste tu primera inversión', icono: '📈', categoria: 'INVERSION' as const, xp: 50 },
  { codigo: 'RACHA_7', nombre: 'Semana Perfecta', descripcion: '7 días seguidos registrando gastos', icono: '🔥', categoria: 'RACHA' as const, xp: 50 },
  { codigo: 'RACHA_30', nombre: 'Mes Disciplinado', descripcion: '30 días seguidos registrando gastos', icono: '🏅', categoria: 'RACHA' as const, xp: 200 },
  { codigo: 'PRESUPUESTO_OK', nombre: 'Mes en Verde', descripcion: 'Un mes sin superar ningún presupuesto', icono: '✅', categoria: 'AHORRO' as const, xp: 80 },
  { codigo: 'DEUDA_50', nombre: 'A Mitad del Camino', descripcion: 'Un crédito llegó al 50% pagado', icono: '⚡', categoria: 'DEUDA' as const, xp: 75 },
  { codigo: 'DEUDA_PAGADA', nombre: 'Deuda Libre', descripcion: 'Liquidaste un crédito completamente', icono: '🎉', categoria: 'DEUDA' as const, xp: 300 },
  { codigo: 'AHORRO_10K', nombre: 'Club de los 10K', descripcion: 'Acumulaste $10,000 en metas de ahorro', icono: '💰', categoria: 'AHORRO' as const, xp: 100 },
  { codigo: 'META_3', nombre: 'Soñador', descripcion: 'Tienes 3 metas activas simultáneas', icono: '🌟', categoria: 'META' as const, xp: 45 },
  { codigo: 'META_COMPLETA', nombre: 'Meta Alcanzada', descripcion: 'Completaste una meta de ahorro al 100%', icono: '🏆', categoria: 'META' as const, xp: 150 },
  { codigo: 'INVERSION_10K', nombre: 'Inversor Serio', descripcion: 'Portfolio de inversiones supera $10,000', icono: '📊', categoria: 'INVERSION' as const, xp: 120 },
  { codigo: 'GASTO_100', nombre: 'Centurión', descripcion: 'Has registrado 100 gastos', icono: '💯', categoria: 'GASTO' as const, xp: 60 },
  { codigo: 'SIN_DEUDA', nombre: 'Libertad Financiera', descripcion: 'Todos tus créditos están liquidados', icono: '🕊️', categoria: 'DEUDA' as const, xp: 500 },
]

async function main() {
  console.log('Seeding gamificación...')

  for (const logro of LOGROS_SEED) {
    await prisma.logro.upsert({
      where: { codigo: logro.codigo },
      update: {},
      create: logro,
    })
  }

  await prisma.streak.upsert({
    where: { tipo: 'GASTOS_DIARIOS' },
    update: {},
    create: { tipo: 'GASTOS_DIARIOS' },
  })

  await prisma.streak.upsert({
    where: { tipo: 'METAS_CONTRIBUCION' },
    update: {},
    create: { tipo: 'METAS_CONTRIBUCION' },
  })

  const count = await prisma.nivelUsuario.count()
  if (count === 0) {
    await prisma.nivelUsuario.create({ data: {} })
  }

  console.log('Gamificación seed completado: 15 logros, 2 streaks, 1 nivel')
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
  await pool.end()
})
