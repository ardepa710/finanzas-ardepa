import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro } from '@/lib/savings-calculator'

export async function GET() {
  const [creditos, config] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.configuracionSalario.findFirst(),
  ])

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const gastosMes = await prisma.gasto.findMany({
    where: { fecha: { gte: inicioMes } },
    orderBy: { fecha: 'desc' },
  })

  const creditosInput = creditos.map(c => ({
    nombre: c.nombre,
    pagoMensual: Number(c.pagoMensual),
    diaPago: c.diaPago,
  }))

  const resumenAhorro = config
    ? calcularResumenAhorro(
        creditosInput,
        config.fechaBaseProximoPago,
        new Date(),
        Number(config.monto)
      )
    : null

  const porCategoria = gastosMes.reduce((acc, g) => {
    const key = g.categoria as string
    acc[key] = (acc[key] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    creditos,
    gastosMes,
    porCategoria,
    resumenAhorro,
    config,
  })
}
