import {
  RatiosFinancieros,
  NivelDeudaIngreso,
  NivelTasaAhorro,
  NivelFondoEmergencia,
  NivelLiquidez,
} from '../types';
import {
  getTotalDebt,
  getTotalMonthlyIncome,
  getMonthlyExpensesAverage,
  getNetPosition,
  getLastMonthExpenses,
  getLastMonthIncome,
} from './helpers';

/**
 * Determines debt-to-income ratio level
 * @param ratio - Debt-to-income percentage
 * @returns Level classification
 */
export function getDebtToIncomeLevel(ratio: number): NivelDeudaIngreso {
  if (ratio < 36) return 'SALUDABLE';
  if (ratio < 43) return 'ACEPTABLE';
  if (ratio < 50) return 'RIESGOSO';
  return 'CRITICO';
}

/**
 * Determines savings rate level
 * @param ratio - Savings rate percentage
 * @returns Level classification
 */
export function getSavingsRateLevel(ratio: number): NivelTasaAhorro {
  if (ratio >= 20) return 'EXCELENTE';
  if (ratio >= 10) return 'BUENO';
  if (ratio >= 5) return 'REGULAR';
  return 'BAJO';
}

/**
 * Determines emergency fund coverage level
 * @param months - Months of coverage
 * @returns Level classification
 */
export function getEmergencyFundLevel(months: number): NivelFondoEmergencia {
  if (months >= 6) return 'ROBUSTO';
  if (months >= 3) return 'ADECUADO';
  if (months >= 1) return 'MINIMO';
  return 'INSUFICIENTE';
}

/**
 * Determines liquidity ratio level
 * @param ratio - Liquidity ratio
 * @returns Level classification
 */
export function getLiquidityLevel(ratio: number): NivelLiquidez {
  if (ratio >= 2.0) return 'ALTA';
  if (ratio >= 1.0) return 'NORMAL';
  if (ratio >= 0.5) return 'BAJA';
  return 'CRITICA';
}

/**
 * Generates description for debt-to-income ratio
 */
function getDebtToIncomeDescription(ratio: number, nivel: NivelDeudaIngreso): string {
  const roundedRatio = ratio.toFixed(2);
  switch (nivel) {
    case 'SALUDABLE':
      return `Tu deuda representa ${roundedRatio}% de tu ingreso mensual. Nivel saludable.`;
    case 'ACEPTABLE':
      return `Tu deuda representa ${roundedRatio}% de tu ingreso mensual. Nivel aceptable, pero vigila no aumentar más.`;
    case 'RIESGOSO':
      return `Tu deuda representa ${roundedRatio}% de tu ingreso mensual. Nivel riesgoso, considera reducir deudas.`;
    case 'CRITICO':
      return `Tu deuda representa ${roundedRatio}% de tu ingreso mensual. Nivel crítico, prioriza pagar deudas urgentemente.`;
  }
}

/**
 * Generates description for savings rate
 */
function getSavingsRateDescription(ratio: number, nivel: NivelTasaAhorro): string {
  const roundedRatio = ratio.toFixed(2);
  switch (nivel) {
    case 'EXCELENTE':
      return `Ahorras ${roundedRatio}% de tus ingresos. Nivel excelente, continúa así.`;
    case 'BUENO':
      return `Ahorras ${roundedRatio}% de tus ingresos. Buen nivel, intenta llegar al 20%.`;
    case 'REGULAR':
      return `Ahorras ${roundedRatio}% de tus ingresos. Nivel regular, busca reducir gastos para aumentar ahorro.`;
    case 'BAJO':
      return `Ahorras ${roundedRatio}% de tus ingresos. Nivel bajo, es urgente aumentar tu tasa de ahorro.`;
  }
}

/**
 * Generates description for emergency fund
 */
function getEmergencyFundDescription(months: number, nivel: NivelFondoEmergencia): string {
  const roundedMonths = months.toFixed(1);
  switch (nivel) {
    case 'ROBUSTO':
      return `Tu fondo de emergencia cubre ${roundedMonths} meses de gastos. Nivel robusto, estás bien protegido.`;
    case 'ADECUADO':
      return `Tu fondo de emergencia cubre ${roundedMonths} meses de gastos. Nivel adecuado, cumples la recomendación mínima.`;
    case 'MINIMO':
      return `Tu fondo de emergencia cubre ${roundedMonths} meses de gastos. Nivel mínimo, se recomiendan 3-6 meses.`;
    case 'INSUFICIENTE':
      return `Tu fondo de emergencia cubre ${roundedMonths} meses de gastos. Nivel insuficiente, es urgente crear un fondo de emergencia.`;
  }
}

/**
 * Generates description for liquidity ratio
 */
function getLiquidityDescription(ratio: number, nivel: NivelLiquidez): string {
  const roundedRatio = ratio.toFixed(2);
  switch (nivel) {
    case 'ALTA':
      return `Liquidez alta. Tienes ${roundedRatio} meses de cobertura en efectivo disponible.`;
    case 'NORMAL':
      return `Liquidez normal. Tienes ${roundedRatio} meses de cobertura en efectivo disponible.`;
    case 'BAJA':
      return `Liquidez baja. Solo tienes ${roundedRatio} meses de cobertura, considera aumentar reservas.`;
    case 'CRITICA':
      return `Liquidez crítica. Solo tienes ${roundedRatio} meses de cobertura, es urgente mejorar tu flujo de efectivo.`;
  }
}

/**
 * Calculates all financial ratios
 * @returns Complete financial ratios analysis
 */
export async function calculateRatiosFinancieros(): Promise<RatiosFinancieros> {
  // Gather all necessary data
  const [
    deudaTotal,
    ingresoMensual,
    gastoMensualPromedio,
    ahorroDisponible,
    gastoUltimoMes,
    ingresoUltimoMes,
  ] = await Promise.all([
    getTotalDebt(),
    getTotalMonthlyIncome(),
    getMonthlyExpensesAverage(3), // Last 3 months average
    getNetPosition(),
    getLastMonthExpenses(),
    getLastMonthIncome(),
  ]);

  // Calculate Debt-to-Income Ratio
  const debtToIncomeRatio = ingresoMensual > 0 ? (deudaTotal / ingresoMensual) * 100 : 0;
  const debtToIncomeLevel = getDebtToIncomeLevel(debtToIncomeRatio);

  // Calculate Savings Rate
  const ahorroMensual = ingresoMensual - gastoMensualPromedio;
  const savingsRatio = ingresoMensual > 0 ? (ahorroMensual / ingresoMensual) * 100 : 0;
  const savingsRateLevel = getSavingsRateLevel(savingsRatio);

  // Calculate Emergency Fund Coverage
  const emergencyFundMonths = gastoMensualPromedio > 0 ? ahorroDisponible / gastoMensualPromedio : 0;
  const emergencyFundLevel = getEmergencyFundLevel(emergencyFundMonths);

  // Calculate Liquidity Ratio
  const efectivoDisponible = ingresoUltimoMes - gastoUltimoMes;
  const liquidityRatio = gastoUltimoMes > 0 ? efectivoDisponible / gastoUltimoMes : 0;
  const liquidityLevel = getLiquidityLevel(liquidityRatio);

  return {
    deudaIngreso: {
      ratio: debtToIncomeRatio,
      nivel: debtToIncomeLevel,
      deudaTotal,
      ingresoMensual,
      descripcion: getDebtToIncomeDescription(debtToIncomeRatio, debtToIncomeLevel),
    },
    tasaAhorro: {
      ratio: savingsRatio,
      nivel: savingsRateLevel,
      ahorroMensual,
      ingresoMensual,
      gastoMensual: gastoMensualPromedio,
      descripcion: getSavingsRateDescription(savingsRatio, savingsRateLevel),
    },
    fondoEmergencia: {
      mesesCobertura: emergencyFundMonths,
      nivel: emergencyFundLevel,
      ahorroDisponible,
      gastoMensualPromedio,
      mesesRecomendados: 6,
      descripcion: getEmergencyFundDescription(emergencyFundMonths, emergencyFundLevel),
    },
    liquidez: {
      ratio: liquidityRatio,
      nivel: liquidityLevel,
      efectivoDisponible,
      gastoMensual: gastoUltimoMes,
      descripcion: getLiquidityDescription(liquidityRatio, liquidityLevel),
    },
  };
}
