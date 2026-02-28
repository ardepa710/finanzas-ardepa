/**
 * Payment Timeline Visualization
 * Shows sequential payoff schedule with CSS bars
 */

interface PayoffItem {
  nombre: string
  meses: number
}

interface Props {
  orden: string[]
  mesesTotal: number
}

// Color palette for debts
const DEBT_COLORS = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-teal-600',
]

export default function PaymentTimeline({ orden, mesesTotal }: Props) {
  // Calculate months per debt (simplified - assumes equal distribution)
  // In a real implementation, this would come from the timeline data
  const mesesPorDeuda = Math.ceil(mesesTotal / orden.length)

  let acumulado = 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Cronograma de Pago</span>
        <span>{mesesTotal} meses</span>
      </div>

      <div className="space-y-1.5">
        {orden.map((deuda, idx) => {
          const mesesEstaDeuda = Math.min(
            mesesPorDeuda,
            mesesTotal - acumulado
          )
          const width = (mesesEstaDeuda / mesesTotal) * 100
          const color = DEBT_COLORS[idx % DEBT_COLORS.length]
          acumulado += mesesEstaDeuda

          return (
            <div key={deuda} className="flex items-center gap-2">
              <div className="w-24 text-xs text-slate-400 truncate">
                {deuda}
              </div>
              <div className="flex-1 bg-slate-700/30 rounded h-6 overflow-hidden">
                <div
                  className={`${color} h-full rounded flex items-center justify-end px-2 transition-all duration-500`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {mesesEstaDeuda}m
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700">
        <span className="text-xs text-slate-500">Orden de pago:</span>
        <div className="flex gap-2 flex-wrap">
          {orden.map((deuda, idx) => (
            <div key={deuda} className="flex items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded ${DEBT_COLORS[idx % DEBT_COLORS.length]}`}
              />
              <span className="text-xs text-slate-400">
                {idx + 1}. {deuda}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
