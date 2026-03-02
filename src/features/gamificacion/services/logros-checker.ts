import { prisma } from '@/lib/prisma'
import type { CheckLogrosResult, LogroConEstado } from '../types'
import type { Credito, Meta, Inversion } from '@/generated/prisma/client'

const NIVELES = [
  { nivel: 1, xpSiguiente: 100 },
  { nivel: 2, xpSiguiente: 250 },
  { nivel: 3, xpSiguiente: 500 },
  { nivel: 4, xpSiguiente: 900 },
  { nivel: 5, xpSiguiente: 1400 },
  { nivel: 6, xpSiguiente: 2000 },
  { nivel: 7, xpSiguiente: 2800 },
  { nivel: 8, xpSiguiente: 3800 },
  { nivel: 9, xpSiguiente: 5000 },
  { nivel: 10, xpSiguiente: 99999 },
]

function toNum(v: { toNumber(): number } | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'object' && 'toNumber' in v ? v.toNumber() : Number(v)
}

async function evaluarLogro(
  codigo: string,
  data: {
    gastoCount: number
    creditos: Credito[]
    metas: Meta[]
    inversiones: Inversion[]
  }
): Promise<boolean> {
  const { gastoCount, creditos, metas, inversiones } = data

  switch (codigo) {
    case 'PRIMER_GASTO':
      return gastoCount >= 1
    case 'GASTO_100':
      return gastoCount >= 100
    case 'CREDITO_PRIMERO':
      return creditos.length >= 1
    case 'DEUDA_50':
      return creditos.some(c =>
        toNum(c.montoTotal) > 0 &&
        toNum(c.saldoActual) <= toNum(c.montoTotal) * 0.5
      )
    case 'DEUDA_PAGADA':
      return creditos.some(c =>
        toNum(c.montoTotal) > 0 && toNum(c.saldoActual) === 0
      )
    case 'SIN_DEUDA': {
      const activos = creditos.filter(c => c.activo)
      return activos.length > 0 && activos.every(c => toNum(c.saldoActual) === 0)
    }
    case 'META_PRIMERA':
      return metas.length >= 1
    case 'META_3':
      return metas.filter(m => m.estado === 'EN_PROGRESO' && m.activo).length >= 3
    case 'META_COMPLETA':
      return metas.some(m => m.estado === 'COMPLETADA')
    case 'AHORRO_10K': {
      const total = metas
        .filter(m => m.activo)
        .reduce((acc, m) => acc + toNum(m.montoActual), 0)
      return total >= 10000
    }
    case 'INVERSION_PRIMERA':
      return inversiones.length >= 1
    case 'INVERSION_10K': {
      const total = inversiones
        .filter(i => i.activa)
        .reduce((acc, i) => acc + toNum(i.valorActual), 0)
      return total >= 10000
    }
    // PRESUPUESTO_OK requires budget comparison logic — not auto-evaluated yet
    case 'PRESUPUESTO_OK':
      return false
    // RACHA_7 and RACHA_30 are handled by streak logic — not auto-evaluated here
    case 'RACHA_7':
    case 'RACHA_30':
      return false
    default:
      return false
  }
}

export async function checkLogros(): Promise<CheckLogrosResult> {
  const pendientes = await prisma.logro.findMany({ where: { desbloqueado: false } })
  if (pendientes.length === 0) return { nuevos: [], xpGanado: 0 }

  // Fetch all needed data once (avoid N+1)
  const [gastoCount, creditos, metas, inversiones] = await Promise.all([
    prisma.gasto.count(),
    prisma.credito.findMany(),
    prisma.meta.findMany(),
    prisma.inversion.findMany(),
  ])

  const nuevos: LogroConEstado[] = []
  let xpGanado = 0

  for (const logro of pendientes) {
    const cumple = await evaluarLogro(logro.codigo, { gastoCount, creditos, metas, inversiones })
    if (cumple) {
      const now = new Date()
      await prisma.logro.update({
        where: { id: logro.id },
        data: { desbloqueado: true, fechaLogro: now },
      })
      nuevos.push({ ...logro, desbloqueado: true, fechaLogro: now })
      xpGanado += logro.xp
    }
  }

  if (xpGanado > 0) {
    const nivel = await prisma.nivelUsuario.findFirst()
    if (nivel) {
      const nuevoXp = nivel.xpTotal + xpGanado
      const nivelInfo = NIVELES.find(n => n.nivel === nivel.nivelActual) ?? NIVELES[0]
      const subeNivel = nuevoXp >= nivelInfo.xpSiguiente && nivel.nivelActual < 10
      await prisma.nivelUsuario.update({
        where: { id: nivel.id },
        data: {
          xpTotal: nuevoXp,
          nivelActual: subeNivel ? nivel.nivelActual + 1 : nivel.nivelActual,
        },
      })
    }
  }

  return { nuevos, xpGanado }
}
