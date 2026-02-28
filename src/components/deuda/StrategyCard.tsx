/**
 * Strategy Card Component
 * Displays results for a single debt payoff strategy
 */

import PaymentTimeline from './PaymentTimeline'

interface StrategyResult {
  orden: string[]
  timeline: any[]
  totalPagado: number
  totalIntereses: number
  mesesLibertad: number
  metadata?: {
    totalCreditosActivos: number
    pagoMensualMinimo: number
    pagoMensualTotal: number
  }
}

interface Props {
  strategy: 'snowball' | 'avalanche'
  result: StrategyResult
  isWinner: boolean
  otherResult?: StrategyResult
}

const STRATEGY_INFO = {
  snowball: {
    emoji: '❄️',
    name: 'Snowball',
    description: 'Pagar primero el balance más pequeño',
  },
  avalanche: {
    emoji: '⚡',
    name: 'Avalanche',
    description: 'Pagar primero el interés más alto',
  },
}

export default function StrategyCard({
  strategy,
  result,
  isWinner,
  otherResult,
}: Props) {
  const info = STRATEGY_INFO[strategy]
  const savings = otherResult
    ? Math.abs(result.totalIntereses - otherResult.totalIntereses)
    : 0

  return (
    <div
      className={`bg-slate-800 rounded-lg p-6 shadow-lg border-2 transition-all ${
        isWinner
          ? 'border-green-600'
          : 'border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{info.emoji}</span>
            <h3 className="text-xl font-bold text-slate-100">{info.name}</h3>
          </div>
          <p className="text-sm text-slate-400">{info.description}</p>
        </div>
        {isWinner && (
          <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
            <span>🏆</span>
            <span>Ahorra más</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Meses hasta libertad</p>
          <p className="text-2xl font-bold text-emerald-400">
            {result.mesesLibertad}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total pagado</p>
          <p className="text-2xl font-bold text-slate-100">
            ${result.totalPagado.toLocaleString('es-MX')}
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total intereses</p>
          <p className="text-2xl font-bold text-red-400">
            ${result.totalIntereses.toLocaleString('es-MX')}
          </p>
        </div>
        {isWinner && otherResult && (
          <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
            <p className="text-xs text-green-400 mb-1">Ahorro vs {strategy === 'snowball' ? 'Avalanche' : 'Snowball'}</p>
            <p className="text-2xl font-bold text-green-400">
              ${savings.toLocaleString('es-MX')}
            </p>
          </div>
        )}
      </div>

      {/* Payoff Order */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          Orden de pago:
        </h4>
        <ol className="space-y-2">
          {result.orden.map((deuda, idx) => (
            <li
              key={deuda}
              className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-2"
            >
              <span className="flex items-center justify-center w-6 h-6 bg-slate-600 text-slate-100 rounded-full text-xs font-bold">
                {idx + 1}
              </span>
              <span className="text-slate-200">{deuda}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Timeline Visualization */}
      <div className="pt-6 border-t border-slate-700">
        <PaymentTimeline
          orden={result.orden}
          mesesTotal={result.mesesLibertad}
        />
      </div>
    </div>
  )
}
