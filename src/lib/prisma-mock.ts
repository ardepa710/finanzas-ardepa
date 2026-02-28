/**
 * Prisma mock for testing
 */

import { vi } from 'vitest'
import type { PrismaClient } from '@/generated/prisma/client'

export const prismaMock = {
  gasto: {
    groupBy: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  categoria: {
    findMany: vi.fn(),
  },
  ingresoManual: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  credito: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient
