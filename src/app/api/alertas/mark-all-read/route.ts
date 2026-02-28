import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

export const PUT = withErrorHandling(async () => {
  // Update all unread notifications in a single transaction
  const result = await prisma.notificacion.updateMany({
    where: { leida: false },
    data: { leida: true },
  })

  return { count: result.count }
})
