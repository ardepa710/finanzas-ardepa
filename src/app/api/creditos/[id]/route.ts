import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const credito = await prisma.credito.update({
    where: { id },
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
      activo: body.activo,
      frecuencia: body.frecuencia ?? 'MENSUAL',
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      fechaBase: body.fechaBase ? new Date(body.fechaBase) : null,
    },
  })
  return NextResponse.json(credito)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.credito.update({
    where: { id },
    data: { activo: false },
  })
  return NextResponse.json({ ok: true })
}
