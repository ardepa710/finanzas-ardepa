import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro } from '@/lib/savings-calculator'

export async function GET() {
  const [creditos, fuentes] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.fuenteIngreso.findMany({ where: { activo: true } }),
  ])

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const gastosMes = await prisma.gasto.findMany({
    where: { fecha: { gte: inicioMes } },
    orderBy: { fecha: 'desc' },
    include: { categoria: true },
  })

  const creditosInput = creditos.map(c => ({
    nombre: c.nombre,
    pagoMensual: Number(c.pagoMensual),
    frecuencia: c.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
    diaPago: c.diaPago ?? undefined,
    diaSemana: c.diaSemana ?? undefined,
    fechaBase: c.fechaBase ?? undefined,
  }))

  const fuentesInput = fuentes.map(f => ({
    nombre: f.nombre,
    monto: Number(f.monto),
    frecuencia: f.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
    diaMes: f.diaMes ?? undefined,
    diaSemana: f.diaSemana ?? undefined,
    fechaBase: f.fechaBase,
  }))

  const resumenAhorro = fuentes.length > 0
    ? calcularResumenAhorro(creditosInput, fuentesInput, new Date())
    : null

  const porCategoria = gastosMes.reduce((acc, g) => {
    const key = g.categoria.nombre
    acc[key] = (acc[key] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    creditos,
    fuentes,
    gastosMes,
    porCategoria,
    resumenAhorro,
  })
}
