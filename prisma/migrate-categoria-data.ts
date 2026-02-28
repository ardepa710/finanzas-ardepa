/**
 * Data migration script: Map old CategoriaGasto enum to new Categoria FK
 *
 * This script:
 * 1. Fetches all Categoria records
 * 2. Creates a mapping from enum values to Categoria IDs
 * 3. Updates all Gasto records to set categoriaId based on old categoria enum
 * 4. Updates all GastoFijo records to set categoriaId based on old categoria enum
 */

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Mapping from enum values to Spanish names in Categoria table
const ENUM_TO_NOMBRE: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

async function main() {
  console.log('🔄 Starting data migration: CategoriaGasto enum → Categoria FK')

  // Step 1: Fetch all categories and create ID mapping
  const categorias = await prisma.categoria.findMany({
    where: { tipo: 'GASTO' }
  })

  const enumToId: Record<string, string> = {}
  for (const [enumVal, nombre] of Object.entries(ENUM_TO_NOMBRE)) {
    const cat = categorias.find(c => c.nombre === nombre)
    if (!cat) {
      throw new Error(`Category not found: ${nombre}`)
    }
    enumToId[enumVal] = cat.id
    console.log(`  ${enumVal} → ${cat.nombre} (${cat.id})`)
  }

  // Step 2: Migrate Gasto records
  console.log('\n📝 Migrating Gasto records...')
  const gastos = await prisma.$queryRaw<Array<{ id: string; categoria: string }>>`
    SELECT id, categoria::text FROM "Gasto"
  `

  let gastosUpdated = 0
  for (const gasto of gastos) {
    const categoriaId = enumToId[gasto.categoria]
    if (!categoriaId) {
      console.warn(`  ⚠️  Unknown categoria: ${gasto.categoria} for Gasto ${gasto.id}`)
      continue
    }
    await prisma.gasto.update({
      where: { id: gasto.id },
      data: { categoriaId },
    })
    gastosUpdated++
  }
  console.log(`  ✅ Updated ${gastosUpdated} Gasto records`)

  // Step 3: Migrate GastoFijo records
  console.log('\n📝 Migrating GastoFijo records...')
  const gastosFijos = await prisma.$queryRaw<Array<{ id: string; categoria: string }>>`
    SELECT id, categoria::text FROM "GastoFijo"
  `

  let gastosFijosUpdated = 0
  for (const gastoFijo of gastosFijos) {
    const categoriaId = enumToId[gastoFijo.categoria]
    if (!categoriaId) {
      console.warn(`  ⚠️  Unknown categoria: ${gastoFijo.categoria} for GastoFijo ${gastoFijo.id}`)
      continue
    }
    await prisma.gastoFijo.update({
      where: { id: gastoFijo.id },
      data: { categoriaId },
    })
    gastosFijosUpdated++
  }
  console.log(`  ✅ Updated ${gastosFijosUpdated} GastoFijo records`)

  console.log('\n✅ Data migration complete!')
  console.log(`   - ${gastosUpdated} Gastos migrated`)
  console.log(`   - ${gastosFijosUpdated} GastosFijos migrated`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
