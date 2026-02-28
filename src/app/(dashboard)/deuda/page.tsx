/**
 * Debt Strategy Planner Page
 * Compare Snowball vs Avalanche debt payoff strategies
 */

'use client'
import { useState } from 'react'
import ActiveDebtsSummary from '@/components/deuda/ActiveDebtsSummary'
import StrategyComparison from '@/components/deuda/StrategyComparison'
import {
  useActiveCreditos,
  useSnowballStrategy,
  useAvalancheStrategy,
} from '@/features/deuda/hooks/useDeudaStrategies'

export default function DeudaPage() {
  const [pagoExtra, setPagoExtra] = useState(0)

  // Fetch active debts
  const {
    data: creditos,
    isLoading: loadingCreditos,
    error: errorCreditos,
  } = useActiveCreditos()

  // Fetch strategies (only if pagoExtra > 0)
  const {
    data: snowball,
    isLoading: loadingSnowball,
    error: errorSnowball,
  } = useSnowballStrategy(pagoExtra)

  const {
    data: avalanche,
    isLoading: loadingAvalanche,
    error: errorAvalanche,
  } = useAvalancheStrategy(pagoExtra)

  // Filter only active debts with balance > 0
  const activeDebts = creditos?.filter(
    (c) => c.activo && Number(c.saldoActual) > 0
  ) || []

  const hasActiveDebts = activeDebts.length > 0
  const showComparison = pagoExtra > 0 && snowball && avalanche

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          💳 Planificación de Deuda
        </h1>
        <p className="text-slate-400">
          Compara estrategias de pago y encuentra la mejor forma de liberarte de
          tus deudas
        </p>
      </div>

      {/* Loading state */}
      {loadingCreditos && (
        <div className="bg-slate-800 rounded-lg p-12 shadow-lg text-center">
          <p className="text-slate-400">Cargando deudas activas...</p>
        </div>
      )}

      {/* Error state */}
      {errorCreditos && (
        <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6">
          <p className="text-red-400">
            Error al cargar las deudas: {(errorCreditos as Error).message}
          </p>
        </div>
      )}

      {/* Active Debts Summary */}
      {!loadingCreditos && !errorCreditos && (
        <ActiveDebtsSummary creditos={activeDebts} />
      )}

      {/* Extra Payment Slider */}
      {hasActiveDebts && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <label className="block mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-100 font-medium">
                Pago Extra Mensual
              </span>
              <span className="text-2xl font-bold text-emerald-400">
                ${pagoExtra.toLocaleString('es-MX')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={pagoExtra}
              onChange={(e) => setPagoExtra(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>$0</span>
              <span>$500</span>
              <span>$1,000</span>
            </div>
          </label>
          <p className="text-sm text-slate-400 mt-3">
            Ajusta la cantidad extra que puedes pagar mensualmente para ver cómo
            afecta tu plan de pago
          </p>
        </div>
      )}

      {/* Strategy Loading */}
      {pagoExtra > 0 && (loadingSnowball || loadingAvalanche) && (
        <div className="bg-slate-800 rounded-lg p-12 shadow-lg text-center">
          <p className="text-slate-400">Calculando estrategias...</p>
        </div>
      )}

      {/* Strategy Error */}
      {(errorSnowball || errorAvalanche) && (
        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-6">
          <p className="text-yellow-400">
            Error al calcular estrategias:{' '}
            {((errorSnowball || errorAvalanche) as Error).message}
          </p>
        </div>
      )}

      {/* Strategy Comparison */}
      {showComparison && <StrategyComparison snowball={snowball} avalanche={avalanche} />}

      {/* Prompt to set extra payment */}
      {hasActiveDebts && pagoExtra === 0 && (
        <div className="bg-slate-800 rounded-lg p-12 shadow-lg text-center">
          <p className="text-slate-400 mb-2">
            Ajusta el pago extra mensual arriba para comparar estrategias
          </p>
          <p className="text-sm text-slate-500">
            Las estrategias Snowball y Avalanche te ayudarán a salir de deudas
            más rápido
          </p>
        </div>
      )}
    </div>
  )
}
