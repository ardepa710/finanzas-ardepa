'use client'
import { useState } from 'react'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  diaSemana: string
  fechaBase: string
}

interface Props {
  initial?: Partial<CreditoFormData> & { id?: string; tipo?: string }
  onSave: (data: CreditoFormData) => void
  onCancel: () => void
}

export default function CreditoForm({ initial, onSave, onCancel }: Props) {
  const [tipo, setTipo] = useState<'PRESTAMO' | 'TARJETA'>((initial?.tipo as any) ?? 'PRESTAMO')
  const [frecuencia, setFrecuencia] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>(
    (initial?.frecuencia as any) ?? 'MENSUAL'
  )
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    montoTotal: initial?.montoTotal ?? '',
    saldoActual: initial?.saldoActual ?? '',
    pagoMensual: initial?.pagoMensual ?? '',
    pagoMinimo: initial?.pagoMinimo ?? '',
    fechaCorte: initial?.fechaCorte ?? '',
    diaPago: initial?.diaPago ?? '',
    tasaInteres: initial?.tasaInteres ?? '',
    diaSemana: initial?.diaSemana ?? '',
    fechaBase: initial?.fechaBase ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, tipo, frecuencia, activo: true })
  }

  const pagoLabel = frecuencia === 'MENSUAL' ? 'Pago mensual' : frecuencia === 'QUINCENAL' ? 'Pago quincenal' : 'Pago semanal'

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
          <label className="text-xs text-slate-400 block mb-1">{pagoLabel}</label>
          <input required type="number" step="0.01" min="0" value={form.pagoMensual} onChange={set('pagoMensual')} className="input" placeholder="2500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Frecuencia de pago</label>
          <select value={frecuencia} onChange={e => setFrecuencia(e.target.value as any)} className="input">
            <option value="MENSUAL">Mensual</option>
            <option value="QUINCENAL">Quincenal (cada 14 días)</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </div>

        {frecuencia === 'MENSUAL' ? (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Día límite de pago (1-31)</label>
            <input required type="number" min="1" max="31" value={form.diaPago} onChange={set('diaPago')} className="input" placeholder="15" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de pago (semana)</label>
              <select value={form.diaSemana} onChange={set('diaSemana')} className="input">
                <option value="">Seleccionar...</option>
                {DIAS_SEMANA.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha del primer pago</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-slate-400 block mb-1">Tasa de interés anual (%)</label>
          <input type="number" step="0.01" min="0" value={form.tasaInteres} onChange={set('tasaInteres')} className="input" placeholder="24.5" />
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
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar crédito</button>
      </div>
    </form>
  )
}
