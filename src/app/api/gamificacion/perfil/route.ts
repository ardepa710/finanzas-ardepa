import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'
import { NIVELES } from '@/features/gamificacion/constants/niveles'

export const GET = withErrorHandling(async () => {
  let nivel = await prisma.nivelUsuario.findFirst()
  if (!nivel) {
    nivel = await prisma.nivelUsuario.create({ data: {} })
  }
  const nivelInfo = NIVELES.find(n => n.nivel === nivel!.nivelActual) ?? NIVELES[0]
  const nivelPrevio = NIVELES.find(n => n.nivel === nivel!.nivelActual - 1)
  const xpParaNivel = nivelPrevio?.xpSiguiente ?? 0
  const xpEnNivel = nivel.xpTotal - xpParaNivel
  const xpNecesario = nivelInfo.xpSiguiente - xpParaNivel
  const progresoPct = xpNecesario > 0 ? Math.round((xpEnNivel / xpNecesario) * 100) : 100

  return {
    nivelActual: nivel.nivelActual,
    nivelNombre: nivelInfo.nombre,
    xpTotal: nivel.xpTotal,
    xpSiguiente: nivelInfo.xpSiguiente,
    progresoPct: Math.max(0, Math.min(progresoPct, 100)),
  }
})
