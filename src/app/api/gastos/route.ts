import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const categoria = searchParams.get('categoria')

  const gastos = await prisma.gasto.findMany({
    where: {
      ...(desde && { fecha: { gte: new Date(desde) } }),
      ...(hasta && { fecha: { lte: new Date(hasta) } }),
      ...(categoria && { categoria: categoria as any }),
    },
    orderBy: { fecha: 'desc' },
    take: 100,
  })
  return NextResponse.json(gastos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const gasto = await prisma.gasto.create({
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoria: body.categoria,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      fuente: body.fuente ?? 'WEB',
    },
  })
  return NextResponse.json(gasto, { status: 201 })
}
