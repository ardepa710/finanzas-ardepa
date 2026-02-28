import { prisma } from '@/lib/prisma';
import { FrecuenciaPago } from '@/generated/prisma/client';

/**
 * Normalizes an amount to monthly frequency
 * @param monto - Amount to normalize
 * @param frecuencia - Payment frequency
 * @returns Monthly equivalent amount
 */
export function normalizeToMonthly(
  monto: number,
  frecuencia: FrecuenciaPago
): number {
  switch (frecuencia) {
    case 'MENSUAL':
      return monto;
    case 'QUINCENAL':
      return monto * 2;
    case 'SEMANAL':
      return monto * 4.33; // Average weeks per month
    default:
      return monto;
  }
}

/**
 * Calculates average monthly expenses for the last N months
 * @param months - Number of months to average
 * @returns Average monthly expense amount
 */
export async function getMonthlyExpensesAverage(months: number): Promise<number> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: startDate,
      },
    },
    select: {
      monto: true,
    },
  });

  if (gastos.length === 0) {
    return 0;
  }

  const total = gastos.reduce((sum, gasto) => {
    const montoNum = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : Number(gasto.monto);
    return sum + montoNum;
  }, 0);
  return total / months;
}

/**
 * Calculates net position (total income - total expenses)
 * @returns Net position amount
 */
export async function getNetPosition(): Promise<number> {
  const [totalIngresos, totalGastos] = await Promise.all([
    prisma.ingresoManual.aggregate({
      _sum: {
        monto: true,
      },
    }),
    prisma.gasto.aggregate({
      _sum: {
        monto: true,
      },
    }),
  ]);

  const ingresos = totalIngresos._sum.monto ? (typeof totalIngresos._sum.monto === 'string' ? parseFloat(totalIngresos._sum.monto) : Number(totalIngresos._sum.monto)) : 0;
  const gastos = totalGastos._sum.monto ? (typeof totalGastos._sum.monto === 'string' ? parseFloat(totalGastos._sum.monto) : Number(totalGastos._sum.monto)) : 0;

  return ingresos - gastos;
}

/**
 * Gets total monthly income from all active income sources
 * @returns Total monthly income
 */
export async function getTotalMonthlyIncome(): Promise<number> {
  const fuentes = await prisma.fuenteIngreso.findMany({
    where: {
      activo: true,
    },
    select: {
      monto: true,
      frecuencia: true,
    },
  });

  return fuentes.reduce((total, fuente) => {
    const montoNum = typeof fuente.monto === 'string' ? parseFloat(fuente.monto) : Number(fuente.monto);
    return total + normalizeToMonthly(montoNum, fuente.frecuencia);
  }, 0);
}

/**
 * Gets total debt from all active credits
 * @returns Total debt amount
 */
export async function getTotalDebt(): Promise<number> {
  const creditos = await prisma.credito.findMany({
    where: {
      activo: true,
    },
    select: {
      saldoActual: true,
    },
  });

  return creditos.reduce((total, credito) => {
    const saldoNum = typeof credito.saldoActual === 'string' ? parseFloat(credito.saldoActual) : Number(credito.saldoActual);
    return total + saldoNum;
  }, 0);
}

/**
 * Gets expenses for the last month
 * @returns Total expenses from last month
 */
export async function getLastMonthExpenses(): Promise<number> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const gastos = await prisma.gasto.findMany({
    where: {
      fecha: {
        gte: startDate,
      },
    },
    select: {
      monto: true,
    },
  });

  return gastos.reduce((sum, gasto) => {
    const montoNum = typeof gasto.monto === 'string' ? parseFloat(gasto.monto) : Number(gasto.monto);
    return sum + montoNum;
  }, 0);
}

/**
 * Gets income for the last month
 * @returns Total income from last month
 */
export async function getLastMonthIncome(): Promise<number> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const ingresos = await prisma.ingresoManual.findMany({
    where: {
      fecha: {
        gte: startDate,
      },
    },
    select: {
      monto: true,
    },
  });

  return ingresos.reduce((sum, ingreso) => {
    const montoNum = typeof ingreso.monto === 'string' ? parseFloat(ingreso.monto) : Number(ingreso.monto);
    return sum + montoNum;
  }, 0);
}
