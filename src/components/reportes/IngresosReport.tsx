/**
 * IngresosReport - Income vs expenses comparison
 */

import React from 'react'
import ProgressBar from './ProgressBar'

interface IngresosReportData {
  periodo: { inicio: string; fin: string }
  totalIngresos: number
  totalGastos: number
  balance: number
  porcentajeAhorro: number
  recomendaciones: string[]
}

interface IngresosReportProps {
  data: IngresosReportData
}

export default function IngresosReport({ data }: IngresosReportProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)

  const balanceColor = data.balance >= 0 ? 'text-green-500' : 'text-red-500'
  const balanceIcon = data.balance >= 0 ? '✅' : '⚠️'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(data.totalIngresos)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totalGastos)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1 flex items-center gap-1">
            Balance {balanceIcon}
          </p>
          <p className={`text-2xl font-bold ${balanceColor}`}>{formatCurrency(data.balance)}</p>
        </div>
      </div>

      {/* Savings Rate */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Tasa de Ahorro</h3>
        <ProgressBar
          percentage={data.porcentajeAhorro}
          label="Porcentaje de ingresos ahorrados"
          color={data.porcentajeAhorro >= 20 ? 'green' : data.porcentajeAhorro >= 10 ? 'yellow' : 'red'}
        />
        <div className="mt-4 text-sm text-slate-300">
          {data.porcentajeAhorro >= 20 && '🎉 Excelente tasa de ahorro'}
          {data.porcentajeAhorro >= 10 && data.porcentajeAhorro < 20 && '👍 Buena tasa de ahorro'}
          {data.porcentajeAhorro < 10 && '⚠️ Considera aumentar tus ahorros'}
        </div>
      </div>

      {/* Recommendations */}
      {data.recomendaciones.length > 0 && (
        <div className="card bg-blue-900/20 border-blue-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
            💡 Recomendaciones
          </h3>
          <ul className="space-y-2">
            {data.recomendaciones.map((rec, idx) => (
              <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
