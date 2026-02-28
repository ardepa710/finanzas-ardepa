/**
 * Strategy Comparison Component
 * Side-by-side comparison of Snowball vs Avalanche strategies
 */

import StrategyCard from './StrategyCard'

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
  snowball: StrategyResult
  avalanche: StrategyResult
}

export default function StrategyComparison({ snowball, avalanche }: Props) {
  const winner =
    snowball.totalIntereses < avalanche.totalIntereses
      ? 'snowball'
      : 'avalanche'

  return (
    <div>
      {/* Winner announcement */}
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-600/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-green-400 font-semibold">
              {winner === 'snowball' ? '❄️ Snowball' : '⚡ Avalanche'} es la mejor
              estrategia para ti
            </p>
            <p className="text-sm text-slate-300">
              Ahorrarás ${Math.abs(snowball.totalIntereses - avalanche.totalIntereses).toLocaleString('es-MX')} en intereses
            </p>
          </div>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StrategyCard
          strategy="snowball"
          result={snowball}
          isWinner={winner === 'snowball'}
          otherResult={avalanche}
        />
        <StrategyCard
          strategy="avalanche"
          result={avalanche}
          isWinner={winner === 'avalanche'}
          otherResult={snowball}
        />
      </div>
    </div>
  )
}
