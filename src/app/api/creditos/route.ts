import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const creditos = await prisma.credito.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(creditos)
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
      diaPago: Number(body.diaPago),
      tasaInteres: body.tasaInteres || null,
    },
  })
  return NextResponse.json(credito, { status: 201 })
}
