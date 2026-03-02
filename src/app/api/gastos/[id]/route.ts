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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const cat = await prisma.categoria.findFirst({ where: { nombre: CAT_NOMBRE[body.categoria] ?? body.categoria, tipo: 'GASTO' } })
  if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
  const gasto = await prisma.gasto.update({
    where: { id },
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoriaId: cat.id,
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
