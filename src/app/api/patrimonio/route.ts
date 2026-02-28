import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'
import { TipoActivo, Liquidez } from '@/generated/prisma/client'
import type {
  PatrimonioPorTipo,
  PatrimonioPorLiquidez,
  TopActivo,
  DeudaPorCredito,
  PatrimonioData,
} from '@/features/patrimonio/types'

export const GET = withErrorHandling(async (req: Request) => {
  // Fetch all active assets
  const activos = await prisma.activo.findMany({
    where: { activo: true },
  })

  // Fetch all active debts
  const creditos = await prisma.credito.findMany({
    where: { activo: true },
  })

  // Calculate total assets
  const totalActivos = activos.reduce(
    (sum, activo) => sum + Number(activo.valorActual),
    0
  )

  // Calculate total liabilities
  const totalPasivos = creditos.reduce(
    (sum, credito) => sum + Number(credito.saldoActual),
    0
  )

  // Calculate net worth
  const patrimonioNeto = totalActivos - totalPasivos

  // Breakdown by asset type
  const porTipoMap = new Map<TipoActivo, number>()
  activos.forEach((activo) => {
    const current = porTipoMap.get(activo.tipo) || 0
    porTipoMap.set(activo.tipo, current + Number(activo.valorActual))
  })

  const porTipo: PatrimonioPorTipo[] = Array.from(porTipoMap.entries()).map(
    ([tipo, valor]) => ({
      tipo,
      valor,
      porcentaje: totalActivos > 0 ? (valor / totalActivos) * 100 : 0,
    })
  )

  // Breakdown by liquidity
  const porLiquidezMap = new Map<Liquidez, number>()
  activos.forEach((activo) => {
    const current = porLiquidezMap.get(activo.liquidez) || 0
    porLiquidezMap.set(activo.liquidez, current + Number(activo.valorActual))
  })

  const porLiquidez: PatrimonioPorLiquidez[] = Array.from(
    porLiquidezMap.entries()
  ).map(([liquidez, valor]) => ({
    liquidez,
    valor,
    porcentaje: totalActivos > 0 ? (valor / totalActivos) * 100 : 0,
  }))

  // Top 5 assets by value
  const topActivos: TopActivo[] = activos
    .sort((a, b) => Number(b.valorActual) - Number(a.valorActual))
    .slice(0, 5)
    .map((activo) => ({
      id: activo.id,
      nombre: activo.nombre,
      tipo: activo.tipo,
      valorActual: Number(activo.valorActual),
      porcentajeDelTotal:
        totalActivos > 0 ? (Number(activo.valorActual) / totalActivos) * 100 : 0,
    }))

  // Debt summary
  const porCredito: DeudaPorCredito[] = creditos.map((credito) => ({
    id: credito.id,
    nombre: credito.nombre,
    saldoActual: Number(credito.saldoActual),
    porcentajeDelTotal:
      totalPasivos > 0 ? (Number(credito.saldoActual) / totalPasivos) * 100 : 0,
  }))

  const patrimonio: PatrimonioData = {
    totalActivos,
    totalPasivos,
    patrimonioNeto,
    porTipo,
    porLiquidez,
    topActivos,
    deudas: {
      total: totalPasivos,
      porCredito,
    },
  }

  return { patrimonio }
})
