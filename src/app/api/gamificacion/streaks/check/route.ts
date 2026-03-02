import { withErrorHandling } from '@/lib/api-error'
import { checkGastosStreak } from '@/features/gamificacion/services/streak-service'

export const POST = withErrorHandling(async () => {
  const result = await checkGastosStreak()
  return result
})
