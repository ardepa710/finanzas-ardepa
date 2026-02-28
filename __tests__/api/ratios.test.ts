import { GET } from '@/app/api/ratios/route';
import { prisma } from '@/lib/prisma';
import { FrecuenciaPago, TipoCredito, TipoCategoria } from '@/generated/prisma/client';

// Helper functions for test data
async function createFuenteIngreso(data: {
  nombre: string;
  monto: number;
  frecuencia: FrecuenciaPago;
  activo?: boolean;
}) {
  return prisma.fuenteIngreso.create({
    data: {
      ...data,
      fechaBase: new Date(),
      activo: data.activo ?? true,
    },
  });
}

async function createCredito(data: {
  nombre: string;
  saldoActual: number;
  tipo?: TipoCredito;
  tasaInteres?: number;
  pagoMinimo?: number;
  activo?: boolean;
}) {
  return prisma.credito.create({
    data: {
      nombre: data.nombre,
      tipo: data.tipo || ('TARJETA' as TipoCredito),
      montoTotal: data.saldoActual,
      saldoActual: data.saldoActual,
      pagoMensual: data.pagoMinimo || 100,
      pagoMinimo: data.pagoMinimo,
      diaPago: 15,
      tasaInteres: data.tasaInteres,
      activo: data.activo ?? true,
    },
  });
}

async function createGasto(categoriaId: string, data: {
  descripcion: string;
  monto: number;
  fecha: Date;
}) {
  return prisma.gasto.create({
    data: {
      ...data,
      categoriaId,
    },
  });
}

describe('API /api/ratios', () => {
  let testCategoriaId: string;

  beforeEach(async () => {
    // Clean up database
    await prisma.gasto.deleteMany();
    await prisma.ingresoManual.deleteMany();
    await prisma.credito.deleteMany();
    await prisma.fuenteIngreso.deleteMany();

    // Create a test category for gastos
    let categoria = await prisma.categoria.findFirst({
      where: {
        nombre: 'Test Category',
        tipo: 'GASTO' as TipoCategoria
      }
    });
    if (!categoria) {
      categoria = await prisma.categoria.create({
        data: {
          nombre: 'Test Category',
          icono: 'test',
          color: '#000000',
          tipo: 'GASTO' as TipoCategoria,
          orden: 999,
        },
      });
    }
    testCategoriaId = categoria.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns all four ratio sections', async () => {
    // Create sample data
    await createFuenteIngreso({
      nombre: 'Salario',
      monto: 5000,
      frecuencia: 'MENSUAL',
    });

    await createCredito({
      nombre: 'Tarjeta',
      saldoActual: 1500,
      tasaInteres: 18,
      pagoMinimo: 100,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    expect(data).toHaveProperty('deudaIngreso');
    expect(data).toHaveProperty('tasaAhorro');
    expect(data).toHaveProperty('fondoEmergencia');
    expect(data).toHaveProperty('liquidez');

    // Verify structure of each ratio
    expect(data.deudaIngreso).toHaveProperty('ratio');
    expect(data.deudaIngreso).toHaveProperty('nivel');
    expect(data.deudaIngreso).toHaveProperty('deudaTotal');
    expect(data.deudaIngreso).toHaveProperty('ingresoMensual');
    expect(data.deudaIngreso).toHaveProperty('descripcion');

    expect(data.tasaAhorro).toHaveProperty('ratio');
    expect(data.tasaAhorro).toHaveProperty('nivel');
    expect(data.tasaAhorro).toHaveProperty('ahorroMensual');
    expect(data.tasaAhorro).toHaveProperty('ingresoMensual');
    expect(data.tasaAhorro).toHaveProperty('gastoMensual');
    expect(data.tasaAhorro).toHaveProperty('descripcion');

    expect(data.fondoEmergencia).toHaveProperty('mesesCobertura');
    expect(data.fondoEmergencia).toHaveProperty('nivel');
    expect(data.fondoEmergencia).toHaveProperty('ahorroDisponible');
    expect(data.fondoEmergencia).toHaveProperty('gastoMensualPromedio');
    expect(data.fondoEmergencia).toHaveProperty('mesesRecomendados');
    expect(data.fondoEmergencia).toHaveProperty('descripcion');

    expect(data.liquidez).toHaveProperty('ratio');
    expect(data.liquidez).toHaveProperty('nivel');
    expect(data.liquidez).toHaveProperty('efectivoDisponible');
    expect(data.liquidez).toHaveProperty('gastoMensual');
    expect(data.liquidez).toHaveProperty('descripcion');
  });

  it('handles empty database gracefully', async () => {
    const response = await GET();
    const body = await response.json();
    const data = body.data;

    expect(data.deudaIngreso.ratio).toBe(0);
    expect(data.deudaIngreso.nivel).toBe('SALUDABLE');
    expect(data.deudaIngreso.deudaTotal).toBe(0);
    expect(data.deudaIngreso.ingresoMensual).toBe(0);

    expect(data.tasaAhorro.ratio).toBe(0);
    expect(data.fondoEmergencia.mesesCobertura).toBe(0);
    expect(data.liquidez.ratio).toBe(0);
  });

  it('calculates correct debt-to-income ratio with real data', async () => {
    // Income: 4000/month
    await createFuenteIngreso({
      nombre: 'Salario',
      monto: 4000,
      frecuencia: 'MENSUAL',
    });

    // Debt: 1600 (40% of income - should be ACEPTABLE)
    await createCredito({
      nombre: 'Préstamo',
      saldoActual: 1600,
      tasaInteres: 12,
      pagoMinimo: 100,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    expect(data.deudaIngreso.ratio).toBe(40);
    expect(data.deudaIngreso.nivel).toBe('ACEPTABLE');
    expect(data.deudaIngreso.deudaTotal).toBe(1600);
    expect(data.deudaIngreso.ingresoMensual).toBe(4000);
  });

  it('calculates correct savings rate with expenses', async () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Income: 5000/month
    await createFuenteIngreso({
      nombre: 'Salario',
      monto: 5000,
      frecuencia: 'MENSUAL',
    });

    // Expenses over 3 months: 4000 average
    // Month 1: 3800
    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 1',
      monto: 3800,
      fecha: twoMonthsAgo,
    });

    // Month 2: 4000
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 2',
      monto: 4000,
      fecha: oneMonthAgo,
    });

    // Month 3: 4200
    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 3',
      monto: 4200,
      fecha: now,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    // Average expenses: (3800 + 4000 + 4200) / 3 = 4000
    // Savings: 5000 - 4000 = 1000
    // Rate: 1000 / 5000 = 20%
    expect(data.tasaAhorro.gastoMensual).toBe(4000);
    expect(data.tasaAhorro.ahorroMensual).toBe(1000);
    expect(data.tasaAhorro.ratio).toBe(20);
    expect(data.tasaAhorro.nivel).toBe('EXCELENTE');
  });

  it('calculates emergency fund with savings and expenses', async () => {
    const now = new Date();
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Create savings (ingresos - gastos = net position)
    // Total ingresos: 15000
    await prisma.ingresoManual.create({
      data: {
        monto: 15000,
        fecha: twoMonthsAgo,
        descripcion: 'Ahorro acumulado',
      },
    });

    // Total gastos over 3 months: 9000 (avg 3000/month)
    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 1',
      monto: 2800,
      fecha: twoMonthsAgo,
    });

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 2',
      monto: 3000,
      fecha: oneMonthAgo,
    });

    await createGasto(testCategoriaId, {
      descripcion: 'Gastos mes 3',
      monto: 3200,
      fecha: now,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    // Net position: 15000 - 9000 = 6000
    // Average expenses: 9000 / 3 = 3000
    // Coverage: 6000 / 3000 = 2 months
    expect(data.fondoEmergencia.ahorroDisponible).toBe(6000);
    expect(data.fondoEmergencia.gastoMensualPromedio).toBe(3000);
    expect(data.fondoEmergencia.mesesCobertura).toBe(2);
    expect(data.fondoEmergencia.nivel).toBe('MINIMO');
    expect(data.fondoEmergencia.mesesRecomendados).toBe(6);
  });

  it('handles multiple income sources with different frequencies', async () => {
    // Monthly salary: 3000
    await prisma.fuenteIngreso.create({
      data: {
        nombre: 'Salario',
        monto: 3000,
        frecuencia: 'MENSUAL' as FrecuenciaPago,
        fechaBase: new Date(),
        activo: true,
      },
    });

    // Bi-weekly bonus: 500 (= 1000/month)
    await prisma.fuenteIngreso.create({
      data: {
        nombre: 'Bono',
        monto: 500,
        frecuencia: 'QUINCENAL' as FrecuenciaPago,
        fechaBase: new Date(),
        activo: true,
      },
    });

    // Weekly gig: 100 (= 433/month)
    await prisma.fuenteIngreso.create({
      data: {
        nombre: 'Freelance',
        monto: 100,
        frecuencia: 'SEMANAL' as FrecuenciaPago,
        fechaBase: new Date(),
        activo: true,
      },
    });

    // Inactive income (should not count)
    await prisma.fuenteIngreso.create({
      data: {
        nombre: 'Old Job',
        monto: 5000,
        frecuencia: 'MENSUAL' as FrecuenciaPago,
        fechaBase: new Date(),
        activo: false,
      },
    });

    // Debt: 2000
    await createCredito({
      nombre: 'Préstamo',
      saldoActual: 2000,
      tasaInteres: 15,
      pagoMinimo: 150,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    // Total monthly income: 3000 + 1000 + 433 = 4433
    expect(data.deudaIngreso.ingresoMensual).toBeCloseTo(4433);
    expect(data.deudaIngreso.deudaTotal).toBe(2000);
    // Ratio: 2000 / 4433 * 100 ≈ 45.12%
    expect(data.deudaIngreso.ratio).toBeCloseTo(45.12, 1);
    expect(data.deudaIngreso.nivel).toBe('RIESGOSO');
  });

  it('only counts active credits in debt calculation', async () => {
    await createFuenteIngreso({
      nombre: 'Salario',
      monto: 5000,
      frecuencia: 'MENSUAL',
    });

    // Active credit: 1000
    await createCredito({
      nombre: 'Tarjeta activa',
      saldoActual: 1000,
      tasaInteres: 18,
      pagoMinimo: 50,
    });

    // Inactive credit (should not count)
    await createCredito({
      nombre: 'Préstamo pagado',
      saldoActual: 5000,
      tasaInteres: 12,
      pagoMinimo: 200,
      activo: false,
    });

    const response = await GET();
    const body = await response.json();
    const data = body.data;

    expect(data.deudaIngreso.deudaTotal).toBe(1000);
    expect(data.deudaIngreso.ratio).toBe(20);
    expect(data.deudaIngreso.nivel).toBe('SALUDABLE');
  });
});
