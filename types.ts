
export enum CalculatorType {
  EQD2_BED = 'EQD2_BED',
  GAP_CORRECTION = 'GAP_CORRECTION',
  TDF = 'TDF',
  RADIOBIOLOGY_EXPLAINER = 'RADIOBIOLOGY_EXPLAINER'
}

export interface CalculationResult {
  bed: number;
  eqd2: number;
  label?: string;
}

export interface RadiobiologyParams {
  totalDose: number;
  dosePerFraction: number;
  fractions: number;
  alphaBeta: number;
}
