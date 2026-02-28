import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'
import { CategoriaMeta } from '@/generated/prisma/client'

export const GET = withErrorHandling(async (req: Request) => {
  const metas = await prisma.meta.findMany({
    where: { activo: true },
  })

  if (metas.length === 0) {
    return {
      totalMetas: 0,
      metasActivas: 0,
      metasCompletadas: 0,
      montoObjetivoTotal: Number(0).toFixed(2),
      montoAhorradoTotal: Number(0).toFixed(2),
      progresoPromedio: Number(0).toFixed(2),
      porCategoria: [],
    }
  }

  const totalMetas = metas.length
  const metasActivas = metas.filter((m) => m.estado === 'EN_PROGRESO').length
  const metasCompletadas = metas.filter((m) => m.estado === 'COMPLETADA').length

  const montoObjetivoTotal = metas.reduce(
    (sum, m) => sum + Number(m.montoObjetivo),
    0
  )

  const montoAhorradoTotal = metas.reduce(
    (sum, m) => sum + Number(m.montoActual),
    0
  )

  const progresoPromedio = metas.reduce(
    (sum, m) => sum + Number(m.porcentajeProgreso),
    0
  ) / totalMetas

  // Group by categoria
  const porCategoriaMap = new Map<CategoriaMeta, { cantidad: number; monto: number }>()

  metas.forEach((meta) => {
    const existing = porCategoriaMap.get(meta.categoria)
    if (existing) {
      existing.cantidad += 1
      existing.monto += Number(meta.montoObjetivo)
    } else {
      porCategoriaMap.set(meta.categoria, {
        cantidad: 1,
        monto: Number(meta.montoObjetivo),
      })
    }
  })

  const porCategoria = Array.from(porCategoriaMap.entries()).map(([categoria, data]) => ({
    categoria,
    cantidad: data.cantidad,
    monto: data.monto.toFixed(2),
  }))

  return {
    totalMetas,
    metasActivas,
    metasCompletadas,
    montoObjetivoTotal: montoObjetivoTotal.toFixed(2),
    montoAhorradoTotal: montoAhorradoTotal.toFixed(2),
    progresoPromedio: progresoPromedio.toFixed(2),
    porCategoria,
  }
})
