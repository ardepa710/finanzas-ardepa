'use client'
import { useState } from 'react'
import { useCreatePresupuesto, useCategorias } from '@/features/presupuestos/hooks/usePresupuestos'
import { useToast } from '@/shared/hooks/useToast'

interface PresupuestoFormProps {
  onClose: () => void
}

export default function PresupuestoForm({ onClose }: PresupuestoFormProps) {
  const [categoriaId, setCategoriaId] = useState('')
  const [monto, setMonto] = useState('')
  const [periodo, setPeriodo] = useState<'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('MENSUAL')

  const { data: categorias, isLoading: loadingCategorias } = useCategorias()
  const createMutation = useCreatePresupuesto()
  const { add } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoriaId || !monto) {
      add({
        type: 'error',
        title: 'Error de validación',
        message: 'Todos los campos son obligatorios',
      })
      return
    }

    try {
      await createMutation.mutateAsync({
        categoriaId,
        monto: parseFloat(monto),
        periodo,
      })

      add({
        type: 'success',
        title: 'Presupuesto creado',
        message: 'El presupuesto se ha registrado correctamente',
      })

      onClose()
    } catch (error: any) {
      add({
        type: 'error',
        title: 'Error al crear presupuesto',
        message: error.message || 'Ocurrió un error inesperado',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Nuevo presupuesto</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-slate-400 block mb-1">Categoría</label>
          <select
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="input"
            disabled={loadingCategorias}
          >
            <option value="">Seleccionar categoría</option>
            {categorias?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.icono} {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto (MXN)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="input"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Periodo</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="input"
          >
            <option value="SEMANAL">Semanal</option>
            <option value="QUINCENAL">Quincenal</option>
            <option value="MENSUAL">Mensual</option>
          </select>
        </div>

        <div className="col-span-2 flex gap-2 items-end">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={createMutation.isPending}
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  )
}
