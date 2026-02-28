import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const activoParam = searchParams.get('activo')

  const where: any = {}

  if (activoParam === 'true') {
    where.activo = true
  }

  const creditos = await prisma.credito.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, data: creditos })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const credito = await prisma.credito.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      montoTotal: body.montoTotal,
      saldoActual: body.saldoActual,
      pagoMensual: body.pagoMensual,
      pagoMinimo: body.pagoMinimo || null,
      fechaCorte: body.fechaCorte ? Number(body.fechaCorte) : null,
      diaPago: Number(body.diaPago) || 1,
      tasaInteres: body.tasaInteres || null,
      frecuencia: body.frecuencia ?? 'MENSUAL',
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      fechaBase: body.fechaBase ? new Date(body.fechaBase) : null,
    },
  })
  return NextResponse.json(credito, { status: 201 })
}
