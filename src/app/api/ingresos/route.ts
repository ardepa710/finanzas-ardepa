import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const fuentes = await prisma.fuenteIngreso.findMany({
    orderBy: { createdAt: 'asc' },
    include: { ingresos: { orderBy: { fecha: 'desc' }, take: 5 } },
  })
  return NextResponse.json(fuentes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const fuente = await prisma.fuenteIngreso.create({
    data: {
      nombre: body.nombre,
      monto: body.monto,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
    },
  })
  return NextResponse.json(fuente, { status: 201 })
}
