import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function usePresupuestos() {
  return useQuery({
    queryKey: ['presupuestos'],
    queryFn: () => fetch('/api/presupuestos').then(r => r.json()).then(res => res.data),
  })
}

export function usePresupuestoStatus(periodo: string) {
  return useQuery({
    queryKey: ['presupuesto-status', periodo],
    queryFn: () => fetch(`/api/presupuestos/status?periodo=${periodo}`).then(r => r.json()).then(res => res.data),
  })
}

export function useCreatePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async r => {
      const json = await r.json()
      if (!r.ok) throw new Error(json.error?.message || 'Error al crear presupuesto')
      return json.data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      queryClient.invalidateQueries({ queryKey: ['presupuesto-status'] })
    },
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => fetch('/api/categorias').then(r => r.json()).then(res => res.data),
  })
}
