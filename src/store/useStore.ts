import { create } from 'zustand'

interface Store {
  notificacionesNoLeidas: number
  sidebarOpen: boolean
  setNotificacionesNoLeidas: (count: number) => void
  toggleSidebar: () => void
}

export const useStore = create<Store>((set) => ({
  notificacionesNoLeidas: 0,
  sidebarOpen: true,
  setNotificacionesNoLeidas: (count) => set({ notificacionesNoLeidas: count }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
