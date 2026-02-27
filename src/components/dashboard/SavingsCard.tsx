interface ResumenAhorro {
  totalProximoPago: number
  salarioDisponible: number
  proximaFechaPago: string | Date
  diasParaProximoPago: number
  desglose: Array<{ nombre: string; porPago: number[]; montoTotal: number }>
}

export default function SavingsCard({ resumen }: { resumen: ResumenAhorro }) {
  const total = resumen.totalProximoPago
  const salario = total + resumen.salarioDisponible
  const pct = salario > 0 ? (total / salario) * 100 : 0
  const fecha = new Date(resumen.proximaFechaPago)

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-400 mb-3">💰 Recomendación de ahorro</h2>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-bold text-emerald-400">${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
        <span className="text-slate-400 text-sm mb-1">MXN</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Próximo pago: <span className="text-slate-300">{fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        {' '}· en <span className="text-emerald-400">{resumen.diasParaProximoPago} días</span>
      </p>
      <div className="h-1.5 bg-slate-700 rounded-full mb-4">
        <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="space-y-1.5 mb-4">
        {resumen.desglose.filter(d => d.porPago[0] > 0).map(d => (
          <div key={d.nombre} className="flex justify-between text-xs">
            <span className="text-slate-400 truncate">{d.nombre}</span>
            <span className="text-slate-200 ml-2 shrink-0">${d.porPago[0].toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-slate-700 flex justify-between">
        <span className="text-xs text-slate-400">Disponible tras créditos</span>
        <span className="text-sm font-semibold text-slate-100">${resumen.salarioDisponible.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}
