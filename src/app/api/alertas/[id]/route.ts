import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { notificacionSchema } from '@/shared/validations/schemas'
import { Prisma } from '@/generated/prisma/client'
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
    // Filter out undefined values and build update data with proper typing
    const updateData = Object.entries(result.data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof Prisma.NotificacionUpdateInput] = value
      }
      return acc
    }, {} as Prisma.NotificacionUpdateInput)

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
