'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']
const LABELS: Record<string, string> = {
  ALIMENTACION: 'Alimentación',
  TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  SERVICIOS: 'Servicios',
  OTROS: 'Otros',
}

export default function ExpensesPieChart({ porCategoria }: { porCategoria: Record<string, number> }) {
  const data = Object.entries(porCategoria)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: LABELS[name] ?? name,
      value: Math.round(value * 100) / 100,
    }))

  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">Sin gastos registrados este mes</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-400 mb-4">🥧 Gastos del mes por categoría</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v: number | undefined) => [`$${(v ?? 0).toLocaleString('es-MX')}`, 'Total']}
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
