import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CAT_NOMBRE: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

export async function GET() {
  const gastosFijos = await prisma.gastoFijo.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(gastosFijos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.fechaBase) {
    return NextResponse.json({ error: 'fechaBase is required' }, { status: 400 })
  }
  const cat = await prisma.categoria.findFirst({ where: { nombre: CAT_NOMBRE[body.categoria] ?? body.categoria, tipo: 'GASTO' } })
  if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
  const gastoFijo = await prisma.gastoFijo.create({
    data: {
      nombre: body.nombre,
      monto: body.monto,
      categoriaId: cat.id,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
    },
  })
  return NextResponse.json(gastoFijo, { status: 201 })
}
