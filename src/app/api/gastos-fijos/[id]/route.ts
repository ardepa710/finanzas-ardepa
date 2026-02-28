import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const gastoFijo = await prisma.gastoFijo.update({
    where: { id },
    data: {
      nombre: body.nombre,
      monto: body.monto,
      categoria: body.categoria,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
      activo: body.activo ?? true,
    },
  })
  return NextResponse.json(gastoFijo)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.gastoFijo.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}
