import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'
import { calculateRendimientoPct } from '@/features/inversiones/calculators/returns'
import type { InversionResumen } from '@/features/inversiones/types'

export const GET = withErrorHandling(async (_req: Request) => {
  const inversiones = await prisma.inversion.findMany({
    where: { activa: true },
    include: {
      activo: true,
    },
  })

  if (inversiones.length === 0) {
    const emptyResumen: any = {
      totalInversiones: 0,
      montoTotalInvertido: '0',
      valorActualTotal: '0',
      rendimientoTotal: '0',
      rendimientoPct: '0',
      dividendosTotal: '0',
      interesesTotal: '0',
      porActivo: [],
      mejores: [],
      peores: [],
    }
    return emptyResumen
  }

  // Calculate totals
  const montoTotalInvertido = inversiones.reduce(
    (sum, inv) => sum + Number(inv.montoInvertido),
    0
  )
  const valorActualTotal = inversiones.reduce((sum, inv) => sum + Number(inv.valorActual), 0)
  const rendimientoTotal = valorActualTotal - montoTotalInvertido
  const rendimientoPct = calculateRendimientoPct(valorActualTotal, montoTotalInvertido)
  const dividendosTotal = inversiones.reduce((sum, inv) => sum + Number(inv.dividendos), 0)
  const interesesTotal = inversiones.reduce((sum, inv) => sum + Number(inv.intereses), 0)

  // Group by activo
  const porActivo = inversiones.map((inv) => ({
    activoId: inv.activoId,
    activoNombre: inv.activo.nombre,
    montoInvertido: Number(inv.montoInvertido),
    valorActual: Number(inv.valorActual),
    rendimiento: Number(inv.rendimientoTotal),
    rendimientoPct: Number(inv.rendimientoPct),
  }))

  // Sort by performance
  const sorted = [...inversiones].sort(
    (a, b) => Number(b.rendimientoPct) - Number(a.rendimientoPct)
  )

  // Best performers (top 3)
  const mejores = sorted.slice(0, 3).map((inv) => ({
    activoId: inv.activoId,
    activoNombre: inv.activo.nombre,
    rendimientoPct: Number(inv.rendimientoPct),
  }))

  // Worst performers (bottom 3)
  const peores = sorted.slice(-3).reverse().map((inv) => ({
    activoId: inv.activoId,
    activoNombre: inv.activo.nombre,
    rendimientoPct: Number(inv.rendimientoPct),
  }))

  const resumen: any = {
    totalInversiones: inversiones.length,
    montoTotalInvertido: String(montoTotalInvertido),
    valorActualTotal: String(valorActualTotal),
    rendimientoTotal: String(rendimientoTotal),
    rendimientoPct: String(rendimientoPct),
    dividendosTotal: String(dividendosTotal),
    interesesTotal: String(interesesTotal),
    porActivo,
    mejores,
    peores,
  }

  return resumen
})
