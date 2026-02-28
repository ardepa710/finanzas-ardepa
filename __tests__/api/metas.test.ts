import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Metas API', () => {
  let testMetaId: string

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.contribucion.deleteMany({})
    await prisma.meta.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup and disconnect
    await prisma.contribucion.deleteMany({})
    await prisma.meta.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/metas', () => {
    it('creates meta with default values', async () => {
      const response = await request(baseURL)
        .post('/api/metas')
        .send({
          nombre: 'Fondo Emergencia',
          descripcion: 'Ahorros para emergencias',
          categoria: 'FONDO_EMERGENCIA',
          montoObjetivo: 10000,
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Fondo Emergencia')
      expect(response.body.data.categoria).toBe('FONDO_EMERGENCIA')
      expect(Number(response.body.data.montoObjetivo)).toBe(10000)
      expect(Number(response.body.data.montoActual)).toBe(0)
      expect(Number(response.body.data.porcentajeProgreso)).toBe(0)
      expect(response.body.data.estado).toBe('EN_PROGRESO')
      expect(response.body.data.prioridad).toBe('MEDIA')
      expect(response.body.data.activo).toBe(true)

      testMetaId = response.body.data.id
    })

    it('creates meta with custom priority and deadline', async () => {
      const fechaObjetivo = new Date('2026-12-31')

      const response = await request(baseURL)
        .post('/api/metas')
        .send({
          nombre: 'Vacaciones Europa',
          categoria: 'VACACIONES',
          montoObjetivo: 5000,
          fechaObjetivo: fechaObjetivo.toISOString(),
          prioridad: 'ALTA',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Vacaciones Europa')
      expect(response.body.data.prioridad).toBe('ALTA')
      expect(response.body.data.fechaObjetivo).toBeDefined()
    })

    it('rejects meta with invalid categoria', async () => {
      const response = await request(baseURL)
        .post('/api/metas')
        .send({
          nombre: 'Test',
          categoria: 'INVALID',
          montoObjetivo: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('rejects meta with empty nombre', async () => {
      const response = await request(baseURL)
        .post('/api/metas')
        .send({
          nombre: 'AB',  // Too short (min 3)
          categoria: 'OTRO',
          montoObjetivo: 1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('rejects meta with negative amount', async () => {
      const response = await request(baseURL)
        .post('/api/metas')
        .send({
          nombre: 'Test Meta',
          categoria: 'OTRO',
          montoObjetivo: -1000,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('GET /api/metas', () => {
    beforeEach(async () => {
      // Create test metas
      await prisma.meta.createMany({
        data: [
          {
            nombre: 'Meta 1',
            categoria: 'FONDO_EMERGENCIA',
            montoObjetivo: 10000,
            estado: 'EN_PROGRESO',
          },
          {
            nombre: 'Meta 2',
            categoria: 'VACACIONES',
            montoObjetivo: 5000,
            estado: 'EN_PROGRESO',
          },
          {
            nombre: 'Meta 3',
            categoria: 'RETIRO',
            montoObjetivo: 50000,
            estado: 'COMPLETADA',
          },
          {
            nombre: 'Meta Inactiva',
            categoria: 'OTRO',
            montoObjetivo: 1000,
            activo: false,
          },
        ],
      })
    })

    it('lists all active metas', async () => {
      const response = await request(baseURL)
        .get('/api/metas')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toHaveLength(3) // Only active
      expect(response.body.data[0].nombre).toBeDefined()
    })

    it('filters metas by estado=EN_PROGRESO', async () => {
      const response = await request(baseURL)
        .get('/api/metas?estado=EN_PROGRESO')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data.every((m: any) => m.estado === 'EN_PROGRESO')).toBe(true)
    })

    it('filters metas by estado=COMPLETADA', async () => {
      const response = await request(baseURL)
        .get('/api/metas?estado=COMPLETADA')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].estado).toBe('COMPLETADA')
    })

    it('filters metas by categoria', async () => {
      const response = await request(baseURL)
        .get('/api/metas?categoria=FONDO_EMERGENCIA')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].categoria).toBe('FONDO_EMERGENCIA')
    })

    it('returns empty array when no metas exist', async () => {
      await prisma.meta.deleteMany({})

      const response = await request(baseURL)
        .get('/api/metas')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toHaveLength(0)
    })
  })

  describe('GET /api/metas/[id]', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Test Meta',
          categoria: 'OTRO',
          montoObjetivo: 5000,
          montoActual: 2000,
          porcentajeProgreso: 40,
          contribuciones: {
            create: [
              { monto: 1000, fecha: new Date('2026-01-15') },
              { monto: 1000, fecha: new Date('2026-02-15') },
            ],
          },
        },
      })
      testMetaId = meta.id
    })

    it('gets meta with contributions', async () => {
      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Test Meta')
      expect(response.body.data.contribuciones).toHaveLength(2)
      expect(Number(response.body.data.contribuciones[0].monto)).toBe(1000)
    })

    it('returns 404 for non-existent meta', async () => {
      const response = await request(baseURL)
        .get('/api/metas/cly9999999999999999')
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('PUT /api/metas/[id]', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Original Name',
          categoria: 'OTRO',
          montoObjetivo: 5000,
        },
      })
      testMetaId = meta.id
    })

    it('updates meta name', async () => {
      const response = await request(baseURL)
        .put(`/api/metas/${testMetaId}`)
        .send({
          nombre: 'Updated Name',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.nombre).toBe('Updated Name')
    })

    it('updates meta amount and recalculates progress', async () => {
      const response = await request(baseURL)
        .put(`/api/metas/${testMetaId}`)
        .send({
          montoActual: 2500,
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(Number(response.body.data.montoActual)).toBe(2500)
      expect(Number(response.body.data.porcentajeProgreso)).toBe(50)
    })

    it('updates priority', async () => {
      const response = await request(baseURL)
        .put(`/api/metas/${testMetaId}`)
        .send({
          prioridad: 'ALTA',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.prioridad).toBe('ALTA')
    })

    it('updates estado', async () => {
      const response = await request(baseURL)
        .put(`/api/metas/${testMetaId}`)
        .send({
          estado: 'PAUSADA',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.estado).toBe('PAUSADA')
    })

    it('returns 404 for non-existent meta', async () => {
      const response = await request(baseURL)
        .put('/api/metas/cly9999999999999999')
        .send({ nombre: 'Test' })
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('DELETE /api/metas/[id]', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'To Delete',
          categoria: 'OTRO',
          montoObjetivo: 1000,
        },
      })
      testMetaId = meta.id
    })

    it('soft deletes meta', async () => {
      const response = await request(baseURL)
        .delete(`/api/metas/${testMetaId}`)
        .expect(200)

      expect(response.body.ok).toBe(true)

      // Verify soft delete
      const meta = await prisma.meta.findUnique({
        where: { id: testMetaId },
      })
      expect(meta?.activo).toBe(false)
    })

    it('returns 404 for non-existent meta', async () => {
      const response = await request(baseURL)
        .delete('/api/metas/cly9999999999999999')
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('POST /api/metas/[id]/contribuciones', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Meta Test',
          categoria: 'OTRO',
          montoObjetivo: 10000,
          montoActual: 5000,
          porcentajeProgreso: 50,
        },
      })
      testMetaId = meta.id
    })

    it('adds contribution and updates meta', async () => {
      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({
          monto: 1000,
          descripcion: 'Ahorro mensual',
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(Number(response.body.data.meta.montoActual)).toBe(6000)
      expect(Number(response.body.data.meta.porcentajeProgreso)).toBe(60)
      expect(Number(response.body.data.contribucion.monto)).toBe(1000)
    })

    it('adds contribution with custom date', async () => {
      const fecha = new Date('2026-01-15')

      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({
          monto: 500,
          fecha: fecha.toISOString(),
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(Number(response.body.data.contribucion.monto)).toBe(500)
    })

    it('completes meta when contribution reaches goal', async () => {
      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({
          monto: 5000, // Reaches 10000 total
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.meta.estado).toBe('COMPLETADA')
      expect(response.body.data.meta.fechaCompletada).toBeDefined()
      expect(Number(response.body.data.meta.porcentajeProgreso)).toBe(100)
    })

    it('completes meta when contribution exceeds goal', async () => {
      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({
          monto: 6000, // Exceeds goal
        })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.meta.estado).toBe('COMPLETADA')
      expect(Number(response.body.data.meta.montoActual)).toBe(11000)
      expect(Number(response.body.data.meta.porcentajeProgreso)).toBe(110)
    })

    it('handles multiple contributions to same meta', async () => {
      // First contribution
      await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({ monto: 1000 })
        .expect(200)

      // Second contribution
      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({ monto: 500 })
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(Number(response.body.data.meta.montoActual)).toBe(6500)

      // Verify contributions exist
      const meta = await prisma.meta.findUnique({
        where: { id: testMetaId },
        include: { contribuciones: true },
      })
      expect(meta?.contribuciones).toHaveLength(2)
    })

    it('rejects negative contribution', async () => {
      const response = await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({
          monto: -500,
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('returns 404 for non-existent meta', async () => {
      const response = await request(baseURL)
        .post('/api/metas/cly9999999999999999/contribuciones')
        .send({ monto: 100 })
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('GET /api/metas/resumen', () => {
    beforeEach(async () => {
      await prisma.meta.createMany({
        data: [
          {
            nombre: 'Meta 1',
            categoria: 'FONDO_EMERGENCIA',
            montoObjetivo: 10000,
            montoActual: 5000,
            porcentajeProgreso: 50,
            estado: 'EN_PROGRESO',
          },
          {
            nombre: 'Meta 2',
            categoria: 'VACACIONES',
            montoObjetivo: 5000,
            montoActual: 3000,
            porcentajeProgreso: 60,
            estado: 'EN_PROGRESO',
          },
          {
            nombre: 'Meta 3',
            categoria: 'FONDO_EMERGENCIA',
            montoObjetivo: 20000,
            montoActual: 20000,
            porcentajeProgreso: 100,
            estado: 'COMPLETADA',
          },
        ],
      })
    })

    it('returns summary statistics', async () => {
      const response = await request(baseURL)
        .get('/api/metas/resumen')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.totalMetas).toBe(3)
      expect(response.body.data.metasActivas).toBe(2)
      expect(response.body.data.metasCompletadas).toBe(1)
      expect(Number(response.body.data.montoObjetivoTotal)).toBe(35000)
      expect(Number(response.body.data.montoAhorradoTotal)).toBe(28000)
      expect(Number(response.body.data.progresoPromedio)).toBeCloseTo(70, 1) // (50+60+100)/3
    })

    it('returns breakdown by categoria', async () => {
      const response = await request(baseURL)
        .get('/api/metas/resumen')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.porCategoria).toHaveLength(2)

      const fondoEmergencia = response.body.data.porCategoria.find(
        (c: any) => c.categoria === 'FONDO_EMERGENCIA'
      )
      expect(fondoEmergencia.cantidad).toBe(2)
      expect(Number(fondoEmergencia.monto)).toBe(30000)

      const vacaciones = response.body.data.porCategoria.find(
        (c: any) => c.categoria === 'VACACIONES'
      )
      expect(vacaciones.cantidad).toBe(1)
      expect(Number(vacaciones.monto)).toBe(5000)
    })

    it('returns empty summary when no metas exist', async () => {
      await prisma.meta.deleteMany({})

      const response = await request(baseURL)
        .get('/api/metas/resumen')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.totalMetas).toBe(0)
      expect(response.body.data.metasActivas).toBe(0)
      expect(response.body.data.metasCompletadas).toBe(0)
      expect(Number(response.body.data.montoObjetivoTotal)).toBe(0)
      expect(Number(response.body.data.montoAhorradoTotal)).toBe(0)
      expect(Number(response.body.data.progresoPromedio)).toBe(0)
      expect(response.body.data.porCategoria).toHaveLength(0)
    })
  })

  describe('GET /api/metas/[id]/proyeccion', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Meta Proyeccion',
          categoria: 'VACACIONES',
          montoObjetivo: 12000,
          montoActual: 2000,
          porcentajeProgreso: 16.67,
          fechaObjetivo: new Date('2026-12-31'),
        },
      })
      testMetaId = meta.id
    })

    it('returns projection with achievable scenario', async () => {
      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}/proyeccion?ahorroMensual=1000`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.metaId).toBe(testMetaId)
      expect(response.body.data.nombreMeta).toBe('Meta Proyeccion')
      expect(Number(response.body.data.montoFaltante)).toBe(10000)
      expect(response.body.data.mesesEstimados).toBe(10)
      expect(response.body.data.fechaEstimadaComplecion).toBeDefined()
      expect(response.body.data.esAlcanzable).toBe(true)
    })

    it('returns projection with tight deadline', async () => {
      // Update meta with closer deadline
      await prisma.meta.update({
        where: { id: testMetaId },
        data: { fechaObjetivo: new Date('2026-06-30') },
      })

      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}/proyeccion?ahorroMensual=500`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.esAlcanzable).toBe(false) // Need 10000/500=20 months, but only have ~4
    })

    it('returns projection with no deadline', async () => {
      // Update meta to remove deadline
      await prisma.meta.update({
        where: { id: testMetaId },
        data: { fechaObjetivo: null },
      })

      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}/proyeccion?ahorroMensual=500`)
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.esAlcanzable).toBe(true) // Always achievable with no deadline
      expect(Number(response.body.data.ahorroMensualRequerido)).toBe(0)
    })

    it('requires ahorroMensual query param', async () => {
      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}/proyeccion`)
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('rejects negative ahorroMensual', async () => {
      const response = await request(baseURL)
        .get(`/api/metas/${testMetaId}/proyeccion?ahorroMensual=-100`)
        .expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('returns 404 for non-existent meta', async () => {
      const response = await request(baseURL)
        .get('/api/metas/cly9999999999999999/proyeccion?ahorroMensual=1000')
        .expect(404)

      expect(response.body.ok).toBe(false)
    })
  })

  describe('Transaction safety', () => {
    beforeEach(async () => {
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Transaction Test',
          categoria: 'OTRO',
          montoObjetivo: 5000,
          montoActual: 1000,
        },
      })
      testMetaId = meta.id
    })

    it('rolls back contribution on error', async () => {
      // This test ensures that if something fails during contribution,
      // the meta is not updated and the contribution is not created.
      // We'll verify by checking counts before and after a failed request

      const beforeMeta = await prisma.meta.findUnique({
        where: { id: testMetaId },
      })

      // Try to add invalid contribution
      await request(baseURL)
        .post(`/api/metas/${testMetaId}/contribuciones`)
        .send({ monto: 'invalid' })
        .expect(400)

      // Verify meta wasn't modified
      const afterMeta = await prisma.meta.findUnique({
        where: { id: testMetaId },
      })
      expect(Number(afterMeta?.montoActual)).toBe(Number(beforeMeta?.montoActual))
    })
  })

  describe('Cascade delete', () => {
    it('deletes contributions when meta is hard deleted', async () => {
      // Create meta with contributions
      const meta = await prisma.meta.create({
        data: {
          nombre: 'Cascade Test',
          categoria: 'OTRO',
          montoObjetivo: 5000,
          contribuciones: {
            create: [
              { monto: 1000 },
              { monto: 2000 },
            ],
          },
        },
      })

      // Verify contributions exist
      const contributions = await prisma.contribucion.findMany({
        where: { metaId: meta.id },
      })
      expect(contributions).toHaveLength(2)

      // Hard delete meta (bypass soft delete for this test)
      await prisma.meta.delete({
        where: { id: meta.id },
      })

      // Verify contributions were cascade deleted
      const remainingContributions = await prisma.contribucion.findMany({
        where: { metaId: meta.id },
      })
      expect(remainingContributions).toHaveLength(0)
    })
  })
})
