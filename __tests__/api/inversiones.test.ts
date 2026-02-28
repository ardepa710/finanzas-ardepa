import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Inversiones API', () => {
  let testActivoId: string
  let testInversionId: string

  beforeAll(async () => {
    // Create a test activo of tipo INVERSION
    const activo = await prisma.activo.create({
      data: {
        nombre: 'Test Stock Portfolio',
        tipo: 'INVERSION',
        valorActual: 10000,
        liquidez: 'ALTA',
      },
    })
    testActivoId = activo.id
  })

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.transaccionInversion.deleteMany({})
    await prisma.inversion.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.transaccionInversion.deleteMany({})
    await prisma.inversion.deleteMany({})
    await prisma.valoracionActivo.deleteMany({})
    await prisma.activo.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/inversiones', () => {
    it('creates investment with COMPRA transaction auto-created', async () => {
      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: testActivoId,
          montoInvertido: 10000,
          fechaInversion: '2024-01-15T00:00:00Z',
          valorActual: 10000,
          descripcion: 'Initial investment in tech stocks',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.activoId).toBe(testActivoId)
      expect(response.body.data.montoInvertido).toBe('10000')
      expect(response.body.data.valorActual).toBe('10000')
      expect(response.body.data.rendimientoTotal).toBe('0')
      expect(response.body.data.rendimientoPct).toBe('0')
      expect(response.body.data.dividendos).toBe('0')
      expect(response.body.data.intereses).toBe('0')
      expect(response.body.data.activa).toBe(true)
      expect(response.body.data.transacciones).toHaveLength(1)
      expect(response.body.data.transacciones[0].tipo).toBe('COMPRA')
      expect(response.body.data.transacciones[0].monto).toBe('10000')

      testInversionId = response.body.data.id
    })

    it('creates investment with dividendos and intereses', async () => {
      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: testActivoId,
          montoInvertido: 5000,
          fechaInversion: '2023-01-01T00:00:00Z',
          valorActual: 6500,
          dividendos: 200,
          intereses: 150,
          descripcion: 'Dividend stock',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.dividendos).toBe('200')
      expect(response.body.data.intereses).toBe('150')
      expect(response.body.data.rendimientoTotal).toBe('1500')
      expect(response.body.data.rendimientoPct).toBe('30')
    })

    it('validates activoId exists', async () => {
      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: 'clxxxxxxxxxxxx',
          montoInvertido: 1000,
          fechaInversion: '2024-01-01T00:00:00Z',
          valorActual: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('validates tipo=INVERSION activo', async () => {
      // Create activo with wrong tipo
      const otherActivo = await prisma.activo.create({
        data: {
          nombre: 'Test Casa',
          tipo: 'INMUEBLE',
          valorActual: 100000,
        },
      })

      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: otherActivo.id,
          montoInvertido: 1000,
          fechaInversion: '2024-01-01T00:00:00Z',
          valorActual: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.message).toContain('INVERSION')

      await prisma.activo.delete({ where: { id: otherActivo.id } })
    })

    it('validates positive amounts', async () => {
      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: testActivoId,
          montoInvertido: -1000,
          fechaInversion: '2024-01-01T00:00:00Z',
          valorActual: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('validates date formats', async () => {
      const response = await request(baseURL)
        .post('/api/inversiones')
        .send({
          activoId: testActivoId,
          montoInvertido: 1000,
          fechaInversion: 'invalid-date',
          valorActual: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('GET /api/inversiones', () => {
    beforeEach(async () => {
      // Create test investments
      await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 5000,
          fechaInversion: new Date('2024-01-01'),
          valorActual: 6000,
          rendimientoTotal: 1000,
          rendimientoPct: 20,
          activa: true,
        },
      })

      await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 3000,
          fechaInversion: new Date('2024-06-01'),
          valorActual: 2500,
          rendimientoTotal: -500,
          rendimientoPct: -16.67,
          activa: false, // Inactive
        },
      })
    })

    it('lists all active investments', async () => {
      const response = await request(baseURL).get('/api/inversiones').expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
      expect(response.body.data[0]).toHaveProperty('activoId')
      expect(response.body.data[0]).toHaveProperty('montoInvertido')
      expect(response.body.data[0]).toHaveProperty('valorActual')
      expect(response.body.data[0].activa).toBe(true)
    })

    it('filters inactive investments by default', async () => {
      const response = await request(baseURL).get('/api/inversiones').expect(200)

      const allActive = response.body.data.every((inv: any) => inv.activa === true)
      expect(allActive).toBe(true)
    })
  })

  describe('GET /api/inversiones/:id', () => {
    beforeEach(async () => {
      const inversion = await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 10000,
          fechaInversion: new Date('2024-01-01'),
          valorActual: 12000,
          rendimientoTotal: 2000,
          rendimientoPct: 20,
          dividendos: 300,
          intereses: 100,
        },
      })
      testInversionId = inversion.id

      // Create transactions
      await prisma.transaccionInversion.createMany({
        data: [
          {
            inversionId: testInversionId,
            tipo: 'COMPRA',
            monto: 10000,
            fecha: new Date('2024-01-01'),
          },
          {
            inversionId: testInversionId,
            tipo: 'DIVIDENDO',
            monto: 300,
            fecha: new Date('2024-06-01'),
          },
          {
            inversionId: testInversionId,
            tipo: 'INTERES',
            monto: 100,
            fecha: new Date('2024-12-01'),
          },
        ],
      })
    })

    it('gets investment details with transactions', async () => {
      const response = await request(baseURL)
        .get(`/api/inversiones/${testInversionId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.id).toBe(testInversionId)
      expect(response.body.data.transacciones).toHaveLength(3)
      expect(response.body.data.transacciones[0].tipo).toBe('INTERES') // Latest first
      expect(response.body.data.activo).toBeDefined()
      expect(response.body.data.activo.nombre).toBe('Test Stock Portfolio')
    })

    it('returns 404 for non-existent investment', async () => {
      const response = await request(baseURL)
        .get('/api/inversiones/clxxxxxxxxxxxx')
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('PUT /api/inversiones/:id', () => {
    beforeEach(async () => {
      const inversion = await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 10000,
          fechaInversion: new Date('2024-01-01'),
          valorActual: 10000,
          rendimientoTotal: 0,
          rendimientoPct: 0,
        },
      })
      testInversionId = inversion.id
    })

    it('updates investment and recalculates returns', async () => {
      const response = await request(baseURL)
        .put(`/api/inversiones/${testInversionId}`)
        .send({
          valorActual: 15000,
          dividendos: 500,
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.valorActual).toBe('15000')
      expect(response.body.data.dividendos).toBe('500')
      expect(response.body.data.rendimientoTotal).toBe('5000')
      expect(response.body.data.rendimientoPct).toBe('50')
    })

    it('handles negative returns', async () => {
      const response = await request(baseURL)
        .put(`/api/inversiones/${testInversionId}`)
        .send({
          valorActual: 7000,
        })
        .expect(200)

      expect(response.body.data.rendimientoTotal).toBe('-3000')
      expect(response.body.data.rendimientoPct).toBe('-30')
    })
  })

  describe('DELETE /api/inversiones/:id', () => {
    beforeEach(async () => {
      const inversion = await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 5000,
          fechaInversion: new Date('2024-01-01'),
          valorActual: 5000,
          rendimientoTotal: 0,
          rendimientoPct: 0,
        },
      })
      testInversionId = inversion.id
    })

    it('soft deletes investment', async () => {
      const response = await request(baseURL)
        .delete(`/api/inversiones/${testInversionId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.activa).toBe(false)

      // Verify it's not in active list
      const listResponse = await request(baseURL).get('/api/inversiones')
      const found = listResponse.body.data.find(
        (inv: any) => inv.id === testInversionId
      )
      expect(found).toBeUndefined()
    })
  })

  describe('POST /api/inversiones/:id/transacciones', () => {
    beforeEach(async () => {
      const inversion = await prisma.inversion.create({
        data: {
          activoId: testActivoId,
          montoInvertido: 10000,
          fechaInversion: new Date('2024-01-01'),
          valorActual: 11000,
          rendimientoTotal: 1000,
          rendimientoPct: 10,
          dividendos: 0,
          intereses: 0,
        },
      })
      testInversionId = inversion.id
    })

    it('adds dividend transaction', async () => {
      const response = await request(baseURL)
        .post(`/api/inversiones/${testInversionId}/transacciones`)
        .send({
          tipo: 'DIVIDENDO',
          monto: 250,
          fecha: '2024-06-15T00:00:00Z',
          descripcion: 'Q2 dividend',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.tipo).toBe('DIVIDENDO')
      expect(response.body.data.monto).toBe('250')
    })

    it('adds interest transaction', async () => {
      const response = await request(baseURL)
        .post(`/api/inversiones/${testInversionId}/transacciones`)
        .send({
          tipo: 'INTERES',
          monto: 150,
          fecha: '2024-12-31T00:00:00Z',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.tipo).toBe('INTERES')
    })

    it('adds aporte transaction', async () => {
      const response = await request(baseURL)
        .post(`/api/inversiones/${testInversionId}/transacciones`)
        .send({
          tipo: 'APORTE',
          monto: 5000,
          fecha: '2024-07-01T00:00:00Z',
          descripcion: 'Additional investment',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.tipo).toBe('APORTE')
    })

    it('adds retiro transaction', async () => {
      const response = await request(baseURL)
        .post(`/api/inversiones/${testInversionId}/transacciones`)
        .send({
          tipo: 'RETIRO',
          monto: 2000,
          fecha: '2024-09-01T00:00:00Z',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.tipo).toBe('RETIRO')
    })

    it('validates enum values', async () => {
      const response = await request(baseURL)
        .post(`/api/inversiones/${testInversionId}/transacciones`)
        .send({
          tipo: 'INVALID_TYPE',
          monto: 100,
          fecha: '2024-01-01T00:00:00Z',
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('GET /api/inversiones/resumen', () => {
    beforeEach(async () => {
      // Create multiple investments for summary
      await prisma.inversion.createMany({
        data: [
          {
            activoId: testActivoId,
            montoInvertido: 10000,
            fechaInversion: new Date('2024-01-01'),
            valorActual: 15000,
            rendimientoTotal: 5000,
            rendimientoPct: 50,
            dividendos: 300,
            intereses: 100,
            activa: true,
          },
          {
            activoId: testActivoId,
            montoInvertido: 5000,
            fechaInversion: new Date('2024-06-01'),
            valorActual: 4000,
            rendimientoTotal: -1000,
            rendimientoPct: -20,
            dividendos: 0,
            intereses: 50,
            activa: true,
          },
        ],
      })
    })

    it('gets portfolio summary', async () => {
      const response = await request(baseURL).get('/api/inversiones/resumen').expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.totalInversiones).toBeGreaterThanOrEqual(2)
      expect(response.body.data.montoTotalInvertido).toBe('15000')
      expect(response.body.data.valorActualTotal).toBe('19000')
      expect(response.body.data.rendimientoTotal).toBe('4000')
      expect(Number(response.body.data.rendimientoPct)).toBeCloseTo(26.67, 1)
      expect(response.body.data.dividendosTotal).toBe('300')
      expect(response.body.data.interesesTotal).toBe('150')
      expect(response.body.data.porActivo).toBeDefined()
      expect(response.body.data.mejores).toBeDefined()
      expect(response.body.data.peores).toBeDefined()
    })

    it('handles summary with zero investments', async () => {
      await prisma.inversion.deleteMany({})

      const response = await request(baseURL).get('/api/inversiones/resumen').expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.totalInversiones).toBe(0)
      expect(response.body.data.montoTotalInvertido).toBe('0')
      expect(response.body.data.valorActualTotal).toBe('0')
    })
  })
})
