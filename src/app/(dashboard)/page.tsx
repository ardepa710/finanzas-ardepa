import SavingsCard from '@/components/dashboard/SavingsCard'
import ExpensesPieChart from '@/components/dashboard/ExpensesPieChart'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro } from '@/lib/savings-calculator'

export const dynamic = 'force-dynamic'

const EMOJI: Record<string, string> = {
  ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬',
  SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦',
}

export default async function DashboardPage() {
  const [creditos, fuentes] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true }, orderBy: { diaPago: 'asc' } }),
    prisma.fuenteIngreso.findMany({ where: { activo: true } }),
  ])

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [gastosMes, gastosRecientes] = await Promise.all([
    prisma.gasto.findMany({ where: { fecha: { gte: inicioMes } } }),
    prisma.gasto.findMany({ orderBy: { fecha: 'desc' }, take: 8 }),
  ])

  const totalMes = gastosMes.reduce((s, g) => s + Number(g.monto), 0)
  const totalDeuda = creditos.reduce((s, c) => s + Number(c.saldoActual), 0)
  const salarioTotal = fuentes.reduce((s, f) => s + Number(f.monto), 0)

  const porCategoria = gastosMes.reduce((acc, g) => {
    const key = g.categoria as string
    acc[key] = (acc[key] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  const resumenAhorro = fuentes.length > 0
    ? calcularResumenAhorro(
        creditos.map(c => ({
          nombre: c.nombre,
          pagoMensual: Number(c.pagoMensual),
          frecuencia: c.frecuencia as any,
          diaPago: c.diaPago,
          diaSemana: c.diaSemana ?? undefined,
          fechaBase: c.fechaBase ?? undefined,
        })),
        fuentes.map(f => ({
          nombre: f.nombre,
          monto: Number(f.monto),
          frecuencia: f.frecuencia as any,
          diaMes: f.diaMes ?? undefined,
          diaSemana: f.diaSemana ?? undefined,
          fechaBase: f.fechaBase,
        })),
        new Date()
      )
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">📊 Dashboard</h1>
        <p className="text-slate-500 text-sm">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Ingresos configurados</p>
          <p className="text-2xl font-bold text-emerald-400">${salarioTotal.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">MXN · {fuentes.length} {fuentes.length === 1 ? 'fuente' : 'fuentes'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Gastos del mes</p>
          <p className="text-2xl font-bold text-red-400">${totalMes.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">{gastosMes.length} transacciones</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Deuda total</p>
          <p className="text-2xl font-bold text-orange-400">${totalDeuda.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">{creditos.length} créditos activos</p>
        </div>
      </div>

      {/* Savings + Pie chart */}
      <div className="grid grid-cols-2 gap-4">
        {resumenAhorro ? (
          <SavingsCard resumen={resumenAhorro} />
        ) : (
          <div className="card flex items-center justify-center h-48">
            <p className="text-slate-500 text-sm">Configura tus ingresos para ver el plan de ahorro</p>
          </div>
        )}
        <ExpensesPieChart porCategoria={porCategoria} />
      </div>

      {/* Credits status */}
      {creditos.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">💳 Estado de créditos</h2>
          <div className="space-y-4">
            {creditos.map(c => {
              const pct = Math.max(0, Math.min(100, 100 - (Number(c.saldoActual) / Number(c.montoTotal)) * 100))
              const diasParaPago = (() => {
                const hoy = new Date()
                const pago = new Date(hoy.getFullYear(), hoy.getMonth(), c.diaPago)
                if (pago <= hoy) pago.setMonth(pago.getMonth() + 1)
                return Math.ceil((pago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
              })()
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200">{c.nombre}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${diasParaPago <= 5 ? 'bg-red-500/20 text-red-400' : diasParaPago <= 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                        {diasParaPago <= 0 ? 'Vencido' : `${diasParaPago}d`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">${Number(c.saldoActual).toLocaleString('es-MX')} restante</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">🕐 Gastos recientes</h2>
        {gastosRecientes.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin gastos registrados aún.</p>
        ) : (
          <div className="space-y-3">
            {gastosRecientes.map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{EMOJI[g.categoria as string] ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{g.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(g.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    {' · '}{g.fuente === 'TELEGRAM' ? '📱' : '🌐'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-400 shrink-0">${Number(g.monto).toLocaleString('es-MX')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
