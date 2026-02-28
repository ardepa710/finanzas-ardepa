import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { metaProyeccionQuerySchema } from '@/shared/validations/schemas'
import {
  calculateMesesParaMeta,
  projectFechaComplecion,
  esMetaAlcanzable,
  calcularAhorroMensualRequerido,
} from '@/features/metas/calculators/proyeccion'

export const GET = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: metaId } = await params
  const url = new URL(req.url)

  const queryParams = {
    ahorroMensual: url.searchParams.get('ahorroMensual'),
  }

  const result = metaProyeccionQuerySchema.safeParse(queryParams)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const meta = await prisma.meta.findUnique({
    where: { id: metaId },
  })

  if (!meta) {
    throw new APIError(ErrorCodes.NOT_FOUND, 'Meta no encontrada', 404)
  }

  const { ahorroMensual } = result.data
  const montoObjetivo = Number(meta.montoObjetivo)
  const montoActual = Number(meta.montoActual)
  const montoFaltante = Math.max(0, montoObjetivo - montoActual)

  // Calculate projection
  const mesesEstimados = calculateMesesParaMeta(montoObjetivo, montoActual, ahorroMensual)
  const fechaEstimadaComplecion = projectFechaComplecion(mesesEstimados)
  const esAlcanzable = esMetaAlcanzable(montoFaltante, ahorroMensual, meta.fechaObjetivo)

  // Calculate required monthly savings if there's a deadline
  const ahorroMensualRequerido = meta.fechaObjetivo
    ? calcularAhorroMensualRequerido(montoFaltante, meta.fechaObjetivo)
    : 0

  return {
    metaId: meta.id,
    nombreMeta: meta.nombre,
    montoFaltante: montoFaltante.toFixed(2),
    ahorroMensualRequerido: ahorroMensualRequerido.toFixed(2),
    mesesEstimados,
    fechaEstimadaComplecion,
    esAlcanzable,
  }
})
