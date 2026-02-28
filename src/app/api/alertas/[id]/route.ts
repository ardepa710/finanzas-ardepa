import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { notificacionSchema } from '@/shared/validations/schemas'
import { z } from 'zod'

// Extended schema for updates (allows leida and archivar fields)
const notificacionUpdateSchema = notificacionSchema.partial().extend({
  leida: z.boolean().optional(),
  archivar: z.boolean().optional(),
})

export const PUT = withErrorHandling(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const body = await req.json()

  // Allow partial updates
  const result = notificacionUpdateSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.issues[0].message)
  }

  try {
    const updateData: any = {}
    if (result.data.tipo !== undefined) updateData.tipo = result.data.tipo
    if (result.data.titulo !== undefined) updateData.titulo = result.data.titulo
    if (result.data.mensaje !== undefined) updateData.mensaje = result.data.mensaje
    if (result.data.prioridad !== undefined) updateData.prioridad = result.data.prioridad
    if (result.data.metadata !== undefined) updateData.metadata = result.data.metadata
    if (result.data.leida !== undefined) updateData.leida = result.data.leida
    if (result.data.archivar !== undefined) updateData.archivar = result.data.archivar

    const notificacion = await prisma.notificacion.update({
      where: { id },
      data: updateData,
    })

    return notificacion
  } catch (error: any) {
    // Handle not found error (P2025)
    if (error.code === 'P2025') {
      throw new APIError(ErrorCodes.NOT_FOUND, 'Notificación no encontrada', 404)
    }
    throw error
  }
})
