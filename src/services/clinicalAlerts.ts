export const checkClinicalAlerts = (inputs: any): string[] => {
  const alerts: string[] = [];
  if (inputs.dfx > 5 && !inputs.isSBRT) alerts.push("High dose-per-fraction — is this SBRT?");
  if (inputs.alphaBeta === 10 && inputs.site === 'prostate') alerts.push("Prostate α/β is 1.5 Gy (Wang 2003). Using α/β=10 underestimates prostate BED by ~60%.");
  if (inputs.eqd2 > 90 && inputs.ab === 3) alerts.push("Check OAR constraints at this EQD2 level.");
  if (inputs.fractions > 40) alerts.push("Unusual fraction number — verify intent.");
  if (inputs.fractions <= 3 && inputs.totalDose > 30) alerts.push("SBRT-range doses — verify physics peer review and patient-specific QA are planned.");
  return alerts;
};
