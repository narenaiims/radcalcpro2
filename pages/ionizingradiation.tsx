import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import {
  Activity, Zap, Shield, BookOpen, ChevronDown, ChevronUp,
  Info, AlertTriangle, CheckCircle, XCircle, GraduationCap,
  ChevronRight, BarChart2, RefreshCw, Heart, Brain, Eye,
  Baby, Users, Dna
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'Overview' | 'Deterministic' | 'Stochastic' | 'Tissue' | 'Modifiers' | 'Special' | 'Quiz' | '5 Rs';

interface DeterministicEffect {
  id: string;
  organ: string;
  effect: string;
  thresholdDose: string;
  thresholdEQD2?: string;
  onset: string;
  severity: 'mild' | 'moderate' | 'severe' | 'lethal';
  mechanism: string;
  latency: string;
  notes: string;
  source: string;
  category: 'acute_whole_body' | 'skin' | 'gonads' | 'eye' | 'haemopoietic' | 'gi' | 'cns' | 'lung' | 'kidney';
}

interface StochasticEffect {
  id: string;
  effect: string;
  type: 'cancer' | 'hereditary';
  nominalnominalRisk: string;
  riskPerSv: string;
  latency: string;
  mechanism: string;
  population: string;
  evidence: string;
  icrpNominal?: string;
  notes: string;
  source: string;
}

interface TissueResponse {
  tissue: string;
  alphaBeta: number;
  type: 'early' | 'late';
  tdxx: { td5: number; td50: number };
  repair_t12: string;
  repopulation: string;
  redistribution: string;
  reoxygenation: string;
  notes: string;
}

interface RadiationModifier {
  id: string;
  name: string;
  category: 'sensitiser' | 'protector' | 'physical' | 'biological';
  mechanism: string;
  clinicalUse: string;
  doseModificationFactor?: string;
  evidence: string;
  notes: string;
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

// ─── Data: Deterministic Effects ─────────────────────────────────────────────

const DETERMINISTIC: DeterministicEffect[] = [
  // Acute Whole-Body (ARS)
  {
    id: 'ars_hematopoietic',
    organ: 'Bone Marrow (Haematopoietic)',
    effect: 'Haematopoietic ARS — pancytopaenia, infection, haemorrhage',
    thresholdDose: '0.5–1 Gy (whole body)',
    onset: '2–6 weeks post-exposure',
    severity: 'severe',
    mechanism: 'Pluripotent stem cell depletion → aplasia. Lymphocytes most sensitive (G₀ cells). Granulocyte nadir at 30 days.',
    latency: 'Prodrome 0–48 h; latency 1–3 wk; manifest illness 3–8 wk',
    notes: 'LD50/60 without treatment ≈ 3–4 Gy. With G-CSF + transfusion support ≈ 6–8 Gy. Lymphocyte count at 48 h best acute dosimetry tool (Biodosimetry).',
    source: 'ICRP 118; RERF Life Span Study; Waselenko et al. Ann Intern Med 2004',
    category: 'haemopoietic'
  },
  {
    id: 'ars_gi',
    organ: 'GI Tract',
    effect: 'GI ARS — severe diarrhoea, malabsorption, sepsis',
    thresholdDose: '6–10 Gy (whole body)',
    onset: 'Hours to days; death within 1–2 weeks',
    severity: 'lethal',
    mechanism: 'Crypt stem cell loss → villous denudation → loss of mucosal barrier → endotoxaemia + fluid loss.',
    latency: 'Prodrome <1 h; manifest 2–5 days',
    notes: 'Death typically 10–14 days from loss of GI barrier. No effective treatment — bone marrow transplant cannot rescue severe GI damage.',
    source: 'ICRP 118; UNSCEAR 2008',
    category: 'gi'
  },
  {
    id: 'ars_cns',
    organ: 'CNS / Cardiovascular',
    effect: 'CNS/CV ARS — cerebral oedema, circulatory collapse',
    thresholdDose: '>20–50 Gy (whole body)',
    onset: 'Minutes to hours; death within 24–72 h',
    severity: 'lethal',
    mechanism: 'Direct vascular damage, cerebral oedema, disruption of autonomic control. Neuronal membranes directly ionised.',
    latency: 'No true latency; immediate prodrome',
    notes: 'Invariably fatal. Seen in criticality accidents (e.g. Tokaimura). Treatment is palliative only.',
    source: 'ICRP 118; Oak Ridge criticality accidents',
    category: 'cns'
  },
  // Skin
  {
    id: 'skin_erythema',
    organ: 'Skin — Epidermis',
    effect: 'Early transient erythema (vascular flush)',
    thresholdDose: '2 Gy (single fraction)',
    onset: 'Hours, resolves 2–3 days',
    severity: 'mild',
    mechanism: 'Prostaglandin-mediated vasodilatation. NOT cell death dependent.',
    latency: '2–24 hours post-exposure',
    notes: 'Different mechanism from true radiation erythema. Aspirin can reduce this response.',
    source: 'ICRP 118; Hall & Giaccia',
    category: 'skin'
  },
  {
    id: 'skin_moist_desquamation',
    organ: 'Skin — Epidermis',
    effect: 'Moist desquamation (acute skin reaction Grade 3)',
    thresholdDose: '20–25 Gy (2 Gy/fx)',
    onset: 'During RT course (weeks 4–6)',
    severity: 'moderate',
    mechanism: 'Basal cell layer depletion → failure of epidermal regeneration → loss of barrier function.',
    latency: '3–4 weeks from start of RT',
    notes: 'V-shaped response to skin dose. Moist desquamation = Grade 3 CTCAE. Heals from skin appendages (sebaceous glands, hair follicles) outside the field.',
    source: 'CTCAE v5; Turesson & Thames 1989',
    category: 'skin'
  },
  {
    id: 'skin_necrosis',
    organ: 'Skin — Full thickness',
    effect: 'Skin necrosis / radionecrosis',
    thresholdDose: '>40–50 Gy (2 Gy/fx single field)',
    thresholdEQD2: 'EQD2₁₀ >50 Gy',
    onset: 'Months to years after RT',
    severity: 'severe',
    mechanism: 'Dermal fibroblast depletion + vascular damage → ischaemic necrosis. Late deterministic effect.',
    latency: '6 months – 5 years',
    notes: 'Chronic non-healing wound. Risk ↑ with concurrent chemotherapy, diabetes, smoking. Hyperbaric O₂ can help.',
    source: 'ICRP 118; Archambeau & Mathieu',
    category: 'skin'
  },
  // Eye
  {
    id: 'cataract',
    organ: 'Lens of Eye',
    effect: 'Radiation cataract (posterior subcapsular)',
    thresholdDose: '0.5 Gy (acute); 5 Gy (fractionated)',
    onset: 'Months to years',
    severity: 'moderate',
    mechanism: 'Lens epithelial cells (equatorial zone) most sensitive. Abnormal lens fibres migrate to posterior pole → PSC opacity.',
    latency: '6 months – 35 years (dose-dependent)',
    notes: 'ICRP 118 (2012) revised threshold DOWN from 2 Gy to 0.5 Gy (ICRP 103 value). α/β ≈ 1.2 Gy — extremely sensitive to dose/fraction. Surgically correctable.',
    source: 'ICRP 118 (2012); NCRP 130',
    category: 'eye'
  },
  {
    id: 'radiation_retinopathy',
    organ: 'Retina',
    effect: 'Radiation retinopathy / optic neuropathy',
    thresholdDose: '45 Gy (2 Gy/fx) whole retina; 55 Gy fovea',
    thresholdEQD2: 'Optic nerve: EQD2₂ > 55 Gy',
    onset: '6–36 months post-RT',
    severity: 'severe',
    mechanism: 'Endothelial cell loss → microangiopathy → ischaemia → cotton wool spots, haemorrhages, neovascularisation.',
    latency: '6 months – 3 years',
    notes: 'Risk ↑ with diabetes, hypertension. VEGF pathway involved → anti-VEGF (bevacizumab) used therapeutically.',
    source: 'QUANTEC 2010; Parsons et al. 1994',
    category: 'eye'
  },
  // Gonads
  {
    id: 'gonadal_sterility_male',
    organ: 'Testes — Spermatogonia',
    effect: 'Temporary azoospermia / oligospermia',
    thresholdDose: '0.15 Gy (temporary azoospermia)',
    onset: '6–8 weeks post-exposure',
    severity: 'moderate',
    mechanism: 'Spermatogonial stem cells (type A) most sensitive. Mature sperm persist ~6 weeks (spermatogenesis cycle).',
    latency: '6–8 weeks for azoospermia',
    notes: 'Recovery: typically 9–18 months at 0.15–1 Gy. Permanent at >3–6 Gy. Pre-treatment sperm banking mandatory if any testicular dose expected.',
    source: 'ICRP 118; RERF studies',
    category: 'gonads'
  },
  {
    id: 'gonadal_sterility_female',
    organ: 'Ovaries — Primary Follicles',
    effect: 'Premature ovarian failure (POF)',
    thresholdDose: '2–3 Gy (age-dependent); 6 Gy permanent in women <40',
    onset: 'Menstrual irregularity 2–3 months',
    severity: 'severe',
    mechanism: 'Oocytes (non-cycling primary follicles) highly sensitive. Fixed pool at birth — no regeneration possible.',
    latency: 'Months (menopausal symptoms) to years',
    notes: 'Threshold varies dramatically with age: prepubertal girls most resistant (larger primordial pool); peri-menopausal most sensitive. Oophoropexy, embryo/oocyte cryopreservation are fertility-preservation options.',
    source: 'ICRP 118; Wallace & Thomson 2003',
    category: 'gonads'
  },
  // Lung
  {
    id: 'radiation_pneumonitis',
    organ: 'Lung — Parenchyma',
    effect: 'Acute radiation pneumonitis (Grade 2+)',
    thresholdDose: 'V20Gy >20–35% (QUANTEC); MLD >20 Gy',
    onset: '4–12 weeks post-RT',
    severity: 'moderate',
    mechanism: 'Type II pneumocyte injury → surfactant loss → alveolar flooding. IL-1β, TGF-β, IL-6 cytokine cascade. VEGF and TGF-β are key downstream mediators.',
    latency: '4–12 weeks (acute phase)',
    notes: 'Risk factors: concurrent carboplatin/paclitaxel, pre-existing COPD, ipsilateral V5Gy. Steroid treatment (prednisolone 1mg/kg) in Grade ≥2. TGF-β1 plasma level pre-RT is predictive.',
    source: 'QUANTEC 2010; Graham MJO et al. 1999',
    category: 'lung'
  },
  {
    id: 'pulmonary_fibrosis',
    organ: 'Lung — Stroma/Parenchyma',
    effect: 'Late pulmonary fibrosis',
    thresholdDose: 'V20Gy >35%; MLD >20 Gy',
    onset: '6 months – 2 years post-RT',
    severity: 'severe',
    mechanism: 'Activated fibroblasts (TGF-β1 pathway) → collagen deposition → lung architecture destruction. Progressive and irreversible.',
    latency: '6 months – years',
    notes: 'Manifests radiologically before clinically. CT shows consolidation/traction bronchiectasis in irradiated volume. Nintedanib (anti-fibrotic) under investigation.',
    source: 'QUANTEC 2010; Mehta et al.',
    category: 'lung'
  },
  // Kidney
  {
    id: 'radiation_nephropathy',
    organ: 'Kidney — Glomeruli/Tubules',
    effect: 'Radiation nephropathy (proteinuria, hypertension, renal failure)',
    thresholdDose: 'Mean bilateral dose > 15–18 Gy (2 Gy/fx)',
    onset: '6–12 months post-RT',
    severity: 'severe',
    mechanism: 'Glomerular endothelial injury → thrombotic microangiopathy → mesangial expansion → scarring. Tubular damage superimposed.',
    latency: '6–12 months (acute); years (chronic)',
    notes: '≥700cc normal liver (liver-kidney combined irradiation) must stay below tolerance. Single-kidney patients: threshold drops to ~10 Gy mean. GFR tracking mandatory.',
    source: 'QUANTEC 2010; Cohen & Robbins 1956',
    category: 'kidney'
  },
];

// ─── Data: Stochastic Effects ─────────────────────────────────────────────────

const STOCHASTIC: StochasticEffect[] = [
  {
    id: 'leukemia',
    effect: 'Leukaemia (AML, CML, ALL)',
    type: 'cancer',
    nominalnominalRisk: 'Excess relative risk 1.0–1.5/Sv',
    riskPerSv: '~1 × 10⁻² excess leukaemia deaths/Sv (whole population)',
    latency: '2–5 years (shortest of all cancers)',
    mechanism: 'Single-hit chromosomal rearrangements in haematopoietic stem cells. Philadelphia chromosome (BCR-ABL) radiation-inducible. Most radiation-sensitive malignancy.',
    population: 'All ages; children most susceptible (3–5× higher ERR than adults)',
    evidence: 'RERF Life Span Study (A-bomb survivors). Clear dose-response above 0.1 Gy. CML excess peaked 5–10 yrs post-exposure.',
    icrpNominal: 'ICRP 103: 0.5% per Sv (whole population) for leukaemia',
    notes: 'CLL is NOT radiation-induced (unique among leukaemias). ERR for AML is 2.5/Sv at 1 Sv.',
    source: 'RERF LSS Report 14 (2012); ICRP 103',
  },
  {
    id: 'solid_cancer',
    effect: 'Solid cancer excess (all sites combined)',
    type: 'cancer',
    nominalnominalRisk: 'ERR ≈ 0.47/Sv (RERF LSS); EAR 10.5 per 10,000/Gy/year',
    riskPerSv: '~4 × 10⁻² total cancer deaths/Sv (ICRP 103)',
    latency: '10–60 years (solid cancers have long latency)',
    mechanism: 'Multi-step genomic instability: DSB → misrepair → chromosomal aberrations → oncogene activation/tumour suppressor loss. Linear relationship at low doses under LNT model.',
    population: 'All sites: breast, lung, thyroid, stomach, colon most sensitive. Children 3–5× more sensitive than adults.',
    evidence: 'A-bomb survivor LSS (120,000 subjects, 70+ years follow-up). Clear dose-response for solid cancers above 0.1 Sv.',
    icrpNominal: 'ICRP 103: 5% per Sv whole population; 5.5% workers; 3.3% public (age-averaged)',
    notes: 'Nominal fatal cancer risk 5%/Sv is a weighted average. Breast and thyroid have higher risk coefficients. Prostate, uterus have lower. Risk decreases markedly with age at exposure.',
    source: 'ICRP 103 (2007); RERF LSS Report 14',
  },
  {
    id: 'thyroid_cancer',
    effect: 'Thyroid cancer',
    type: 'cancer',
    nominalnominalRisk: 'ERR 1.28/Gy (RERF); risk highest <15 yrs at exposure',
    riskPerSv: 'EAR 4.4 per 10,000 per Gy per year (for childhood exposure)',
    latency: '5–40 years (peak 15–25 years)',
    mechanism: 'RET/PTC rearrangements (inversion on chromosome 10) are hallmark of radiation-induced papillary thyroid cancer. Also BRAF V600E (less radiation-specific).',
    population: 'Children <15 years most susceptible. Iodine-131 particularly carcinogenic (100–200 mGy to thyroid from Chernobyl).',
    evidence: 'Chernobyl accident: 6,000 thyroid cancers in children exposed to ¹³¹I fallout. A-bomb survivors. Childhood neck RT (tinea capitis).',
    icrpNominal: 'High tissue weighting factor for thyroid (wT = 0.04)',
    notes: 'Radiation-induced thyroid cancer is predominantly papillary type — excellent prognosis with appropriate treatment. Potassium iodide (KI) blocks thyroidal ¹³¹I uptake if given within 24 hours.',
    source: 'RERF LSS; Tuttle & Shaha 2000; Chernobyl studies',
  },
  {
    id: 'breast_cancer',
    effect: 'Breast cancer',
    type: 'cancer',
    nominalnominalRisk: 'ERR 0.97/Sv; one of highest tissue coefficients',
    riskPerSv: 'EAR 12.4 per 10,000/Gy/year for women age 30–40',
    latency: '10–30 years',
    mechanism: 'Oestrogen receptor signalling amplification after radiation-induced genomic instability. BRCA1/2 mutations increase radiosensitivity.',
    population: 'Women only (negligible in men). Adolescent and young adult women most sensitive. Pre-menopausal > post-menopausal.',
    evidence: 'A-bomb survivors, fluoroscopy series (tuberculosis patients), Hodgkin lymphoma chest RT survivors. Linear dose-response.',
    icrpNominal: 'wT = 0.12 (tissue weighting factor)',
    notes: 'HL survivors treated with mantle field RT have 30–40% cumulative breast cancer risk by age 50 (relative risk 4–5×). Surveillance mammography from 8 years post-RT is standard.',
    source: 'ICRP 103; RERF; Hancock et al. 1993',
  },
  {
    id: 'lung_cancer',
    effect: 'Lung cancer',
    type: 'cancer',
    nominalnominalRisk: 'ERR 0.39/Sv (smokers) to 0.77/Sv (non-smokers)',
    riskPerSv: 'Strong interaction with smoking — multiplicative risk model',
    latency: '10–40 years',
    mechanism: 'Radiation + tobacco carcinogens: multiplicative interaction (not merely additive). K-ras and TP53 mutations predominate.',
    population: 'Radon (²²²Rn) major environmental source for lung cancer. Occupational uranium miners. A-bomb survivors.',
    evidence: 'Underground miners (BEIR VI). A-bomb survivors (ERR 0.39–0.77/Sv). Synergism with tobacco clearly established.',
    icrpNominal: 'wT = 0.12 (lung tissue weighting factor)',
    notes: 'Radon is the second leading cause of lung cancer (after smoking) globally. NCRP: 8–10 Bq/m³ indoor radon reference level. Uranium miner excess risk 1.5% per Working Level Month (WLM).',
    source: 'BEIR VI (1999); ICRP 103; RERF',
  },
  {
    id: 'hereditary',
    effect: 'Hereditary/Genetic effects',
    type: 'hereditary',
    nominalnominalRisk: 'Nominal risk ≈ 0.2% per Sv (reproductive population)',
    riskPerSv: '2 × 10⁻³ per Sv (first 2 generations)',
    latency: 'First generation offspring — no latency',
    mechanism: 'Point mutations, chromosomal aberrations in germ cells transmitted to offspring. Meiotic recombination may reduce risk vs mitotic errors.',
    population: 'Risk only applies to doses to gonads in pre-reproductive individuals',
    evidence: 'Largely from experimental mouse genetics (Russell). A-bomb survivor children showed NO statistically significant hereditary effects (LSS).',
    icrpNominal: 'ICRP 103: 0.2% per Sv (entire population); much less in practice (reproductive years only)',
    notes: 'Historically overestimated. UNSCEAR 2001 revised markedly downward. Mouse data suggest dose-rate effect — chronic low-dose rate much less mutagenic than acute. A-bomb survivor children (F1 study): no excess mutations in sequencing studies.',
    source: 'ICRP 103; UNSCEAR 2001; Ozaki et al. Lancet 2004 (F1 study)',
  },
];

// ─── Data: 5 Rs of Radiobiology ───────────────────────────────────────────────

const FIVE_RS = [
  {
    r: 'Repair',
    desc: 'Repair of sublethal DNA damage (SLD)',
    mechanism: 'Primarily non-homologous end joining (NHEJ) and homologous recombination (HR).',
    clinical: 'Sparing effect of fractionation. Normal tissues (low α/β) repair SLD better than tumours (high α/β). Requires time (typically >6 hours between fractions).',
    icon: <Shield className="w-5 h-5 text-emerald-500" />
  },
  {
    r: 'Repopulation',
    desc: 'Cell division during treatment',
    mechanism: 'Triggered by cell death. Accelerated repopulation begins ~3–4 weeks into RT course (especially HNSCC, cervix).',
    clinical: 'Prolonging overall treatment time (OTT) decreases tumour control. Counteracted by accelerated fractionation or concurrent chemo.',
    icon: <Users className="w-5 h-5 text-blue-500" />
  },
  {
    r: 'Redistribution',
    desc: 'Reassortment of cells in cell cycle',
    mechanism: 'RT kills cells in sensitive phases (G2/M). Surviving cells in resistant phases (late S) progress into sensitive phases before next fraction.',
    clinical: 'Increases tumour cell kill with fractionated RT. Rationale for daily fractionation.',
    icon: <RefreshCw className="w-5 h-5 text-amber-500" />
  },
  {
    r: 'Reoxygenation',
    desc: 'Hypoxic cells become oxygenated',
    mechanism: 'As oxygenated cells die and tumour shrinks, previously hypoxic (radioresistant) cells move closer to blood vessels and become oxygenated (radiosensitive).',
    clinical: 'Overcomes hypoxic radioresistance over a fractionated course. OER is 2.5–3.0.',
    icon: <Activity className="w-5 h-5 text-red-500" />
  },
  {
    r: 'Radiosensitivity',
    desc: 'Intrinsic cellular sensitivity',
    mechanism: 'Inherent susceptibility to radiation-induced apoptosis/death. Governed by genetics (e.g. ATM, BRCA mutations), chromatin structure.',
    clinical: 'Explains why lymphoma is cured with 30 Gy while glioblastoma recurs after 60 Gy. Measured by surviving fraction at 2 Gy (SF2).',
    icon: <Dna className="w-5 h-5 text-violet-500" />
  }
];

// ─── Data: Modifiers ─────────────────────────────────────────────────────────

const MODIFIERS: RadiationModifier[] = [
  {
    id: 'oxygen',
    name: 'Oxygen (O₂)',
    category: 'sensitiser',
    mechanism: 'Oxygen Fixation Hypothesis: O₂ reacts with DNA free radicals to form stable, irreparable peroxyl radicals (ROO•).',
    clinicalUse: 'The most potent and universal radiosensitiser. Hypoxic cells are 2.5–3× more resistant.',
    doseModificationFactor: 'OER = 2.5–3.0',
    evidence: 'Fundamental radiobiology principle.',
    notes: 'Attempts to exploit: Hyperbaric O₂, ARCON, hypoxic cytotoxins (nimorazole, tirapazamine).'
  },
  {
    id: 'halogenated_pyrimidines',
    name: 'Halogenated Pyrimidines (BrdU, IdU)',
    category: 'sensitiser',
    mechanism: 'Incorporate into DNA in place of thymidine during S-phase. Weakens DNA backbone, increasing susceptibility to radiation-induced strand breaks.',
    clinicalUse: 'Experimental/Historical. Limited by systemic toxicity and need for continuous infusion.',
    doseModificationFactor: 'Sensitiser Enhancement Ratio (SER) ≈ 1.5–2.0',
    evidence: 'In vitro efficacy clear; clinical trials (e.g. GBM) largely failed due to toxicity.',
    notes: 'Requires cells to be actively dividing (S-phase) to incorporate.'
  },
  {
    id: 'cisplatin',
    name: 'Cisplatin / Platinum agents',
    category: 'sensitiser',
    mechanism: 'Forms DNA crosslinks. Inhibits sublethal damage repair. May also act as an electron-affinic hypoxic cell sensitiser.',
    clinicalUse: 'Standard of care concurrent with RT for HNSCC, cervix, lung cancer.',
    evidence: 'Extensive Level 1 evidence (e.g. MACH-NC meta-analysis for HNSCC).',
    notes: 'Synergistic effect is highly schedule-dependent (must be concurrent, not sequential).'
  },
  {
    id: 'amifostine',
    name: 'Amifostine (WR-2721)',
    category: 'protector',
    mechanism: 'Prodrug dephosphorylated by alkaline phosphatase (higher in normal tissues) to active free-radical scavenger. Scavenges OH• radicals.',
    clinicalUse: 'FDA approved to reduce xerostomia in HNSCC RT.',
    doseModificationFactor: 'Dose Reduction Factor (DRF) ≈ 1.2–1.5 for normal tissues',
    evidence: 'Phase III trials show reduced acute/late xerostomia.',
    notes: 'Use limited by severe nausea, hypotension, and daily IV administration requirement. Does not protect tumour (poor vascularity/lower alk phos).'
  },
  {
    id: 'hyperthermia',
    name: 'Hyperthermia (41–43°C)',
    category: 'physical',
    mechanism: 'Inhibits DNA repair enzymes (e.g. polymerase β). Kills S-phase and hypoxic cells (which are radioresistant).',
    clinicalUse: 'Adjunct to RT for superficial tumours (melanoma, chest wall recurrence), cervical cancer.',
    doseModificationFactor: 'Thermal Enhancement Ratio (TER) ≈ 1.5–2.0',
    evidence: 'Positive Phase III trials in cervix, recurrent breast cancer.',
    notes: 'Technically difficult to deliver uniform heat to deep tumours.'
  }
];

// ─── Data: Special Populations ───────────────────────────────────────────────

const SPECIAL_POPULATIONS = [
  {
    group: 'Pregnancy',
    icon: <Baby className="w-5 h-5 text-pink-500" />,
    risks: [
      'Pre-implantation (0–2 wks): "All or nothing" — death or normal development.',
      'Organogenesis (2–8 wks): Congenital malformations (microcephaly, skeletal). Threshold ~100 mGy.',
      'Early Foetal (8–15 wks): Severe mental retardation (IQ drop ~30 points/Sv). Highest risk period.',
      'Late Foetal (>15 wks): Lower risk of retardation. Childhood cancer risk remains.'
    ],
    guidelines: '10-day rule (historical) replaced by 28-day rule. Foetal dose limit for pregnant workers: 1 mSv over declared pregnancy.'
  },
  {
    group: 'Paediatrics',
    icon: <Baby className="w-5 h-5 text-blue-500" />,
    risks: [
      'High sensitivity to radiation carcinogenesis (3–5× adult risk).',
      'Growth retardation (epiphyseal plate irradiation).',
      'Neurocognitive decline (whole brain RT <3 years old is contraindicated).',
      'Endocrine dysfunction (hypothalamic/pituitary axis highly sensitive).'
    ],
    guidelines: 'Proton therapy preferred to reduce integral dose. Avoid RT in very young if chemo/surgery viable.'
  },
  {
    group: 'Genetic Syndromes',
    icon: <Dna className="w-5 h-5 text-violet-500" />,
    risks: [
      'Ataxia Telangiectasia (ATM mutation): Extreme radiosensitivity. Standard RT is fatal.',
      'Li-Fraumeni (TP53 mutation): High risk of radiation-induced secondary sarcomas.',
      'Gorlin Syndrome (PTCH1): RT induces thousands of basal cell carcinomas in field.',
      'BRCA1/2: Increased breast cancer risk from diagnostic/therapeutic RT.'
    ],
    guidelines: 'Avoid RT in AT and Gorlin. Use extreme caution/alternative modalities in Li-Fraumeni.'
  }
];

// ─── Data: Quiz ──────────────────────────────────────────────────────────────

const QUIZ: QuizQuestion[] = [
  {
    q: 'Which of the following is a deterministic effect of radiation?',
    opts: ['Radiation-induced leukaemia', 'Hereditary mutations', 'Radiation cataract', 'Secondary solid tumour'],
    correct: 2,
    explanation: 'Cataract formation is a deterministic (tissue reaction) effect. It has a threshold dose (0.5 Gy) and severity increases with dose. Leukaemia, solid tumours, and hereditary effects are stochastic (no threshold, probability increases with dose).',
    pearl: 'ICRP 118 (2012) significantly lowered the threshold for radiation cataract from 2.0 Gy to 0.5 Gy, classifying it as a late deterministic effect.',
    difficulty: 'basic',
    source: 'ICRP 118'
  },
  {
    q: 'The most radiation-sensitive phase of the cell cycle is:',
    opts: ['G1 phase', 'S phase', 'G2/M phase', 'G0 phase'],
    correct: 2,
    explanation: 'Cells are most radiosensitive in the G2 and M (mitosis) phases. They are most radioresistant in the late S (synthesis) phase due to homologous recombination repair availability and duplicated genome.',
    pearl: 'This is the basis for the "Redistribution" R of radiobiology: fractionated RT allows resistant S-phase cells to cycle into sensitive G2/M phases before the next dose.',
    difficulty: 'basic',
    source: 'Hall & Giaccia'
  },
  {
    q: 'According to the Oxygen Fixation Hypothesis, oxygen acts as a radiosensitiser by:',
    opts: ['Increasing cell division rate', 'Forming stable, irreparable peroxyl radicals with DNA', 'Inhibiting homologous recombination', 'Increasing the production of hydroxyl radicals'],
    correct: 1,
    explanation: 'Oxygen reacts with DNA free radicals (created by indirect action of radiation) to form peroxyl radicals (ROO•). This "fixes" the damage, making it permanent and preventing repair by chemical restitution (e.g. via sulfhydryl groups).',
    pearl: 'The Oxygen Enhancement Ratio (OER) for X-rays is ~2.5–3.0. Hypoxic cells are therefore up to 3 times more resistant to photon radiation.',
    difficulty: 'intermediate',
    source: 'Hall & Giaccia'
  },
  {
    q: 'Which genetic syndrome is an absolute contraindication to standard-dose radiotherapy due to extreme, fatal radiosensitivity?',
    opts: ['Li-Fraumeni syndrome', 'BRCA1 mutation carrier', 'Ataxia Telangiectasia', 'Neurofibromatosis Type 1'],
    correct: 2,
    explanation: 'Ataxia Telangiectasia (mutated ATM gene) results in a complete inability to recognise and repair DNA double-strand breaks. Standard RT doses cause catastrophic, fatal normal tissue necrosis.',
    pearl: 'While Li-Fraumeni and Gorlin syndromes carry high risks of secondary malignancies from RT, only AT carries an immediate risk of fatal acute toxicity at standard doses.',
    difficulty: 'intermediate',
    source: 'Clinical Radiobiology'
  },
  {
    q: 'During pregnancy, the highest risk of severe mental retardation in the foetus occurs during exposure at:',
    opts: ['0–2 weeks', '2–8 weeks', '8–15 weeks', '25–40 weeks'],
    correct: 2,
    explanation: 'The period of 8–15 weeks (early foetal period) is when rapid neuronal proliferation and migration to the cerebral cortex occurs. Radiation during this window carries the highest risk of severe mental retardation (IQ drop of ~30 points per Sv).',
    pearl: '0–2 weeks is "all or nothing" (death or normal). 2–8 weeks is organogenesis (structural malformations). >15 weeks the risk of retardation drops significantly.',
    difficulty: 'advanced',
    source: 'ICRP 103 / RERF'
  }
];

// ─── Main Component ────────────────────────────────────────────────────────────

const IonizingRadiationEffectsPage: React.FC = () => {
  const [tab, setTab] = useState<TabType>('Deterministic');
  const [showQR, setShowQR] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "Acute Radiation Syndrome",
      emoji: "☢️",
      accent: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.4)",
      rows: [
        { k: "Haematopoietic", v: "0.5–1 Gy", mono: true },
        { k: "Gastrointestinal", v: "6–10 Gy", mono: true },
        { k: "Cerebrovascular", v: "> 20–50 Gy", mono: true },
        { k: "LD50/60 (No Tx)", v: "3–4 Gy", mono: true },
      ]
    },
    {
      title: "Deterministic Thresholds",
      emoji: "🛑",
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      border: "rgba(245, 158, 11, 0.4)",
      rows: [
        { k: "Temporary Alopecia", v: "3 Gy", mono: true },
        { k: "Permanent Alopecia", v: "7 Gy", mono: true },
        { k: "Cataracts (ICRP 118)", v: "0.5 Gy", mono: true },
        { k: "Male Sterility (Perm)", v: "3.5–6 Gy", mono: true },
        { k: "Female Sterility", v: "2.5–6 Gy", mono: true },
      ]
    },
    {
      title: "Stochastic Risks (ICRP 103)",
      emoji: "🎲",
      accent: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.4)",
      rows: [
        { k: "Cancer (Whole Pop)", v: "5.5% / Sv", mono: true },
        { k: "Cancer (Workers)", v: "4.1% / Sv", mono: true },
        { k: "Hereditary (Pop)", v: "0.2% / Sv", mono: true },
        { k: "Hereditary (Workers)", v: "0.1% / Sv", mono: true },
      ]
    },
    {
      title: "The 5 R's of Radiobiology",
      emoji: "🧬",
      accent: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.4)",
      rows: [
        { k: "Repair", v: "Sublethal damage (DNA)", mono: false },
        { k: "Redistribution", v: "To sensitive phases (G2/M)", mono: false },
        { k: "Repopulation", v: "Tumour cell proliferation", mono: false },
        { k: "Reoxygenation", v: "Hypoxic cells become oxic", mono: false },
        { k: "Radiosensitivity", v: "Intrinsic cell sensitivity", mono: false },
      ]
    }
  ];
  
  const [expandedDet, setExpandedDet] = useState<string | null>(null);
  const [expandedStoch, setExpandedStoch] = useState<string | null>(null);

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);
  const [qDiff, setQDiff] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');

  const filteredQ = QUIZ.filter(q => qDiff === 'all' || q.difficulty === qDiff);
  const curQ = filteredQ[qIdx];

  const DIFF_C: Record<string, string> = {
    basic: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
  };

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
            <h1 className="text-sm font-extrabold tracking-tight">Ionizing Radiation Effects</h1>
            <p className="text-[10px] text-blue-200/70">Deterministic & Stochastic Radiobiology</p>
            <p className="text-[9px] text-blue-200/40 mt-0.5">ICRP 103/118 · UNSCEAR · NCRP</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1.5 text-[9px]">
              <span className="bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-bold">5 Rs</span>
              <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">LNT</span>
            </div>
            <p className="text-[9px] text-blue-200/40">Clinical & Physics Reference</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {(['Deterministic', 'Stochastic', '5 Rs', 'Modifiers', 'Special', 'Quiz'] as (TabType | '5 Rs')[]).map(t => (
          <button key={t} onClick={() => setTab(t as TabType)}
            className={`flex-shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: Deterministic
      ════════════════════════════════════════════════════════ */}
      {tab === 'Deterministic' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[10px] text-blue-800">
            <p className="font-bold mb-1">Deterministic Effects (Tissue Reactions)</p>
            <p>Characterised by a <strong>threshold dose</strong> below which the effect does not occur. Above the threshold, the <strong>severity</strong> of the effect increases with dose. Caused by cell killing/depletion.</p>
          </div>

          {['acute_whole_body', 'skin', 'eye', 'gonads', 'lung', 'kidney'].map(cat => {
            const items = DETERMINISTIC.filter(d => d.category === cat);
            if (items.length === 0) return null;
            
            const catTitles: Record<string, string> = {
              acute_whole_body: 'Acute Radiation Syndrome (Whole Body)',
              skin: 'Skin & Integument',
              eye: 'Lens & Retina',
              gonads: 'Reproductive System',
              lung: 'Pulmonary System',
              kidney: 'Renal System'
            };

            return (
              <div key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{catTitles[cat]}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map(item => {
                    const isExp = expandedDet === item.id;
                    return (
                      <div key={item.id} className="p-3">
                        <div 
                          className="flex justify-between items-start cursor-pointer group"
                          onClick={() => setExpandedDet(isExp ? null : item.id)}
                        >
                          <div className="flex-1 pr-4">
                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">{item.effect}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.organ}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs font-black font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">{item.thresholdDose}</span>
                            {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExp && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-slate-100 space-y-2 text-[11px]">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-slate-50 p-2 rounded">
                                    <span className="font-bold text-slate-700 block mb-0.5">Onset / Latency</span>
                                    <span className="text-slate-600">{item.onset}</span>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded">
                                    <span className="font-bold text-slate-700 block mb-0.5">Severity</span>
                                    <span className={`uppercase font-bold tracking-wider ${
                                      item.severity === 'lethal' ? 'text-red-600' : 
                                      item.severity === 'severe' ? 'text-orange-600' : 
                                      item.severity === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>{item.severity}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-700">Mechanism: </span>
                                  <span className="text-slate-600">{item.mechanism}</span>
                                </div>
                                <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                  <span className="font-bold text-blue-800">Clinical Pearl: </span>
                                  <span className="text-blue-700">{item.notes}</span>
                                </div>
                                <div className="text-[9px] text-slate-400 text-right pt-1">
                                  Source: {item.source}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Stochastic
      ════════════════════════════════════════════════════════ */}
      {tab === 'Stochastic' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800">
            <p className="font-bold mb-1">Stochastic Effects</p>
            <p>Characterised by <strong>no threshold dose</strong> (Linear Non-Threshold model). The <strong>probability</strong> of occurrence increases with dose, but the <strong>severity</strong> is independent of dose. Caused by DNA mutation.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {STOCHASTIC.map(item => {
              const isExp = expandedStoch === item.id;
              return (
                <div key={item.id} className="p-3">
                  <div 
                    className="flex justify-between items-start cursor-pointer group"
                    onClick={() => setExpandedStoch(isExp ? null : item.id)}
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition">{item.effect}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.nominalnominalRisk}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        item.type === 'cancer' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {item.type}
                      </span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-slate-100 space-y-2 text-[11px]">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="font-bold text-slate-700 block mb-0.5">Latency</span>
                              <span className="text-slate-600">{item.latency}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="font-bold text-slate-700 block mb-0.5">Risk per Sv</span>
                              <span className="text-slate-600">{item.riskPerSv}</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Mechanism: </span>
                            <span className="text-slate-600">{item.mechanism}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Population/Evidence: </span>
                            <span className="text-slate-600">{item.population} {item.evidence}</span>
                          </div>
                          <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                            <span className="font-bold text-amber-800">Clinical Pearl: </span>
                            <span className="text-amber-700">{item.notes}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 text-right pt-1">
                            Source: {item.source}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: 5 Rs
      ════════════════════════════════════════════════════════ */}
      {tab === '5 Rs' && (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[10px] text-emerald-800">
            <p className="font-bold mb-1">The 5 Rs of Radiobiology</p>
            <p>The biological rationale for fractionated radiotherapy. Fractionation spares normal tissue (repair, repopulation) while increasing damage to the tumour (redistribution, reoxygenation).</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {FIVE_RS.map(item => (
              <div key={item.r} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3">
                <div className="mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{item.r}</h3>
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">{item.desc}</p>
                  <div className="space-y-1.5 text-[11px]">
                    <p><span className="font-bold text-slate-700">Mechanism: </span><span className="text-slate-600">{item.mechanism}</span></p>
                    <p><span className="font-bold text-slate-700">Clinical Impact: </span><span className="text-slate-600">{item.clinical}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Modifiers
      ════════════════════════════════════════════════════════ */}
      {tab === 'Modifiers' && (
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-[10px] text-violet-800">
            <p className="font-bold mb-1">Radiation Modifiers</p>
            <p>Chemical or physical agents that alter the biological response to radiation. Sensitisers shift the survival curve to the left; protectors shift it to the right.</p>
          </div>

          <div className="space-y-3">
            {MODIFIERS.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800">{item.name}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    item.category === 'sensitiser' ? 'bg-red-50 text-red-600' :
                    item.category === 'protector' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {item.category}
                  </span>
                </div>
                <div className="p-3 space-y-2 text-[11px]">
                  {item.doseModificationFactor && (
                    <div className="bg-slate-50 p-2 rounded inline-block mb-1">
                      <span className="font-bold text-slate-700">Factor: </span>
                      <span className="font-mono font-bold text-blue-700">{item.doseModificationFactor}</span>
                    </div>
                  )}
                  <p><span className="font-bold text-slate-700">Mechanism: </span><span className="text-slate-600">{item.mechanism}</span></p>
                  <p><span className="font-bold text-slate-700">Clinical Use: </span><span className="text-slate-600">{item.clinicalUse}</span></p>
                  <div className="bg-violet-50/50 p-2 rounded border border-violet-100 mt-2">
                    <span className="font-bold text-violet-800">Evidence/Notes: </span>
                    <span className="text-violet-700">{item.evidence} {item.notes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Special
      ════════════════════════════════════════════════════════ */}
      {tab === 'Special' && (
        <div className="space-y-3">
          {SPECIAL_POPULATIONS.map(pop => (
            <div key={pop.group} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
                {pop.icon}
                <h3 className="text-sm font-bold text-slate-800">{pop.group}</h3>
              </div>
              <div className="p-3 space-y-3 text-[11px]">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Key Risks & Considerations:</span>
                  <ul className="space-y-1 pl-1">
                    {pop.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-600">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                  <span className="font-bold text-blue-800">Guidelines: </span>
                  <span className="text-blue-700">{pop.guidelines}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Quiz
      ════════════════════════════════════════════════════════ */}
      {tab === 'Quiz' && (
        <div className="space-y-3">
          {/* Quiz Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radiobiology Quiz</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {qDone ? 'Quiz Complete' : `Question ${qIdx + 1} of ${filteredQ.length}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={qDiff}
                onChange={e => {
                  setQDiff(e.target.value as 'all' | 'basic' | 'intermediate' | 'advanced');
                  setQIdx(0); setQAnswered(null); setQScore(0); setQDone(false);
                }}
                className="text-[10px] border border-slate-200 rounded px-2 py-1 bg-slate-50 outline-none"
              >
                <option value="all">All Levels</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="bg-blue-50 text-blue-700 font-mono text-xs font-bold px-2 py-1 rounded">
                Score: {qScore}
              </div>
            </div>
          </div>

          {/* Quiz Content */}
          {!qDone && curQ && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4">
                <div className="flex gap-2 mb-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${DIFF_C[curQ.difficulty]}`}>
                    {curQ.difficulty}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 leading-snug">{curQ.q}</p>
              </div>

              <div className="px-3 pb-3 space-y-2">
                {curQ.opts.map((opt, i) => {
                  const isSelected = qAnswered === i;
                  const isCorrect = curQ.correct === i;
                  const showStatus = qAnswered !== null;
                  
                  let btnClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                  if (showStatus) {
                    if (isCorrect) btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-800';
                    else if (isSelected) btnClass = 'bg-red-50 border-red-500 text-red-800';
                    else btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
                  }

                  return (
                    <button
                      key={i}
                      disabled={showStatus}
                      onClick={() => {
                        setQAnswered(i);
                        if (i === curQ.correct) setQScore(s => s + 1);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition flex justify-between items-center ${btnClass}`}
                    >
                      <span>{opt}</span>
                      {showStatus && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      {showStatus && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {qAnswered !== null && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden bg-slate-50 border-t border-slate-200"
                  >
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold">Explanation: </span>{curQ.explanation}
                      </p>
                      <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                        <span className="font-bold text-blue-800 text-[11px]">Clinical Pearl: </span>
                        <span className="text-blue-700 text-[11px]">{curQ.pearl}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[9px] text-slate-400">Source: {curQ.source}</span>
                        <button
                          onClick={() => {
                            if (qIdx < filteredQ.length - 1) {
                              setQIdx(i => i + 1);
                              setQAnswered(null);
                            } else {
                              setQDone(true);
                            }
                          }}
                          className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-blue-700 transition"
                        >
                          {qIdx < filteredQ.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quiz End Screen */}
          {qDone && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-4">
              <GraduationCap className="w-12 h-12 text-blue-600 mx-auto" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Quiz Completed!</h2>
                <p className="text-sm text-slate-500 mt-1">
                  You scored <span className="font-bold text-blue-600">{qScore}</span> out of {filteredQ.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setQIdx(0); setQAnswered(null); setQScore(0); setQDone(false);
                }}
                className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-200 transition"
              >
                Restart Quiz
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default IonizingRadiationEffectsPage;