import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, TipoCategoria } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function seedCategories() {
  console.log('🌱 Seeding categories...')

  const categories = [
    { nombre: 'Alimentación', icono: '🍽️', color: '#10b981', tipo: 'GASTO', orden: 1 },
    { nombre: 'Transporte', icono: '🚗', color: '#3b82f6', tipo: 'GASTO', orden: 2 },
    { nombre: 'Entretenimiento', icono: '🎬', color: '#8b5cf6', tipo: 'GASTO', orden: 3 },
    { nombre: 'Salud', icono: '💊', color: '#ef4444', tipo: 'GASTO', orden: 4 },
    { nombre: 'Servicios', icono: '🏠', color: '#f59e0b', tipo: 'GASTO', orden: 5 },
    { nombre: 'Otros', icono: '📦', color: '#6b7280', tipo: 'GASTO', orden: 6 },
  ]

  for (const cat of categories) {
    await prisma.categoria.upsert({
      where: {
        nombre_tipo: {
          nombre: cat.nombre,
          tipo: cat.tipo as TipoCategoria
        }
      },
      update: {
        icono: cat.icono,
        color: cat.color,
        orden: cat.orden,
      },
      create: {
        nombre: cat.nombre,
        icono: cat.icono,
        color: cat.color,
        tipo: cat.tipo as TipoCategoria,
        orden: cat.orden,
      },
    })
    console.log(`  ✅ ${cat.icono} ${cat.nombre}`)
  }

  console.log('✅ Categories seeded successfully')
}
