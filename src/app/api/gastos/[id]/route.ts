import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const gasto = await prisma.gasto.update({
    where: { id },
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoria: body.categoria,
      fecha: new Date(body.fecha),
    },
  })
  return NextResponse.json(gasto)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.gasto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
