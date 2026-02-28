/**
 * DeudaReport - Debt evolution and warnings
 */

import React from 'react'
import ProgressBar from './ProgressBar'

interface DeudaReportData {
  report: {
    total: number
    pagado: number
    pendiente: number
    porcentajePagado: number
  }
  warnings: string[]
}

interface DeudaReportProps {
  data: DeudaReportData
}

export default function DeudaReport({ data }: DeudaReportProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)

  const { report, warnings } = data

  return (
    <div className="space-y-6">
      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="card bg-red-900/20 border-red-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-red-400">Alertas de Deuda</h3>
          </div>
          <ul className="space-y-2">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Total Deuda</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(report.total)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Pagado</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(report.pagado)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(report.pendiente)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Progreso de Pago</h3>
        <ProgressBar
          percentage={report.porcentajePagado}
          label="Deuda pagada"
          color={report.porcentajePagado >= 75 ? 'green' : report.porcentajePagado >= 50 ? 'yellow' : 'red'}
        />
        <div className="mt-4 text-sm text-slate-300 flex items-center gap-2">
          {report.porcentajePagado >= 75 && '🎉 Buen progreso en el pago de deudas'}
          {report.porcentajePagado >= 50 && report.porcentajePagado < 75 && '👍 Vas por buen camino'}
          {report.porcentajePagado < 50 && '💪 Continúa pagando para reducir la deuda'}
        </div>
      </div>
    </div>
  )
}
