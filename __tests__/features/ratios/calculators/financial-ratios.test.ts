import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getDebtToIncomeLevel,
  getSavingsRateLevel,
  getEmergencyFundLevel,
  getLiquidityLevel,
  calculateRatiosFinancieros,
} from '@/features/ratios/calculators/financial-ratios';
import * as helpers from '@/features/ratios/calculators/helpers';

// Mock the helpers module
vi.mock('@/features/ratios/calculators/helpers');

describe('Financial Ratios Calculator', () => {
  describe('getDebtToIncomeLevel', () => {
    it('returns SALUDABLE for ratio < 36%', () => {
      expect(getDebtToIncomeLevel(0)).toBe('SALUDABLE');
      expect(getDebtToIncomeLevel(20)).toBe('SALUDABLE');
      expect(getDebtToIncomeLevel(35.99)).toBe('SALUDABLE');
    });

    it('returns ACEPTABLE for ratio 36-42%', () => {
      expect(getDebtToIncomeLevel(36)).toBe('ACEPTABLE');
      expect(getDebtToIncomeLevel(40)).toBe('ACEPTABLE');
      expect(getDebtToIncomeLevel(42.99)).toBe('ACEPTABLE');
    });

    it('returns RIESGOSO for ratio 43-49%', () => {
      expect(getDebtToIncomeLevel(43)).toBe('RIESGOSO');
      expect(getDebtToIncomeLevel(45)).toBe('RIESGOSO');
      expect(getDebtToIncomeLevel(49.99)).toBe('RIESGOSO');
    });

    it('returns CRITICO for ratio >= 50%', () => {
      expect(getDebtToIncomeLevel(50)).toBe('CRITICO');
      expect(getDebtToIncomeLevel(100)).toBe('CRITICO');
      expect(getDebtToIncomeLevel(333.33)).toBe('CRITICO');
    });
  });

  describe('getSavingsRateLevel', () => {
    it('returns EXCELENTE for ratio >= 20%', () => {
      expect(getSavingsRateLevel(20)).toBe('EXCELENTE');
      expect(getSavingsRateLevel(30)).toBe('EXCELENTE');
      expect(getSavingsRateLevel(50)).toBe('EXCELENTE');
    });

    it('returns BUENO for ratio 10-19%', () => {
      expect(getSavingsRateLevel(10)).toBe('BUENO');
      expect(getSavingsRateLevel(15)).toBe('BUENO');
      expect(getSavingsRateLevel(19.99)).toBe('BUENO');
    });

    it('returns REGULAR for ratio 5-9%', () => {
      expect(getSavingsRateLevel(5)).toBe('REGULAR');
      expect(getSavingsRateLevel(7)).toBe('REGULAR');
      expect(getSavingsRateLevel(9.99)).toBe('REGULAR');
    });

    it('returns BAJO for ratio < 5%', () => {
      expect(getSavingsRateLevel(0)).toBe('BAJO');
      expect(getSavingsRateLevel(2)).toBe('BAJO');
      expect(getSavingsRateLevel(4.99)).toBe('BAJO');
    });

    it('handles negative savings rate', () => {
      expect(getSavingsRateLevel(-10)).toBe('BAJO');
    });
  });

  describe('getEmergencyFundLevel', () => {
    it('returns ROBUSTO for >= 6 months', () => {
      expect(getEmergencyFundLevel(6)).toBe('ROBUSTO');
      expect(getEmergencyFundLevel(8)).toBe('ROBUSTO');
      expect(getEmergencyFundLevel(12)).toBe('ROBUSTO');
    });

    it('returns ADECUADO for 3-5 months', () => {
      expect(getEmergencyFundLevel(3)).toBe('ADECUADO');
      expect(getEmergencyFundLevel(4.5)).toBe('ADECUADO');
      expect(getEmergencyFundLevel(5.99)).toBe('ADECUADO');
    });

    it('returns MINIMO for 1-2 months', () => {
      expect(getEmergencyFundLevel(1)).toBe('MINIMO');
      expect(getEmergencyFundLevel(1.5)).toBe('MINIMO');
      expect(getEmergencyFundLevel(2.99)).toBe('MINIMO');
    });

    it('returns INSUFICIENTE for < 1 month', () => {
      expect(getEmergencyFundLevel(0)).toBe('INSUFICIENTE');
      expect(getEmergencyFundLevel(0.5)).toBe('INSUFICIENTE');
      expect(getEmergencyFundLevel(0.99)).toBe('INSUFICIENTE');
    });
  });

  describe('getLiquidityLevel', () => {
    it('returns ALTA for ratio >= 2.0', () => {
      expect(getLiquidityLevel(2.0)).toBe('ALTA');
      expect(getLiquidityLevel(3.5)).toBe('ALTA');
      expect(getLiquidityLevel(10)).toBe('ALTA');
    });

    it('returns NORMAL for ratio 1.0-1.9', () => {
      expect(getLiquidityLevel(1.0)).toBe('NORMAL');
      expect(getLiquidityLevel(1.5)).toBe('NORMAL');
      expect(getLiquidityLevel(1.99)).toBe('NORMAL');
    });

    it('returns BAJA for ratio 0.5-0.9', () => {
      expect(getLiquidityLevel(0.5)).toBe('BAJA');
      expect(getLiquidityLevel(0.7)).toBe('BAJA');
      expect(getLiquidityLevel(0.99)).toBe('BAJA');
    });

    it('returns CRITICA for ratio < 0.5', () => {
      expect(getLiquidityLevel(0)).toBe('CRITICA');
      expect(getLiquidityLevel(0.2)).toBe('CRITICA');
      expect(getLiquidityLevel(0.49)).toBe('CRITICA');
    });

    it('handles negative liquidity', () => {
      expect(getLiquidityLevel(-0.5)).toBe('CRITICA');
    });
  });

  describe('calculateRatiosFinancieros', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('calculates all ratios correctly with typical data', async () => {
      // Mock helper functions
      (helpers.getTotalDebt as any).mockResolvedValue(10000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(3000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(2500);
      (helpers.getNetPosition as any).mockResolvedValue(5000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(2600);
      (helpers.getLastMonthIncome as any).mockResolvedValue(3000);

      const result = await calculateRatiosFinancieros();

      // Debt-to-Income: 10000 / 3000 * 100 = 333.33%
      expect(result.deudaIngreso.ratio).toBeCloseTo(333.33);
      expect(result.deudaIngreso.nivel).toBe('CRITICO');
      expect(result.deudaIngreso.deudaTotal).toBe(10000);
      expect(result.deudaIngreso.ingresoMensual).toBe(3000);
      expect(result.deudaIngreso.descripcion).toContain('333.33');

      // Savings Rate: (3000 - 2500) / 3000 * 100 = 16.67%
      expect(result.tasaAhorro.ratio).toBeCloseTo(16.67);
      expect(result.tasaAhorro.nivel).toBe('BUENO');
      expect(result.tasaAhorro.ahorroMensual).toBeCloseTo(500);
      expect(result.tasaAhorro.gastoMensual).toBe(2500);

      // Emergency Fund: 5000 / 2500 = 2 months
      expect(result.fondoEmergencia.mesesCobertura).toBeCloseTo(2.0);
      expect(result.fondoEmergencia.nivel).toBe('MINIMO');
      expect(result.fondoEmergencia.ahorroDisponible).toBe(5000);
      expect(result.fondoEmergencia.mesesRecomendados).toBe(6);

      // Liquidity: (3000 - 2600) / 2600 = 0.154
      expect(result.liquidez.ratio).toBeCloseTo(0.154, 2);
      expect(result.liquidez.nivel).toBe('CRITICA');
      expect(result.liquidez.efectivoDisponible).toBe(400);
      expect(result.liquidez.gastoMensual).toBe(2600);
    });

    it('handles zero income scenario', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(5000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(0);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(2000);
      (helpers.getNetPosition as any).mockResolvedValue(-5000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(2000);
      (helpers.getLastMonthIncome as any).mockResolvedValue(0);

      const result = await calculateRatiosFinancieros();

      expect(result.deudaIngreso.ratio).toBe(0);
      expect(result.tasaAhorro.ratio).toBe(0);
      expect(result.fondoEmergencia.mesesCobertura).toBeCloseTo(-2.5);
    });

    it('handles zero debt scenario', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(0);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(5000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(3000);
      (helpers.getNetPosition as any).mockResolvedValue(10000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(3000);
      (helpers.getLastMonthIncome as any).mockResolvedValue(5000);

      const result = await calculateRatiosFinancieros();

      expect(result.deudaIngreso.ratio).toBe(0);
      expect(result.deudaIngreso.nivel).toBe('SALUDABLE');
      expect(result.deudaIngreso.deudaTotal).toBe(0);
    });

    it('handles zero expenses scenario', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(1000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(5000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(0);
      (helpers.getNetPosition as any).mockResolvedValue(20000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(0);
      (helpers.getLastMonthIncome as any).mockResolvedValue(5000);

      const result = await calculateRatiosFinancieros();

      expect(result.fondoEmergencia.mesesCobertura).toBe(0);
      expect(result.liquidez.ratio).toBe(0);
    });

    it('calculates excellent financial health scenario', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(5000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(10000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(6000);
      (helpers.getNetPosition as any).mockResolvedValue(50000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(6000);
      (helpers.getLastMonthIncome as any).mockResolvedValue(10000);

      const result = await calculateRatiosFinancieros();

      // Debt-to-Income: 5000 / 10000 * 100 = 50%
      expect(result.deudaIngreso.ratio).toBe(50);
      expect(result.deudaIngreso.nivel).toBe('CRITICO');

      // Savings Rate: (10000 - 6000) / 10000 * 100 = 40%
      expect(result.tasaAhorro.ratio).toBe(40);
      expect(result.tasaAhorro.nivel).toBe('EXCELENTE');

      // Emergency Fund: 50000 / 6000 = 8.33 months
      expect(result.fondoEmergencia.mesesCobertura).toBeCloseTo(8.33);
      expect(result.fondoEmergencia.nivel).toBe('ROBUSTO');

      // Liquidity: (10000 - 6000) / 6000 = 0.67
      expect(result.liquidez.ratio).toBeCloseTo(0.67, 2);
      expect(result.liquidez.nivel).toBe('BAJA');
    });

    it('includes descriptions in all ratios', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(2000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(5000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(3000);
      (helpers.getNetPosition as any).mockResolvedValue(10000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(3000);
      (helpers.getLastMonthIncome as any).mockResolvedValue(5000);

      const result = await calculateRatiosFinancieros();

      expect(result.deudaIngreso.descripcion).toBeTruthy();
      expect(result.deudaIngreso.descripcion.length).toBeGreaterThan(0);

      expect(result.tasaAhorro.descripcion).toBeTruthy();
      expect(result.tasaAhorro.descripcion.length).toBeGreaterThan(0);

      expect(result.fondoEmergencia.descripcion).toBeTruthy();
      expect(result.fondoEmergencia.descripcion.length).toBeGreaterThan(0);

      expect(result.liquidez.descripcion).toBeTruthy();
      expect(result.liquidez.descripcion.length).toBeGreaterThan(0);
    });

    it('calculates negative savings scenario', async () => {
      (helpers.getTotalDebt as any).mockResolvedValue(15000);
      (helpers.getTotalMonthlyIncome as any).mockResolvedValue(3000);
      (helpers.getMonthlyExpensesAverage as any).mockResolvedValue(4000);
      (helpers.getNetPosition as any).mockResolvedValue(-5000);
      (helpers.getLastMonthExpenses as any).mockResolvedValue(4000);
      (helpers.getLastMonthIncome as any).mockResolvedValue(3000);

      const result = await calculateRatiosFinancieros();

      // Negative savings: (3000 - 4000) / 3000 * 100 = -33.33%
      expect(result.tasaAhorro.ratio).toBeCloseTo(-33.33);
      expect(result.tasaAhorro.nivel).toBe('BAJO');
      expect(result.tasaAhorro.ahorroMensual).toBe(-1000);
    });
  });
});
