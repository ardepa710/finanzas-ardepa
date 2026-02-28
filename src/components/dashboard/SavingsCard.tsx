import type { ResumenAhorro } from '@/lib/savings-calculator'

interface Props {
  resumen: ResumenAhorro
}

export default function SavingsCard({ resumen }: Props) {
  const { cobros } = resumen

  if (cobros.length === 0) {
    return (
      <div className="card flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">Sin proyección disponible</p>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-slate-400">💡 Plan de ahorro</h2>
      <div className="space-y-4">
        {cobros.map((cobro, idx) => (
          <div key={idx} className={idx > 0 ? 'pt-4 border-t border-slate-700/50' : ''}>
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <p className="text-xs text-slate-500">{cobro.fuenteNombre}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {new Date(cobro.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="text-emerald-400 font-semibold">${cobro.montoIngreso.toLocaleString('es-MX')}</p>
            </div>

            {cobro.desglose.length > 0 && (
              <div className="space-y-1 mb-2">
                {cobro.desglose.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">Apartar para {d.creditoNombre}</span>
                    <span className="text-orange-400">−${d.monto.toLocaleString('es-MX')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-700/30">
              <span className="text-slate-400">Disponible</span>
              <span className={cobro.disponible >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ${cobro.disponible.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
