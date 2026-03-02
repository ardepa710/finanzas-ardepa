import { withErrorHandling } from '@/lib/api-error'
import { getStreaks } from '@/features/gamificacion/services/streak-service'

export const GET = withErrorHandling(async () => {
  const streaks = await getStreaks()
  return streaks
})
