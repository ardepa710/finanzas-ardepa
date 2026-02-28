import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Alertas API', () => {
  afterEach(async () => {
    // Clean up test data after each test to prevent pollution
    await prisma.notificacion.deleteMany({})
  })

  afterAll(async () => {
    // Final cleanup and disconnect
    await prisma.notificacion.deleteMany({})
    await prisma.$disconnect()
  })

  it('POST /api/alertas creates notification', async () => {
    const response = await request(baseURL)
      .post('/api/alertas')
      .send({
        tipo: 'PRESUPUESTO_80',
        titulo: 'Presupuesto al 80%',
        mensaje: 'Tu presupuesto de Alimentación ha alcanzado el 80%',
        prioridad: 'NORMAL',
        metadata: { categoriaId: 'test-id', porcentaje: 80 },
      })
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.tipo).toBe('PRESUPUESTO_80')
    expect(response.body.data.titulo).toBe('Presupuesto al 80%')
    expect(response.body.data.leida).toBe(false)
    expect(response.body.data.archivar).toBe(false)
  })

  it('GET /api/alertas returns all notifications', async () => {
    // Create test notifications
    await prisma.notificacion.create({
      data: {
        tipo: 'PRESUPUESTO_90',
        titulo: 'Test 1',
        mensaje: 'Mensaje 1',
      },
    })
    await prisma.notificacion.create({
      data: {
        tipo: 'CREDITO_PROXIMO',
        titulo: 'Test 2',
        mensaje: 'Mensaje 2',
        leida: true,
      },
    })

    const response = await request(baseURL)
      .get('/api/alertas?todas=true')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBe(2)
  })

  it('GET /api/alertas with todas=false returns only unread', async () => {
    // Create one read and one unread notification
    await prisma.notificacion.create({
      data: {
        tipo: 'PRESUPUESTO_90',
        titulo: 'Unread',
        mensaje: 'Not read yet',
        leida: false,
      },
    })
    await prisma.notificacion.create({
      data: {
        tipo: 'CREDITO_PROXIMO',
        titulo: 'Read',
        mensaje: 'Already read',
        leida: true,
      },
    })

    const response = await request(baseURL)
      .get('/api/alertas')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBe(1)
    expect(response.body.data[0].titulo).toBe('Unread')
  })

  it('PUT /api/alertas/:id marks notification as read', async () => {
    // Create a notification
    const notification = await prisma.notificacion.create({
      data: {
        tipo: 'GASTO_INUSUAL',
        titulo: 'Gasto inusual detectado',
        mensaje: 'Se detectó un gasto inusual',
        leida: false,
      },
    })

    // Mark it as read
    const response = await request(baseURL)
      .put(`/api/alertas/${notification.id}`)
      .send({ leida: true })
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.leida).toBe(true)
  })

  it('PUT /api/alertas/:id returns 404 for non-existent ID', async () => {
    const response = await request(baseURL)
      .put('/api/alertas/nonexistent-id')
      .send({ leida: true })
      .expect(404)

    expect(response.body.ok).toBe(false)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('POST /api/alertas validates input', async () => {
    const response = await request(baseURL)
      .post('/api/alertas')
      .send({
        tipo: 'INVALID_TYPE',
        titulo: '', // Invalid: empty string
        mensaje: 'Valid message',
      })
      .expect(400)

    expect(response.body.ok).toBe(false)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
