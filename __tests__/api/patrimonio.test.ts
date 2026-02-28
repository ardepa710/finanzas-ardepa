import { GET } from '@/app/api/patrimonio/route';
import { prisma } from '@/lib/prisma';
import { TipoActivo, Liquidez, TipoCredito } from '@/generated/prisma/client';

// Helper functions for test data
async function createActivo(data: {
  nombre: string;
  tipo: TipoActivo;
  valorActual: number;
  liquidez?: Liquidez;
  activo?: boolean;
}) {
  return prisma.activo.create({
    data: {
      nombre: data.nombre,
      tipo: data.tipo,
      valorActual: data.valorActual,
      liquidez: data.liquidez || 'MEDIA',
      activo: data.activo ?? true,
    },
  });
}

async function createCredito(data: {
  nombre: string;
  saldoActual: number;
  activo?: boolean;
}) {
  return prisma.credito.create({
    data: {
      nombre: data.nombre,
      tipo: 'PRESTAMO' as TipoCredito,
      montoTotal: data.saldoActual,
      saldoActual: data.saldoActual,
      pagoMensual: 100,
      diaPago: 15,
      activo: data.activo ?? true,
    },
  });
}

describe('API /api/patrimonio', () => {
  beforeEach(async () => {
    // Clean up database
    await prisma.valoracionActivo.deleteMany();
    await prisma.activo.deleteMany();
    await prisma.credito.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns correct net worth structure', async () => {
    // Create sample data
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 100000,
      liquidez: 'BAJA',
    });

    await createCredito({
      nombre: 'Hipoteca',
      saldoActual: 50000,
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const data = body.data;

    expect(data).toHaveProperty('patrimonio');
    expect(data.patrimonio).toHaveProperty('totalActivos');
    expect(data.patrimonio).toHaveProperty('totalPasivos');
    expect(data.patrimonio).toHaveProperty('patrimonioNeto');
    expect(data.patrimonio).toHaveProperty('porTipo');
    expect(data.patrimonio).toHaveProperty('porLiquidez');
    expect(data.patrimonio).toHaveProperty('topActivos');
    expect(data.patrimonio).toHaveProperty('deudas');
  });

  it('calculates net worth correctly (assets - liabilities)', async () => {
    // Assets: 150,000
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 100000,
    });

    await createActivo({
      nombre: 'Carro',
      tipo: 'VEHICULO',
      valorActual: 50000,
    });

    // Liabilities: 60,000
    await createCredito({
      nombre: 'Hipoteca',
      saldoActual: 50000,
    });

    await createCredito({
      nombre: 'Auto',
      saldoActual: 10000,
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalActivos).toBe(150000);
    expect(patrimonio.totalPasivos).toBe(60000);
    expect(patrimonio.patrimonioNeto).toBe(90000);
  });

  it('returns correct breakdown by asset type', async () => {
    // Total: 175,000
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 100000, // 57.14%
    });

    await createActivo({
      nombre: 'Carro',
      tipo: 'VEHICULO',
      valorActual: 50000, // 28.57%
    });

    await createActivo({
      nombre: 'Inversión',
      tipo: 'INVERSION',
      valorActual: 25000, // 14.29%
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { porTipo } = body.data.patrimonio;

    expect(porTipo).toHaveLength(3);

    const inmueble = porTipo.find((t: any) => t.tipo === 'INMUEBLE');
    expect(inmueble.valor).toBe(100000);
    expect(inmueble.porcentaje).toBeCloseTo(57.14, 1);

    const vehiculo = porTipo.find((t: any) => t.tipo === 'VEHICULO');
    expect(vehiculo.valor).toBe(50000);
    expect(vehiculo.porcentaje).toBeCloseTo(28.57, 1);

    const inversion = porTipo.find((t: any) => t.tipo === 'INVERSION');
    expect(inversion.valor).toBe(25000);
    expect(inversion.porcentaje).toBeCloseTo(14.29, 1);
  });

  it('returns correct breakdown by liquidity', async () => {
    // Total: 100,000
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 60000,
      liquidez: 'BAJA', // 60%
    });

    await createActivo({
      nombre: 'Inversión',
      tipo: 'INVERSION',
      valorActual: 30000,
      liquidez: 'MEDIA', // 30%
    });

    await createActivo({
      nombre: 'Efectivo',
      tipo: 'EFECTIVO',
      valorActual: 10000,
      liquidez: 'ALTA', // 10%
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { porLiquidez } = body.data.patrimonio;

    expect(porLiquidez).toHaveLength(3);

    const alta = porLiquidez.find((l: any) => l.liquidez === 'ALTA');
    expect(alta.valor).toBe(10000);
    expect(alta.porcentaje).toBe(10);

    const media = porLiquidez.find((l: any) => l.liquidez === 'MEDIA');
    expect(media.valor).toBe(30000);
    expect(media.porcentaje).toBe(30);

    const baja = porLiquidez.find((l: any) => l.liquidez === 'BAJA');
    expect(baja.valor).toBe(60000);
    expect(baja.porcentaje).toBe(60);
  });

  it('returns top 5 assets sorted by value', async () => {
    // Create 7 assets
    await createActivo({ nombre: 'Casa', tipo: 'INMUEBLE', valorActual: 100000 });
    await createActivo({ nombre: 'Carro', tipo: 'VEHICULO', valorActual: 50000 });
    await createActivo({ nombre: 'Inversión A', tipo: 'INVERSION', valorActual: 30000 });
    await createActivo({ nombre: 'Inversión B', tipo: 'INVERSION', valorActual: 20000 });
    await createActivo({ nombre: 'Ahorro', tipo: 'AHORRO', valorActual: 15000 });
    await createActivo({ nombre: 'Efectivo', tipo: 'EFECTIVO', valorActual: 5000 });
    await createActivo({ nombre: 'Otro', tipo: 'OTRO', valorActual: 1000 });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { topActivos } = body.data.patrimonio;

    // Should return only top 5
    expect(topActivos).toHaveLength(5);

    // Should be sorted by value DESC
    expect(topActivos[0].nombre).toBe('Casa');
    expect(topActivos[0].valorActual).toBe(100000);
    expect(topActivos[1].nombre).toBe('Carro');
    expect(topActivos[1].valorActual).toBe(50000);
    expect(topActivos[2].nombre).toBe('Inversión A');
    expect(topActivos[2].valorActual).toBe(30000);
    expect(topActivos[3].nombre).toBe('Inversión B');
    expect(topActivos[3].valorActual).toBe(20000);
    expect(topActivos[4].nombre).toBe('Ahorro');
    expect(topActivos[4].valorActual).toBe(15000);

    // Check percentages (total: 221000)
    expect(topActivos[0].porcentajeDelTotal).toBeCloseTo(45.25, 1);
    expect(topActivos[1].porcentajeDelTotal).toBeCloseTo(22.62, 1);
  });

  it('returns debt summary with breakdown', async () => {
    // Total debt: 80,000
    await createCredito({ nombre: 'Hipoteca', saldoActual: 50000 }); // 62.5%
    await createCredito({ nombre: 'Auto', saldoActual: 20000 }); // 25%
    await createCredito({ nombre: 'Tarjeta', saldoActual: 10000 }); // 12.5%

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { deudas } = body.data.patrimonio;

    expect(deudas.total).toBe(80000);
    expect(deudas.porCredito).toHaveLength(3);

    const hipoteca = deudas.porCredito.find((c: any) => c.nombre === 'Hipoteca');
    expect(hipoteca.saldoActual).toBe(50000);
    expect(hipoteca.porcentajeDelTotal).toBe(62.5);

    const auto = deudas.porCredito.find((c: any) => c.nombre === 'Auto');
    expect(auto.saldoActual).toBe(20000);
    expect(auto.porcentajeDelTotal).toBe(25);
  });

  it('handles zero assets case without division by zero', async () => {
    // No assets, only debt
    await createCredito({ nombre: 'Deuda', saldoActual: 10000 });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalActivos).toBe(0);
    expect(patrimonio.totalPasivos).toBe(10000);
    expect(patrimonio.patrimonioNeto).toBe(-10000);
    expect(patrimonio.porTipo).toHaveLength(0);
    expect(patrimonio.porLiquidez).toHaveLength(0);
    expect(patrimonio.topActivos).toHaveLength(0);
  });

  it('handles zero debts case', async () => {
    // Only assets, no debt
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 100000,
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalActivos).toBe(100000);
    expect(patrimonio.totalPasivos).toBe(0);
    expect(patrimonio.patrimonioNeto).toBe(100000);
    expect(patrimonio.deudas.total).toBe(0);
    expect(patrimonio.deudas.porCredito).toHaveLength(0);
  });

  it('filters out inactive assets', async () => {
    // Active assets
    await createActivo({
      nombre: 'Casa',
      tipo: 'INMUEBLE',
      valorActual: 100000,
      activo: true,
    });

    // Inactive asset (should be excluded)
    await createActivo({
      nombre: 'Carro Viejo',
      tipo: 'VEHICULO',
      valorActual: 50000,
      activo: false,
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalActivos).toBe(100000);
    expect(patrimonio.topActivos).toHaveLength(1);
    expect(patrimonio.topActivos[0].nombre).toBe('Casa');
  });

  it('filters out inactive debts', async () => {
    // Active debt
    await createCredito({
      nombre: 'Hipoteca',
      saldoActual: 50000,
      activo: true,
    });

    // Inactive debt (should be excluded)
    await createCredito({
      nombre: 'Préstamo Pagado',
      saldoActual: 20000,
      activo: false,
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalPasivos).toBe(50000);
    expect(patrimonio.deudas.total).toBe(50000);
    expect(patrimonio.deudas.porCredito).toHaveLength(1);
    expect(patrimonio.deudas.porCredito[0].nombre).toBe('Hipoteca');
  });

  it('handles empty database', async () => {
    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { patrimonio } = body.data;

    expect(patrimonio.totalActivos).toBe(0);
    expect(patrimonio.totalPasivos).toBe(0);
    expect(patrimonio.patrimonioNeto).toBe(0);
    expect(patrimonio.porTipo).toHaveLength(0);
    expect(patrimonio.porLiquidez).toHaveLength(0);
    expect(patrimonio.topActivos).toHaveLength(0);
    expect(patrimonio.deudas.total).toBe(0);
    expect(patrimonio.deudas.porCredito).toHaveLength(0);
  });

  it('calculates percentages correctly with multiple assets of same type', async () => {
    // Total: 200,000
    // INVERSION: 150,000 (75%)
    await createActivo({
      nombre: 'Inversión A',
      tipo: 'INVERSION',
      valorActual: 100000,
    });
    await createActivo({
      nombre: 'Inversión B',
      tipo: 'INVERSION',
      valorActual: 50000,
    });

    // EFECTIVO: 50,000 (25%)
    await createActivo({
      nombre: 'Efectivo',
      tipo: 'EFECTIVO',
      valorActual: 50000,
      liquidez: 'ALTA',
    });

    const request = new Request('http://localhost/api/patrimonio');
    const response = await GET(request, {});
    const body = await response.json();
    const { porTipo } = body.data.patrimonio;

    expect(porTipo).toHaveLength(2);

    const inversion = porTipo.find((t: any) => t.tipo === 'INVERSION');
    expect(inversion.valor).toBe(150000);
    expect(inversion.porcentaje).toBe(75);

    const efectivo = porTipo.find((t: any) => t.tipo === 'EFECTIVO');
    expect(efectivo.valor).toBe(50000);
    expect(efectivo.porcentaje).toBe(25);
  });
});
