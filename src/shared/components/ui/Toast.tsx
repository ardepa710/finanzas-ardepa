'use client'
import { useToast } from '@/shared/hooks/useToast'

export function ToastContainer() {
  const { toasts, remove } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-slate-800 border-l-4 p-4 rounded shadow-lg max-w-sm ${getBorderColor(toast.type)}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-100">{toast.title}</h4>
              <p className="text-sm text-slate-300 mt-1">{toast.message}</p>
            </div>
            <button
              onClick={() => remove(toast.id)}
              className="text-slate-400 hover:text-slate-100 ml-4"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function getBorderColor(type: 'success' | 'error' | 'warning' | 'info'): string {
  const colors = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500',
  }
  return colors[type]
}
