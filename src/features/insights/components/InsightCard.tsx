'use client'
import type { InsightGenerado } from '../types'

const ICONOS: Record<string, string> = {
  ALERTA: '🚨',
  OPORTUNIDAD: '💡',
  LOGRO: '🏆',
  SUGERENCIA: '💬',
}

const PRIORIDAD_LABELS: Record<number, { label: string; cls: string }> = {
  5: { label: 'Urgente', cls: 'bg-red-500/20 text-red-400' },
  4: { label: 'Alto', cls: 'bg-orange-500/20 text-orange-400' },
  3: { label: 'Medio', cls: 'bg-yellow-500/20 text-yellow-400' },
  2: { label: 'Bajo', cls: 'bg-blue-500/20 text-blue-400' },
  1: { label: 'Info', cls: 'bg-slate-500/20 text-slate-400' },
}

export default function InsightCard({ insight }: { insight: InsightGenerado }) {
  const pLabel = PRIORIDAD_LABELS[insight.prioridad] ?? PRIORIDAD_LABELS[1]

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{ICONOS[insight.tipo] ?? '💬'}</span>
          <h3 className="text-sm font-semibold text-slate-100">{insight.titulo}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${pLabel.cls}`}>
          {pLabel.label}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{insight.descripcion}</p>
      <p className="text-xs text-emerald-400 font-medium">→ {insight.accion}</p>
    </div>
  )
}
