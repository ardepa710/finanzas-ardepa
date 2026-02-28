import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Activos API', () => {
  let testActivoId: string

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.valoracionActivo.deleteMany({})
    await prisma.activo.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup and disconnect
    await prisma.valoracionActivo.deleteMany({})
    await prisma.activo.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/activos', () => {
    it('creates activo with initial valoración', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          nombre: 'Casa Principal',
          tipo: 'INMUEBLE',
          valorActual: 150000,
          valorCompra: 120000,
          fechaAdquisicion: '2020-01-15',
          liquidez: 'BAJA',
          descripcion: 'Casa familiar',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Casa Principal')
      expect(response.body.data.tipo).toBe('INMUEBLE')
      expect(response.body.data.valorActual).toBe('150000.00')
      expect(response.body.data.valorCompra).toBe('120000.00')
      expect(response.body.data.liquidez).toBe('BAJA')
      expect(response.body.data.activo).toBe(true)
      expect(response.body.data.historico).toHaveLength(1)
      expect(response.body.data.historico[0].valor).toBe('150000.00')
      expect(response.body.data.historico[0].notas).toBe('Valoración inicial')

      testActivoId = response.body.data.id
    })

    it('creates activo with minimal fields', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          nombre: 'Cuenta Ahorro',
          tipo: 'AHORRO',
          valorActual: 5000,
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Cuenta Ahorro')
      expect(response.body.data.liquidez).toBe('MEDIA') // Default value
      expect(response.body.data.valorCompra).toBeNull()
      expect(response.body.data.historico).toHaveLength(1)
    })

    it('validates required fields', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          tipo: 'VEHICULO',
          valorActual: 20000,
          // Missing nombre
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('validates positive valorActual', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          nombre: 'Test',
          tipo: 'EFECTIVO',
          valorActual: -100,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('validates valid TipoActivo enum', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          nombre: 'Test',
          tipo: 'INVALID_TYPE',
          valorActual: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('validates valid Liquidez enum', async () => {
      const response = await request(baseURL)
        .post('/api/activos')
        .send({
          nombre: 'Test',
          tipo: 'OTRO',
          valorActual: 1000,
          liquidez: 'SUPER_ALTA',
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/activos', () => {
    beforeEach(async () => {
      // Create test activos
      await prisma.activo.create({
        data: {
          nombre: 'Casa',
          tipo: 'INMUEBLE',
          valorActual: 150000,
          liquidez: 'BAJA',
          activo: true,
        },
      })

      await prisma.activo.create({
        data: {
          nombre: 'Carro',
          tipo: 'VEHICULO',
          valorActual: 20000,
          liquidez: 'MEDIA',
          activo: false, // Inactive
        },
      })
    })

    it('returns all activos', async () => {
      const response = await request(baseURL).get('/api/activos').expect(200)

      expect(response.body.ok).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(2)
    })

    it('filters by activo=true', async () => {
      const response = await request(baseURL)
        .get('/api/activos?activo=true')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.length).toBe(1)
      expect(response.body.data[0].nombre).toBe('Casa')
      expect(response.body.data[0].activo).toBe(true)
    })

    it('includes historico in response', async () => {
      const response = await request(baseURL).get('/api/activos').expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data[0]).toHaveProperty('historico')
      expect(Array.isArray(response.body.data[0].historico)).toBe(true)
    })
  })

  describe('GET /api/activos/:id', () => {
    beforeEach(async () => {
      const activo = await prisma.activo.create({
        data: {
          nombre: 'Test Activo',
          tipo: 'AHORRO',
          valorActual: 10000,
          historico: {
            create: [
              { valor: 8000, fecha: new Date('2024-01-01'), notas: 'Primera' },
              { valor: 9000, fecha: new Date('2025-01-01'), notas: 'Segunda' },
              { valor: 10000, fecha: new Date('2026-01-01'), notas: 'Tercera' },
            ],
          },
        },
      })
      testActivoId = activo.id
    })

    it('returns activo by id with full historico', async () => {
      const response = await request(baseURL)
        .get(`/api/activos/${testActivoId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.id).toBe(testActivoId)
      expect(response.body.data.nombre).toBe('Test Activo')
      expect(response.body.data.historico).toHaveLength(3)
      // Should be ordered by fecha desc
      expect(response.body.data.historico[0].notas).toBe('Tercera')
    })

    it('returns 404 for non-existent activo', async () => {
      const response = await request(baseURL)
        .get('/api/activos/nonexistent-id')
        .expect(404)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/activos/:id', () => {
    beforeEach(async () => {
      const activo = await prisma.activo.create({
        data: {
          nombre: 'Original Name',
          tipo: 'VEHICULO',
          valorActual: 20000,
          liquidez: 'MEDIA',
        },
      })
      testActivoId = activo.id
    })

    it('updates activo fields', async () => {
      const response = await request(baseURL)
        .put(`/api/activos/${testActivoId}`)
        .send({
          nombre: 'Updated Name',
          valorActual: 18000,
          liquidez: 'BAJA',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Updated Name')
      expect(response.body.data.valorActual).toBe('18000.00')
      expect(response.body.data.liquidez).toBe('BAJA')
    })

    it('allows partial updates', async () => {
      const response = await request(baseURL)
        .put(`/api/activos/${testActivoId}`)
        .send({
          descripcion: 'Nueva descripción',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.descripcion).toBe('Nueva descripción')
      expect(response.body.data.nombre).toBe('Original Name') // Unchanged
    })

    it('validates positive valorActual', async () => {
      const response = await request(baseURL)
        .put(`/api/activos/${testActivoId}`)
        .send({
          valorActual: -5000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/activos/:id', () => {
    beforeEach(async () => {
      const activo = await prisma.activo.create({
        data: {
          nombre: 'To Delete',
          tipo: 'OTRO',
          valorActual: 5000,
        },
      })
      testActivoId = activo.id
    })

    it('soft deletes activo (sets activo=false)', async () => {
      const response = await request(baseURL)
        .delete(`/api/activos/${testActivoId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.activo).toBe(false)

      // Verify it's soft deleted
      const activo = await prisma.activo.findUnique({
        where: { id: testActivoId },
      })
      expect(activo).not.toBeNull()
      expect(activo?.activo).toBe(false)
    })
  })

  describe('GET /api/activos/:id/valoraciones', () => {
    beforeEach(async () => {
      const activo = await prisma.activo.create({
        data: {
          nombre: 'Test Activo',
          tipo: 'INVERSION',
          valorActual: 15000,
          historico: {
            create: [
              { valor: 10000, fecha: new Date('2024-01-01'), notas: 'Primera' },
              { valor: 12000, fecha: new Date('2025-01-01'), notas: 'Segunda' },
              { valor: 15000, fecha: new Date('2026-01-01'), notas: 'Tercera' },
            ],
          },
        },
      })
      testActivoId = activo.id
    })

    it('returns all valoraciones for activo', async () => {
      const response = await request(baseURL)
        .get(`/api/activos/${testActivoId}/valoraciones`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toHaveLength(3)
      // Should be ordered by fecha desc
      expect(response.body.data[0].notas).toBe('Tercera')
    })

    it('returns 404 for non-existent activo', async () => {
      const response = await request(baseURL)
        .get('/api/activos/nonexistent-id/valoraciones')
        .expect(404)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /api/activos/:id/valoraciones', () => {
    beforeEach(async () => {
      const activo = await prisma.activo.create({
        data: {
          nombre: 'Test Activo',
          tipo: 'INMUEBLE',
          valorActual: 150000,
        },
      })
      testActivoId = activo.id
    })

    it('adds valoración and updates valorActual', async () => {
      const response = await request(baseURL)
        .post(`/api/activos/${testActivoId}/valoraciones`)
        .send({
          valor: 160000,
          fecha: '2026-02-28',
          notas: 'Nueva valuación',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.valor).toBe('160000.00')
      expect(response.body.data.notas).toBe('Nueva valuación')

      // Verify valorActual was updated
      const activo = await prisma.activo.findUnique({
        where: { id: testActivoId },
      })
      expect(activo?.valorActual.toString()).toBe('160000.00')
    })

    it('creates valoración without notas', async () => {
      const response = await request(baseURL)
        .post(`/api/activos/${testActivoId}/valoraciones`)
        .send({
          valor: 155000,
          fecha: '2026-02-28',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.notas).toBeNull()
    })

    it('validates positive valor', async () => {
      const response = await request(baseURL)
        .post(`/api/activos/${testActivoId}/valoraciones`)
        .send({
          valor: -5000,
          fecha: '2026-02-28',
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('validates required fields', async () => {
      const response = await request(baseURL)
        .post(`/api/activos/${testActivoId}/valoraciones`)
        .send({
          fecha: '2026-02-28',
          // Missing valor
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns 404 for non-existent activo', async () => {
      const response = await request(baseURL)
        .post('/api/activos/nonexistent-id/valoraciones')
        .send({
          valor: 10000,
          fecha: '2026-02-28',
        })
        .expect(404)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })
})
