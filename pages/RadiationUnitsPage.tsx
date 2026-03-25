
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend,
  ComposedChart, Line, LineChart, Scatter, ScatterChart, ZAxis, ReferenceLine
} from 'recharts';
import { 
  Calculator, BookOpen, Zap, GraduationCap, Info, 
  Search, ChevronRight, ChevronDown, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, Activity,
  Shield, RefreshCw, Layers, Target, TrendingUp
} from 'lucide-react';
import Tooltip, { InfoIcon } from '@/components/Tooltip';

const STORAGE_KEY = 'radonco_units_state_v2';

interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  description: string;
  formula: string;
  type: 'absorbed' | 'equivalent' | 'activity' | 'exposure' | 'fluence' | 'legacy';
  details: string;
  fact: string;
  icrpRef?: string;
  clinicalContext: string;  // "Used in RT planning for..." 
  commonValues?: { label: string; value: string }[]; // e.g. "Breast RT: 50 Gy in 25 fx"
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  teachingPearl: string;    // one-liner clinical takeaway
  difficulty: 'intern' | 'resident' | 'fellow';
  category: 'units' | 'LQ-model' | 'beam-physics' | 'radiobiology' | 'safety';
  reference: string;
}

const RADIATION_WEIGHTING_FACTORS: { type: string; wR: number | string; note: string }[] = [
  { type: 'Photons (all energies)', wR: 1, note: 'X-rays, gamma rays, bremsstrahlung. Note: For therapeutic photons, Gy = Sv numerically.' },
  { type: 'Electrons & Muons', wR: 1, note: 'Including beta particles' },
  { type: 'Protons & Charged Pions', wR: 1.1, note: 'ICRU 78 / ICRP 92 consensus (fixed clinical convention)' },
  { type: 'Alpha particles', wR: 20, note: 'Also fission fragments, heavy ions' },
  { type: 'Neutrons <1 MeV', wR: '2.5 + 18.2e^[-(ln E)²/6]', note: 'Continuous function ICRP 103' },
  { type: 'Neutrons 1-50 MeV', wR: '5.0 + 17.0e^[-(ln 2E)²/6]', note: '' },
  { type: 'Neutrons >50 MeV', wR: '2.5 + 3.25e^[-(ln 0.04E)²/6]', note: '' },
];

const TISSUE_WEIGHTING_FACTORS: { organ: string; wT: number }[] = [
  { organ: 'Red Bone Marrow', wT: 0.12 },
  { organ: 'Colon', wT: 0.12 },
  { organ: 'Lung', wT: 0.12 },
  { organ: 'Stomach', wT: 0.12 },
  { organ: 'Breast', wT: 0.12 },
  { organ: 'Remainder Tissues', wT: 0.12 },
  { organ: 'Gonads', wT: 0.08 },
  { organ: 'Bladder', wT: 0.04 },
  { organ: 'Esophagus', wT: 0.04 },
  { organ: 'Liver', wT: 0.04 },
  { organ: 'Thyroid', wT: 0.04 },
  { organ: 'Bone Surface', wT: 0.01 },
  { organ: 'Brain', wT: 0.01 },
  { organ: 'Salivary Glands', wT: 0.01 },
  { organ: 'Skin', wT: 0.01 },
];

const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    id: 'gy',
    name: 'Gray',
    symbol: 'Gy',
    description: 'SI unit of absorbed dose.',
    formula: '1 Gy = 1 J/kg',
    type: 'absorbed',
    details: 'Measures energy deposited per unit mass. 1 Gy = 100 cGy = 100 rad.',
    fact: 'Replaced the "rad" in 1975.',
    icrpRef: 'ICRP 103',
    clinicalContext: 'Primary unit for prescribing tumor and OAR doses in RT.',
    commonValues: [{ label: 'Standard Fraction', value: '2.0 Gy' }, { label: 'SBRT Fraction', value: '10-20 Gy' }]
  },
  {
    id: 'sv',
    name: 'Sievert',
    symbol: 'Sv',
    description: 'SI unit of equivalent/effective dose.',
    formula: 'H = D × wR',
    type: 'equivalent',
    details: 'Used to quantify biological risk. It adjusts absorbed dose by a weighting factor (wR) based on radiation type (e.g., 1 for X-rays, 20 for Alpha particles).',
    fact: 'Named after Rolf Maximilian Sievert, a Swedish medical physicist known for his work on radiation dosage measurement.',
    icrpRef: 'ICRP 103',
    clinicalContext: 'Used for radiation protection and risk assessment.',
    commonValues: [{ label: 'Annual Public Limit', value: '1 mSv' }, { label: 'Annual Worker Limit', value: '20 mSv' }]
  },
  {
    id: 'bq',
    name: 'Becquerel',
    symbol: 'Bq',
    description: 'SI unit of radioactivity.',
    formula: '1 Bq = 1 decay/s',
    type: 'activity',
    details: 'Measures the activity of a radionuclide. It is a very small unit; clinical sources are often in Megabecquerels (MBq) or Gigabecquerels (GBq).',
    fact: 'Named after Henri Becquerel, who discovered radioactivity along with Marie and Pierre Curie.',
    icrpRef: 'ICRP 103',
    clinicalContext: 'Used in nuclear medicine and brachytherapy source activity.',
    commonValues: [{ label: 'I-131 Therapy', value: '3.7-7.4 GBq' }]
  },
  {
    id: 'mu',
    name: 'Monitor Unit',
    symbol: 'MU',
    description: 'Machine output unit.',
    formula: 'MU = Dose / (Factors)',
    type: 'fluence',
    details: 'Calibrated such that 1 MU = 1 cGy at reference conditions (e.g., 10x10 field, Dmax, 100 SSD).',
    fact: 'MU is specific to the linac calibration, not a fundamental physical constant.',
    clinicalContext: 'Used to program the linear accelerator for treatment delivery.',
    commonValues: [{ label: 'Typical 2Gy Field', value: '200-250 MU' }]
  },
  {
    id: 'hvl',
    name: 'Half-Value Layer',
    symbol: 'HVL',
    description: 'Thickness of material reducing intensity by 50%.',
    formula: 'HVL = 0.693 / μ',
    type: 'fluence',
    details: 'Determined by beam energy and material attenuation coefficient (μ).',
    fact: 'Used to characterize beam quality, especially for orthovoltage.',
    clinicalContext: 'Essential for shielding design (lead, concrete) and beam hardening assessment.',
  },
  {
    id: 'tvl',
    name: 'Tenth-Value Layer',
    symbol: 'TVL',
    description: 'Thickness reducing intensity by 90%.',
    formula: 'TVL = 3.32 × HVL',
    type: 'fluence',
    details: 'Thickness required to attenuate a beam to 1/10th of its original intensity.',
    fact: 'TVL is more efficient for high-energy shielding calculations.',
    clinicalContext: 'Standard for calculating bunker wall thickness.',
  },
  {
    id: 'r',
    name: 'Roentgen',
    symbol: 'R',
    description: 'Legacy exposure unit for air ionization.',
    formula: '1 R = 2.58e-4 C/kg',
    type: 'exposure',
    details: 'Measures the ability of X-rays to ionize a specific volume of air. 1 R ≈ 0.00877 Gy in air.',
    fact: 'Named after Wilhelm Conrad Röntgen, the discoverer of X-rays.',
    clinicalContext: 'Used in legacy dosimetry and some diagnostic equipment.',
  },
  {
    id: 'let',
    name: 'Linear Energy Transfer',
    symbol: 'LET',
    description: 'Energy deposited per unit path length (keV/μm).',
    formula: 'LET = dE / dl',
    type: 'fluence',
    details: 'Low-LET: photons, electrons. High-LET: protons, neutrons, alpha.',
    fact: 'LET increases as a particle slows down (Bragg Peak).',
    clinicalContext: 'Determines the biological effectiveness (RBE) of radiation.',
  },
  {
    id: 'rbe',
    name: 'Relative Biological Effectiveness',
    symbol: 'RBE',
    description: 'Ratio of doses for same biological effect.',
    formula: 'RBE = D_ref / D_test',
    type: 'equivalent',
    details: 'Protons ~1.1, Carbon ~3. Compares test radiation to 250 kVp X-rays or Co-60.',
    fact: 'RBE depends on LET, dose/fraction, and tissue type.',
    clinicalContext: 'Used to adjust physical dose in particle therapy. Proton RBE is fixed at 1.1 by convention (ICRU 78).',
    commonValues: [{ label: 'Protons', value: '1.1' }, { label: 'Carbon Ions', value: '3.0' }]
  },
  {
    id: 'oer',
    name: 'Oxygen Enhancement Ratio',
    symbol: 'OER',
    description: 'Ratio of doses for same effect in hypoxic vs. normoxic conditions.',
    formula: 'OER = D_hypoxic / D_aerated',
    type: 'equivalent',
    details: 'OER ≈ 3 for X-rays. Approaches 1.0 for very high-LET radiation.',
    fact: 'Oxygen "fixes" radiation damage, making it permanent.',
    clinicalContext: 'Explains why hypoxic tumor cores are resistant to conventional RT.',
  },
  {
    id: 'dmax',
    name: 'Depth of Maximum Dose',
    symbol: 'Dmax',
    description: 'Depth of electronic equilibrium.',
    formula: 'Build-up region',
    type: 'absorbed',
    details: '6MV: ~1.5cm, 10MV: ~2.5cm, 18MV: ~3.5cm.',
    fact: 'Higher energy = deeper Dmax (Skin Sparing Effect).',
    clinicalContext: 'Crucial for skin sparing and superficial tumor coverage.',
    commonValues: [{ label: '6 MV', value: '1.5 cm' }, { label: '18 MV', value: '3.5 cm' }]
  },
  {
    id: 'tcp',
    name: 'Tumor Control Probability',
    symbol: 'TCP',
    description: 'Probability of tumor eradication.',
    formula: 'TCP = exp(-N_surviving)',
    type: 'equivalent',
    details: 'D10/D50: Dose for 10% / 50% tumor control probability.',
    fact: 'Based on Poisson statistics of cell kill.',
    clinicalContext: 'Used in radiobiological modeling to optimize dose.',
  },
  {
    id: 'kvp',
    name: 'Kilovolt Peak',
    symbol: 'kVp',
    description: 'Peak tube voltage in kV.',
    formula: 'Beam Quality',
    type: 'exposure',
    details: 'Determines X-ray beam quality/energy spectrum.',
    fact: 'Increasing kVp increases both quantity and quality of X-rays.',
    clinicalContext: 'Determines contrast and dose in CT and diagnostic X-rays.',
  }
];

const CLINICAL_PEARLS = [
  "1 cGy = 1 rad. The switch to cGy in the 1990s was purely cosmetic — the numbers stayed the same.",
  "A standard linac fraction is 200 cGy (2 Gy). Always sanity-check MU calculations: 200 cGy ÷ 1 cGy/MU = 200 MU at reference.",
  "BED is NOT a deliverable dose — it's a mathematical construct for isoeffect comparison only.",
  "Prostate α/β ≈ 1.5 Gy (lower than late rectum ~3 Gy) — the radiobiologic basis for hypofractionation.",
  "The Bragg peak depth for 150 MeV protons is ~15.5 cm — enough to treat mid-pelvis tumors.",
  "FLASH RT (>40 Gy/s dose rate) shows reduced normal tissue toxicity in preclinical models — mechanism unknown.",
  "Carbon ion RBE is 2-3× at the Bragg peak — enabling dose escalation impossible with photons.",
  "OER ≈ 3 for X-rays: a hypoxic tumor requires ~3× higher dose for same kill. This is why hypoxia is radioresistance.",
  "LET determines RBE: low-LET photons cause mostly repairable DSBs; high-LET heavy ions cause complex irreparable DSBs.",
  "TVL = 3.32 × HVL. A vault wall providing 3 TVLs reduces intensity by 10³ = 1000×."
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: "What is the primary difference between the Gray (Gy) and the Sievert (Sv)?",
    options: [
      "Gy is for diagnostic, Sv is for therapy",
      "Gy measures absorbed energy, Sv measures biological risk",
      "Sv is the legacy unit for Gy",
      "There is no difference; 1 Gy always equals 1 Sv"
    ],
    correctIndex: 1,
    explanation: "The Gray (Gy) is a physical unit of absorbed dose (J/kg). The Sievert (Sv) is a protection unit that adjusts the dose by a weighting factor (wR) to reflect biological harm.",
    teachingPearl: "Gy = Physics; Sv = Biology/Risk.",
    difficulty: 'intern',
    category: 'units',
    reference: 'ICRP 103'
  },
  {
    id: 'q2',
    question: "1 Gray is equivalent to how many centigray (cGy) and rad?",
    options: ["1 cGy, 1 rad", "10 cGy, 10 rad", "100 cGy, 100 rad", "1000 cGy, 1000 rad"],
    correctIndex: 2,
    explanation: "1 Gy = 100 cGy. Since 1 cGy = 1 rad, 1 Gy also equals 100 rad.",
    teachingPearl: "1 rad = 1 cGy.",
    difficulty: 'intern',
    category: 'units',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q3',
    question: "What is the generally accepted α/β ratio for prostate cancer, suggesting high sensitivity to fraction size?",
    options: ["1.5 Gy", "3.0 Gy", "10.0 Gy", "20.0 Gy"],
    correctIndex: 0,
    explanation: "Prostate cancer is thought to have a very low α/β ratio (~1.5 Gy), making it more sensitive to large fraction sizes (hypofractionation) than most other tumors.",
    teachingPearl: "Low α/β = High fractionation sensitivity.",
    difficulty: 'resident',
    category: 'LQ-model',
    reference: 'Brenner et al. 2008'
  },
  {
    id: 'q4',
    question: "Compare the BED10 for 60 Gy in 30 fx vs 48 Gy in 4 fx (SBRT). Which is higher?",
    options: ["60 Gy in 30 fx", "48 Gy in 4 fx", "They are identical", "Cannot be calculated"],
    correctIndex: 1,
    explanation: "BED10(60/30) = 60(1+2/10) = 72 Gy. BED10(48/4) = 48(1+12/10) = 105.6 Gy. SBRT provides a much higher biological dose.",
    teachingPearl: "Hypofractionation dramatically increases BED for high α/β tissues.",
    difficulty: 'fellow',
    category: 'LQ-model',
    reference: 'Radiobiology for the Radiologist'
  },
  {
    id: 'q5',
    question: "Which radiation type has the highest Relative Biological Effectiveness (RBE)?",
    options: ["6 MV Photons", "Electrons", "Protons", "Carbon Ions"],
    correctIndex: 3,
    explanation: "Carbon ions are high-LET particles with dense ionization tracks, resulting in much higher RBE (~3.0) compared to photons (1.0) or protons (1.1).",
    teachingPearl: "High LET = High RBE.",
    difficulty: 'resident',
    category: 'radiobiology',
    reference: 'ICRP 103'
  },
  {
    id: 'q6',
    question: "What is the primary clinical advantage of the Proton Bragg Peak?",
    options: [
      "Higher dose at the surface",
      "Zero 'exit dose' beyond the target",
      "Faster treatment delivery",
      "Lower cost of equipment"
    ],
    correctIndex: 1,
    explanation: "Protons deposit most of their energy at a specific depth (Bragg Peak) and then stop, resulting in nearly zero dose to tissues distal to the target.",
    teachingPearl: "Protons = Superior distal OAR sparing.",
    difficulty: 'resident',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q7',
    question: "What is the purpose of a Spread-Out Bragg Peak (SOBP) in proton therapy?",
    options: [
      "To increase the dose rate",
      "To cover the entire depth of a tumor",
      "To reduce skin dose",
      "To focus the beam on a single point"
    ],
    correctIndex: 1,
    explanation: "A single Bragg peak is too narrow to cover a tumor. Multiple peaks of different energies are combined to create a SOBP that covers the target volume.",
    teachingPearl: "SOBP = Volumetric coverage.",
    difficulty: 'fellow',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q8',
    question: "The Oxygen Enhancement Ratio (OER) is most significant for which type of radiation?",
    options: ["Alpha particles", "Neutrons", "X-rays", "Carbon ions"],
    correctIndex: 2,
    explanation: "OER is highest (~3.0) for low-LET radiation like X-rays. High-LET radiation (Alpha, Neutrons) is less dependent on oxygen for cell killing.",
    teachingPearl: "Low LET is oxygen-dependent; High LET is not.",
    difficulty: 'fellow',
    category: 'radiobiology',
    reference: 'Hall\'s Radiobiology'
  },
  {
    id: 'q9',
    question: "According to ICRP 103, what is the radiation weighting factor (wR) for alpha particles?",
    options: ["1", "2", "5", "20"],
    correctIndex: 3,
    explanation: "Alpha particles are assigned a wR of 20, reflecting their high biological effectiveness in causing stochastic damage.",
    teachingPearl: "Alpha wR = 20.",
    difficulty: 'intern',
    category: 'units',
    reference: 'ICRP 103'
  },
  {
    id: 'q10',
    question: "What is the approximate Dmax for a 6 MV photon beam?",
    options: ["0.5 cm", "1.5 cm", "3.0 cm", "5.0 cm"],
    correctIndex: 1,
    explanation: "A 6 MV beam typically reaches electronic equilibrium (Dmax) at approximately 1.5 cm depth.",
    teachingPearl: "6MV Dmax = 1.5cm.",
    difficulty: 'resident',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q11',
    question: "What is the relationship between Tenth-Value Layer (TVL) and Half-Value Layer (HVL)?",
    options: ["TVL = 2 × HVL", "TVL = 3.32 × HVL", "TVL = 10 × HVL", "TVL = ln(10) × HVL"],
    correctIndex: 1,
    explanation: "Since log2(10) ≈ 3.32, it takes 3.32 half-value layers to reduce intensity to 10% (one TVL).",
    teachingPearl: "1 TVL ≈ 3.3 HVL.",
    difficulty: 'resident',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q12',
    question: "The effective half-life (Te) of a radiopharmaceutical is calculated as:",
    options: ["Tp + Tb", "Tp × Tb", "(Tp + Tb) / (Tp × Tb)", "(Tp × Tb) / (Tp + Tb)"],
    correctIndex: 3,
    explanation: "1/Te = 1/Tp + 1/Tb. Solving for Te gives (Tp × Tb) / (Tp + Tb).",
    teachingPearl: "Effective T1/2 is always shorter than physical or biological T1/2.",
    difficulty: 'resident',
    category: 'safety',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q13',
    question: "According to the Inverse Square Law, doubling the distance from a point source reduces the dose by:",
    options: ["25%", "50%", "75%", "90%"],
    correctIndex: 2,
    explanation: "Dose is proportional to 1/d². Doubling distance (2d) results in 1/(2d)² = 1/4th the dose, which is a 75% reduction.",
    teachingPearl: "Double distance = 1/4 dose.",
    difficulty: 'intern',
    category: 'safety',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q14',
    question: "Why is centigray (cGy) often preferred over Gray (Gy) in clinical radiotherapy records?",
    options: [
      "It is more accurate",
      "It is an SI unit",
      "Numerical values are identical to the legacy 'rad'",
      "It prevents decimal errors"
    ],
    correctIndex: 2,
    explanation: "1 cGy = 1 rad. Using cGy allowed clinics to transition to SI units without changing the numerical values in their treatment records.",
    teachingPearl: "cGy = rad.",
    difficulty: 'resident',
    category: 'units',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q15',
    question: "How does the LET of protons compare to photons?",
    options: [
      "Protons are much lower",
      "They are identical",
      "Protons are slightly higher, increasing significantly at the end of range",
      "Protons are 100x higher throughout the track"
    ],
    correctIndex: 2,
    explanation: "Protons are low-LET particles for most of their track, but their LET increases sharply at the Bragg Peak as they slow down.",
    teachingPearl: "LET increases as velocity decreases.",
    difficulty: 'fellow',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q16',
    question: "What is the standard RBE for protons clinically used in treatment planning (ICRP 92)?",
    options: ["1.0", "1.1", "1.5", "2.0"],
    correctIndex: 1,
    explanation: "A generic RBE of 1.1 is used globally for proton therapy planning, although actual RBE varies with depth and tissue.",
    teachingPearl: "Proton RBE = 1.1.",
    difficulty: 'fellow',
    category: 'radiobiology',
    reference: 'ICRP 92'
  },
  {
    id: 'q17',
    question: "A Monitor Unit (MU) calculation primarily accounts for which of the following?",
    options: [
      "Patient age",
      "Tumor histology",
      "Machine output, depth dose, and scatter",
      "The cost of the treatment"
    ],
    correctIndex: 2,
    explanation: "MU calculation converts the prescribed dose into machine time by accounting for output factors, PDD/TMR, and collimator/phantom scatter.",
    teachingPearl: "MU = Dose / Factors.",
    difficulty: 'resident',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q18',
    question: "According to ICRP 103, which tissue has the lowest weighting factor (wT), indicating low stochastic sensitivity?",
    options: ["Bone Marrow", "Gonads", "Brain", "Lung"],
    correctIndex: 2,
    explanation: "Brain and Skin have a wT of 0.01. Marrow and Lung are 0.12. Gonads were reduced to 0.08 in ICRP 103.",
    teachingPearl: "Brain has low stochastic sensitivity (wT=0.01).",
    difficulty: 'fellow',
    category: 'units',
    reference: 'ICRP 103'
  },
  {
    id: 'q19',
    question: "FLASH Radiotherapy requires dose rates exceeding which threshold?",
    options: ["0.1 Gy/s", "1 Gy/s", "40 Gy/s", "1000 Gy/s"],
    correctIndex: 2,
    explanation: "The FLASH effect (sparing normal tissue while killing tumor) is observed at ultra-high dose rates, typically >40 Gy/s.",
    teachingPearl: "FLASH = >40 Gy/s.",
    difficulty: 'fellow',
    category: 'radiobiology',
    reference: 'Wilson et al. 2020'
  },
  {
    id: 'q20',
    question: "Hypofractionation (large dose per fraction) favors the therapeutic ratio for which scenario?",
    options: [
      "Tumor α/β < Normal Tissue α/β",
      "Tumor α/β > Normal Tissue α/β",
      "Tumor α/β = 10",
      "Always favors the tumor"
    ],
    correctIndex: 0,
    explanation: "If a tumor has a lower α/β than the surrounding late-reacting normal tissue (e.g., Prostate), hypofractionation increases tumor kill more than normal tissue damage.",
    teachingPearl: "Hypofractionation favors low α/β targets.",
    difficulty: 'fellow',
    category: 'LQ-model',
    reference: 'Radiobiology for the Radiologist'
  },
  {
    id: 'q21',
    question: "What is the SI unit of radioactivity?",
    options: ["Curie", "Becquerel", "Roentgen", "Gray"],
    correctIndex: 1,
    explanation: "The Becquerel (Bq) is the SI unit, defined as 1 disintegration per second.",
    teachingPearl: "1 Bq = 1 dps.",
    difficulty: 'intern',
    category: 'units',
    reference: 'ICRP 103'
  },
  {
    id: 'q22',
    question: "The 'Roentgen' is a unit of:",
    options: ["Absorbed Dose", "Dose Equivalent", "Exposure (Ionization in air)", "Radioactivity"],
    correctIndex: 2,
    explanation: "The Roentgen (R) measures the ability of X-rays to ionize a specific volume of air.",
    teachingPearl: "Roentgen = Exposure.",
    difficulty: 'resident',
    category: 'units',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q23',
    question: "Which α/β ratio is typically used for 'late-reacting' normal tissues?",
    options: ["1.5 Gy", "3.0 Gy", "10.0 Gy", "20.0 Gy"],
    correctIndex: 1,
    explanation: "A value of 3.0 Gy is the standard approximation for late-reacting tissues like spinal cord or lung fibrosis.",
    teachingPearl: "Late tissue α/β ≈ 3.",
    difficulty: 'resident',
    category: 'LQ-model',
    reference: 'Radiobiology for the Radiologist'
  },
  {
    id: 'q24',
    question: "Dmax for an 18 MV beam is approximately:",
    options: ["1.5 cm", "2.5 cm", "3.5 cm", "5.0 cm"],
    correctIndex: 2,
    explanation: "Higher energy beams have a longer build-up region. 18 MV reaches Dmax at ~3.5 cm.",
    teachingPearl: "18MV Dmax = 3.5cm.",
    difficulty: 'resident',
    category: 'beam-physics',
    reference: 'Khan\'s Physics'
  },
  {
    id: 'q25',
    question: "The 'f-factor' converts:",
    options: ["Dose to BED", "Exposure to Absorbed Dose", "MU to Dose", "Gy to Sv"],
    correctIndex: 1,
    explanation: "The f-factor (Roentgen-to-rad conversion factor) is used to calculate absorbed dose from exposure measurements.",
    teachingPearl: "D = f × X.",
    difficulty: 'fellow',
    category: 'units',
    reference: 'Khan\'s Physics'
  }
];

// ─── CALCULATION ENGINE ──────────────────────────────────────────────────────

function calculateBED(params: {
  dosePerFraction: number;
  numFractions: number;
  alphaBeta: number;
  repairHalfTime?: number;
}): {
  totalDose: number;
  BED: number;
  EQD2: number;
  RE: number;
  formula: string;
  bedUnit: string;
  eqd2Unit: string;
} {
  const { dosePerFraction: d, numFractions: n, alphaBeta: ab } = params;
  const totalDose = n * d;
  const BED = totalDose * (1 + d / ab);
  const EQD2 = BED / (1 + 2 / ab);
  const RE = 1 + d / ab;
  
  const bedUnit = `Gy${ab === 10 ? '₁₀' : ab === 3 ? '₃' : ab}`;
  const eqd2Unit = `Gy${ab === 10 ? '₁₀' : ab === 3 ? '₃' : ab}`;

  return {
    totalDose,
    BED,
    EQD2,
    RE,
    formula: `BED = ${n} × ${d} × (1 + ${d}/${ab})`,
    bedUnit,
    eqd2Unit
  };
}

function isoeffectDose(params: {
  d1: number; n1: number;
  d2: number;
  alphaBeta: number;
}): { n2: number; totalDose2: number; warning?: string } {
  const { d1, n1, d2, alphaBeta: ab } = params;
  const bed1 = n1 * d1 * (1 + d1 / ab);
  const n2 = bed1 / (d2 * (1 + d2 / ab));
  const totalDose2 = n2 * d2;
  
  let warning;
  if (d2 > 4) warning = "High dose per fraction (>4Gy) may exceed LQ model validity for some tissues.";
  
  return { n2, totalDose2, warning };
}

function calculateMU(params: {
  prescribedDose: number;
  outputFactor: number;
  PDD: number;
  fieldSizeFactor: number;
  inverseSqFactor?: number;
}): { MU: number; formula: string } {
  const { prescribedDose: D, outputFactor: Scp, PDD, fieldSizeFactor: fs, inverseSqFactor: ISF = 1 } = params;
  const MU = D / (Scp * (PDD / 100) * fs * ISF);
  
  return {
    MU,
    formula: `MU = ${D} / (${Scp} × ${PDD/100} × ${fs} × ${ISF})`
  };
}

function generateBortfeldPDD(energy_MeV: number, tissueType: 'water' | 'tissue'): { depth: number; dose: number }[] {
  const alpha = 0.0022; // Bragg-Kleeman constant
  const p = 1.77;       // Bragg-Kleeman exponent
  const range = alpha * Math.pow(energy_MeV, p); // R80 in cm
  
  const data = [];
  const step = 0.1;
  const maxDepth = range + 2;

  for (let z = 0; z <= maxDepth; z += step) {
    let dose = 0;
    if (z < range) {
      dose = 20 + 10 * Math.pow(range - z, -0.4);
      if (dose > 100) dose = 100;
    } else if (z >= range && z <= range + 0.5) {
      dose = 100 * Math.exp(-Math.pow(z - range, 2) / 0.05);
    } else {
      dose = 0;
    }
    data.push({ depth: parseFloat(z.toFixed(1)), dose: parseFloat(dose.toFixed(1)) });
  }
  return data;
}

function generateElectronPDD(energy_MeV: number): { depth: number; dose: number }[] {
  const Rp = energy_MeV / 2;
  const R80 = energy_MeV / 2.8;
  const Dmax = 0.9 * (energy_MeV / 4);
  
  const data = [];
  for (let z = 0; z <= Rp + 2; z += 0.2) {
    let dose = 0;
    if (z <= Dmax) {
      dose = 80 + (20 * (z / Dmax));
    } else if (z > Dmax && z <= R80) {
      dose = 100 - (20 * (z - Dmax) / (R80 - Dmax));
    } else if (z > R80 && z <= Rp) {
      dose = 80 * (1 - (z - R80) / (Rp - R80));
    } else {
      dose = 2;
    }
    data.push({ depth: parseFloat(z.toFixed(1)), dose: parseFloat(dose.toFixed(1)) });
  }
  return data;
}

function isSameDosimetricCategory(unitA: string, unitB: string): {
  allowed: boolean;
  warning?: string;
} {
  const absorbed = ['Gy', 'cGy', 'rad'];
  const equivalent = ['Sv', 'mSv', 'rem'];
  const activity = ['Bq', 'MBq', 'GBq', 'Ci', 'mCi'];
  
  if (absorbed.includes(unitA) && equivalent.includes(unitB)) {
    return { allowed: false, warning: "Gy → Sv conversion requires a Radiation Weighting Factor (wR). Note: For therapeutic radiation (photons), wR=1 so Gy=Sv numerically, but conceptually they measure different things (Absorbed Dose vs. Equivalent Dose). This is a high-yield boards distinction." };
  }
  if (equivalent.includes(unitA) && absorbed.includes(unitB)) {
    return { allowed: false, warning: "Sv → Gy conversion requires knowledge of the radiation type." };
  }
  if ((absorbed.includes(unitA) || equivalent.includes(unitA)) && activity.includes(unitB)) {
    return { allowed: false, warning: "Dose units cannot be directly converted to activity units." };
  }
  return { allowed: true };
}

interface FormulaCalculatorProps {
  title: string;
  formula: string;
  desc: string;
  inputs: { label: string; key: string; placeholder: string; unit: string; defaultValue: string }[];
  compute: (values: Record<string, number>) => string;
}

const FormulaCalculator: React.FC<FormulaCalculatorProps> = ({ title, formula, desc, inputs, compute }) => {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    inputs.forEach(i => initial[i.key] = i.defaultValue);
    return initial;
  });

  const result = useMemo(() => {
    const numericVals: Record<string, number> = {};
    Object.keys(vals).forEach(k => numericVals[k] = parseFloat(vals[k]) || 0);
    return compute(numericVals);
  }, [vals, compute]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-all group">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{title}</h4>
          <Tooltip content={desc}>
            <InfoIcon />
          </Tooltip>
        </div>
        <div className="text-lg font-mono font-black text-slate-900 mb-4">{formula}</div>
        
        <div className="space-y-3 mb-6">
          {inputs.map(input => (
            <div key={input.key} className="flex items-center space-x-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase w-12">{input.label}</label>
              <div className="relative flex-1">
                <input 
                  type="number" 
                  value={vals[input.key]} 
                  onChange={(e) => setVals(prev => ({ ...prev, [input.key]: e.target.value }))}
                  placeholder={input.placeholder}
                  className="w-full pl-2 pr-8 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500 transition-shadow"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">{input.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Result</span>
        <div className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl shadow-inner group-hover:bg-amber-100 transition-colors">
          {result}
        </div>
      </div>
    </div>
  );
};

function generateLQSurvivalData(dosePerFx: number): { dose: number; highAB: number; lowAB: number; highLET: number }[] {
  const data = [];
  const alphaHigh = 0.35;
  const betaHigh = 0.035; // alpha/beta = 10
  const alphaLow = 0.15;
  const betaLow = 0.05;   // alpha/beta = 3
  const alphaLET = 0.6;   // Linear, no shoulder
  
  for (let d = 0; d <= 25; d += 0.5) {
    const sfHigh = Math.exp(-(alphaHigh * d + betaHigh * d * d));
    const sfLow = Math.exp(-(alphaLow * d + betaLow * d * d));
    const sfLET = Math.exp(-(alphaLET * d));
    
    data.push({
      dose: d,
      highAB: parseFloat(sfHigh.toFixed(6)),
      lowAB: parseFloat(sfLow.toFixed(6)),
      highLET: parseFloat(sfLET.toFixed(6))
    });
  }
  return data;
}

const CONVERSION_GROUPS = [
  { id: 'absorbed', name: 'Absorbed Dose', units: ['Gy', 'cGy', 'rad'] },
  { id: 'equivalent', name: 'Equivalent Dose', units: ['Sv', 'mSv', 'rem'] },
  { id: 'activity', name: 'Radioactivity', units: ['Bq', 'MBq', 'GBq', 'Ci', 'mCi'] }
];

const QUICK_REF_DATA = {
  conversions: [
    { label: '1 Gy', value: '100 cGy = 100 rad' },
    { label: '1 Sv', value: '100 rem = 1000 mSv' },
    { label: '1 Ci', value: '3.7 × 10¹⁰ Bq (37 GBq)' },
    { label: '1 Bq', value: '1 decay/sec' }
  ],
  alphaBeta: [
    { label: 'Tumors (Early)', value: '10 Gy' },
    { label: 'Late Tissue', value: '3 Gy' },
    { label: 'Prostate', value: '1.5 Gy' },
    { label: 'Breast', value: '4 Gy' }
  ],
  dmax: [
    { label: 'Co-60', value: '0.5 cm' },
    { label: '6 MV', value: '1.5 cm' },
    { label: '10 MV', value: '2.5 cm' },
    { label: '18 MV', value: '3.5 cm' }
  ],
  wr: [
    { label: 'Photons/Electrons', value: '1' },
    { label: 'Protons', value: '1.1' },
    { label: 'Alpha Particles', value: '20' }
  ]
};

const FIVE_RS = [
  { name: 'Repair', desc: 'Repair of sublethal damage between fractions. Favors normal tissue sparing with fractionation.' },
  { name: 'Redistribution', desc: 'Cells move into sensitive phases (G2/M) of the cell cycle. Increases tumor kill.' },
  { name: 'Repopulation', desc: 'Tumor cell division during treatment. Reason to avoid treatment breaks.' },
  { name: 'Reoxygenation', desc: 'Hypoxic cells become aerated as tumor shrinks. Increases radiosensitivity.' },
  { name: 'Radiosensitivity', desc: 'Intrinsic sensitivity of the specific cell type (The 5th R).' }
];

const RadiationUnitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'convert' | 'defs' | 'formulas' | 'physics' | 'quiz'>('convert');
  const [searchTerm, setSearchTerm] = useState('');
  const [convValue, setConvValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('Gy');
  const [toUnit, setToUnit] = useState<string>('rad');
  const [expandedDef, setExpandedDef] = useState<string | null>('gy');
  const [pearlIdx, setPearlIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
  }));

  const [radiobioTab, setRadiobioTab] = useState<'lq' | 'survival' | 'effects'>('lq');

  // Radiobiology Deep Dive States
  const [lqDosePerFx, setLqDosePerFx] = useState(2);
  const [cellSurvAlpha, setCellSurvAlpha] = useState(0.3);
  const [cellSurvBeta, setCellSurvBeta] = useState(0.03);
  const [cellSurvDose, setCellSurvDose] = useState(2);

  const [protonEnergy, setProtonEnergy] = useState<number>(150);
  const [showSOBP, setShowSOBP] = useState<boolean>(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const pearlInterval = setInterval(() => setPearlIdx(i => (i + 1) % CLINICAL_PEARLS.length), 8000);
    return () => clearInterval(pearlInterval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConvValue(parsed.convValue ?? '1');
        setFromUnit(parsed.fromUnit ?? 'Gy');
        setToUnit(parsed.toUnit ?? 'rad');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ convValue, fromUnit, toUnit }));
  }, [convValue, fromUnit, toUnit]);

  const getUnitBaseValue = (v: number, u: string): number => {
    switch(u) {
      case 'Gy': return v;
      case 'cGy': return v / 100;
      case 'rad': return v / 100;
      case 'Sv': return v;
      case 'mSv': return v / 1000;
      case 'rem': return v / 100;
      case 'Bq': return v;
      case 'MBq': return v * 1e6;
      case 'GBq': return v * 1e9;
      case 'Ci': return v * 3.7e10;
      case 'mCi': return v * 3.7e7;
      default: return v;
    }
  };

  const convertFromBase = (base: number, u: string): number => {
    switch(u) {
      case 'Gy': return base;
      case 'cGy': return base * 100;
      case 'rad': return base * 100;
      case 'Sv': return base;
      case 'mSv': return base * 1000;
      case 'rem': return base * 100;
      case 'Bq': return base;
      case 'MBq': return base / 1e6;
      case 'GBq': return base / 1e9;
      case 'Ci': return base / 3.7e10;
      case 'mCi': return base / 3.7e7;
      default: return base;
    }
  };

  const conversionResult = useMemo(() => {
    const val = parseFloat(convValue) || 0;
    const base = getUnitBaseValue(val, fromUnit);
    return convertFromBase(base, toUnit);
  }, [convValue, fromUnit, toUnit]);

  // FIX: Added chartDataConvert calculation to fix "Cannot find name 'chartDataConvert'"
  const chartDataConvert = useMemo(() => {
    const val = parseFloat(convValue) || 0;
    const base = getUnitBaseValue(val, fromUnit);
    const group = CONVERSION_GROUPS.find(g => g.units.includes(fromUnit));
    if (!group) return [];
    
    return group.units.map(u => ({
      name: u,
      magnitude: convertFromBase(base, u),
      fill: u === fromUnit ? '#d97706' : u === toUnit ? '#b45309' : '#fbbf24'
    }));
  }, [convValue, fromUnit, toUnit]);

  const physicsData = useMemo(() => {
    const data = [];
    const maxDepth = 25;
    const peakDepth = protonEnergy / 10;
    
    for (let x = 0; x <= maxDepth; x += 0.5) {
      const photonDose = x < 1.5 
        ? 50 + (50 * (x / 1.5)) 
        : 100 * Math.exp(-0.05 * (x - 1.5));
        
      let protonDoseEntrance = 25 + (10 * (x / peakDepth)); 
      const peakWidth = 0.5;
      const peakHeight = 100;
      const gaussian = peakHeight * Math.exp(-Math.pow(x - peakDepth, 2) / (2 * Math.pow(peakWidth, 2)));
      let finalProtonDose = x > peakDepth + 0.5 ? 0 : Math.max(protonDoseEntrance, gaussian);

      let sobpDose = 0;
      if (showSOBP) {
        const peaks = [peakDepth, peakDepth - 1, peakDepth - 2, peakDepth - 3, peakDepth - 4];
        peaks.forEach(p => {
          if (p < 0) return;
          const g = 100 * Math.exp(-Math.pow(x - p, 2) / (2 * Math.pow(peakWidth * 2, 2)));
          if (x < p + 0.5) {
             sobpDose = Math.max(sobpDose, g);
          }
        });
        sobpDose = sobpDose < 10 && x < peakDepth ? 30 : sobpDose;
      }

      data.push({
        depth: x,
        photon: parseFloat(photonDose.toFixed(1)),
        proton: showSOBP ? parseFloat(sobpDose.toFixed(1)) : parseFloat(finalProtonDose.toFixed(1))
      });
    }
    return data;
  }, [protonEnergy, showSOBP]);

  const handleQuizAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    // FIX: Using defined QUIZ_QUESTIONS array
    if (idx === QUIZ_QUESTIONS[quizIndex].correctIndex) {
      setQuizScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setShowFeedback(false);
    setSelectedOption(null);
    setQuizFinished(false);
  };

  return (
    <div className="relative min-h-screen">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-8 pt-6">
          <div className="bg-amber-600 text-white p-2.5 rounded-xl shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Radiation Units Reference</h1>
            <p className="text-sm text-slate-500 font-medium">Radiological Physics & Standards</p>
          </div>
        </div>

        {/* Clinical Pearls Banner */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 mb-8">
          <div className="bg-amber-600 text-white p-2 rounded-xl shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p 
              key={pearlIdx}
              className="text-xs font-bold text-amber-900 leading-tight animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {CLINICAL_PEARLS[pearlIdx]}
            </p>
          </div>
        </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
        {(['convert', 'defs', 'formulas', 'physics', 'quiz'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-2.5 text-xs font-bold rounded-xl transition-all capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-white shadow-sm text-amber-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'defs' ? 'Glossary' : tab === 'physics' ? 'Beam Physics' : tab === 'convert' ? 'Converter' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'formulas' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormulaCalculator 
              title="Absorbed Dose (D)"
              formula="D = dE / dm"
              desc="Concentration of energy deposited in matter."
              inputs={[
                { label: 'Energy', key: 'e', placeholder: 'Joules', unit: 'J', defaultValue: '10' },
                { label: 'Mass', key: 'm', placeholder: 'Kg', unit: 'Kg', defaultValue: '5' }
              ]}
              compute={(v) => v.m !== 0 ? `${(v.e / v.m).toFixed(2)} Gy` : '0 Gy'}
            />
            <FormulaCalculator 
              title="Equivalent Dose (H)"
              formula="H = D × wR"
              desc="Adjusts for radiation biological impact based on particle type."
              inputs={[
                { label: 'Dose', key: 'd', placeholder: 'Gray', unit: 'Gy', defaultValue: '2' },
                { label: 'wR', key: 'wr', placeholder: 'Weight', unit: 'wR', defaultValue: '1' }
              ]}
              compute={(v) => `${(v.d * v.wr).toFixed(2)} Sv`}
            />
            <FormulaCalculator 
              title="Inverse Square Law"
              formula="I2 = I1 × (d1 / d2)²"
              desc="Intensity variation with distance from a point source."
              inputs={[
                { label: 'Init. I', key: 'i1', placeholder: 'Rate', unit: 'R/h', defaultValue: '100' },
                { label: 'Dist. 1', key: 'd1', placeholder: 'm', unit: 'm', defaultValue: '1' },
                { label: 'Dist. 2', key: 'd2', placeholder: 'm', unit: 'm', defaultValue: '2' }
              ]}
              compute={(v) => v.d2 !== 0 ? `${(v.i1 * Math.pow(v.d1 / v.d2, 2)).toFixed(2)} R/h` : '0 R/h'}
            />
            <FormulaCalculator 
              title="Effective Half-Life"
              formula="1/Te = 1/Tp + 1/Tb"
              desc="Combined physical and biological clearance for radiopharmaceuticals."
              inputs={[
                { label: 'Phys T', key: 'tp', placeholder: 'Days', unit: 'd', defaultValue: '8' },
                { label: 'Bio T', key: 'tb', placeholder: 'Days', unit: 'd', defaultValue: '2' }
              ]}
              compute={(v) => (v.tp + v.tb) !== 0 ? `${((v.tp * v.tb) / (v.tp + v.tb)).toFixed(2)} d` : '0 d'}
            />
            <FormulaCalculator 
              title="Percentage Depth Dose"
              formula="PDD = (Dd / Dmax) × 100"
              desc="Dose at depth relative to dose at depth of maximum."
              inputs={[
                { label: 'D_depth', key: 'dd', placeholder: 'cGy', unit: 'cGy', defaultValue: '75' },
                { label: 'D_max', key: 'dm', placeholder: 'cGy', unit: 'cGy', defaultValue: '100' }
              ]}
              compute={(v) => v.dm !== 0 ? `${((v.dd / v.dm) * 100).toFixed(1)}%` : '0%'}
            />
            <FormulaCalculator 
              title="Exposure Rate (Ẋ)"
              formula="Ẋ = (Γ × A) / d²"
              desc="Calculates dose rate from a point radioactive source."
              inputs={[
                { label: 'Γ Const', key: 'g', placeholder: 'Const', unit: 'R-m²', defaultValue: '1.3' },
                { label: 'Activity', key: 'a', placeholder: 'Ci', unit: 'Ci', defaultValue: '10' },
                { label: 'Distance', key: 'd', placeholder: 'm', unit: 'm', defaultValue: '1' }
              ]}
              compute={(v) => v.d !== 0 ? `${((v.g * v.a) / Math.pow(v.d, 2)).toFixed(2)} R/h` : '0 R/h'}
            />
          </div>
        </div>
      )}

      {activeTab === 'convert' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Parameters</h3>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Magnitude</label>
                  <input 
                    type="number" 
                    value={convValue} 
                    onChange={(e) => setConvValue(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition text-lg font-bold text-slate-700"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">From</label>
                    <select 
                      value={fromUnit} 
                      onChange={(e) => setFromUnit(e.target.value)}
                      className="w-full px-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                    >
                      {CONVERSION_GROUPS.map(group => (
                        <optgroup key={group.id} label={group.name}>
                          {group.units.map(u => <option key={u} value={u}>{u}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">To</label>
                    <select 
                      value={toUnit} 
                      onChange={(e) => setToUnit(e.target.value)}
                      className="w-full px-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                    >
                      {CONVERSION_GROUPS.map(group => (
                        <optgroup key={group.id} label={group.name}>
                          {group.units.map(u => <option key={u} value={u}>{u}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="bg-amber-600 rounded-2xl p-6 text-white text-center shadow-lg transition-all hover:scale-[1.02]">
                  <p className="text-[10px] font-bold uppercase opacity-75 mb-1 tracking-widest">Result</p>
                  <p className="text-4xl font-black">{conversionResult < 0.0001 ? conversionResult.toExponential(4) : Number(conversionResult).toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">{toUnit}</p>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Magnitude Visualization</h3>
                </div>
                <div className="h-64 w-full bg-slate-50 rounded-3xl p-4 border border-slate-100 relative shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartDataConvert} 
                      layout="vertical" 
                      margin={{ left: 5, right: 60, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" scale="log" domain={[1e-12, 'auto']} hide />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={60} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="magnitude" radius={[0, 8, 8, 0]} barSize={40}>
                        {chartDataConvert.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'physics' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Proton vs. Photon Depth Dose</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                  Compare the physical dose deposition of conventional X-rays (Photons) with Particle Therapy (Protons). Observe the <strong>Bragg Peak</strong> advantage where dose is dumped at a specific depth with zero dose beyond.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Proton Energy (MeV)</label>
                    <input type="range" min="70" max="200" step="5" value={protonEnergy} onChange={(e) => setProtonEnergy(parseInt(e.target.value))} className="w-full accent-amber-600" />
                  </div>
                  <button onClick={() => setShowSOBP(!showSOBP)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showSOBP ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {showSOBP ? 'Hide SOBP' : 'Show SOBP'}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-80 w-full relative mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={physicsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="depth" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="photon" name="6MV Photon" stroke="#94a3b8" strokeWidth={2} fillOpacity={0.1} fill="#94a3b8" />
                  <Area type="monotone" dataKey="proton" name={showSOBP ? "Proton SOBP" : "Proton Bragg Peak"} stroke="#d97706" strokeWidth={3} fillOpacity={0.2} fill="#d97706" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Radiobiology Deep Dive */}
            <div className="border-t border-slate-100 pt-12">
              <div className="flex items-center space-x-3 mb-6">
                <Activity className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Radiobiology Deep Dive</h3>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-xl mb-8 w-fit">
                {[
                  { id: 'lq', label: 'LQ Model Curves' },
                  { id: 'survival', label: 'Cell Survival' },
                  { id: 'effects', label: 'Fractionation Effects' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setRadiobioTab(t.id as 'lq' | 'survival' | 'effects')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      radiobioTab === t.id ? 'bg-white shadow-sm text-amber-700' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {radiobioTab === 'lq' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cell Survival Curves (Log Scale)</h4>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-amber-600" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">α/β=10</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">α/β=3</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={generateLQSurvivalData(lqDosePerFx)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="dose" fontSize={10} tickLine={false} label={{ value: 'Dose (Gy)', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis 
                              scale="log" 
                              domain={[0.00001, 1]} 
                              fontSize={10} 
                              tickLine={false} 
                              label={{ value: 'Surviving Fraction', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }}
                            />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="highAB" name="α/β=10 (Tumor)" stroke="#d97706" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="lowAB" name="α/β=3 (Late)" stroke="#94a3b8" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="highLET" name="High LET (Linear)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dose per Fraction (Gy)</label>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="24" 
                          step="0.5" 
                          value={lqDosePerFx} 
                          onChange={(e) => setLqDosePerFx(parseFloat(e.target.value))} 
                          className="w-full accent-amber-600 mb-4" 
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-black text-slate-900">{lqDosePerFx} <span className="text-xs text-slate-400">Gy</span></span>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase">SF at this dose</p>
                            <p className="text-sm font-bold text-amber-600">{(Math.exp(-(0.35 * lqDosePerFx + 0.035 * lqDosePerFx * lqDosePerFx)) * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                        <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Clinical Insight</h5>
                        <p className="text-xs text-amber-900 leading-relaxed">
                          Notice how the <strong>α/β=3</strong> curve (late-responding tissue) is more "curved" than the <strong>α/β=10</strong> curve. This curvature represents the tissue's sensitivity to fraction size.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {radiobioTab === 'survival' && (
                <div className="grid md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cell Survival Calculator (SF)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Alpha (α)</label>
                        <input type="number" value={cellSurvAlpha} onChange={(e) => setCellSurvAlpha(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-amber-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Beta (β)</label>
                        <input type="number" value={cellSurvBeta} onChange={(e) => setCellSurvBeta(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-amber-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Dose (Gy)</label>
                      <input type="number" value={cellSurvDose} onChange={(e) => setCellSurvDose(parseFloat(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500">Surviving Fraction (SF)</span>
                        <span className="text-lg font-black text-amber-600">{(Math.exp(-(cellSurvAlpha * cellSurvDose + cellSurvBeta * cellSurvDose * cellSurvDose))).toExponential(3)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Log Kill</span>
                        <span className="text-lg font-black text-slate-900">{( -Math.log10(Math.exp(-(cellSurvAlpha * cellSurvDose + cellSurvBeta * cellSurvDose * cellSurvDose))) ).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">10-Log Kill Analysis</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      To achieve a "curative" effect, we typically aim for a 10-log reduction in tumor cells (e.g., from 10⁹ to 10⁻¹ cells).
                    </p>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fractions for 10-Log Kill</p>
                      <p className="text-3xl font-black text-amber-400">
                        {Math.ceil(10 / (-Math.log10(Math.exp(-(cellSurvAlpha * cellSurvDose + cellSurvBeta * cellSurvDose * cellSurvDose)))))}
                        <span className="text-xs ml-2 text-white/60 uppercase">Fractions</span>
                      </p>
                    </div>
                    <p className="text-[10px] italic text-slate-400">
                      Formula: SF = e^(-αD - βD²) | Log₁₀ Kill = -log₁₀(SF)
                    </p>
                  </div>
                </div>
              )}

              {radiobioTab === 'effects' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FIVE_RS.map((r, i) => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-amber-200 transition-all group">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black text-xs group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            {r.name[0]}
                          </div>
                          <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm">{r.name}</h5>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'defs' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative mb-6">
            <input type="text" placeholder="Filter glossary..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none" />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="space-y-3">
            {UNIT_DEFINITIONS.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(def => (
              <div key={def.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                <button onClick={() => setExpandedDef(expandedDef === def.id ? null : def.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg min-w-[40px] text-center">{def.symbol}</span>
                    <span className="font-bold text-slate-800">{def.name}</span>
                  </div>
                </button>
                {expandedDef === def.id && (
                  <div className="p-5 pt-0 border-t border-slate-50 space-y-4 bg-slate-50/30">
                    <p className="text-sm text-slate-600 mt-4">{def.description}</p>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 font-mono text-xs font-bold text-slate-700 shadow-inner">{def.formula}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="animate-in zoom-in-95 duration-300">
          {!quizFinished ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {quizIndex + 1} / {QUIZ_QUESTIONS.length}</span>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Score: {quizScore}</span>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 mb-8 leading-tight">{QUIZ_QUESTIONS[quizIndex].question}</h2>
              
              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={showFeedback}
                    onClick={() => handleQuizAnswer(i)}
                    className={`w-full p-5 text-left rounded-2xl border transition-all font-bold text-sm ${
                      showFeedback 
                        ? i === QUIZ_QUESTIONS[quizIndex].correctIndex 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                          : i === selectedOption ? 'bg-red-50 border-red-500 text-red-800' : 'bg-slate-50 border-slate-100 text-slate-400'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="opacity-40">{String.fromCharCode(65 + i)}.</span>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      <span className="font-black uppercase tracking-widest block mb-1 text-slate-400">Contextual Fact</span>
                      {QUIZ_QUESTIONS[quizIndex].explanation}
                    </p>
                  </div>
                  <button 
                    onClick={nextQuestion}
                    className="w-full mt-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg"
                  >
                    {quizIndex === QUIZ_QUESTIONS.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center max-w-xl mx-auto">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
              <p className="text-slate-500 mb-8 font-medium">Units Mastery: {quizScore} out of {QUIZ_QUESTIONS.length}</p>
              
              <div className="grid gap-4">
                <button 
                  onClick={resetQuiz}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-lg"
                >
                  Restart Quiz
                </button>
                <button 
                  onClick={() => setActiveTab('convert')}
                  className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition"
                >
                  Return to Converter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default RadiationUnitsPage;
