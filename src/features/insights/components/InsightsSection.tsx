'use client'
import { useInsights } from '../hooks/useInsights'
import InsightCard from './InsightCard'
import InsightsSkeleton from './InsightsSkeleton'
import { useQueryClient } from '@tanstack/react-query'

export default function InsightsSection() {
  const { data: insights, isLoading, isError } = useInsights()
  const qc = useQueryClient()

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-200">🤖 Insights IA</h2>
        {!isLoading && (
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['insights'] })}
            aria-label="Actualizar insights IA"
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Actualizar
          </button>
        )}
      </div>

      {isLoading && <InsightsSkeleton />}

      {!isLoading && isError && (
        <div className="bg-slate-800/40 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-sm text-red-400">No se pudieron cargar los insights. Intenta de nuevo.</p>
        </div>
      )}

      {!isLoading && !isError && (!insights || insights.length === 0) && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400">Agrega ingresos y gastos para recibir análisis personalizados.</p>
        </div>
      )}

      {!isLoading && insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins) => (
            <InsightCard key={`${ins.tipo}-${ins.titulo}`} insight={ins} />
          ))}
        </div>
      )}
    </section>
  )
}
