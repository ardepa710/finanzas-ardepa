export type NivelDeudaIngreso = 'SALUDABLE' | 'ACEPTABLE' | 'RIESGOSO' | 'CRITICO';
export type NivelTasaAhorro = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'BAJO';
export type NivelFondoEmergencia = 'INSUFICIENTE' | 'MINIMO' | 'ADECUADO' | 'ROBUSTO';
export type NivelLiquidez = 'CRITICA' | 'BAJA' | 'NORMAL' | 'ALTA';

export interface RatioDeudaIngreso {
  ratio: number;
  nivel: NivelDeudaIngreso;
  deudaTotal: number;
  ingresoMensual: number;
  descripcion: string;
}

export interface RatioTasaAhorro {
  ratio: number;
  nivel: NivelTasaAhorro;
  ahorroMensual: number;
  ingresoMensual: number;
  gastoMensual: number;
  descripcion: string;
}

export interface RatioFondoEmergencia {
  mesesCobertura: number;
  nivel: NivelFondoEmergencia;
  ahorroDisponible: number;
  gastoMensualPromedio: number;
  mesesRecomendados: number;
  descripcion: string;
}

export interface RatioLiquidez {
  ratio: number;
  nivel: NivelLiquidez;
  efectivoDisponible: number;
  gastoMensual: number;
  descripcion: string;
}

export interface RatiosFinancieros {
  deudaIngreso: RatioDeudaIngreso;
  tasaAhorro: RatioTasaAhorro;
  fondoEmergencia: RatioFondoEmergencia;
  liquidez: RatioLiquidez;
}
