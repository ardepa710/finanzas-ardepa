import { prisma } from '@/lib/prisma'

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export async function checkGastosStreak(): Promise<{ actualizado: boolean; nuevaRacha: number }> {
  const streak = await prisma.streak.findFirst({ where: { tipo: 'GASTOS_DIARIOS' } })
  if (!streak) return { actualizado: false, nuevaRacha: 0 }

  const now = new Date()

  if (streak.ultimaActividad && isSameDay(streak.ultimaActividad, now)) {
    return { actualizado: false, nuevaRacha: streak.rachaActual }
  }

  let nuevaRacha: number
  if (!streak.ultimaActividad || isYesterday(streak.ultimaActividad)) {
    nuevaRacha = streak.rachaActual + 1
  } else {
    nuevaRacha = 1
  }

  const rachaMayor = Math.max(nuevaRacha, streak.rachaMayor)

  await prisma.streak.update({
    where: { id: streak.id },
    data: { rachaActual: nuevaRacha, rachaMayor, ultimaActividad: now },
  })

  return { actualizado: true, nuevaRacha }
}

export async function getStreaks() {
  return prisma.streak.findMany({ where: { activo: true } })
}
