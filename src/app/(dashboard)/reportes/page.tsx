/**
 * Reportes Page - Financial reports with multiple views
 */

'use client'

import React, { useState } from 'react'
import { useGastosReport, useIngresosReport, useDeudaReport, useCashflowReport } from '@/features/reportes/hooks/useReportes'
import DateRangePicker from '@/components/reportes/DateRangePicker'
import GastosReport from '@/components/reportes/GastosReport'
import IngresosReport from '@/components/reportes/IngresosReport'
import DeudaReport from '@/components/reportes/DeudaReport'
import CashflowReport from '@/components/reportes/CashflowReport'

type Tab = 'gastos' | 'ingresos' | 'deuda' | 'cashflow'
type Periodo = 'mensual' | 'semanal' | 'quincenal'

const TAB_LABELS: Record<Tab, string> = {
  gastos: 'Gastos',
  ingresos: 'Ingresos',
  deuda: 'Deuda',
  cashflow: 'Cashflow',
}

const PERIODO_LABELS: Record<Periodo, string> = {
  mensual: 'Mensual',
  semanal: 'Semanal',
  quincenal: 'Quincenal',
}

// Helper to get default date range (current month)
function getDefaultDateRange() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    inicio: inicio.toISOString().split('T')[0],
    fin: fin.toISOString().split('T')[0],
  }
}

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gastos')
  const defaultRange = getDefaultDateRange()
  const [inicio, setInicio] = useState(defaultRange.inicio)
  const [fin, setFin] = useState(defaultRange.fin)
  const [periodo, setPeriodo] = useState<Periodo>('mensual')

  // Fetch reports based on active tab
  const gastosQuery = useGastosReport(inicio, fin)
  const ingresosQuery = useIngresosReport(inicio, fin)
  const deudaQuery = useDeudaReport(inicio, fin)
  const cashflowQuery = useCashflowReport(periodo)

  // Get current query based on active tab
  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'gastos':
        return gastosQuery
      case 'ingresos':
        return ingresosQuery
      case 'deuda':
        return deudaQuery
      case 'cashflow':
        return cashflowQuery
      default:
        return gastosQuery
    }
  }

  const currentQuery = getCurrentQuery()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">📊 Reportes</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        {activeTab === 'cashflow' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Periodo
            </label>
            <div className="flex gap-2">
              {(Object.keys(PERIODO_LABELS) as Periodo[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                    periodo === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {PERIODO_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <DateRangePicker
            inicio={inicio}
            fin={fin}
            onInicioChange={setInicio}
            onFinChange={setFin}
          />
        )}
      </div>

      {/* Loading State */}
      {currentQuery.isLoading && (
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-slate-400">Generando reporte...</p>
        </div>
      )}

      {/* Error State */}
      {currentQuery.isError && (
        <div className="card bg-red-900/20 border-red-700 text-center py-8">
          <p className="text-red-400 mb-2">⚠️ Error al cargar el reporte</p>
          <p className="text-slate-400 text-sm">
            {currentQuery.error instanceof Error ? currentQuery.error.message : 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Report Content */}
      {currentQuery.isSuccess && currentQuery.data && (
        <>
          {activeTab === 'gastos' && <GastosReport data={currentQuery.data} />}
          {activeTab === 'ingresos' && <IngresosReport data={currentQuery.data} />}
          {activeTab === 'deuda' && <DeudaReport data={currentQuery.data} />}
          {activeTab === 'cashflow' && <CashflowReport data={currentQuery.data} />}
        </>
      )}

      {/* Empty State */}
      {currentQuery.isSuccess && !currentQuery.data && (
        <div className="card text-center py-12">
          <p className="text-slate-400">No hay datos para el periodo seleccionado</p>
        </div>
      )}
    </div>
  )
}
