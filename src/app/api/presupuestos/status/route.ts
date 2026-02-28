import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'

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

  // Validate periodo parameter
  const validPeriodos = ['SEMANAL', 'QUINCENAL', 'MENSUAL']
  if (!validPeriodos.includes(periodo)) {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      `Periodo inválido. Debe ser uno de: ${validPeriodos.join(', ')}`
    )
  }

  const presupuestos = await prisma.presupuesto.findMany({
    where: { activo: true, periodo: periodo as any },
    include: { categoria: true },
  })

  // Calculate spent amount for each budget
  const inicio = getStartOfPeriod(periodo)
  const fin = new Date()

  // Fix N+1 query: Group gastos by categoriaId in a single query
  const gastosAgrupados = await prisma.gasto.groupBy({
    by: ['categoriaId'],
    where: {
      fecha: { gte: inicio, lte: fin },
      categoriaId: { in: presupuestos.map(p => p.categoriaId) },
    },
    _sum: { monto: true },
  })

  // Create a map for O(1) lookups
  const gastadoPorCategoria = new Map(
    gastosAgrupados.map(g => [g.categoriaId, Number(g._sum.monto || 0)])
  )

  // Calculate statuses
  const statuses = presupuestos.map((p) => {
    const monto = gastadoPorCategoria.get(p.categoriaId) || 0
    const limite = Number(p.monto)

    // Fix division by zero
    const porcentaje = limite > 0 ? (monto / limite) * 100 : 0

    return {
      presupuesto: p,
      gastado: monto,
      restante: Math.max(0, limite - monto),
      porcentaje,
      estado: porcentaje >= 100 ? 'EXCEDIDO' : porcentaje >= 90 ? 'ALERTA' : 'OK',
    }
  })

  return statuses
})
