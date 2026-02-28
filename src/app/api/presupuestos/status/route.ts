import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

function getStartOfPeriod(periodo: string): Date {
  const now = new Date()

  if (periodo === 'MENSUAL') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  if (periodo === 'QUINCENAL') {
    const day = now.getDate()
    return new Date(now.getFullYear(), now.getMonth(), day <= 15 ? 1 : 16)
  }

  if (periodo === 'SEMANAL') {
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day  // Sunday = 0, Monday = 1
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  return now
}

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'MENSUAL'

  const presupuestos = await prisma.presupuesto.findMany({
    where: { activo: true, periodo: periodo as any },
    include: { categoria: true },
  })

  // Calculate spent amount for each budget
  const inicio = getStartOfPeriod(periodo)
  const fin = new Date()

  const statuses = await Promise.all(
    presupuestos.map(async (p) => {
      const gastado = await prisma.gasto.aggregate({
        where: {
          categoriaId: p.categoriaId,
          fecha: { gte: inicio, lte: fin },
        },
        _sum: { monto: true },
      })

      const monto = Number(gastado._sum.monto || 0)
      const limite = Number(p.monto)
      const porcentaje = (monto / limite) * 100

      return {
        presupuesto: p,
        gastado: monto,
        restante: Math.max(0, limite - monto),
        porcentaje,
        estado: porcentaje >= 100 ? 'EXCEDIDO' : porcentaje >= 90 ? 'ALERTA' : 'OK',
      }
    })
  )

  return statuses
})
