/**
 * OERLETRBEPage.tsx — Professional Radiobiology Tool
 * OER · LET · RBE — Integrated Clinical & Physics Reference
 *
 * Sources:
 *  - ICRU Report 40 (1989): Radiobiological Basis for RBE
 *  - ICRU Report 78 (2007): Proton Therapy  
 *  - ICRU Report 16 (1970): LET definitions
 *  - IAEA TRS-461: Relative Biological Effectiveness
 *  - Hall & Giaccia: Radiobiology for the Radiologist (8th ed.)
 *  - Paganetti H: Relative biological effectiveness (2014) Phys Med Biol
 *  - Wenzl & Wilkens: Modelling of RBE for carbon ions (2011)
 *  - Zeman EM: The Biological Basis of RBE
 *  - NCRP Report 104: The Relative Biological Effectiveness of Radiations
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import {
  Activity, Zap, Shield, BookOpen, ChevronDown, ChevronUp,
  Info, AlertTriangle, RefreshCw, BarChart2, GraduationCap,
  ChevronRight, CheckCircle, XCircle, Save
} from 'lucide-react';
import { useRxContext } from '@/src/context/RadiobiologyContext';

// ─── Types ────────────────────────────────────────────────────────────────

type TabType = 'Calculator' | 'LET' | 'OER' | 'RBE' | 'Particles' | 'Quiz';

interface ParticleBeam {
  id: string;
  name: string;
  symbol: string;
  let_range: [number, number];     // keV/µm, typical clinical LET range
  let_peak: number;                 // keV/µm at Bragg peak
  rbe_range: [number, number];
  rbe_clinical: number;             // clinically used RBE
  oer_range: [number, number];
  oer_at_let: number;               // typical OER at clinical LET
  charge: number;                   // atomic number Z
  mass_amu: number;
  bragg_peak: boolean;
  clinical_use: string;
  advantages: string[];
  disadvantages: string[];
  indications: string[];
  color: string;
  textColor: string;
  borderColor: string;
}

interface TissueOER {
  tissue: string;
  pO2_mmHg: number;
  oer: number;
  context: string;
}

interface LETEffect {
  let_kev_um: number;
  label: string;
  rbe_approx: number;
  oer_approx: number;
  example: string;
  dna_dsb_relative: number; // relative to 60Co = 1.0
}

interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
  explanation: string;
  pearl: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  source: string;
}

// ─── Data: Particle Beams ─────────────────────────────────────────────────

const PARTICLES: ParticleBeam[] = [
  {
    id: 'photon',
    name: 'Photon (X-ray/γ)',
    symbol: 'γ/X',
    let_range: [0.2, 2],
    let_peak: 0.3,
    rbe_range: [1.0, 1.0],
    rbe_clinical: 1.0,
    oer_range: [2.5, 3.0],
    oer_at_let: 2.8,
    charge: 0,
    mass_amu: 0,
    bragg_peak: false,
    clinical_use: 'Reference standard — all conventional RT, IMRT, VMAT, SBRT, SRS',
    advantages: [
      'Gold standard — all QUANTEC/ICRU constraints referenced to photons',
      'Excellent dose conformality with IMRT/VMAT',
      'Wide availability; established clinical evidence base',
      'No uncertain RBE — consistent radiobiology',
    ],
    disadvantages: [
      'High OER (2.8): hypoxic tumours 2.8× more resistant',
      'No Bragg peak: entrance + exit dose deposited',
      'Low LET limits DNA damage clustering',
    ],
    indications: ['All solid tumours', 'Standard fractionation', 'SBRT/SABR', 'Radiosurgery (SRS/SRT)'],
    color: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
  },
  {
    id: 'electron',
    name: 'Electron',
    symbol: 'e⁻',
    let_range: [0.2, 4],
    let_peak: 0.3,
    rbe_range: [0.85, 1.0],
    rbe_clinical: 1.0,
    oer_range: [2.5, 3.0],
    oer_at_let: 2.8,
    charge: -1,
    mass_amu: 0.000549,
    bragg_peak: false,
    clinical_use: 'Superficial tumours, post-mastectomy chest wall, intraoperative RT (IORT)',
    advantages: [
      'Sharp depth-dose falloff at ~R₈₀ — spares deep tissues',
      'RBE ≈ 1.0 — same radiobiology as photons',
      'IORT: single high dose to tumour bed',
    ],
    disadvantages: [
      'Limited penetration (<6 cm clinical); depth limited to ~one-third of R₈₀',
      'High OER: same hypoxia resistance as photons',
      'Scattering at field edges reduces dose conformality',
    ],
    indications: ['Skin/scalp tumours', 'Post-mastectomy CW boost', 'IORT (breast, rectal)', 'Nodal boost'],
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  {
    id: 'proton',
    name: 'Proton',
    symbol: 'p⁺',
    let_range: [0.5, 80],
    let_peak: 70,
    rbe_range: [1.0, 1.2],
    rbe_clinical: 1.1,
    oer_range: [1.4, 2.8],
    oer_at_let: 2.5,
    charge: 1,
    mass_amu: 1.0073,
    bragg_peak: true,
    clinical_use: 'Paediatric tumours, skull base, paraspinal, ocular melanoma, prostate (selected)',
    advantages: [
      'Bragg peak: sharp dose falloff distal to target — reduced integral dose by 50–60%',
      'RBE 1.1 vs photons — modest but real radiobiological advantage',
      'Critical for paediatric RT: reduces secondary malignancy risk',
      'Dose to normal tissue 30–60% lower than photons for same tumour dose',
    ],
    disadvantages: [
      'Clinical RBE fixed at 1.1: biologically uncertain, especially at distal edge',
      'RBE increases steeply at Bragg peak (LET 60–80 keV/µm) — may underestimate',
      'Range uncertainty ±2–3mm: distal edge adjacent to critical OARs is risky',
      'High cost: cyclotron/synchrotron + gantry ~$150M facility',
      'No cardiac pacemaker; no metallic implants in beam path',
    ],
    indications: [
      'Paediatric CNS/skull base tumours',
      'Chordoma/chondrosarcoma (skull base, sacrum)',
      'Ocular melanoma (uveal)',
      'Paraspinal tumours (cord adjacency)',
    ],
    color: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
  },
  {
    id: 'carbon',
    name: 'Carbon Ion',
    symbol: '¹²C',
    let_range: [10, 200],
    let_peak: 150,
    rbe_range: [2.0, 5.0],
    rbe_clinical: 3.0,
    oer_range: [1.0, 2.0],
    oer_at_let: 1.4,
    charge: 6,
    mass_amu: 11.9967,
    bragg_peak: true,
    clinical_use: 'Radioresistant tumours, previously irradiated, hypoxic tumours, selected sarcomas',
    advantages: [
      'High RBE (2–5×) overcomes tumour radioresistance (hypoxia, G2/M arrest)',
      'Low OER (≈1.4 at Bragg peak): 2× less sensitive to hypoxia than photons',
      'Sharp Bragg peak + lateral scattering 3× less than protons = superior conformality',
      'Direct DNA DSB clustering — difficult to repair, less cell-cycle dependent',
      'Overcomes p53-mutated, radiation-resistant tumours',
    ],
    disadvantages: [
      'RBE highly variable (2–5): depends on LET, cell type, dose/fx, oxygenation',
      'Complex treatment planning: requires LET-informed RBE models (MKM, LEM)',
      'Fragment tail: nuclear fragmentation deposits dose beyond Bragg peak',
      'Limited facilities worldwide (~15 clinical centres)',
      'Requires synchrotron — largest and costliest heavy ion facility',
    ],
    indications: [
      'Salivary gland carcinoma (ACC)',
      'Skull base chordoma (post-proton failure)',
      'Radioresistant sarcomas (leiomyosarcoma, osteosarcoma)',
      'Locally recurrent rectal cancer (re-irradiation)',
      'Hepatocellular carcinoma (HCC)',
    ],
    color: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  {
    id: 'neutron',
    name: 'Fast Neutron',
    symbol: 'n',
    let_range: [30, 100],
    let_peak: 70,
    rbe_range: [2.0, 8.0],
    rbe_clinical: 3.2,
    oer_range: [1.0, 1.6],
    oer_at_let: 1.3,
    charge: 0,
    mass_amu: 1.0087,
    bragg_peak: false,
    clinical_use: 'Mostly historical — salivary gland tumours; BNCT (thermal neutrons) for GBM/HNC',
    advantages: [
      'High RBE (3–8×) — effective against hypoxic, S-phase, p53-mutant tumours',
      'OER ≈ 1.3: nearly oxygen-independent cell kill',
      'BNCT (thermal): tumour-selective via ¹⁰B capture — emerging for GBM/recurrent HNC',
    ],
    disadvantages: [
      'No Bragg peak — significant normal tissue dose (like photons physically)',
      'High neutron RBE poorly defined — late effects difficult to predict',
      'Fast neutron therapy largely abandoned (late toxicity >> carbon ions)',
      'BNCT: requires ¹⁰B boronophenylalanine (BPA) delivery; research stage clinically',
    ],
    indications: [
      'BNCT: recurrent GBM, recurrent H&N cancer (investigational)',
      'Historical: inoperable salivary gland tumours',
      'Not recommended for routine use (replaced by carbon ions)',
    ],
    color: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  {
    id: 'alpha',
    name: 'Alpha Particle',
    symbol: 'α (⁴He)',
    let_range: [60, 200],
    let_peak: 150,
    rbe_range: [3.0, 10.0],
    rbe_clinical: 5.0,
    oer_range: [1.0, 1.3],
    oer_at_let: 1.1,
    charge: 2,
    mass_amu: 4.0026,
    bragg_peak: true,
    clinical_use: 'Targeted radionuclide therapy (¹²³I, ²²³Ra-dichloride); emerging TAT (¹⁷⁷Lu, ²¹²Pb)',
    advantages: [
      'Highest RBE of clinical particles (5–10×)',
      'OER ≈ 1.1: essentially oxygen-independent cell kill',
      'Very short range (~50–70 µm) = 2–3 cell diameters: minimal bystander dose',
      '²²³Ra (Xofigo): bone-seeking alpha emitter for mCRPC bone metastases (OS benefit)',
      'TAT (Targeted Alpha Therapy): precision intracellular DNA damage',
    ],
    disadvantages: [
      'External beam: range only ~3cm in air, <1mm in tissue — not usable externally',
      'Used only as radionuclides; biodistribution determines dose',
      'Recoil nuclei cause daughter nuclide redistribution (¹²³I decay chain issue)',
      'Dosimetry highly uncertain: microscopic dose heterogeneity',
    ],
    indications: [
      '²²³Ra-dichloride (Xofigo): mCRPC bone metastases',
      'TAT: PSMA-targeted ²¹²Pb, ²²⁵Ac for mCRPC',
      'TAT: GBM (locoregional — investigational)',
      'Future: haematological malignancies (CD33, CD20 targets)',
    ],
    color: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
  },
];

// ─── Data: LET-Effect relationship ───────────────────────────────────────

const LET_TABLE: LETEffect[] = [
  { let_kev_um: 0.3,  label: '⁶⁰Co γ',                 rbe_approx: 1.0, oer_approx: 2.8, example: 'Reference beam — all QUANTEC limits',       dna_dsb_relative: 1.0 },
  { let_kev_um: 2,    label: 'High-E photons (6–18 MV)', rbe_approx: 0.9, oer_approx: 2.8, example: 'Clinical linac beams',                      dna_dsb_relative: 0.95 },
  { let_kev_um: 10,   label: 'Low-E photons (kV CT)',    rbe_approx: 1.2, oer_approx: 2.5, example: 'Diagnostic kV; brachytherapy photons',       dna_dsb_relative: 1.3 },
  { let_kev_um: 20,   label: 'Fast neutrons (low)',       rbe_approx: 2.0, oer_approx: 2.0, example: 'Neutron capture therapy',                    dna_dsb_relative: 2.1 },
  { let_kev_um: 30,   label: 'Proton (plateau)',          rbe_approx: 1.1, oer_approx: 2.5, example: 'Entrance region of proton SOBP',             dna_dsb_relative: 1.2 },
  { let_kev_um: 80,   label: 'Proton Bragg peak',        rbe_approx: 1.7, oer_approx: 1.8, example: 'Distal Bragg peak; RBE clinically fixed at 1.1', dna_dsb_relative: 2.0 },
  { let_kev_um: 100,  label: '¹²C plateau',              rbe_approx: 2.5, oer_approx: 1.6, example: 'Carbon ion plateau region',                  dna_dsb_relative: 3.0 },
  { let_kev_um: 150,  label: '¹²C Bragg peak (optimal)', rbe_approx: 3.5, oer_approx: 1.3, example: 'RBE optimal ~100–200 keV/µm (Hall)',         dna_dsb_relative: 5.0 },
  { let_kev_um: 200,  label: 'α particle / ²²³Ra',       rbe_approx: 5.0, oer_approx: 1.1, example: 'Targeted alpha therapy ²²³Ra, ²¹²Pb',       dna_dsb_relative: 8.0 },
  { let_kev_um: 1000, label: 'Ultra-high LET (>200)',     rbe_approx: 2.0, oer_approx: 1.0, example: 'Overkill: RBE paradoxically falls (excess DSB)', dna_dsb_relative: 6.0 },
];

// ─── Data: OER by pO₂ ────────────────────────────────────────────────────

const OER_DATA: TissueOER[] = [
  { tissue: 'Anoxic (in vitro, N₂)',       pO2_mmHg: 0,   oer: 1.0, context: 'True anoxia — theoretical maximum resistance' },
  { tissue: 'Severe tumour hypoxia',        pO2_mmHg: 0.5, oer: 1.5, context: 'Perinecrotic tumour core; >10mm from capillary' },
  { tissue: 'Moderate tumour hypoxia',      pO2_mmHg: 2,   oer: 2.0, context: 'Common in HNSCC (40–60%), NSCLC; HP5 measured' },
  { tissue: 'Mild hypoxia (HP5 threshold)', pO2_mmHg: 5,   oer: 2.5, context: 'Eppendorf electrode HP5 threshold; prognostic cutoff' },
  { tissue: 'Normal tissue venous',         pO2_mmHg: 30,  oer: 2.8, context: 'Venous pO₂ = 40 mmHg; near-full radiosensitivity' },
  { tissue: 'Normal tissue arterial',       pO2_mmHg: 95,  oer: 2.9, context: 'Well-oxygenated normal tissue; OER ≈ maximal' },
  { tissue: 'Hyperoxic (100% O₂, HBO)',     pO2_mmHg: 760, oer: 3.0, context: 'Hyperbaric O₂ (HBO): no further gain beyond pO₂ 30–40mmHg' },
];

// ─── Data: Quiz ───────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    q: 'The Oxygen Enhancement Ratio (OER) for X-rays in well-oxygenated tissue is approximately:',
    opts: ['1.0', '1.5', '2.8', '5.0'],
    correct: 2,
    explanation: 'OER for low-LET photons (⁶⁰Co/X-rays) in well-oxygenated cells ≈ 2.5–3.0, classically cited as 2.8. This means a 2.8× higher dose is needed to achieve the same cell kill in fully anoxic vs fully oxygenated tissue.',
    pearl: 'OER is not tissue-specific for photons — it reflects the oxygen fixation hypothesis: O₂ fixes free radical damage to DNA by forming peroxyl radicals (R• + O₂ → ROO•), preventing DNA repair.',
    difficulty: 'basic',
    source: 'Hall & Giaccia Ch 6; ICRU 40',
  },
  {
    q: 'At which LET does RBE reach its MAXIMUM value before the "overkill" effect causes it to decrease?',
    opts: ['~10 keV/µm', '~30 keV/µm', '~100–200 keV/µm', '~1000 keV/µm'],
    correct: 2,
    explanation: 'RBE peaks at ~100–200 keV/µm (optimal LET). At this point, ionisation density exactly matches the diameter of the DNA double helix (~2 nm), maximising clustered DSB induction. Above this, the "overkill" effect occurs: excess energy deposited per cell, RBE falls.',
    pearl: 'The overkill paradox: ultra-high LET deposits more energy per cell than needed to kill it, effectively "wasting" ionisations. Surviving cells see relatively fewer effective hits.',
    difficulty: 'intermediate',
    source: 'Hall & Giaccia Ch 7; NCRP 104',
  },
  {
    q: 'The clinically applied RBE for proton therapy (ICRU 78) is:',
    opts: ['1.0 (same as photons)', '1.1 (generic fixed value)', '2.0–3.0 (variable)', '5.0 (high LET)'],
    correct: 1,
    explanation: 'ICRU 78 (2007) recommends a fixed clinical RBE of 1.1 for all proton beams in all tissues. This is a pragmatic consensus value. The actual RBE is biologically variable (1.0–1.4 in vitro, up to 1.7 at Bragg peak) but fixed at 1.1 to standardise prescription.',
    pearl: 'The most controversial aspect of proton therapy: the Bragg peak RBE may be 1.4–1.7 at LET 60–80 keV/µm. Prescribing at RBE=1.1 may underestimate biological dose to critical structures DISTAL to the target.',
    difficulty: 'intermediate',
    source: 'ICRU Report 78 (2007); Paganetti PMB 2014',
  },
  {
    q: 'Which radiation type achieves an OER closest to 1.0 (oxygen-independent cell kill)?',
    opts: ['6 MV X-rays', 'Protons (plateau)', 'Carbon ions at Bragg peak', 'Fast electrons'],
    correct: 2,
    explanation: 'Carbon ions at the Bragg peak (LET ≈150 keV/µm) have an OER ≈1.3–1.4, approaching 1.0. At very high LET, DNA damage is so dense (clustered DSBs) that oxygen fixation contributes minimally to lethality — the damage is already irreparable regardless of O₂ status.',
    pearl: 'High LET overcomes the two classical reasons for RT failure: (1) hypoxia resistance and (2) cell-cycle resistance (S-phase, G2/M). Carbon ions kill all phases equally and kill hypoxic cells nearly as efficiently as oxygenated ones.',
    difficulty: 'intermediate',
    source: 'Wenzl & Wilkens PMB 2011; IAEA TRS-461',
  },
  {
    q: 'What is the "oxygen fixation hypothesis" in radiation biology?',
    opts: [
      'Oxygen increases cell metabolism causing faster division',
      'O₂ reacts with DNA free radicals forming stable peroxyl compounds, preventing repair',
      'Oxygen reduces RBE by quenching radical reactions',
      'Oxygen fixation refers to the Bragg peak position in tissue',
    ],
    correct: 1,
    explanation: 'The oxygen fixation hypothesis (Howard-Flanders 1958): O₂ reacts with DNA-centred radicals (R•) to form peroxyl radicals (ROO•) — chemically stable, unable to be repaired by cellular reducing agents (glutathione, -SH groups). Without O₂, the radical can be "restored" by donation of a hydrogen atom from -SH groups.',
    pearl: 'Reaction: DNA-R• + O₂ → DNA-ROO• (irreparable). Without O₂: DNA-R• + RSH → DNA-RH (repaired). This is why hypoxic cells are resistant and why high LET (direct DSB) bypasses this mechanism.',
    difficulty: 'advanced',
    source: 'Howard-Flanders 1958; Hall & Giaccia Ch 6',
  },
  {
    q: 'The pO₂ threshold below which tumour cells are considered clinically hypoxic (HP5) is:',
    opts: ['0.5 mmHg', '2 mmHg', '5 mmHg', '20 mmHg'],
    correct: 2,
    explanation: 'HP5 (hypoxic fraction at 5 mmHg) is the clinically validated threshold from Eppendorf polarographic electrode studies (Vaupel, Höckel). Tumours with >20% of points <5 mmHg have significantly worse local control and survival (HNSCC, cervix, sarcoma data).',
    pearl: 'Normal tissue venous pO₂ ≈40 mmHg; arterial ≈95 mmHg. Tumour pO₂ median ≈10–30 mmHg (heterogeneous). The OER at 5 mmHg ≈ 2.5 — still substantially resistant. Only near-complete anoxia (<0.5 mmHg) gives OER ≈1.5–2.0.',
    difficulty: 'advanced',
    source: 'Vaupel & Harrison 2004; Höckel & Vaupel 2001',
  },
  {
    q: 'Relative to photons, the main physical advantage of carbon ions over protons in treatment planning is:',
    opts: [
      'Longer range in tissue',
      'Three times less lateral scattering',
      'No Bragg peak (uniform depth dose)',
      'Lower LET at Bragg peak',
    ],
    correct: 1,
    explanation: 'Carbon ions (Z=6, A=12) scatter approximately 3× less laterally than protons (Z=1, A=1) due to their higher mass (lateral scattering ∝ 1/√A·Z). This gives sharper penumbra and superior conformality, especially for irregularly shaped targets adjacent to critical OARs.',
    pearl: 'The combination of: (1) sharp Bragg peak, (2) minimal lateral scatter, (3) high RBE, and (4) low OER makes carbon the theoretically ideal particle — but biological complexity (variable RBE) and cost are major barriers.',
    difficulty: 'advanced',
    source: 'Tsujii & Kamada 2012; PTCOG data',
  },
  {
    q: 'BNCT (Boron Neutron Capture Therapy) relies on which nuclear reaction?',
    opts: [
      '¹H + n → ²H + γ (proton capture)',
      '¹⁰B + thermal neutron → ⁷Li + ⁴He (alpha) + 2.3 MeV',
      '¹²C + fast neutron → ¹²C* + γ (inelastic)',
      '¹⁰⁶Pd + n → ¹⁰⁷Pd + γ (activation)',
    ],
    correct: 1,
    explanation: '¹⁰B captures a thermal neutron and undergoes fission: ¹⁰B + n → [¹¹B*] → ⁷Li + ⁴He (alpha) + 2.31 MeV. The alpha particle and Li nucleus have a combined range of ~10 µm — approximately one cell diameter — making this highly tumour-specific if ¹⁰B is selectively delivered intracellularly.',
    pearl: 'BPA (boronophenylalanine) is taken up by tumour cells via amino acid transporters (LAT1/LAT2) — same pathway as L-DOPA. ¹⁰B concentration must be ≥20 µg/g tissue with tumour:normal ratio >3:1 for clinical benefit.',
    difficulty: 'advanced',
    source: 'Barth et al. 2018 Cancer Commun; IAEA-TECDOC-1223',
  },
  {
    q: 'LET is formally defined as:',
    opts: [
      'The ionisation density per unit volume (ions/cm³)',
      'The energy transferred per unit length of track (keV/µm)',
      'The ratio of dose in high-LET to low-LET radiation',
      'The mean path length between ionisation events',
    ],
    correct: 1,
    explanation: 'LET (Linear Energy Transfer) = -dE/dl = energy deposited (keV) per unit path length (µm) of the charged particle. ICRU Report 16 (1970) defines restricted LET (Lₐ) where energy transfers above threshold Δ are excluded, and unrestricted LET (L∞) = total stopping power.',
    pearl: 'LET is not a fixed property of a particle type — it changes along the track. For protons, LET ≈0.3 keV/µm at 200 MeV (entrance) but rises to ~70 keV/µm at the Bragg peak (Bragg-Kleeman rule). This is why RBE varies along the track.',
    difficulty: 'basic',
    source: 'ICRU Report 16 (1970); ICRU Report 33',
  },
  {
    q: 'The "wasted radiation" effect in hypoxic tumours with photon therapy is best counteracted by:',
    opts: [
      'Increasing dose per fraction (hypofractionation)',
      'Using high-LET particles (carbon ions, fast neutrons)',
      'Prolonging overall treatment time',
      'Adding concurrent chemotherapy only',
    ],
    correct: 1,
    explanation: 'High-LET radiation (carbon, alpha) produces dense clustered DNA DSBs that are largely irreparable REGARDLESS of oxygen status (OER ≈ 1.0–1.4). This directly addresses the radiobiological basis of hypoxic radioresistance. Hypofractionation (option A) reduces repopulation but does not address hypoxia.',
    pearl: 'Concurrent cisplatin (option D) is a radiosensitiser but primarily acts as an electron affinic oxygen mimic — it only partially overcomes hypoxia. True hypoxia requires either high-LET radiation OR hypoxic cytotoxins (nimorazole, tirapazamine) OR physical pO₂ modulation (HBO, ARCON).',
    difficulty: 'intermediate',
    source: 'Hall & Giaccia Ch 16; IAEA TRS-461',
  },
  {
    q: 'In the LQ model, compared to an identical photon dose, what happens to the RBE when dose/fraction INCREASES at the same LET?',
    opts: [
      'RBE increases (high dose/fx = higher RBE)',
      'RBE decreases (high dose/fx = lower RBE)',
      'RBE remains constant regardless of dose/fx',
      'RBE first increases then decreases as dose/fx rises',
    ],
    correct: 1,
    explanation: 'In the LQ model, RBE decreases as dose per fraction increases. At very low doses, RBE approaches RBEmax (dominated by α ratio). At high doses, the β term dominates photon killing, so the high-LET advantage (which primarily affects α) becomes relatively smaller: RBE → RBEmin as d→∞.',
    pearl: 'Clinical implication: high-LET particles are most advantageous with small fraction sizes (low β component from photons). At very high SBRT doses, the photon β-killing is so large that RBE advantage of heavy ions is reduced. Standard fractionation (2 Gy/fx) is theoretically ideal for high-LET advantage.',
    difficulty: 'advanced',
    source: 'Paganetti PMB 2014; Joiner & van der Kogel Ch 4',
  },
  {
    q: 'The ²²³Ra-dichloride (Xofigo) alpha emitter targets bone metastases because:',
    opts: [
      'It is trapped in tumour cell lysosomes',
      'It mimics calcium and is incorporated into new bone matrix',
      'It binds to PSMA expressed on prostate cancer cells',
      'It chelates to EDTMP (bone-seeking bisphosphonate carrier)',
    ],
    correct: 1,
    explanation: '²²³Ra (Radium-223) is a calcium mimetic — it is incorporated into newly formed bone matrix (hydroxyapatite) in areas of active osteoblastic activity around bone metastases. It does NOT target PSMA (that is Lu-177-PSMA) and does NOT use a chelator.',
    pearl: '²²³Ra emits alpha particles with a range of ~<100 µm (<10 cell diameters) — this precise range spares bone marrow stem cells while delivering lethal dose to tumour cells in the periosteum. The ALSYMPCA trial (2013) showed OS benefit (14.9 vs 11.3 months) in mCRPC.',
    difficulty: 'intermediate',
    source: 'Parker et al. NEJM 2013 (ALSYMPCA); PDR Xofigo',
  },
];

// ─── RBE model helper ────────────────────────────────────────────────────

function getRBE(letKeVum: number, radiation: string = 'generic'): number {
  if (letKeVum <= 0) return 1.0;
  // Empirical model: RBE rises with LET, peaks ~150 keV/µm, then falls
  const peak_let = 150;
  const peak_rbe = radiation === 'carbon' ? 4.5 : radiation === 'neutron' ? 5.0 : 3.5;
  if (letKeVum <= peak_let) {
    return 1.0 + (peak_rbe - 1.0) * (letKeVum / peak_let) ** 0.6;
  } else {
    return peak_rbe * Math.exp(-0.3 * Math.log(letKeVum / peak_let));
  }
}

function getOER(letKeVum: number): number {
  if (letKeVum <= 0) return 3.0;
  const min_oer = 1.0, max_oer = 2.9;
  const k = 0.015;
  return min_oer + (max_oer - min_oer) * Math.exp(-k * letKeVum);
}

function getOERfromPO2(pO2: number): number {
  if (pO2 <= 0) return 1.0;
  const K = 3; // half-saturation pO₂ (mmHg)
  const OERmax = 3.0, OERmin = 1.0;
  return OERmin + (OERmax - OERmin) * pO2 / (pO2 + K);
}

// ─── Mini Bar component ──────────────────────────────────────────────────

const Bar: React.FC<{ value: number; max: number; color: string; label?: string }> = ({
  value, max, color, label
}) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-[9px] text-slate-400 w-20 flex-shrink-0 text-right">{label}</span>}
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
    <span className="text-[10px] font-mono font-bold text-slate-600 w-10 text-right">{value.toFixed(2)}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────

const OERLETRBEPage: React.FC = () => {
  const { logCalculation } = useRxContext();
  const [tab, setTab] = useState<TabType>('Calculator');
  const [selectedParticle, setSelectedParticle] = useState<string>('carbon');
  const [showQR, setShowQR] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "LET Values",
      emoji: "⚡",
      accent: "#38bdf8",
      bg: "rgba(56, 189, 232, 0.08)",
      border: "rgba(56, 189, 232, 0.4)",
      rows: [
        { k: "Co-60 / MV X-rays", v: "0.2 - 0.3 keV/µm", mono: true },
        { k: "250 kVp X-rays", v: "2.0 keV/µm", mono: true },
        { k: "Protons (SOBP)", v: "1 - 5 keV/µm", mono: true },
        { k: "Carbon Ions", v: "50 - 200 keV/µm", mono: true },
        { k: "Alpha Particles", v: "100 - 200 keV/µm", mono: true },
      ]
    },
    {
      title: "RBE Values",
      emoji: "🎯",
      accent: "#a78bfa",
      bg: "rgba(167, 139, 250, 0.08)",
      border: "rgba(167, 139, 250, 0.4)",
      rows: [
        { k: "Photons/Electrons", v: "1.0", mono: true },
        { k: "Protons", v: "1.1 (Clinical)", mono: true },
        { k: "Carbon Ions", v: "2.5 - 3.0", mono: true },
        { k: "Alpha Particles", v: "10 - 20", mono: true },
        { k: "Neutrons", v: "5 - 20", mono: true },
      ]
    },
    {
      title: "OER Values",
      emoji: "💨",
      accent: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.08)",
      border: "rgba(251, 191, 36, 0.4)",
      rows: [
        { k: "X-rays/Gamma", v: "2.5 - 3.0", mono: true },
        { k: "Protons", v: "2.0 - 2.5", mono: true },
        { k: "Neutrons", v: "1.6", mono: true },
        { k: "Alpha/Carbon", v: "1.0 - 1.2", mono: true },
      ]
    },
    {
      title: "Key Relationships",
      emoji: "🔗",
      accent: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.4)",
      rows: [
        { k: "Max RBE", v: "At LET ~100 keV/µm", mono: false },
        { k: "OER vs LET", v: "OER drops as LET rises", mono: false },
        { k: "OER = 1", v: "At LET > 200 keV/µm", mono: false },
      ]
    }
  ];
  

  // Calculator inputs
  const [letVal, setLetVal] = useState(() => localStorage.getItem('oer_let_letVal') || '150');
  const [pO2Val, setPO2Val] = useState(() => localStorage.getItem('oer_let_pO2Val') || '5');
  const [photonDose, setPhotonDose] = useState(() => localStorage.getItem('oer_let_photonDose') || '2.0');
  const [fractions, setFractions] = useState(() => localStorage.getItem('oer_let_fractions') || '25');
  const [particleType, setParticleType] = useState<'proton' | 'carbon' | 'neutron' | 'alpha'>(() => (localStorage.getItem('oer_let_particleType') as 'proton' | 'carbon' | 'neutron' | 'alpha') || 'carbon');
  const [showFormula, setShowFormula] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('oer_let_letVal', letVal);
    localStorage.setItem('oer_let_pO2Val', pO2Val);
    localStorage.setItem('oer_let_photonDose', photonDose);
    localStorage.setItem('oer_let_fractions', fractions);
    localStorage.setItem('oer_let_particleType', particleType);
  }, [letVal, pO2Val, photonDose, fractions, particleType]);

  // handleLogHistory moved below computed values

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);
  const [qDiff, setQDiff] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');

  // LET table expand
  const [expandedLET, setExpandedLET] = useState<number | null>(null);

  // ── Computed values ────────────────────────────────────────────────────
  const calcLET = useMemo(() => parseFloat(letVal) || 0, [letVal]);
  const calcPO2 = useMemo(() => parseFloat(pO2Val) || 0, [pO2Val]);
  const calcDose = useMemo(() => parseFloat(photonDose) || 2.0, [photonDose]);
  const calcFx = useMemo(() => parseInt(fractions) || 25, [fractions]);

  const calcRBE = useMemo(() => getRBE(calcLET, particleType), [calcLET, particleType]);
  const calcOER = useMemo(() => getOER(calcLET), [calcLET]);
  const calcOER_pO2 = useMemo(() => getOERfromPO2(calcPO2), [calcPO2]);

  const photonTotalDose = calcDose * calcFx;
  const particleBioDose = photonTotalDose * calcRBE;
  const hypoxiaResistanceFactor = calcOER_pO2;
  const requiredDoseForHypoxia = photonTotalDose * hypoxiaResistanceFactor;

  // Combined factor: dose needed to match normoxic photon kill in hypoxic tissue with given particle
  const combinedEfficacy = calcRBE / calcOER_pO2;
  const effectivePhotonEquiv = photonTotalDose * calcRBE;

  const handleLogHistory = useCallback(() => {
    if (!logCalculation) return;
    const summary = `OER/LET/RBE Calc: Particle=${particleType}, LET=${letVal} keV/µm, pO2=${pO2Val} mmHg, Total Photon Dose=${(parseFloat(photonDose) * parseInt(fractions)).toFixed(1)} Gy.`;
    logCalculation('OER/LET/RBE', summary, {
      particle: particleType,
      let: letVal,
      pO2: pO2Val,
      photonDose,
      fractions,
      rbe: calcRBE,
      oer: calcOER_pO2
    });
  }, [logCalculation, particleType, letVal, pO2Val, photonDose, fractions, calcRBE, calcOER_pO2]);

  // Quiz filter
  const filteredQ = QUIZ.filter(q => qDiff === 'all' || q.difficulty === qDiff);
  const curQ = filteredQ[qIdx];

  const DIFF_C: Record<string, string> = {
    basic: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

  const selParticle = PARTICLES.find(p => p.id === selectedParticle) ?? PARTICLES[2];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 fade-in pb-4 relative">

      {/* ── Quick Reference Sidebar ──────────────────────────── */}
      <KeyFactsSidebar 
        isOpen={showQR} 
        onClose={() => setShowQR(false)} 
        onOpen={() => setShowQR(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-[#1e3a5f] rounded-xl px-3 py-2.5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-sm font-extrabold tracking-tight">OER · LET · RBE</h1>
            <p className="text-[10px] text-blue-200/70">Particle Radiobiology — Clinical & Physics Reference</p>
            <p className="text-[9px] text-blue-200/40 mt-0.5">ICRU 16/40/78 · Hall & Giaccia · Paganetti · IAEA TRS-461</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1.5 text-[9px]">
              <span className="bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-bold">LET</span>
              <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">OER</span>
              <span className="bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-bold">RBE</span>
            </div>
            <p className="text-[9px] text-blue-200/40">6 beam types · 12 MCQs · Re-RT guide</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {(['Calculator', 'LET', 'OER', 'RBE', 'Particles', 'Quiz'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: Calculator
      ════════════════════════════════════════════════════════ */}
      {tab === 'Calculator' && (
        <div className="space-y-3">

          {/* Inputs */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-3 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Beam & Biological Parameters</p>

            {/* Particle selector */}
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block mb-1.5">Particle Type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['proton', 'carbon', 'neutron', 'alpha'] as const).map(p => (
                  <button key={p} onClick={() => setParticleType(p)}
                    className={`text-[9px] px-2.5 py-1 rounded-lg border font-bold uppercase tracking-tight transition ${
                      particleType === p
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                  >
                    {p === 'carbon' ? '¹²C' : p === 'alpha' ? 'Alpha' : p === 'proton' ? 'Proton' : 'Neutron'}
                  </button>
                ))}
              </div>
            </div>

            {/* LET slider + input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider">LET (keV/µm)</label>
                <span className="text-xs font-black font-mono text-blue-700">{letVal || '0'} keV/µm</span>
              </div>
              <input type="range" min="0.1" max="500" step="0.5"
                value={letVal}
                onChange={e => setLetVal(e.target.value)}
                className="w-full accent-blue-700 h-2 rounded-full" />
              <div className="flex justify-between text-[8px] text-slate-300 mt-0.5">
                <span>0.1 (γ)</span>
                <span>~80 (p Bragg)</span>
                <span>~150 (¹²C Bragg)</span>
                <span>500</span>
              </div>
              <input type="number" step="0.5" min="0.1" max="1000"
                value={letVal} onChange={e => setLetVal(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>

            {/* pO₂ slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Tissue pO₂ (mmHg)</label>
                <span className={`text-xs font-black font-mono ${
                  calcPO2 < 2 ? 'text-red-700' : calcPO2 < 10 ? 'text-amber-600' : 'text-emerald-700'
                }`}>{pO2Val || '0'} mmHg</span>
              </div>
              <input type="range" min="0" max="100" step="0.5"
                value={pO2Val}
                onChange={e => setPO2Val(e.target.value)}
                className="w-full accent-emerald-600 h-2 rounded-full" />
              <div className="flex justify-between text-[8px] text-slate-300 mt-0.5">
                <span>0 (anoxic)</span>
                <span>5 (HP5)</span>
                <span>40 (venous)</span>
                <span>95 (arterial)</span>
              </div>
              <input type="number" step="0.5" min="0" max="760"
                value={pO2Val} onChange={e => setPO2Val(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>

            {/* Dose inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block mb-1">Dose/Fx (Gy)</label>
                <input type="number" step="0.1" min="0.1" max="30"
                  value={photonDose} onChange={e => setPhotonDose(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider block mb-1">Fractions</label>
                <input type="number" step="1" min="1" max="100"
                  value={fractions} onChange={e => setFractions(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
            </div>
          </div>

          {/* Computed Results */}
          <div className="bg-[#1e3a5f] rounded-xl text-white px-3 py-3 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-200/50">Computed Radiobiology</p>

            {/* Main 3 values */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'LET', value: `${parseFloat(letVal).toFixed(1)}`, unit: 'keV/µm', color: 'text-blue-300', bg: 'bg-blue-900/30' },
                { label: 'RBE', value: calcRBE.toFixed(2), unit: '× photon', color: 'text-amber-300', bg: 'bg-amber-900/30' },
                { label: 'OER', value: calcOER.toFixed(2), unit: `@LET`, color: 'text-emerald-300', bg: 'bg-emerald-900/30' },
              ].map(({ label, value, unit, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl px-2 py-3`}>
                  <p className="text-[9px] text-blue-200/50 uppercase tracking-widest">{label}</p>
                  <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                  <p className="text-[9px] text-blue-200/50">{unit}</p>
                </div>
              ))}
            </div>

            {/* OER from pO₂ */}
            <div className="bg-slate-900/30 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-wider">OER at pO₂ = {calcPO2} mmHg</p>
                <span className={`text-lg font-black font-mono ${
                  calcOER_pO2 < 1.3 ? 'text-emerald-400' :
                  calcOER_pO2 < 2.0 ? 'text-amber-400' : 'text-red-400'
                }`}>{calcOER_pO2.toFixed(2)}</span>
              </div>
              <div className="text-[10px] space-y-1">
                <p className={`font-semibold ${
                  calcPO2 < 1 ? 'text-red-300' :
                  calcPO2 < 5 ? 'text-amber-300' :
                  calcPO2 < 15 ? 'text-yellow-300' : 'text-emerald-300'
                }`}>
                  {calcPO2 < 0.5 ? '⚫ Severe anoxia — maximum radiation resistance' :
                   calcPO2 < 2  ? '🔴 Perinecrotic hypoxia — clinically significant resistance' :
                   calcPO2 < 5  ? '🟡 Moderate hypoxia (HP5 zone) — RT failure risk ↑' :
                   calcPO2 < 15 ? '🟠 Mild hypoxia — some resistance persists' :
                   '🟢 Normoxic — standard radiosensitivity'}
                </p>
              </div>
            </div>

            {/* Dose calculations */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-blue-200/60">Physical dose (prescription):</span>
                <span className="font-black font-mono">{photonTotalDose.toFixed(1)} Gy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200/60">Biological equivalent dose (RBE applied):</span>
                <span className="font-black font-mono text-amber-300">{particleBioDose.toFixed(1)} Gy(RBE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200/60">Photon dose for same hypoxic cell kill:</span>
                <span className={`font-black font-mono ${
                  requiredDoseForHypoxia > photonTotalDose * 1.5 ? 'text-red-400' : 'text-amber-300'
                }`}>{requiredDoseForHypoxia.toFixed(1)} Gy</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1.5">
                <span className="text-blue-200/60 font-bold">Combined RBE/OER efficacy ratio:</span>
                <span className={`font-black font-mono text-lg ${
                  combinedEfficacy > 2 ? 'text-emerald-400' :
                  combinedEfficacy > 1.3 ? 'text-amber-400' : 'text-red-400'
                }`}>{combinedEfficacy.toFixed(2)}×</span>
              </div>
              <p className="text-[9px] text-blue-200/40 text-center">
                {combinedEfficacy > 2.5 ? 'Highly effective for hypoxic tumours — particle therapy advantage clear' :
                 combinedEfficacy > 1.5 ? 'Moderate advantage over standard photon RT' :
                 'Limited advantage over photons at this LET/pO₂ combination'}
              </p>
            </div>

            {/* Visual bars */}
            <div className="space-y-2 pt-1">
              <Bar value={calcRBE} max={10} color="bg-amber-400" label="RBE" />
              <Bar value={calcOER_pO2} max={3.5} color="bg-red-400" label="OER(pO₂)" />
              <Bar value={combinedEfficacy} max={8} color="bg-emerald-400" label="Efficacy" />
            </div>
          </div>

          {/* Log to History */}
          <button
            onClick={handleLogHistory}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="w-4 h-4" />
            Log Calculation to History
          </button>

          {/* Formula toggle */}
          <button onClick={() => setShowFormula(f => !f)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              Formulae & derivation
            </span>
            {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence initial={false}>
            {showFormula && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
              >
                <div className="bg-slate-900 rounded-xl px-3 py-3 font-mono text-[10px] text-slate-200 space-y-2">
                  <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-widest mb-2">Radiobiology Formulae</p>
                  <p><span className="text-blue-300">LET</span> = −dE/dl (keV/µm) — energy deposited per unit track length</p>
                  <p><span className="text-amber-300">RBE</span> = D_ref / D_test at iso-biological effect<br />
                    <span className="text-slate-500 text-[9px]">  where D_ref = photon dose (⁶⁰Co), D_test = particle dose</span></p>
                  <p><span className="text-emerald-300">OER</span> = D_anoxic / D_oxic at iso-biological effect<br />
                    <span className="text-slate-500 text-[9px]">  = measure of oxygen-mediated radiosensitisation</span></p>
                  <p><span className="text-violet-300">OER(pO₂)</span> = OERmin + (OERmax − OERmin) × pO₂ / (pO₂ + K)<br />
                    <span className="text-slate-500 text-[9px]">  K ≈ 3 mmHg (half-saturation); OERmax ≈ 3.0; OERmin ≈ 1.0</span></p>
                  <p><span className="text-rose-300">Bio dose</span> = Physical dose × RBE (Gy(RBE) for heavy ions)</p>
                  <p><span className="text-cyan-300">RBE_eff</span> ≈ (α_ion + β_ion × d) / (α_ref + β_ref × d)<br />
                    <span className="text-slate-500 text-[9px]">  LQ-based RBE — dose and tissue dependent</span></p>
                  <div className="border-t border-slate-700 mt-2 pt-2">
                    <p className="text-[9px] text-slate-500">Oxygen fixation: DNA-R• + O₂ → DNA-ROO• (stable, unrepaired)</p>
                    <p className="text-[9px] text-slate-500">Radioprotection: DNA-R• + RSH → DNA-RH (repaired by thiols)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LQ-RBE interpretation */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px]">
            <p className="font-black text-amber-800 mb-1">Clinical Interpretation</p>
            <p className="text-amber-900 leading-relaxed">
              At LET = <strong>{parseFloat(letVal).toFixed(0)} keV/µm</strong>,{' '}
              RBE ≈ <strong>{calcRBE.toFixed(2)}</strong> and OER ≈ <strong>{calcOER.toFixed(2)}</strong>.
              {calcRBE > 3 && ' This is high-LET territory — DNA damage is clustered, difficult to repair, and largely oxygen-independent.'}
              {calcRBE <= 1.2 && ' Low-LET: cell kill is repair-dependent; hypoxia significantly reduces effectiveness.'}
              {calcRBE > 1.2 && calcRBE <= 3 && ' Intermediate LET: radiobiological advantage over photons is significant.'}
              {' '}At pO₂ = <strong>{calcPO2} mmHg</strong>: OER = <strong>{calcOER_pO2.toFixed(2)}</strong>
              {calcPO2 < 5 ? ' — significant hypoxic resistance. High-LET particles strongly preferred.' : ' — near-normoxic conditions.'}
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: LET
      ════════════════════════════════════════════════════════ */}
      {tab === 'LET' && (
        <div className="space-y-3">
          {/* Definition */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Definition — ICRU Report 16 (1970)</p>
            <div className="bg-slate-900 rounded-lg px-3 py-2 font-mono text-[10px] text-slate-200 mb-2">
              <p><span className="text-blue-300">LET</span> = −dE/dl</p>
              <p className="text-slate-500">dE = energy lost (keV) · dl = path length (µm)</p>
              <p className="mt-1 text-amber-300">Restricted LET (Lₐ): excludes energy transfers &gt; Δ eV (δ-rays)</p>
              <p className="text-emerald-300">Unrestricted LET (L∞) = total electronic stopping power</p>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              LET is NOT a fixed property of a particle type — it changes continuously along the track.
              For protons: LET ≈ 0.3 keV/µm at 200 MeV (entrance plateau), rising to ~70 keV/µm at the Bragg peak.
              The Bethe-Bloch equation governs this: LET ∝ Z²/v² (charge squared / velocity squared).
            </p>
          </div>

          {/* LET classification */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">LET Classification with RBE and OER</p>
            </div>
            <div className="divide-y divide-slate-50">
              {LET_TABLE.map((row, i) => {
                const isExp = expandedLET === i;
                const letPct = Math.min((Math.log10(row.let_kev_um + 1) / Math.log10(1001)) * 100, 100);
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedLET(isExp ? null : i)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2"
                    >
                      {/* LET bar */}
                      <div className="w-12 flex-shrink-0">
                        <div className="h-4 bg-slate-100 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${
                              row.let_kev_um < 10 ? 'bg-blue-300' :
                              row.let_kev_um < 100 ? 'bg-amber-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${letPct}%` }}
                          />
                        </div>
                        <p className="text-[8px] text-center font-mono text-slate-400 mt-0.5">{row.let_kev_um}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{row.label}</p>
                        <p className="text-[9px] text-slate-400 truncate">{row.example}</p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0 text-right">
                        <div>
                          <p className="text-[8px] text-slate-400">RBE</p>
                          <p className="text-xs font-black font-mono text-amber-700">{row.rbe_approx.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-400">OER</p>
                          <p className="text-xs font-black font-mono text-emerald-700">{row.oer_approx.toFixed(1)}</p>
                        </div>
                      </div>
                      {isExp ? <ChevronUp className="w-3 h-3 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-center">
                                <p className="text-[9px] text-amber-600 font-black uppercase">Rel. DSB vs ⁶⁰Co</p>
                                <p className="text-lg font-black text-amber-800 font-mono">{row.dna_dsb_relative.toFixed(1)}×</p>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-2 text-center">
                                <p className="text-[9px] text-blue-600 font-black uppercase">LET Category</p>
                                <p className={`text-xs font-black mt-0.5 ${
                                  row.let_kev_um < 10 ? 'text-blue-700' :
                                  row.let_kev_um < 100 ? 'text-amber-700' : 'text-red-700'
                                }`}>
                                  {row.let_kev_um < 10 ? 'Low LET' : row.let_kev_um < 100 ? 'Medium LET' : 'High LET'}
                                </p>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed">{row.example}</p>
                            {row.let_kev_um > 100 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 text-[10px] text-red-700">
                                <span className="font-bold">High LET: </span>
                                Clustered DNA DSBs predominate. OAR tolerance constraints validated for photons DO NOT directly apply. Use particle-specific RBE models (MKM, LEM for ¹²C).
                              </div>
                            )}
                            {row.label.includes('overkill') && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 text-[10px] text-orange-700 font-semibold">
                                ⚠ Overkill effect: excessive ionisation density per cell reduces effective RBE. Surplus energy is wasted.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bethe-Bloch note */}
          <div className="bg-slate-900 rounded-xl px-3 py-3 font-mono text-[10px] text-slate-200">
            <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-widest mb-2">Bethe-Bloch: Why LET Varies</p>
            <p><span className="text-blue-300">LET ∝ Z² / v²</span></p>
            <p className="text-slate-400 mt-1">Z = particle charge · v = velocity</p>
            <p className="text-emerald-300 mt-1">→ As particle slows down approaching Bragg peak: v↓ → LET↑ → RBE↑ → OER↓</p>
            <p className="text-amber-300">→ Higher Z (carbon Z=6 vs proton Z=1): ~36× higher intrinsic LET at same velocity</p>
            <p className="text-slate-500 mt-1 font-sans">This explains why ¹²C has higher RBE and lower OER than protons even at the same depth.</p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: OER
      ════════════════════════════════════════════════════════ */}
      {tab === 'OER' && (
        <div className="space-y-3">
          {/* Definition */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">OER — Definition & Mechanism</p>
            <div className="bg-slate-900 rounded-lg px-3 py-2 font-mono text-[10px] text-slate-200 mb-2">
              <p><span className="text-emerald-300">OER</span> = D_hypoxic / D_oxic at iso-biological effect</p>
              <p className="text-slate-500 mt-0.5">e.g. OER = 3.0 → anoxic cells need 3× dose to die at same rate</p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-700">
              <p><span className="font-black">Oxygen fixation hypothesis</span> (Howard-Flanders 1958):</p>
              <p className="text-slate-500 leading-relaxed pl-2">
                Ionising radiation → DNA free radicals (R•).
                <br />With O₂: R• + O₂ → ROO• (peroxyl — chemically stable, unrepaired).
                <br />Without O₂: R• + RSH → RH (thiol donation restores DNA — repaired).
              </p>
            </div>
          </div>

          {/* OER vs pO₂ table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">OER vs pO₂ — Photons (ICRU 40)</p>
            </div>
            <div className="divide-y divide-slate-50">
              {OER_DATA.map((row, i) => {
                const oerFraction = (row.oer - 1.0) / 2.0; // 0 to 1 scale
                return (
                  <div key={i} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="w-16 flex-shrink-0 text-right">
                      <p className="text-xs font-black font-mono text-slate-700">{row.pO2_mmHg}</p>
                      <p className="text-[9px] text-slate-400">mmHg</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${oerFraction * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className={`h-full rounded-full ${
                              row.oer < 1.5 ? 'bg-emerald-500' :
                              row.oer < 2.0 ? 'bg-amber-500' :
                              row.oer < 2.5 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-black font-mono w-8 text-right ${
                          row.oer < 1.5 ? 'text-emerald-700' :
                          row.oer < 2.0 ? 'text-amber-700' :
                          row.oer < 2.5 ? 'text-orange-700' : 'text-red-700'
                        }`}>{row.oer.toFixed(1)}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-700">{row.tissue}</p>
                      <p className="text-[9px] text-slate-400 leading-tight">{row.context}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OER modification strategies */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Strategies to Overcome Hypoxic Radioresistance
            </p>
            {[
              {
                n: '1', type: 'Physical', strategy: 'High-LET Particles (¹²C, fast neutrons)',
                mechanism: 'Dense DNA damage independent of O₂ fixation. OER ≈ 1.0–1.4 at Bragg peak.',
                evidence: 'Clinical: ACC, chordoma, radioresistant sarcomas. Level 2B–3.',
                color: 'bg-red-50 border-red-200 text-red-800',
              },
              {
                n: '2', type: 'Chemical', strategy: 'Nimorazole / Metronidazole (electron affinic)',
                mechanism: 'Oxygen mimetic: accepts electrons from DNA radicals, "fixing" damage like O₂ would.',
                evidence: 'DAHANCA trials: nimorazole + RT in HNSCC → improved LC (Level 1B). Standard in Denmark.',
                color: 'bg-amber-50 border-amber-200 text-amber-800',
              },
              {
                n: '3', type: 'Physical', strategy: 'Hyperbaric Oxygen (HBO)',
                mechanism: 'pO₂ ↑ to 760 mmHg (100% O₂ at 3 atm) → OER maximised. Diffusion distance ↑.',
                evidence: 'Meta-analysis: significant LC benefit but logistically impractical. Historical only.',
                color: 'bg-blue-50 border-blue-200 text-blue-800',
              },
              {
                n: '4', type: 'Biological', strategy: 'ARCON (Accelerated RT + Carbogen + Nicotinamide)',
                mechanism: 'Carbogen (98% O₂ + 2% CO₂) reoxygenates chronic hypoxia; nicotinamide improves perfusion.',
                evidence: 'Dutch bladder ARCON trial: improved LC (Level 1B). Clinically complex.',
                color: 'bg-violet-50 border-violet-200 text-violet-800',
              },
              {
                n: '5', type: 'Hypoxic Cytotoxin', strategy: 'Tirapazamine (TPZ)',
                mechanism: 'Bioreductive prodrug: selectively toxic to hypoxic cells (cytotoxic free radical under low pO₂).',
                evidence: 'Phase III: no OS benefit added to cisplatin/RT in HNSCC (TROG 02.02). Development suspended.',
                color: 'bg-slate-50 border-slate-200 text-slate-700',
              },
              {
                n: '6', type: 'Imaging', strategy: 'FMISO/FAZA-PET Hypoxia Imaging → Dose Painting',
                mechanism: 'Identify hypoxic sub-volumes. Boost dose to hypoxic regions (dose painting by numbers).',
                evidence: 'Investigational; FMISO-PET validated. Dose painting RCTs ongoing. Level 3.',
                color: 'bg-teal-50 border-teal-200 text-teal-800',
              },
            ].map(item => (
              <div key={item.n} className={`flex gap-2 mb-2 border rounded-xl px-2.5 py-2 ${item.color}`}>
                <div className="w-4 h-4 rounded-full bg-white/60 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.n}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-[10px] font-black">{item.strategy}</p>
                    <span className="text-[8px] font-bold opacity-60 border border-current rounded px-1">{item.type}</span>
                  </div>
                  <p className="text-[9px] opacity-80 leading-relaxed">{item.mechanism}</p>
                  <p className="text-[9px] opacity-60 italic mt-0.5">{item.evidence}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tumour types and hypoxia prevalence */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hypoxia Prevalence by Tumour Site</p>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              {[
                { site: 'Head & Neck SCC',     hp5: '40–60%', outcome: 'Primary driver of RT failure', severity: 'high' },
                { site: 'Cervix',              hp5: '30–50%', outcome: 'HP5 ↑ → worse survival (Höckel 2001)', severity: 'high' },
                { site: 'GBM (Glioblastoma)', hp5: '60–80%', outcome: 'Perinecrotic hypoxia; drives temozolomide failure', severity: 'high' },
                { site: 'NSCLC',               hp5: '25–40%', outcome: 'Hypoxia correlates with EGFR status', severity: 'medium' },
                { site: 'Sarcoma',             hp5: '20–35%', outcome: 'Limb sarcomas: variable hypoxia', severity: 'medium' },
                { site: 'Prostate',            hp5: '5–15%',  outcome: 'Less clinically significant; low α/β dominant', severity: 'low' },
                { site: 'Breast',              hp5: '10–20%', outcome: 'TNBC subtype more hypoxic', severity: 'low' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px]">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    row.severity === 'high' ? 'bg-red-500' :
                    row.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <p className="font-bold text-slate-700 w-28 flex-shrink-0">{row.site}</p>
                  <p className="font-black font-mono text-slate-600 w-14 flex-shrink-0">{row.hp5}</p>
                  <p className="text-slate-400 leading-tight flex-1">{row.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: RBE
      ════════════════════════════════════════════════════════ */}
      {tab === 'RBE' && (
        <div className="space-y-3">

          {/* Definition */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">RBE — Definition (ICRU 40, 1989)</p>
            <div className="bg-slate-900 rounded-lg px-3 py-2 font-mono text-[10px] text-slate-200 mb-2">
              <p><span className="text-amber-300">RBE</span> = D_ref / D_test</p>
              <p className="text-slate-500 mt-0.5">at the SAME biological effect, endpoint, cell type, and dose/fraction</p>
              <p className="text-blue-300 mt-1">Reference: ⁶⁰Co γ-rays (0.3 keV/µm) → RBE = 1.0 by definition</p>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              RBE is NOT a fixed number for a particle type — it depends on: (1) LET along the track,
              (2) dose/fraction (higher d/fx → lower RBE), (3) biological endpoint, (4) cell line / tissue,
              (5) oxygenation status. This is why fixed RBE = 1.1 for protons is controversial.
            </p>
          </div>

          {/* RBE determinants */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Factors Determining RBE
            </p>
            {[
              {
                factor: 'LET',
                detail: 'Primary driver. RBE ↑ as LET ↑ (to ~100–200 keV/µm), then ↓ (overkill). See LET tab.',
                impact: 'High',
              },
              {
                factor: 'Dose/Fraction (d)',
                detail: 'RBE ↓ as d ↑. In LQ model: RBE = (α_ion + β_ion×d) / (α_ref + β_ref×d). At d→∞: RBE→RBEmin.',
                impact: 'High',
              },
              {
                factor: 'Biological Endpoint',
                detail: 'Cell death, chromosome aberration, mutation, tumorigenesis — all give different RBE values. Clinical RBE = cell death.',
                impact: 'Medium',
              },
              {
                factor: 'Cell/Tissue Type (α/β)',
                detail: 'Late-responding tissue (low α/β): higher RBE than early-responding tumours (high α/β) at same LET/d.',
                impact: 'Medium',
              },
              {
                factor: 'Oxygenation (pO₂)',
                detail: 'High LET particles: OER → 1.0 (RBE more effective in hypoxia). Low LET: OER ≈ 3.0.',
                impact: 'High (for hypoxic tumours)',
              },
              {
                factor: 'Position in Beam (Bragg peak vs plateau)',
                detail: 'RBE varies along track. For protons: 1.0 (entrance) → 1.4–1.7 (Bragg peak). Clinical RBE = 1.1 ignores this gradient.',
                impact: 'High',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 last:mb-0">
                <div className={`w-1.5 rounded-full flex-shrink-0 my-0.5 ${
                  item.impact === 'High' ? 'bg-red-400' :
                  item.impact.startsWith('High') ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div>
                  <p className="text-[11px] font-black text-slate-800">{item.factor}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
                  <p className={`text-[9px] font-bold mt-0.5 ${
                    item.impact === 'High' ? 'text-red-600' :
                    item.impact.startsWith('High') ? 'text-amber-600' : 'text-blue-600'
                  }`}>Impact: {item.impact}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RBE models */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
              RBE Models Used in Clinical Practice
            </p>
            {[
              {
                model: 'Fixed RBE = 1.1 (ICRU 78)',
                particles: 'Protons',
                description: 'Single generic value applied to all tissues, all positions in beam, all dose/fx. Clinically conservative — may underestimate RBE at Bragg peak by 30–50%.',
                status: 'Standard clinical practice worldwide',
                concern: 'Distal Bragg peak RBE uncertainty is the #1 clinical controversy in proton therapy.',
                color: 'bg-sky-50 border-sky-200',
              },
              {
                model: 'MKM (Microdosimetric-Kinetic Model)',
                particles: 'Carbon ions (NIRS/Japan)',
                description: 'Computes RBE from microdosimetry: mean specific energy in cell nucleus. Uses Poisson statistics of energy deposition in sub-cellular volumes. α/β derived for each voxel.',
                status: 'Clinical standard at NIRS (Chiba), HIT (Heidelberg) — MKM variant',
                concern: 'Requires detailed microdosimetry measurements; clinically complex.',
                color: 'bg-red-50 border-red-200',
              },
              {
                model: 'LEM (Local Effect Model)',
                particles: 'Carbon ions (GSI/Germany)',
                description: 'Computes local dose in nanometre-scale track structure. Predicts survival from local dose-response. Uses photon dose-response curve for the same cell type.',
                status: 'Clinical standard at HIT (Heidelberg), CNAO (Pavia), MedAustron',
                concern: 'MKM and LEM give different RBE values for same beam — ongoing harmonisation effort.',
                color: 'bg-violet-50 border-violet-200',
              },
              {
                model: 'Phenomenological RBE-LET model',
                particles: 'Research / fast neutrons',
                description: 'Empirical RBE = function of LET. Simple polynomial or sigmoidal fit to experimental data. Does not account for tissue α/β variation.',
                status: 'Historical; fast neutron therapy (now obsolete for most sites)',
                concern: 'Underestimates late tissue RBE (low α/β tissue especially sensitive to large fraction effects).',
                color: 'bg-orange-50 border-orange-200',
              },
            ].map((m, i) => (
              <div key={i} className={`border rounded-xl px-3 py-2.5 mb-2 last:mb-0 ${m.color}`}>
                <p className="text-xs font-black text-slate-800">{m.model}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Particles: {m.particles}</p>
                <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">{m.description}</p>
                <p className="text-[9px] italic text-slate-500 mt-0.5">{m.status}</p>
                {m.concern && (
                  <div className="flex gap-1.5 mt-1.5 bg-white/60 rounded-lg px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] text-amber-800">{m.concern}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* OAR RBE warning for protons */}
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black text-red-800 mb-1">
                  Proton Therapy: The RBE = 1.1 Clinical Controversy
                </p>
                <p className="text-[10px] text-red-700 leading-relaxed">
                  Published experimental data show RBE = 1.4–1.7 at the Bragg peak (LET 60–80 keV/µm).
                  By prescribing at RBE = 1.1, the biological dose to tissues at the distal edge is
                  underestimated by ~20–35%. This is the primary radiobiological concern for:
                  brainstem (chordoma), cervical cord (paraspinal), optic apparatus (skull base).
                  Institutions are beginning to use variable RBE models in treatment planning.
                </p>
                <p className="text-[9px] text-red-600 italic mt-1">
                  Reference: Paganetti PMB 2014; McNamara PMB 2015; Peeler MedPhys 2016
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Particles
      ════════════════════════════════════════════════════════ */}
      {tab === 'Particles' && (
        <div className="space-y-3">
          {/* Particle selector */}
          <div className="flex flex-wrap gap-1.5">
            {PARTICLES.map(p => (
              <button key={p.id} onClick={() => setSelectedParticle(p.id)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  selectedParticle === p.id
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {p.symbol} {p.id === 'photon' ? 'Photon' : p.id === 'electron' ? 'Electron' :
                  p.id === 'proton' ? 'Proton' : p.id === 'carbon' ? 'Carbon' :
                  p.id === 'neutron' ? 'Neutron' : 'Alpha'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedParticle}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {/* Main card */}
              <div className={`rounded-xl border ${selParticle.borderColor} ${selParticle.color} px-3 py-3`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black font-mono ${selParticle.textColor}`}>{selParticle.symbol}</span>
                      <h2 className="text-sm font-extrabold text-slate-900">{selParticle.name}</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{selParticle.clinical_use}</p>
                  </div>
                  {selParticle.bragg_peak && (
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                      BRAGG PEAK
                    </span>
                  )}
                </div>

                {/* Key numbers grid */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: 'LET (keV/µm)', val: `${selParticle.let_range[0]}–${selParticle.let_range[1]}`, peak: `Peak: ${selParticle.let_peak}`, color: 'text-blue-700' },
                    { label: 'RBE (range)', val: `${selParticle.rbe_range[0]}–${selParticle.rbe_range[1]}`, peak: `Clinical: ${selParticle.rbe_clinical}`, color: 'text-amber-700' },
                    { label: 'OER (range)', val: `${selParticle.oer_range[0]}–${selParticle.oer_range[1]}`, peak: `Typical: ${selParticle.oer_at_let}`, color: 'text-emerald-700' },
                  ].map(item => (
                    <div key={item.label} className="bg-white/70 rounded-lg px-2 py-2 text-center">
                      <p className="text-[8px] text-slate-400 uppercase font-bold">{item.label}</p>
                      <p className={`text-xs font-black font-mono mt-0.5 ${item.color}`}>{item.val}</p>
                      <p className="text-[8px] text-slate-400">{item.peak}</p>
                    </div>
                  ))}
                </div>

                {/* Charge / Mass */}
                {selParticle.charge !== 0 && (
                  <div className="flex gap-3 mt-2 text-[9px] text-slate-500">
                    <span>Z = {selParticle.charge}</span>
                    <span>A = {selParticle.mass_amu} amu</span>
                  </div>
                )}
              </div>

              {/* Advantages */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">Advantages</p>
                {selParticle.advantages.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                    <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-900 leading-snug">{a}</p>
                  </div>
                ))}
              </div>

              {/* Disadvantages */}
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-red-700 mb-1.5">Limitations</p>
                {selParticle.disadvantages.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                    <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-900 leading-snug">{d}</p>
                  </div>
                ))}
              </div>

              {/* Clinical Indications */}
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Clinical Indications</p>
                {selParticle.indications.map((ind, i) => (
                  <div key={i} className="flex gap-2 mb-1 last:mb-0">
                    <span className="text-blue-500 flex-shrink-0 text-xs">◆</span>
                    <p className="text-[11px] text-slate-700">{ind}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Comparison table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Comparative Summary — All Particles
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Particle', 'LET peak', 'RBE clinic', 'OER', 'Bragg', 'Used for'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-black text-slate-400 text-[9px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARTICLES.map((p, i) => (
                    <tr key={p.id} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'} ${selectedParticle === p.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedParticle(p.id)}>
                      <td className="px-2 py-1.5 font-bold text-slate-800">{p.symbol}</td>
                      <td className="px-2 py-1.5 font-mono text-blue-700">{p.let_peak}</td>
                      <td className="px-2 py-1.5 font-mono font-black text-amber-700">{p.rbe_clinical}</td>
                      <td className="px-2 py-1.5 font-mono text-emerald-700">{p.oer_at_let}</td>
                      <td className="px-2 py-1.5">{p.bragg_peak ? '✓' : '—'}</td>
                      <td className="px-2 py-1.5 text-slate-500 max-w-24 truncate">{p.indications[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Quiz
      ════════════════════════════════════════════════════════ */}
      {tab === 'Quiz' && (
        <div className="space-y-3">
          {/* Difficulty */}
          {!qDone && (
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'basic', 'intermediate', 'advanced'] as const).map(d => (
                <button key={d}
                  onClick={() => { setQDiff(d); setQIdx(0); setQScore(0); setQAnswered(null); }}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    qDiff === d ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {d === 'all' ? `All (${QUIZ.length})` : `${d} (${QUIZ.filter(q => q.difficulty === d).length})`}
                </button>
              ))}
            </div>
          )}

          {filteredQ.length === 0 ? (
            <p className="text-sm text-slate-500 italic px-1">No questions for this filter.</p>
          ) : qDone ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1e3a5f] rounded-xl text-white px-4 py-6 text-center space-y-3"
            >
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60">Quiz Complete</p>
              <p className="text-5xl font-black font-mono">
                {qScore}<span className="text-slate-500 text-2xl">/{filteredQ.length}</span>
              </p>
              <p className="text-sm text-blue-200">{Math.round(qScore / filteredQ.length * 100)}% correct</p>
              <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black ${
                qScore / filteredQ.length >= 0.75 ? 'bg-emerald-700' :
                qScore / filteredQ.length >= 0.5  ? 'bg-amber-700' : 'bg-red-700'
              }`}>
                {qScore / filteredQ.length >= 0.75 ? 'Excellent — Particle Radiobiology Mastered' :
                 qScore / filteredQ.length >= 0.5  ? 'Good — Review LET/RBE relationships' :
                 'Revisit OER mechanism and RBE determinants'}
              </div>
              <button onClick={() => { setQIdx(0); setQScore(0); setQDone(false); setQAnswered(null); }}
                className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition">
                Restart Quiz
              </button>
            </motion.div>
          ) : curQ ? (
            <div className="space-y-3">
              {/* Progress */}
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Q {qIdx + 1} / {filteredQ.length}</span>
                <span className="font-black text-blue-700">Score: {qScore}/{qIdx}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-blue-600 rounded-full"
                  animate={{ width: `${(qIdx / filteredQ.length) * 100}%` }} />
              </div>

              {/* Badge row */}
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${DIFF_C[curQ.difficulty]}`}>
                  {curQ.difficulty}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{curQ.source}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{curQ.q}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {curQ.opts.map((opt, i) => {
                  let style = 'bg-white border-slate-200 text-slate-700 hover:border-blue-300';
                  if (qAnswered !== null) {
                    if (i === curQ.correct)
                      style = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                    else if (i === qAnswered)
                      style = 'bg-red-50 border-red-300 text-red-700';
                    else
                      style = 'bg-white border-slate-100 text-slate-400';
                  }
                  return (
                    <button key={i} disabled={qAnswered !== null}
                      onClick={() => {
                        setQAnswered(i);
                        if (i === curQ.correct) setQScore(s => s + 1);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition ${style}`}
                    >
                      <span className="font-black mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {qAnswered !== null && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        {qAnswered === curQ.correct
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                          {qAnswered === curQ.correct ? 'Correct' : `Incorrect — Answer: ${String.fromCharCode(65 + curQ.correct)}`}
                        </p>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">{curQ.explanation}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-[10px] text-blue-800">
                      <span className="font-black text-blue-700">Pearl: </span>
                      {curQ.pearl}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {qAnswered !== null && (
                <button
                  onClick={() => {
                    setQAnswered(null);
                    if (qIdx + 1 >= filteredQ.length) setQDone(true);
                    else setQIdx(i => i + 1);
                  }}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition"
                >
                  {qIdx + 1 >= filteredQ.length ? 'See Final Score' : 'Next Question →'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ── Reference footer ─────────────────────────────────── */}
      <div className="text-[9px] text-slate-400 px-1 border-t border-slate-100 pt-3 mt-2 space-y-0.5">
        <p>ICRU 16 (1970) LET · ICRU 40 (1989) RBE · ICRU 78 (2007) Proton Therapy · NCRP 104</p>
        <p>Hall & Giaccia: Radiobiology for the Radiologist 8th ed. · Paganetti PMB 2014</p>
        <p>Wenzl & Wilkens PMB 2011 (¹²C RBE) · Vaupel & Harrison 2004 (tumour hypoxia)</p>
        <p>Darby NEJM 2013 · Parker NEJM 2013 (²²³Ra Xofigo) · DAHANCA nimorazole trials</p>
        <p className="text-[8px] text-slate-300">
          RBE and OER values are empirical approximations for educational and planning guidance.
          Clinical carbon ion RBE must be computed using institutional MKM or LEM model.
          Proton RBE fixed at 1.1 per ICRU 78 for prescription — actual biological RBE varies.
        </p>
      </div>
    </div>
  );
};

export default OERLETRBEPage;