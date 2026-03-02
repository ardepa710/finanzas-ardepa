import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { seedCategories } from './seed-categories'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Logros predefinidos ────────────────────────────────────────────
const LOGROS_SEED = [
  { codigo: 'PRIMER_GASTO',      nombre: 'Primer Registro',     descripcion: 'Registra tu primer gasto',                    icono: '📝', categoria: 'GASTO',     xp: 10  },
  { codigo: 'GASTO_100',         nombre: 'Centurión',           descripcion: 'Registra 100 gastos',                         icono: '💯', categoria: 'GASTO',     xp: 60  },
  { codigo: 'CREDITO_PRIMERO',   nombre: 'Conoce tu Deuda',     descripcion: 'Registra tu primer crédito',                  icono: '💳', categoria: 'DEUDA',     xp: 20  },
  { codigo: 'DEUDA_50',          nombre: 'A Mitad del Camino',  descripcion: 'Paga el 50% de un crédito',                   icono: '🏃', categoria: 'DEUDA',     xp: 75  },
  { codigo: 'DEUDA_PAGADA',      nombre: 'Deuda Libre',         descripcion: 'Paga un crédito completo',                    icono: '🎯', categoria: 'DEUDA',     xp: 300 },
  { codigo: 'SIN_DEUDA',         nombre: 'Libertad Financiera', descripcion: 'Todos tus créditos en $0',                    icono: '🦅', categoria: 'DEUDA',     xp: 500 },
  { codigo: 'META_PRIMERA',      nombre: 'Primer Objetivo',     descripcion: 'Crea tu primera meta de ahorro',              icono: '🎯', categoria: 'META',      xp: 30  },
  { codigo: 'META_3',            nombre: 'Soñador',             descripcion: 'Ten 3 metas activas al mismo tiempo',         icono: '✨', categoria: 'META',      xp: 45  },
  { codigo: 'META_COMPLETA',     nombre: 'Meta Alcanzada',      descripcion: 'Completa una meta de ahorro al 100%',         icono: '🏆', categoria: 'META',      xp: 150 },
  { codigo: 'AHORRO_10K',        nombre: 'Club de los 10K',     descripcion: 'Acumula $10,000 MXN en metas de ahorro',      icono: '💰', categoria: 'AHORRO',    xp: 100 },
  { codigo: 'INVERSION_PRIMERA', nombre: 'Primer Inversor',     descripcion: 'Registra tu primera inversión',               icono: '📈', categoria: 'INVERSION', xp: 50  },
  { codigo: 'INVERSION_10K',     nombre: 'Inversor Serio',      descripcion: 'Alcanza $10,000 MXN en portfolio',            icono: '🚀', categoria: 'INVERSION', xp: 120 },
  { codigo: 'PRESUPUESTO_OK',    nombre: 'Mes en Verde',        descripcion: 'Cierra un mes sin superar el presupuesto',    icono: '🟢', categoria: 'GASTO',     xp: 80  },
  { codigo: 'RACHA_7',           nombre: 'Semana Perfecta',     descripcion: 'Registra gastos 7 días consecutivos',         icono: '🔥', categoria: 'RACHA',     xp: 50  },
  { codigo: 'RACHA_30',          nombre: 'Mes Disciplinado',    descripcion: 'Registra gastos 30 días consecutivos',        icono: '⚡', categoria: 'RACHA',     xp: 200 },
] as const

async function main() {
  // Seed categories first (required for other seeds)
  await seedCategories()

  // ── FuenteIngreso ──────────────────────────
  const existingIngresos = await prisma.fuenteIngreso.count()
  if (existingIngresos === 0) {
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
    console.log('✅ Seed: fuente de ingreso Salario $22,000 MXN configurada')
  } else {
    console.log('⏭️  Seed: fuentes de ingreso ya existen, omitiendo')
  }

  // ── Logros ────────────────────────────────
  const existingLogros = await prisma.logro.count()
  if (existingLogros === 0) {
    await prisma.logro.createMany({
      data: LOGROS_SEED.map(l => ({ ...l, desbloqueado: false })),
    })
    console.log(`✅ Seed: ${LOGROS_SEED.length} logros predefinidos creados`)
  } else {
    console.log('⏭️  Seed: logros ya existen, omitiendo')
  }

  // ── NivelUsuario ──────────────────────────
  const existingNivel = await prisma.nivelUsuario.count()
  if (existingNivel === 0) {
    await prisma.nivelUsuario.create({
      data: { xpTotal: 0, nivelActual: 1, xpSiguiente: 100 },
    })
    console.log('✅ Seed: NivelUsuario inicializado (Nivel 1)')
  } else {
    console.log('⏭️  Seed: NivelUsuario ya existe, omitiendo')
  }

  // ── Streaks ───────────────────────────────
  const existingStreaks = await prisma.streak.count()
  if (existingStreaks === 0) {
    await prisma.streak.createMany({
      data: [
        { tipo: 'GASTOS_DIARIOS',    rachaActual: 0, rachaMayor: 0, activo: true },
        { tipo: 'METAS_CONTRIBUCION', rachaActual: 0, rachaMayor: 0, activo: true },
      ],
    })
    console.log('✅ Seed: 2 Streaks inicializados (GASTOS_DIARIOS + METAS_CONTRIBUCION)')
  } else {
    console.log('⏭️  Seed: Streaks ya existen, omitiendo')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
