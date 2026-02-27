'use client'
import { useState } from 'react'

interface CreditoFormData {
  nombre: string
  tipo: 'PRESTAMO' | 'TARJETA'
  montoTotal: string
  saldoActual: string
  pagoMensual: string
  pagoMinimo: string
  fechaCorte: string
  diaPago: string
  tasaInteres: string
  activo: boolean
}

interface Props {
  initial?: Partial<CreditoFormData> & { id?: string; tipo?: string }
  onSave: (data: CreditoFormData) => void
  onCancel: () => void
}

export default function CreditoForm({ initial, onSave, onCancel }: Props) {
  const [tipo, setTipo] = useState<'PRESTAMO' | 'TARJETA'>((initial?.tipo as any) ?? 'PRESTAMO')
  const [form, setForm] = useState<Omit<CreditoFormData, 'tipo' | 'activo'>>({
    nombre: initial?.nombre ?? '',
    montoTotal: initial?.montoTotal ?? '',
    saldoActual: initial?.saldoActual ?? '',
    pagoMensual: initial?.pagoMensual ?? '',
    pagoMinimo: initial?.pagoMinimo ?? '',
    fechaCorte: initial?.fechaCorte ?? '',
    diaPago: initial?.diaPago ?? '',
    tasaInteres: initial?.tasaInteres ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, tipo, activo: true })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">{initial?.nombre ? 'Editar crédito' : 'Nuevo crédito'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nombre del crédito</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input" placeholder="Ej: Crédito Nómina" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="input">
            <option value="PRESTAMO">Préstamo / Crédito fijo</option>
            <option value="TARJETA">Tarjeta de crédito</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto total original</label>
          <input required type="number" step="0.01" min="0" value={form.montoTotal} onChange={set('montoTotal')} className="input" placeholder="50000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Saldo actual pendiente</label>
          <input required type="number" step="0.01" min="0" value={form.saldoActual} onChange={set('saldoActual')} className="input" placeholder="35000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Pago mensual</label>
          <input required type="number" step="0.01" min="0" value={form.pagoMensual} onChange={set('pagoMensual')} className="input" placeholder="2500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Día límite de pago (1-31)</label>
          <input required type="number" min="1" max="31" value={form.diaPago} onChange={set('diaPago')} className="input" placeholder="15" />
        </div>
        {tipo === 'TARJETA' && (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Pago mínimo</label>
              <input type="number" step="0.01" min="0" value={form.pagoMinimo} onChange={set('pagoMinimo')} className="input" placeholder="500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de corte (1-31)</label>
              <input type="number" min="1" max="31" value={form.fechaCorte} onChange={set('fechaCorte')} className="input" placeholder="20" />
            </div>
          </>
        )}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tasa de interés anual (%)</label>
          <input type="number" step="0.01" min="0" value={form.tasaInteres} onChange={set('tasaInteres')} className="input" placeholder="24.5" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar crédito</button>
      </div>
    </form>
  )
}
