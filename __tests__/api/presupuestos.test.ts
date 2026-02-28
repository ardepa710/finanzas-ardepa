import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Presupuestos API', () => {
  let categoriaId: string

  beforeAll(async () => {
    const categoria = await prisma.categoria.findFirst()
    categoriaId = categoria!.id
  })

  afterEach(async () => {
    // Clean up test data after each test to prevent pollution
    await prisma.presupuesto.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup and disconnect
    await prisma.presupuesto.deleteMany({})
    await prisma.$disconnect()
  })

  it('POST /api/presupuestos creates budget', async () => {
    const response = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId,
        monto: 5000,
        periodo: 'MENSUAL',
      })
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.monto).toBe('5000.00')
  })

  it('GET /api/presupuestos returns all active budgets', async () => {
    const response = await request(baseURL)
      .get('/api/presupuestos')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('GET /api/presupuestos/status returns status', async () => {
    const response = await request(baseURL)
      .get('/api/presupuestos/status?periodo=MENSUAL')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)

    if (response.body.data.length > 0) {
      const status = response.body.data[0]
      expect(status).toHaveProperty('presupuesto')
      expect(status).toHaveProperty('gastado')
      expect(status).toHaveProperty('restante')
      expect(status).toHaveProperty('porcentaje')
      expect(status).toHaveProperty('estado')
    }
  })

  it('GET /api/presupuestos/:id returns specific budget', async () => {
    // First create a budget
    const createRes = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId,
        monto: 3000,
        periodo: 'QUINCENAL',
      })

    const budgetId = createRes.body.data.id

    // Then fetch it by ID
    const response = await request(baseURL)
      .get(`/api/presupuestos/${budgetId}`)
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.id).toBe(budgetId)
    expect(response.body.data.periodo).toBe('QUINCENAL')
  })

  it('PATCH /api/presupuestos/:id updates budget', async () => {
    // First create a budget
    const createRes = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId,
        monto: 2000,
        periodo: 'SEMANAL',
      })

    const budgetId = createRes.body.data.id

    // Then update it
    const response = await request(baseURL)
      .patch(`/api/presupuestos/${budgetId}`)
      .send({
        monto: 2500,
      })
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.monto).toBe('2500.00')
  })

  it('DELETE /api/presupuestos/:id soft deletes budget', async () => {
    // First create a budget
    const createRes = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId,
        monto: 1000,
        periodo: 'MENSUAL',
      })

    const budgetId = createRes.body.data.id

    // Then delete it
    const response = await request(baseURL)
      .delete(`/api/presupuestos/${budgetId}`)
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.activo).toBe(false)
  })

  it('POST /api/presupuestos validates input', async () => {
    const response = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId: 'invalid-id',
        monto: -100,  // Invalid: negative
        periodo: 'INVALID',
      })
      .expect(400)

    expect(response.body.ok).toBe(false)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('GET /api/presupuestos/:id returns 404 for non-existent budget', async () => {
    const response = await request(baseURL)
      .get('/api/presupuestos/nonexistent-id')
      .expect(404)

    expect(response.body.ok).toBe(false)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })
})
