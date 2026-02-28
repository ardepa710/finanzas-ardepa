import { z } from 'zod'

export const gastoSchema = z.object({
  descripcion: z.string().min(1).max(200),
  monto: z.number().positive(),
  categoriaId: z.string().cuid(),
  fecha: z.string().datetime(),
})

export const presupuestoSchema = z.object({
  categoriaId: z.string().cuid(),
  monto: z.number().positive(),
  periodo: z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL']),
})

export const creditoSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['PRESTAMO', 'TARJETA']),
  montoTotal: z.number().positive(),
  saldoActual: z.number().min(0),
  pagoMensual: z.number().positive(),
  diaPago: z.number().int().min(1).max(31),
  tasaInteres: z.number().min(0).max(100).optional(),
})

export const notificacionSchema = z.object({
  tipo: z.enum(['PRESUPUESTO_80', 'PRESUPUESTO_90', 'PRESUPUESTO_100', 'CREDITO_PROXIMO', 'CREDITO_VENCIDO', 'AHORRO_BAJO', 'AHORRO_META', 'GASTO_INUSUAL', 'LOGRO_DESBLOQUEADO', 'INSIGHT_IA']),
  titulo: z.string().min(1).max(200),
  mensaje: z.string().min(1),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})
