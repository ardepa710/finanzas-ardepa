'use client'
import { useState } from 'react'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export interface FuenteIngresoFormData {
  nombre: string
  monto: string
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  diaSemana: string
  diaMes: string
  fechaBase: string
}

interface Props {
  initial?: Partial<FuenteIngresoFormData> & { id?: string }
  onSave: (data: FuenteIngresoFormData) => void
  onCancel: () => void
}

export default function FuenteIngresoForm({ initial, onSave, onCancel }: Props) {
  const [frecuencia, setFrecuencia] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>(
    (initial?.frecuencia as any) ?? 'QUINCENAL'
  )
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    monto: initial?.monto ?? '',
    diaSemana: initial?.diaSemana ?? '',
    diaMes: initial?.diaMes ?? '',
    fechaBase: initial?.fechaBase ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, frecuencia })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">{initial?.id ? 'Editar fuente' : 'Nueva fuente de ingreso'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nombre</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input" placeholder="Ej: Salario IMSS" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto</label>
          <input required type="number" step="0.01" min="0" value={form.monto} onChange={set('monto')} className="input" placeholder="22000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Frecuencia</label>
          <select value={frecuencia} onChange={e => setFrecuencia(e.target.value as any)} className="input">
            <option value="MENSUAL">Mensual</option>
            <option value="QUINCENAL">Quincenal (cada 14 días)</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </div>

        {frecuencia === 'MENSUAL' ? (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día del mes que cobras</label>
              <input required type="number" min="1" max="31" value={form.diaMes} onChange={set('diaMes')} className="input" placeholder="15" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha de referencia</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de la semana</label>
              <select value={form.diaSemana} onChange={set('diaSemana')} className="input">
                <option value="">Seleccionar...</option>
                {DIAS_SEMANA.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha del primer cobro</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  )
}
