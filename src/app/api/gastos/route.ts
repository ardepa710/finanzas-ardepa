import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkGastosStreak } from '@/features/gamificacion/services/streak-service'

// Mapeo de códigos frontend → nombres en DB
const CAT_NOMBRE: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const categoria = searchParams.get('categoria')

  const gastos = await prisma.gasto.findMany({
    where: {
      ...(desde && { fecha: { gte: new Date(desde) } }),
      ...(hasta && { fecha: { lte: new Date(hasta) } }),
      ...(categoria && { categoria: { nombre: CAT_NOMBRE[categoria] ?? categoria } }),
    },
    orderBy: { fecha: 'desc' },
    take: 100,
  })
  return NextResponse.json(gastos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const cat = await prisma.categoria.findFirst({ where: { nombre: CAT_NOMBRE[body.categoria] ?? body.categoria, tipo: 'GASTO' } })
  if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
  const gasto = await prisma.gasto.create({
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoriaId: cat.id,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      fuente: body.fuente ?? 'WEB',
    },
  })
  checkGastosStreak().catch((err) => { // fire-and-forget, no bloquea
    console.error('[streak] checkGastosStreak failed:', err)
  })
  return NextResponse.json(gasto, { status: 201 })
}
