import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

const NIVELES = [
  { nivel: 1, nombre: 'Principiante', xpSiguiente: 100 },
  { nivel: 2, nombre: 'Consciente', xpSiguiente: 250 },
  { nivel: 3, nombre: 'Organizado', xpSiguiente: 500 },
  { nivel: 4, nombre: 'Planificador', xpSiguiente: 900 },
  { nivel: 5, nombre: 'Ahorrista', xpSiguiente: 1400 },
  { nivel: 6, nombre: 'Inversor', xpSiguiente: 2000 },
  { nivel: 7, nombre: 'Estratega', xpSiguiente: 2800 },
  { nivel: 8, nombre: 'Experto', xpSiguiente: 3800 },
  { nivel: 9, nombre: 'Maestro', xpSiguiente: 5000 },
  { nivel: 10, nombre: 'Élite Financiero', xpSiguiente: 99999 },
]

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
    progresoPct: Math.min(progresoPct, 100),
  }
})
