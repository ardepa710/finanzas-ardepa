import { normalizeToMonthly } from '@/features/ratios/calculators/helpers';

describe('Ratios Helpers', () => {
  describe('normalizeToMonthly', () => {
    it('returns same amount for MENSUAL frequency', () => {
      const result = normalizeToMonthly(1000, 'MENSUAL');
      expect(result).toBe(1000);
    });

    it('doubles amount for QUINCENAL frequency', () => {
      const result = normalizeToMonthly(500, 'QUINCENAL');
      expect(result).toBe(1000);
    });

    it('multiplies by 4.33 for SEMANAL frequency', () => {
      const result = normalizeToMonthly(250, 'SEMANAL');
      expect(result).toBeCloseTo(1082.5);
    });

    it('handles zero amount', () => {
      expect(normalizeToMonthly(0, 'MENSUAL')).toBe(0);
      expect(normalizeToMonthly(0, 'QUINCENAL')).toBe(0);
      expect(normalizeToMonthly(0, 'SEMANAL')).toBe(0);
    });

    it('handles decimal amounts', () => {
      const result = normalizeToMonthly(333.33, 'QUINCENAL');
      expect(result).toBeCloseTo(666.66);
    });

    it('handles large amounts', () => {
      const result = normalizeToMonthly(10000, 'SEMANAL');
      expect(result).toBeCloseTo(43300);
    });
  });
});
