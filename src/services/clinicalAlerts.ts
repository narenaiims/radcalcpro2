export type AlertSeverity = 'warning' | 'caution' | 'info';

export interface ClinicalAlert {
  id: string;
  message: string;
  severity: AlertSeverity;
}

export interface AlertInputs {
  alphaBeta: number;
  dosePerFx: number;
  fractions: number;
  totalDose: number;
  eqd2?: number;
  bed?: number;
  site?: string;
  subsite?: string;
  tumour?: string;
  isSBRT?: boolean;
}

export const checkClinicalAlerts = (inputs: AlertInputs): ClinicalAlert[] => {
  const alerts: ClinicalAlert[] = [];
  
  const isProstate = [inputs.site, inputs.subsite, inputs.tumour]
    .some(s => s?.toLowerCase().includes('prostate'));

  // 1. Prostate α/β Range Awareness
  if (isProstate && inputs.alphaBeta === 1.5 && inputs.bed) {
    const bed = inputs.bed;
    const eqd2_1_0 = bed / (1 + 2/1.0);
    const eqd2_1_85 = bed / (1 + 2/1.85);
    alerts.push({
      id: 'prostate-ab-range',
      severity: 'info',
      message: `α/β uncertainty range 1.0–1.85 Gy: your EQD2 is ${inputs.eqd2?.toFixed(1)} Gy (range ${eqd2_1_85.toFixed(1)}–${eqd2_1_0.toFixed(1)} Gy)`
    });
  }

  // 2. Prostate α/β Warning
  if (isProstate && inputs.alphaBeta === 10) {
    alerts.push({
      id: 'prostate-ab-warning',
      severity: 'warning',
      message: "Prostate α/β is 1.5 Gy (Wang 2003). Using α/β=10 underestimates prostate BED by ~60%."
    });
  }

  // 3. SBRT PHYSICS QA ALERT
  if (inputs.dosePerFx >= 5 && inputs.fractions <= 10) {
    alerts.push({
      id: 'sbrt-qa',
      severity: 'warning',
      message: "SBRT protocol requires: (1) patient-specific QA, (2) physics peer review, (3) respiratory motion assessment for thoracic/abdominal targets, (4) IGRT (cone-beam CT or equivalent) before each fraction."
    });
  }

  // 4. EXTREME HYPOFRACTIONATION ALERT
  if (inputs.dosePerFx >= 6 && inputs.fractions <= 5) {
    alerts.push({
      id: 'extreme-hypo',
      severity: 'caution',
      message: "Single/few fraction schedule: confirm patient has adequate PS (ECOG 0-1), no prior RT to this field, and institutional experience with this technique."
    });
  }

  // 5. OAR Alert
  if (inputs.eqd2 && inputs.eqd2 > 90 && inputs.alphaBeta === 3) {
    alerts.push({
      id: 'oar-constraints',
      severity: 'caution',
      message: "Check OAR constraints at this EQD2 level (>90 Gy)."
    });
  }

  // 6. High dose-per-fraction (not SBRT)
  if (inputs.dosePerFx > 5 && !inputs.isSBRT && inputs.fractions > 10) {
    alerts.push({
      id: 'high-dpf-not-sbrt',
      severity: 'warning',
      message: "High dose-per-fraction (>5 Gy) in a non-SBRT schedule — verify intent."
    });
  }

  // 7. Unusual fraction number
  if (inputs.fractions > 40) {
    alerts.push({
      id: 'unusual-fractions',
      severity: 'info',
      message: "Unusual fraction number (>40) — verify intent."
    });
  }

  return alerts;
};
