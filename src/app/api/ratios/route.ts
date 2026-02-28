import { NextResponse } from 'next/server';
import { calculateRatiosFinancieros } from '@/features/ratios/calculators/financial-ratios';
import { withErrorHandling } from '@/lib/api-error';

export const GET = withErrorHandling(async () => {
  const ratios = await calculateRatiosFinancieros();
  return ratios;
});
