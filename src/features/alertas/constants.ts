import type { TipoNotificacion, Prioridad } from './types'

export const TIPO_ICONS: Record<TipoNotificacion, string> = {
  PRESUPUESTO_80: '⚠️',
  PRESUPUESTO_90: '🔴',
  PRESUPUESTO_100: '🚨',
  CREDITO_PROXIMO: '📅',
  CREDITO_VENCIDO: '⏰',
  AHORRO_BAJO: '📉',
  AHORRO_META: '🎯',
  GASTO_INUSUAL: '👀',
  LOGRO_DESBLOQUEADO: '🏆',
  INSIGHT_IA: '💡',
}

export const PRIORITY_COLORS: Record<Prioridad, { border: string; bg: string; text: string }> = {
  URGENTE: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
  },
  ALTA: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
  },
  NORMAL: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
  },
  BAJA: {
    border: 'border-l-slate-500',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
  },
}
