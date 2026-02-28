import { create } from 'zustand'

type Toast = {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

// Map to track setTimeout IDs for cleanup
const timeouts = new Map<string, NodeJS.Timeout>()

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

    // Store timeout ID for cleanup
    const timeoutId = setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
      timeouts.delete(id)
    }, toast.duration || 5000)
    timeouts.set(id, timeoutId)
  },
  remove: (id) => {
    // Clear pending timeout to prevent memory leak
    const timeoutId = timeouts.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeouts.delete(id)
    }
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
