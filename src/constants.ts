export const ROUTES = [
  // ── Calculators
  { path: '/eqd2',           label: 'BED / EQD2',          group: 'Calculators',  short: 'BED/EQD2' },
  { path: '/bed-eqd2',       label: 'BED ↔ EQD2 Convert',  group: 'Calculators',  short: 'BED↔EQD2' },
  { path: '/frac-adjust',    label: 'Fractionation Adjust', group: 'Calculators',  short: 'Frac Adj' },
  { path: '/hdr-brachy',     label: 'HDR Brachytherapy',    group: 'Calculators',  short: 'HDR' },
  { path: '/ebrt-gap',       label: 'EBRT Gap (LQ)',        group: 'Calculators',  short: 'Gap LQ' },
  { path: '/tdf',            label: 'TDF Factor',           group: 'Calculators',  short: 'TDF' },
  { path: '/reirradiation',  label: 'Re-irradiation Calc',  group: 'Calculators',  short: 'Re-RT' },
  { path: '/oerletrbe',      label: 'OER / LET / RBE',      group: 'Calculators',  short: 'OER/RBE' },
  // ── References
  { path: '/oar-limits',     label: 'OAR Dose Limits',      group: 'Reference',    short: 'OAR' },
  { path: '/pediatric-constraints', label: 'Pediatric Constraints', group: 'Reference', short: 'Pediatric' },
  { path: '/clinical-trials',      label: 'Clinical Trials Ref',  group: 'Reference', short: 'Trials' },
  { path: '/toxicity-grading',     label: 'RT Toxicity Grading',  group: 'Reference', short: 'Toxicity' },
  { path: '/dose-rate-comparison', label: 'Brachy Dose Rates',    group: 'Reference', short: 'Brachy' },
  { path: '/cervix-brachytherapy', label: 'Cervix Brachytherapy', group: 'Reference', short: 'Cervix' },
  { path: '/brachytherapy-reference', label: 'Prostate, uterine & Surface brachytherapy', group: 'Reference', short: 'Brachy Ref' },
  { path: '/adaptive-rt',    label: 'Adaptive RT Decision Tool', group: 'Reference', short: 'Adaptive RT' },
  { path: '/contouring-atlas', label: 'Contouring Atlas', group: 'Reference', short: 'Atlas' },
  { path: '/sbrt',           label: 'SBRT Constraints',     group: 'Reference',    short: 'SBRT' },
  { path: '/guidelines',     label: 'Oncologic Emergencies',group: 'Reference',    short: 'Emergencies' },
  { path: '/dose-exposures', label: 'Dose Exposure Ref',    group: 'Reference',    short: 'Exposure' },
  { path: '/radiation-units',label: 'Radiation Units',      group: 'Reference',    short: 'Units' },
  // ── Education
  { path: '/radioactive-sources', label: 'Radioactive Sources', group: 'Education', short: 'Sources' },
  { path: '/radioiodine-i131', label: 'Radioiodine I-131', group: 'Education', short: 'I-131' },
  { path: '/icru',           label: 'ICRU Standards',      group: 'Education', short: 'ICRU' },
  { path: '/named-effects',  label: 'Named Effects',       group: 'Education', short: 'Effects' },
  { path: '/ionizing-radiation', label: 'Ionizing Radiation Effects', group: 'Education', short: 'Radiation' },
  { path: '/radiation-mechanism', label: 'Radiation Mechanisms', group: 'Education', short: 'Mechanisms' },
  { path: '/cell-survival',      label: 'Cell Survival Curves', group: 'Education', short: 'Survival' },
  { path: '/viva-definitions',label: 'Viva Definitions',    group: 'Education',    short: 'Viva' },
  { path: '/radiation-history',label: 'History of Oncology',group: 'Education',   short: 'History' },
  { path: '/about',          label: 'About',                group: 'Education',    short: 'About' },
] as const;

export type RouteGroup = 'Calculators' | 'Reference' | 'Education';
export const GROUP_ORDER: RouteGroup[] = ['Calculators', 'Reference', 'Education'];
