import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { inversionSchema } from '@/shared/validations/schemas'
import { calculateRendimientoTotal, calculateRendimientoPct } from '@/features/inversiones/calculators/returns'

export const GET = withErrorHandling(async (req: Request) => {
  const url = new URL(req.url)
  const activaParam = url.searchParams.get('activa')

  const where: any = {}

  if (activaParam === 'true' || activaParam === null) {
    where.activa = true
  }

  const inversiones = await prisma.inversion.findMany({
    where,
    include: {
      activo: true,
      transacciones: {
        orderBy: { fecha: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return inversiones
})

export const POST = withErrorHandling(async (req: Request) => {
  const body = await req.json()
  const result = inversionSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  const { activoId, montoInvertido, fechaInversion, valorActual, dividendos, intereses, descripcion } = result.data

  // Validate activo exists and is tipo INVERSION
  const activo = await prisma.activo.findUnique({
    where: { id: activoId },
  })

  if (!activo) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, 'Activo no encontrado')
  }

  if (activo.tipo !== 'INVERSION') {
    throw new APIError(
      ErrorCodes.VALIDATION_ERROR,
      'El activo debe ser de tipo INVERSION'
    )
  }

  // Calculate returns
  const rendimientoTotal = calculateRendimientoTotal(valorActual, montoInvertido)
  const rendimientoPct = calculateRendimientoPct(valorActual, montoInvertido)

  // Create investment with initial COMPRA transaction
  const inversion = await prisma.inversion.create({
    data: {
      activoId,
      montoInvertido,
      fechaInversion: new Date(fechaInversion),
      valorActual,
      rendimientoTotal,
      rendimientoPct,
      dividendos: dividendos || 0,
      intereses: intereses || 0,
      descripcion,
      transacciones: {
        create: {
          tipo: 'COMPRA',
          monto: montoInvertido,
          fecha: new Date(fechaInversion),
          descripcion: 'Inversión inicial',
        },
      },
    },
    include: {
      activo: true,
      transacciones: {
        orderBy: { fecha: 'desc' },
      },
    },
  })

  return inversion
})
