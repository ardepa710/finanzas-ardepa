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
  if (!body.fechaBase) {
    return NextResponse.json({ error: 'fechaBase is required' }, { status: 400 })
  }
  const cat = await prisma.categoria.findFirst({ where: { nombre: CAT_NOMBRE[body.categoria] ?? body.categoria, tipo: 'GASTO' } })
  if (!cat) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
  const gastoFijo = await prisma.gastoFijo.update({
    where: { id },
    data: {
      nombre: body.nombre,
      monto: body.monto,
      categoriaId: cat.id,
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
