import { z } from 'zod'
import { TipoNotificacion, Prioridad, TipoActivo, Liquidez, TipoTransaccion } from '@/generated/prisma/client'

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
  tipo: z.nativeEnum(TipoNotificacion),
  titulo: z.string().min(1).max(200),
  mensaje: z.string().min(1),
  prioridad: z.nativeEnum(Prioridad).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const activoSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.nativeEnum(TipoActivo),
  valorActual: z.number().positive(),
  valorCompra: z.number().positive().optional(),
  fechaAdquisicion: z.coerce.date().optional(),
  descripcion: z.string().max(500).optional(),
  liquidez: z.nativeEnum(Liquidez).optional(),
})

export const updateActivoSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  valorActual: z.number().positive().optional(),
  descripcion: z.string().max(500).optional(),
  liquidez: z.nativeEnum(Liquidez).optional(),
  activo: z.boolean().optional(),
})

export const valoracionSchema = z.object({
  valor: z.number().positive(),
  fecha: z.coerce.date(),
  notas: z.string().max(500).optional(),
})

export const proyeccionLargoPlazoQuerySchema = z.object({
  años: z.coerce.number().int().min(1).max(5).default(5),
  balanceInicial: z.coerce.number().default(0),
})

export const inversionSchema = z.object({
  activoId: z.string().cuid(),
  montoInvertido: z.number().positive(),
  fechaInversion: z.string().datetime().or(z.coerce.date()),
  valorActual: z.number().positive(),
  dividendos: z.number().nonnegative().optional(),
  intereses: z.number().nonnegative().optional(),
  descripcion: z.string().optional(),
})

export const updateInversionSchema = z.object({
  valorActual: z.number().positive().optional(),
  dividendos: z.number().nonnegative().optional(),
  intereses: z.number().nonnegative().optional(),
  descripcion: z.string().optional(),
  activa: z.boolean().optional(),
})

export const transaccionInversionSchema = z.object({
  tipo: z.nativeEnum(TipoTransaccion),
  monto: z.number().positive(),
  fecha: z.string().datetime().or(z.coerce.date()),
  descripcion: z.string().optional(),
})
