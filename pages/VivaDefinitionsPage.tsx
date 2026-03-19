import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface VivaDef {
  id: number;
  term: string;
  category: 'Units' | 'Radiobiology' | 'Physics' | 'Planning' | 'Techniques' | 'Safety';
  shortDef: string;
  details: string;
  formula?: string;
  clinicalExample: string;
  vivaAns: string;
  pitfall: string;
  reference: string;
  examWeight: 1 | 2 | 3; // 3 = most likely in exam
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const QUICK_REF_DATA = [
  {
    category: "Key Units",
    items: [
      { label: "Absorbed Dose", value: "Gray (Gy) = 1 J/kg" },
      { label: "Equivalent Dose", value: "Sievert (Sv) = Gy × wR" },
      { label: "Activity", value: "Becquerel (Bq) = 1 dps" },
      { label: "Exposure", value: "Roentgen (R)" },
    ]
  },
  {
    category: "Radiobiology",
    items: [
      { label: "LET", value: "Energy per track length" },
      { label: "RBE", value: "D_ref / D_test" },
      { label: "OER", value: "D_hypoxic / D_oxic" },
      { label: "TCP/NTCP", value: "Sigmoid probability" },
    ]
  },
  {
    category: "Physics",
    items: [
      { label: "Compton", value: "Dominant 100keV - 10MeV" },
      { label: "Photoelectric", value: "Dominant < 100keV" },
      { label: "Pair Production", value: "Threshold 1.022 MeV" },
    ]
  }
];

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DEFS: VivaDef[] = [
  // ── UNITS ──────────────────────────────────────────────────────────────────
  {
    id: 1, term: 'Rad (Radiation Absorbed Dose)', category: 'Units', examWeight: 2,
    shortDef: 'Legacy CGS unit of absorbed dose. 1 rad = 0.01 Gy = 1 cGy.',
    details: '1 rad = 100 ergs of energy absorbed per gram of absorber (any material). Pre-1975 standard. Not an abbreviation — a distinct unit name. Conversion: 5000 rad = 50 Gy.',
    formula: '1 rad = 100 erg/g = 0.01 J/kg = 0.01 Gy = 1 cGy',
    clinicalExample: 'Historical prescriptions (US literature pre-1980s): "Dose: 5000 rads in 25 fractions." Equivalent: 50 Gy/25fr.',
    vivaAns: '"Rad is the legacy CGS unit of absorbed dose. 1 rad equals 100 ergs per gram, which equals 0.01 Gray. It is encountered in vintage US literature and legacy TPS databases."',
    pitfall: 'Do not confuse rad (dose) with R (Roentgen = exposure). 1 R produces ~0.0096 Gy in tissue — NOT exactly 1 rad.',
    reference: 'Khan FM. Physics of Radiation Therapy, 5th ed. 2014.'
  },
  {
    id: 2, term: 'Gray (Gy)', category: 'Units', examWeight: 3,
    shortDef: 'SI unit of absorbed dose. 1 Gy = 1 J/kg. Biologically neutral — no radiation type weighting.',
    details: 'Absorbed dose = energy deposited per unit mass. 1 Gy = 1 J/kg. Material-independent (applies to tissue, water, bone). Does NOT account for biological effect — that requires Sievert. 1 Gy = 100 rads = 100 cGy.',
    formula: 'D (Gy) = Energy deposited (J) / Mass (kg)',
    clinicalExample: 'Curative H&N SCC: 70 Gy/35fr (2 Gy/fr). Post-op cervix: 45 Gy/25fr + BT boost to 85 Gy EQD2.',
    vivaAns: '"Gray is the SI unit of absorbed dose, defined as 1 joule of energy absorbed per kilogram of matter. It is material and radiation-type independent. 1 Gray equals 100 rads."',
    pitfall: 'Gray measures physical dose — not biological effect. For biological comparison, use BED or EQD2 (which incorporate α/β). Never say "Gray is the unit of dose equivalent" — that is Sievert.',
    reference: 'ICRP Publication 103. 2007. SI system (BIPM).'
  },
  {
    id: 3, term: 'Sievert (Sv)', category: 'Units', examWeight: 3,
    shortDef: 'SI unit of equivalent dose (HT) and effective dose (E). Sv = Gy × wR (radiation) × wT (tissue).',
    details: 'Equivalent dose HT = DT × wR. Effective dose E = Σ(wT × HT). Radiation weighting factors (wR): photons = 1, protons = 2, alpha = 20, neutrons = 2–20 (energy-dependent). Tissue weighting factors (wT): gonads 0.08, colon/lung/bone marrow 0.12 each, skin/bone surface 0.01.',
    formula: 'HT (Sv) = DT (Gy) × wR | E (Sv) = Σ wT × HT',
    clinicalExample: 'Public dose limit: 1 mSv/yr effective dose. Occupational: 20 mSv/yr (5yr average). Lens of eye: 20 mSv/yr (2011 revised ICRP limit). 1 Sv = 100 rem (legacy).',
    vivaAns: '"Sievert quantifies stochastic risk. Equivalent dose = absorbed dose × radiation weighting factor. Effective dose additionally weights by tissue sensitivity. Used for radiation protection, not clinical prescription."',
    pitfall: 'Sievert is for stochastic (probabilistic) risk — cancer induction, genetic effects. NOT for deterministic effects (which use absorbed dose Gy with threshold). Do not use Sv for RT prescriptions.',
    reference: 'ICRP Publication 103 (2007). ICRP 60 (1990) — historical wR/wT values.'
  },
  {
    id: 4, term: 'Becquerel (Bq)', category: 'Units', examWeight: 2,
    shortDef: 'SI unit of activity. 1 Bq = 1 disintegration per second (dps).',
    details: '1 Bq = 1 dps. Very small unit → clinical use: MBq (10⁶), GBq (10⁹). Relationship to Curie: 1 Ci = 3.7 × 10¹⁰ Bq = 37 GBq. Activity A = λN = (ln2/T½) × N.',
    formula: 'A (Bq) = λ × N | 1 Ci = 37 GBq | A(t) = A₀ × e^(−λt)',
    clinicalExample: 'HDR Ir-192 source: ~370 GBq (10 Ci) initial activity. I-125 seed (LDR prostate): ~0.3–0.5 mCi = 11–18.5 MBq per seed. Lu-177-PSMA treatment: 7.4 GBq per cycle.',
    vivaAns: '"Becquerel is the SI unit of radioactivity, defined as 1 nuclear disintegration per second. Because it is a small unit, clinical practice uses MBq and GBq. 1 Curie equals 37 GBq."',
    pitfall: 'Activity (Bq) ≠ dose rate. Dose rate depends additionally on photon energy, geometry, and distance. Two isotopes with equal activity (Bq) may give vastly different dose rates (e.g., Am-241 vs Ir-192).',
    reference: 'SI system. ICRU Report 85a (2011).'
  },
  {
    id: 5, term: 'Roentgen (R)', category: 'Units', examWeight: 2,
    shortDef: 'Historical unit of X/γ-ray exposure in air. 1 R = 2.58 × 10⁻⁴ C/kg air.',
    details: 'Exposure = charge liberated per unit mass of dry air. 1 R = 1 esu per 0.001293 g air = 2.58 × 10⁻⁴ C/kg. Valid only for photons ≤3 MeV in air. f-factor converts R → rad in tissue: ~0.9 rad/R for soft tissue, ~3.5 rad/R for bone at 100 kVp.',
    formula: 'X (R) = ΔQ/Δm_air | f-factor: D_tissue = f × X',
    clinicalExample: 'Calibrating orthovoltage units (100–300 kVp): output in R/min, converted to Gy using f-factor. Radiation survey meters (Geiger counters) still often read in mR/hr.',
    vivaAns: '"Roentgen is the unit of exposure — ionisation produced in air by photons. It applies only to X-rays and gamma-rays in air, up to ~3 MeV. It is converted to absorbed dose in tissue using the f-factor (roentgen-to-rad conversion factor)."',
    pitfall: 'R measures exposure in AIR only — it cannot be applied to particle radiation or to tissue directly. The common mistake: confusing exposure (R) with absorbed dose (Gy).',
    reference: 'IAEA TRS-398 (2000). Khan FM ch. 6.'
  },
  {
    id: 6, term: 'Curie (Ci)', category: 'Units', examWeight: 2,
    shortDef: 'Non-SI unit of activity. 1 Ci = 3.7 × 10¹⁰ dps = 37 GBq. Based on Ra-226 decay.',
    details: 'Historically: activity of 1 gram of Ra-226 = 1 Ci. Now defined as 3.7 × 10¹⁰ dps exactly. Sub-units: mCi = 10⁻³ Ci = 37 MBq; μCi = 10⁻⁶ Ci = 37 kBq.',
    formula: '1 Ci = 3.7 × 10¹⁰ dps = 37 GBq',
    clinicalExample: 'Tele-cobalt source: 5,000–10,000 Ci (185–370 TBq) at loading. I-131 thyroid ablation: 30–150 mCi (1.1–5.5 GBq). Ra-223 (Xofigo): 55 kBq/kg per cycle.',
    vivaAns: '"Curie is the traditional unit of radioactivity, historically defined as the activity of 1 gram of radium-226. 1 Curie equals 3.7 × 10¹⁰ disintegrations per second, or 37 GBq. It remains in use in the USA and in teletherapy machine specifications."',
    pitfall: 'Activity in Ci/GBq does not directly tell you dose rate — must know photon energy, geometry, and distance. Do not confuse with dose (Gy) or dose rate (Gy/min).',
    reference: 'Historical standard. SI replacement: Becquerel (1975).'
  },

  // ── RADIOBIOLOGY ──────────────────────────────────────────────────────────
  {
    id: 7, term: 'Linear Energy Transfer (LET)', category: 'Radiobiology', examWeight: 3,
    shortDef: 'Energy deposited per unit track length (keV/μm). Governs RBE, OER, and DNA damage pattern.',
    details: 'LET = dE/dl (keV/μm). Restricted LET (L∞ or LΔ) excludes delta rays. Low LET (<10 keV/μm): X-rays, γ, electrons — sparse ionisations. High LET (>100 keV/μm): α, neutrons, C-ions — dense, clustered DSBs. LET determines: (1) OER (decreases as LET↑), (2) RBE (peaks ~100 keV/μm then decreases — overkill), (3) cell cycle position dependence (decreases with LET↑).',
    formula: 'LET (keV/μm): X-rays ~3; Co-60 γ ~0.3; Protons 0.5–50 (peak); α 80–200; C-ions 20–200',
    clinicalExample: 'Hypoxic glioblastoma: Low-LET photons need O₂ (OER=3) for full effect; neutrons/C-ions OER≈1 → effective regardless of hypoxia. Proton Bragg peak: LET↑ → variable RBE 1.1–1.7.',
    vivaAns: '"LET is the energy deposited per unit path length, measured in keV per micrometre. High-LET radiation causes dense, clustered DNA double-strand breaks that are more lethal and less repairable than the sparse damage of low-LET radiation. LET inversely correlates with OER and influences the peak RBE at around 100 keV/μm."',
    pitfall: 'RBE does not increase linearly with LET — it peaks ~100 keV/μm then DECREASES due to "overkill" (excessive energy wasted per cell). Carbon ions exploit this peak efficiently.',
    reference: 'Hall EJ, Giaccia AJ. Radiobiology for the Radiologist. 8th ed. 2019.'
  },
  {
    id: 8, term: 'Relative Biological Effectiveness (RBE)', category: 'Radiobiology', examWeight: 3,
    shortDef: 'RBE = Dose 250kVp X-ray / Dose test radiation, for identical biological effect.',
    details: 'Reference radiation: 250 kVp X-rays (ICRU standard). RBE depends on: (1) LET of test radiation, (2) dose per fraction (↓dose/fr → ↑RBE for high-LET), (3) biological endpoint, (4) tissue type (α/β), (5) dose rate. Clinical values: photons = 1.0 (by definition); protons = 1.1 (generic, may be 1.1–1.7 at Bragg peak); C-ions = 2–3; fast neutrons = 10; slow neutrons = 5; α = 20.',
    formula: 'RBE = D_ref / D_test (for equal biological effect) | wR (ICRP) approximates RBE for protection',
    clinicalExample: 'Proton therapy: CGE (cobalt gray equivalent) = proton dose × 1.1. 66 CGE prescribed = 60 Gy physical proton dose. C-ion skull base: 70.4 Gy(RBE) = higher physical dose effectiveness.',
    vivaAns: '"RBE is the ratio of the dose of 250 kVp X-rays to the dose of the test radiation producing the same biological effect under identical conditions. For clinical protons, RBE is conventionally fixed at 1.1, though variable RBE at the Bragg peak remains an area of active research and dosimetric concern."',
    pitfall: 'RBE = 1.1 for protons is a CLINICAL CONVENTION — not a biological constant. At the distal Bragg peak edge, RBE may be 1.5–1.7, raising concern for brainstem/optic nerve in SRS. Monte Carlo engines attempt to account for variable RBE.',
    reference: 'Paganetti H. Relative biological effectiveness in proton therapy. Br J Radiol. 2014. ICRU Report 78.'
  },
  {
    id: 9, term: 'Oxygen Enhancement Ratio (OER)', category: 'Radiobiology', examWeight: 3,
    shortDef: 'OER = Hypoxic dose / Oxic dose for same effect. Low-LET OER ≈ 2.5–3.0; High-LET OER → 1.0.',
    details: 'Oxygen "fixes" free-radical damage — converts labile carbon radicals to peroxy radicals (C-OO•) that cannot be chemically repaired (oxygen fixation hypothesis). Threshold pO₂ for full effect: ~8 mmHg (1%). Necrotic tumour core may be <1 mmHg → radioresistant. At LET ~100–200 keV/μm: direct action dominates, O₂ independent → OER approaches 1.',
    formula: 'OER = D_hypoxic / D_oxic (same biological effect) | For photons: OER = 2.5–3.0 | For α: OER ≈ 1.0',
    clinicalExample: 'Hypoxic head and neck tumour core: needs 2.5–3× higher photon dose for same kill as well-oxygenated rim. Strategies: (1) Nimorazole (DAHANCA), (2) accelerated RT to outpace repopulation, (3) carbon ions (OER≈1), (4) hyperbaric O₂ (historical).',
    vivaAns: '"OER is the ratio of radiation dose under hypoxic conditions to dose under oxygenated conditions for the same biological effect. For photons, OER is 2.5–3.0, meaning hypoxic cells are significantly radioresistant. High-LET radiation (alpha particles, carbon ions) has OER approaching 1.0 — a key advantage for hypoxic tumours."',
    pitfall: 'Hypoxia also activates HIF-1α, which promotes angiogenesis, invasion, and metastasis — not just radioresistance. ARCON (accelerated RT + carbogen + nicotinamide) addresses both hypoxia and repopulation simultaneously.',
    reference: 'Gray LH. Concentration of oxygen dissolved in tissues at time of irradiation. Br J Radiol. 1953. Hall & Giaccia ch. 6.'
  },
  {
    id: 10, term: 'Biologically Effective Dose (BED)', category: 'Radiobiology', examWeight: 3,
    shortDef: 'BED = nd[1 + d/(α/β)]. Quantifies true tissue-specific biological impact of a fractionation scheme.',
    details: 'Derived from LQ model: BED = Total Dose × Relative Effectiveness = nd[1 + d/(α/β)]. BED is tissue-specific (depends on α/β). BED_tumour: use α/β=10 Gy (acute); BED_late: use α/β=3 Gy (late). Cannot directly compare BED values across different α/β tissues. Use EQD2 for cross-comparison.',
    formula: 'BED = nd × [1 + d/(α/β)] where n=fractions, d=dose/fraction | BED_10: α/β=10 | BED_3: α/β=3',
    clinicalExample: 'Prostate SBRT 36.25 Gy/5fr: BED₁.₅ = 36.25×[1+7.25/1.5] = 36.25×5.83 = 211.5 Gy₁.₅. Conventional 78 Gy/39fr: BED₁.₅ = 78×[1+2/1.5] = 78×2.33 = 181.7 Gy₁.₅. SBRT delivers higher BED.',
    vivaAns: '"BED is derived from the linear-quadratic model and equals total dose multiplied by the relative effectiveness factor [1 + d/(α/β)]. It quantifies the true biological impact on a specific tissue type. BED of tumour and spinal cord for the same schedule will differ because their α/β values differ."',
    pitfall: 'BED cannot be directly summed across different α/β tissues. To sum EBRT + BT, convert each to EQD2 with the same α/β FIRST, then sum. BED is not in units of Gy2 — it is Gy (often subscripted with α/β used).',
    reference: 'Fowler JF. The linear-quadratic formula. Br J Radiol. 1989;62:679. Dale RG. Eur J Cancer. 1990.'
  },
  {
    id: 11, term: 'EQD2 (Equivalent Dose in 2 Gy fractions)', category: 'Radiobiology', examWeight: 3,
    shortDef: 'EQD2 = BED / [1 + 2/(α/β)]. Converts any schedule to biologically equivalent 2 Gy/fr dose.',
    details: 'Also called NTD (Normalised Total Dose). Allows: (1) Comparison of different schedules on same axis, (2) Summation of EBRT + BT doses (GEC-ESTRO cervix: EBRT EQD2 + BT EQD2 = total EQD2). Formula: EQD2 = nd × [(d + α/β)/(2 + α/β)].',
    formula: 'EQD2 = nd × (d + α/β) / (2 + α/β) | OR: EQD2 = BED / (1 + 2/[α/β])',
    clinicalExample: 'GEC-ESTRO cervix: EBRT 45 Gy/25fr (EQD2₁₀ = 46.9 Gy) + HDR BT 7 Gy×4fr (EQD2₁₀ = 47.6 Gy) = total EQD2₁₀ to tumour = 94.5 Gy. Late tissue (α/β=3): EBRT EQD2₃ = 52.5 + BT EQD2₃ = 63 Gy = 115.5 Gy₃ (constraint: OAR D2cc <75–90 Gy EQD2₃).',
    vivaAns: '"EQD2 converts any fractionation scheme to the equivalent dose if delivered in 2 Gy fractions, using the LQ model. EQD2 = nd × (d + α/β)/(2 + α/β). It enables summation of EBRT and brachytherapy contributions — essential for cervical cancer treatment planning per GEC-ESTRO guidelines."',
    pitfall: 'EQD2 must use the SAME α/β throughout a summation. Tumour EQD2 (α/β=10) cannot be added to late-tissue EQD2 (α/β=3). Calculate separately for each tissue type.',
    reference: 'Pötter R et al. EMBRACE. Radiother Oncol. 2021. GEC-ESTRO Recs. Dale RG. Br J Radiol. 2004.'
  },
  {
    id: 12, term: 'α/β Ratio', category: 'Radiobiology', examWeight: 3,
    shortDef: 'Dose (Gy) at which α and β components of LQ cell kill are equal. Determines fractionation sensitivity.',
    details: 'From LQ: lnS = −αD − βD². α/β = −α/β = dose where αD = βD². High α/β (8–12 Gy): early-reacting tissues + most tumours. Low α/β (1–5 Gy): late-reacting tissues + prostate/breast tumours. Low α/β → sensitive to dose per fraction (large fractions → proportionally more late damage). Key values: Spinal cord 2 Gy, Rectum 3 Gy, Lung 3 Gy, Parotid 3.5 Gy, Prostate 1.5 Gy (Brenner&Hall), Breast 4 Gy (START), H&N SCC 10–15 Gy.',
    formula: 'α/β (Gy) = inflection point of LQ survival curve. BED = D[1+d/(α/β)]',
    clinicalExample: 'Prostate (α/β=1.5 Gy): 5fr SBRT 36.25 Gy → BED₁.₅ = 211.5 Gy. Conventional 78 Gy/39fr → BED₁.₅ = 181.7 Gy. SBRT is MORE effective — exploits low α/β. Breast (α/β=4): START-B 40 Gy/15fr hypofractionation justified.',
    vivaAns: '"The α/β ratio is the dose at which the linear and quadratic components of cell kill are equal. High α/β tissues (mucosa, most tumours ~10 Gy) are relatively insensitive to fraction size. Low α/β tissues (spinal cord 2 Gy, prostate 1.5 Gy) are highly sensitive — large fractions cause disproportionately more damage, justifying hypofractionation for prostate cancer."',
    pitfall: 'Prostate α/β of 1.5 Gy (Brenner & Hall 1999) is widely cited but derived from clinical data — some estimates range 1.2–3.4 Gy. The principle (low α/β) is undisputed; the exact value has uncertainty. Use 1.5 Gy in exams unless stated otherwise.',
    reference: 'Brenner DJ, Hall EJ. Prostate α/β. IJROBP. 1999;45:1285. Fowler JF. Br J Radiol. 1989.'
  },
  {
    id: 13, term: 'Four Rs of Radiobiology', category: 'Radiobiology', examWeight: 3,
    shortDef: 'Repair, Repopulation, Redistribution, Reoxygenation. Withers 1975. Fifth R: Radiosensitivity.',
    details: 'REPAIR: SLD repair between fractions (6–24h) — normal tissue repairs more efficiently than tumour. REPOPULATION: tumour accelerated repopulation from ~4 weeks (H&N). Conventionally 5 fractions/week to exploit. REDISTRIBUTION: cycling cells move to radiosensitive G2/M during treatment course. REOXYGENATION: hypoxic tumour cells reoxygenate between fractions (shrinkage, vascular remodelling). Fifth R (Steel 1989): RADIOSENSITIVITY — intrinsic cellular sensitivity (determined by SF2).',
    formula: 'Accelerated repopulation kick-in time for H&N: ~21–28 days. Dose to compensate: ~0.6 Gy/day lost.',
    clinicalExample: 'H&N SCC treatment gap: each day lost after day 21 requires 0.5–0.7 Gy extra dose. DAHANCA 6&7: 6fr/week (tackle repopulation) → improved LC. Prostate: slow repopulation (T_d ~40d) → extended schedules tolerated.',
    vivaAns: '"The four Rs — Repair, Repopulation, Redistribution, and Reoxygenation — explain why fractionated radiotherapy is superior to a single dose for most tumours. A fifth R, Radiosensitivity, reflects intrinsic cellular sensitivity. These principles underpin all fractionation modifications: hyperfractionation exploits repair differences; accelerated RT counters repopulation."',
    pitfall: 'Fractionation exploits differential REPAIR kinetics (normal tissue repairs more). Fractionation EXPLOITS repopulation in normal tissue but must OUTPACE tumour repopulation — hence 5fr/week standard and penalties for treatment gaps.',
    reference: 'Withers HR. The four Rs of radiobiology. Adv Radiat Biol. 1975;5:241. Steel GG (5th R). 1989.'
  },
  {
    id: 14, term: 'TCP & NTCP', category: 'Radiobiology', examWeight: 3,
    shortDef: 'Sigmoid models of tumour control probability and normal tissue complication probability.',
    details: 'TCP: S-shaped (sigmoid) dose-response. TCP = e^[−N₀ × S(D)] where N₀ = initial clonogen number, S(D) = LQ survival. Factors ↑TCP: ↑dose, smaller tumour, ↑radiosensitivity. NTCP: also sigmoid. LKB model (Lyman-Kutcher-Burman): uses gEUD (generalised equivalent uniform dose) for DVH compression. Parallel OARs: volume effect critical (mean dose drives NTCP). Serial OARs: maximum dose drives NTCP.',
    formula: 'TCP = exp(−N × SF) | NTCP: LKB model gEUD = [Σ(vi × Di^(1/n))]^n where n = volume parameter',
    clinicalExample: 'Lung NTCP: V20<30% for <20% grade 2 pneumonitis risk (parallel OAR). Spinal cord NTCP: Dmax <45 Gy for <0.2% myelitis (serial — single max point, no volume correction). Therapeutic ratio = widest gap between TCP and NTCP curves.',
    vivaAns: '"TCP and NTCP are sigmoid probability models. The goal of radiation planning is to maximise TCP while minimising NTCP. The therapeutic ratio is the separation between these two curves. NTCP modelling uses different strategies for parallel OARs (mean/Vx dose) and serial OARs (Dmax)."',
    pitfall: 'TCP curves are steeper for small homogeneous tumours; larger/hypoxic tumours flatten the curve. NTCP for parallel organs (lung, liver, parotid) is driven by mean dose or volume histogram parameters — NOT Dmax alone.',
    reference: 'QUANTEC, IJROBP 2010;76(3 Suppl). Lyman JT. Complication probability as assessed from dose-volume histograms. Radiat Res. 1985.'
  },
  {
    id: 15, term: 'Hyperfractionation', category: 'Radiobiology', examWeight: 2,
    shortDef: 'Dose/fr <1.8 Gy, given BID. ↑total dose to tumour without ↑late toxicity. Exploits repair kinetics.',
    details: 'Rationale: Low α/β of late tissues → more spared per small fraction. Tumour (high α/β) responds proportionally less to small fractions — so total dose must increase to compensate. Key requirement: ≥6h interval between fractions for complete SLD repair in late tissues. CHART (continuous hyperfractionated accelerated RT): 54 Gy/36fr/12d (1.5 Gy TID, no weekend break) for NSCLC.',
    formula: 'If α/β_tumour=10, α/β_late=3: reducing fr from 2→1.2 Gy allows total dose ↑ by ~20% with same late BED',
    clinicalExample: 'EORTC 22791 H&N: 80.5 Gy/70fr/1.15 Gy BID vs 70 Gy/35fr — improved locoregional control. RTOG 9003: 4 arms; hyperfractionation (81.6 Gy) improved LC vs conventional at 2y. CHART NSCLC: 54 Gy in 12 days.',
    vivaAns: '"Hyperfractionation uses small doses per fraction (typically 1.2 Gy), given twice daily, to increase total dose without increasing late normal tissue injury. The minimum 6-hour inter-fraction interval is mandatory to allow complete sublethal damage repair. It exploits the differential α/β between late-reacting normal tissues (~3 Gy) and most tumours (~10 Gy)."',
    pitfall: 'Hyperfractionation ≠ Accelerated fractionation. Accelerated RT reduces overall time (tackles repopulation) but does NOT necessarily use smaller doses/fraction. CHART combines BOTH. Confuse these in viva and lose marks.',
    reference: 'Fu KK et al. RTOG 9003. IJROBP. 2000;48:7. Dische S. CHART. Lancet. 1997.'
  },
  {
    id: 16, term: 'Hypofractionation', category: 'Radiobiology', examWeight: 3,
    shortDef: 'Dose/fr >2.2 Gy, fewer fractions. Exploits low α/β tumours or physical precision (SBRT).',
    details: 'Two rationales: (1) Radiobiological: tumour has low α/β (prostate 1.5, breast 4 Gy) → large fractions relatively more effective per Gy vs late tissue. (2) Physical: SBRT precision limits OAR exposure regardless of high dose/fr. Extreme hypofractionation/SBRT: 5–20 Gy/fr in 1–5 fractions. BED >100 Gy₁₀ → additional mechanisms: vascular apoptosis, immune activation (cGAS-STING).',
    formula: 'EQD2 for prostate 36.25 Gy/5fr (α/β=1.5): = 36.25×(7.25+1.5)/(2+1.5) = 36.25×2.5 = 90.6 Gy₂ — far exceeds conventional 78 Gy',
    clinicalExample: 'CHHiP (2016): 60 Gy/20fr non-inferior to 74 Gy/37fr prostate. FAST-Forward (2020): 26 Gy/5fr non-inferior to 40 Gy/15fr breast. PACE-B (2022): 36.25 Gy/5fr prostate SBRT non-inferior. STEREOTACTIC SBRT lung: RTOG 0236 54 Gy/3fr (BED₁₀=151 Gy).',
    vivaAns: '"Hypofractionation uses doses greater than 2 Gy per fraction. For prostate cancer with α/β ~1.5 Gy, moderate hypofractionation (3 Gy/fr) and extreme hypofractionation/SBRT deliver higher BED to tumour relative to late normal tissue. CHHiP and FAST-Forward trials established hypofractionation as the new standard for prostate and breast respectively."',
    pitfall: 'Hypofractionation for late-responding tissue is HARMFUL unless total dose is reduced proportionally. Calculate EQD2 for BOTH tumour AND critical OARs when changing fractionation — the same schedule may be beneficial for tumour but exceed safe OAR dose.',
    reference: 'CHHiP: Dearnaley D. Lancet Oncol. 2016. FAST-Forward: Murray Brunt A. Lancet. 2020. PACE-B: Brand DH. Lancet Oncol. 2023.'
  },

  // ── PHYSICS ────────────────────────────────────────────────────────────────
  {
    id: 17, term: 'Inverse Square Law', category: 'Physics', examWeight: 3,
    shortDef: 'Intensity ∝ 1/d². Applies to point sources in free space. I₁/I₂ = d₂²/d₁².',
    details: 'For a point source isotropically emitting into space: intensity spreads over sphere surface = 4πr². Dose rate = I = k/d². Ratio: I₁/I₂ = d₂²/d₁². Important: applies strictly to POINT source in free space with no scatter. In clinical BT: inverse square dominates within first few cm. In EBRT: ISL contributes to SSD correction (F-factor for output).',
    formula: 'I₁/I₂ = d₂²/d₁² | Doubling distance → dose rate ×(1/2)² = 1/4 (75% reduction)',
    clinicalExample: 'BT: dose at 2 cm from Ir-192 source = dose at 1 cm × (1/2)² = 25%. HDR catheter dwell position optimisation exploits this steep gradient to protect OARs. EBRT: source at 80 SSD → 100 SSD: output factor = (80/100)² = 0.64.',
    vivaAns: '"The inverse square law states that radiation intensity is inversely proportional to the square of the distance from a point source. Doubling distance reduces intensity to one-quarter — a 75% reduction. This law underpins brachytherapy dosimetry and radiation safety room design."',
    pitfall: 'ISL does NOT account for scatter — in a clinical environment with scatter (walls, patient), dose falls less steeply than ISL predicts. Also, Co-60 source (1.5 cm diameter) is NOT a point source — geometric penumbra results.',
    reference: 'Khan FM. Physics of Radiation Therapy. 5th ed. ch. 7. AAPM TG-43 (BT dosimetry).'
  },
  {
    id: 18, term: 'Penumbra', category: 'Physics', examWeight: 2,
    shortDef: 'Dose transition region at field edges: 80%→20% isodose width. Components: geometric, transmission, scatter.',
    details: 'Geometric penumbra (dominant): P = s(SSD+d−SDD)/SDD where s=source size, SDD=source-diaphragm distance. Transmission penumbra: radiation through MLC leaf sides/ends. Physical penumbra: lateral scatter of electrons in medium. Co-60: large geometric penumbra (~1 cm) due to 1.5 cm source diameter. LINAC: smaller penumbra (focal spot ~2 mm). MLC leaf transmission: ~1–2%, adds to penumbra.',
    formula: 'P_geometric = s × (SSD + d − SDD) / SDD',
    clinicalExample: 'Co-60 vs 6 MV LINAC field edge: Co-60 penumbra ≈10 mm vs LINAC ≈4–5 mm. For brain SRS: sharp penumbra critical → LINAC HD120 MLC (2.5 mm leaves) or Gamma Knife (≤1 mm penumbra).',
    vivaAns: '"Penumbra is the region of dose falloff at the field edge, defined as the lateral distance between the 80% and 20% isodose lines. Its main component is geometric penumbra, determined by the source size. Cobalt-60 has a large penumbra (~1 cm) due to its 1.5–2 cm extended source, compared to the fine focal spot of a LINAC."',
    pitfall: 'Larger field size → more scatter → more physical penumbra contribution. MLC leaf design (tongue-and-groove, rounded leaf ends) creates complex penumbra that must be measured and modelled in TPS beam data commissioning.',
    reference: 'Khan FM ch. 4. AAPM TG-45: linac safety testing.'
  },
  {
    id: 19, term: 'Skin Sparing Effect', category: 'Physics', examWeight: 3,
    shortDef: 'MV beams: dose builds up to Dmax below skin surface. Spares basal layer. Dmax ∝ energy.',
    details: 'In MV beams: secondary electrons scatter predominantly forward. Dose builds from surface to Dmax (depth of electronic equilibrium). Surface dose = 15–40% (skin spared). Dmax values: 60Co = 0.5 cm; 4 MV = 1.0 cm; 6 MV = 1.5 cm; 10 MV = 2.5 cm; 15 MV = 3.0 cm; 18 MV = 3.3 cm. Skin sparing is LOST by: bolus, tangential beams, immobilisation devices in beam.',
    formula: 'Dmax (cm) ≈ 0.6 × MV (approximate) | Surface dose 6 MV ≈ 30%',
    clinicalExample: 'Post-mastectomy chest wall RT: skin is target → bolus (0.5–1 cm) placed to bring Dmax to surface. No bolus → adequate chest wall skin under-dosed. Scalp: no bolus needed if deep target; bolus mandatory for scalp scar treatment.',
    vivaAns: '"Skin sparing is the characteristic of megavoltage beams whereby the skin surface receives a fraction of the maximum dose due to the build-up region. At 6 MV, the surface dose is approximately 30% and Dmax is at 1.5 cm depth. This allows high doses to deep tumours without the severe skin reactions of orthovoltage. Skin sparing is eliminated by using bolus."',
    pitfall: 'Contaminant electrons from LINAC head/blocks raise surface dose above the ideal build-up region — 6 MV has higher surface contamination than 18 MV. Post-mastectomy RT: measure surface dose with TLDs or film to verify bolus adequacy.',
    reference: 'Khan FM ch. 10. AAPM TG-51: reference dosimetry.'
  },
  {
    id: 20, term: 'Percentage Depth Dose (PDD)', category: 'Physics', examWeight: 2,
    shortDef: 'PDD = (Dose at depth d / Dose at Dmax) × 100%. Varies with energy, depth, field size, SSD.',
    details: 'PDD = D_d/D_dmax × 100. Factors affecting PDD: (1) ↑Energy → ↑PDD (better depth penetration), (2) ↑Field size → ↑PDD (more scatter), (3) ↑SSD → ↑PDD (divergence effect), (4) ↑Depth → ↓PDD. Cobalt-60 PDD at 10 cm (10×10, 80 SSD): ~55%. 6 MV: ~67%. 18 MV: ~80%. Used in isocentric calculations: TMR (Tissue-Maximum Ratio) = depth dose relative to Dmax AT SAME point (isocentre).',
    formula: 'PDD(d,r,SSD) = 100 × D_d / D_dmax | TMR(d,r) = D_d / D_dmax(same_point)',
    clinicalExample: 'Deep-seated pelvic tumour (15 cm depth): 18 MV achieves ~75% PDD vs 6 MV ~50% → fewer monitor units, less integral dose. But 18 MV generates neutrons from linac head — consider for deep targets only, not SRS.',
    vivaAns: '"PDD is the ratio of dose at a given depth to the dose at Dmax, expressed as a percentage. It increases with higher beam energy, larger field size, and larger SSD. At 10 cm depth in a 10×10 cm field: Co-60 ≈55%, 6 MV ≈67%, 18 MV ≈80%."',
    pitfall: 'PDD is defined for a FIXED SSD setup. For isocentric (SAD) setup, use TMR (tissue-maximum ratio) or TPR (tissue-phantom ratio) instead. Confusing PDD with TMR is a common physics viva error.',
    reference: 'Khan FM ch. 9–10. BJR Supplement 25 (central axis depth dose data).'
  },

  // ── PLANNING ───────────────────────────────────────────────────────────────
  {
    id: 21, term: 'GTV / CTV / PTV (ICRU 50/62)', category: 'Planning', examWeight: 3,
    shortDef: 'ICRU volume hierarchy: GTV→CTV→PTV. Distinct conceptual layers for RT prescription.',
    details: 'GTV: visible/palpable tumour on imaging/exam (no microscopic extension). CTV: GTV + margin for subclinical disease (anatomical/biological — no uncertainty included). PTV: CTV + IM (internal margin for organ motion) + SM (setup margin for positioning uncertainty). PTV = geometric concept for dose prescription. PRV (Planning Risk Volume): OAR + motion/setup margin. ICRU-50 (1993), ICRU-62 (1999), ICRU-83 (2010, IMRT).',
    formula: 'PTV = CTV ⊕ IM ⊕ SM | Typical SM: 5–10 mm (CBCT-guided 3–5 mm)',
    clinicalExample: 'Prostate: GTV=prostate gland. CTV=prostate ± seminal vesicles ± nodes. PTV = CTV+5mm (sup/inf/lat), 7mm (post) when using daily CBCT. With MRI-LINAC: PTV=CTV+3mm. Tighter margins → less rectal dose.',
    vivaAns: '"The ICRU volume concept: GTV is the visible tumour; CTV adds a margin for microscopic spread and must be treated to curative dose; PTV adds geometric margins for setup uncertainty and organ motion to ensure the CTV receives the prescribed dose throughout treatment. PTV is a geometric, not biological, concept."',
    pitfall: 'GTV is not always present (post-op, prophylactic nodal RT). CTV-to-PTV margin must be independently derived for each institution based on their measured setup uncertainty (van Herk formula: M = 2.5Σ + 0.7σ). Do not use another centre\'s margins without validation.',
    reference: 'ICRU Report 50 (1993); Report 62 (1999); Report 83 (2010). Van Herk M. Semin Radiat Oncol. 2004.'
  },
  {
    id: 33, term: 'ICRU 89 (IGBT Cervix)', category: 'Techniques', examWeight: 3,
    shortDef: 'Modern standard for Image-Guided Brachytherapy (IGBT) in Cervical Cancer.',
    details: 'Shifts from Point A dosimetry to volume-based MRI-guided dosimetry. Defines HR-CTV (High Risk) and IR-CTV (Intermediate Risk). HR-CTV = GTV-B (at brachy) + entire cervix + suspicious extension. IR-CTV = HR-CTV + 5-15mm margin + initial GTV. Reporting: D90 (dose to 90% of volume) for HR-CTV; D2cm³ for OARs (rectum, bladder, sigmoid).',
    formula: 'Planning Aim: HR-CTV D90 > 85 Gy EQD2₁₀ | OAR D2cm³: Rectum < 75 Gy, Bladder < 90 Gy EQD2₃',
    clinicalExample: 'EMBRACE-I trial: MRI-guided IGBT achieved 92% local control at 5 years with low toxicity by adhering to ICRU 89 volume concepts.',
    vivaAns: '"ICRU 89 is the current standard for cervical cancer brachytherapy. It replaces the legacy Point A system with MRI-based volume definitions, specifically the HR-CTV and IR-CTV. It mandates reporting D90 for target coverage and D2cm³ for OAR sparing, allowing for dose escalation while maintaining safe limits for the rectum and bladder."',
    pitfall: 'Do not ignore Point A entirely; ICRU 89 still recommends reporting it for historical comparison and transition purposes.',
    reference: 'ICRU Report 89 (2016). Pötter R et al. Lancet Oncol. 2021.'
  },
  {
    id: 34, term: 'ICRU 83 (IMRT Reporting)', category: 'Planning', examWeight: 3,
    shortDef: 'Standard for prescribing, recording, and reporting IMRT.',
    details: 'Replaces point-based reporting (ICRU 50) with volume-based reporting. Primary reference dose is D50% (median dose). Near-max dose = D2%; Near-min dose = D98%. Defines Homogeneity Index (HI) and Conformity Index (CI). Recommends reporting the "Irradiated Volume" (low dose bath).',
    formula: 'HI = (D2% - D98%) / D50% | CI = V_RI / TV',
    clinicalExample: 'In a prostate IMRT plan, instead of saying "78 Gy to isocentre", we report "D50% = 78.2 Gy, D98% = 74.5 Gy, D2% = 81.1 Gy" to provide a complete picture of dose distribution.',
    vivaAns: '"ICRU 83 is the international standard for IMRT reporting. It shifts the focus from a single reference point to volume-based metrics, with D50% (the median dose) as the primary reporting point. It also introduces robust near-max and near-min metrics (D2% and D98%) to avoid single-pixel outliers in calculation grids."',
    pitfall: 'Using Dmax/Dmin instead of D2%/D98% is a common error; Dmax is too sensitive to calculation grid resolution.',
    reference: 'ICRU Report 83 (2010).'
  },
  {
    id: 22, term: 'DVH (Dose-Volume Histogram)', category: 'Planning', examWeight: 3,
    shortDef: 'Cumulative DVH: volume receiving ≥ dose D. Key metrics: Vx (volume at dose x), Dx (dose to volume x%).',
    details: 'Differential DVH: volume receiving dose within a small range. Cumulative (integral) DVH: volume receiving ≥ dose D. Key metrics: V20 (lung), V30, V40, Dmean, Dmax, D2cc (BT OAR). Cumulative DVH starts at 100% at D=0. Ideal OAR DVH: steep falloff at low dose. Ideal PTV DVH: near-vertical cliff at prescription dose (D95 ≥ prescribed dose).',
    formula: 'Vx = % volume receiving ≥x Gy | Dx = dose received by x% of volume | D2cc = dose to hottest 2 cc',
    clinicalExample: 'Lung constraints: V20 <30–35% (pneumonitis), Dmean <20 Gy. Cord: Dmax <45 Gy (1.8–2 Gy/fr). Rectal V70 <25% (prostate RT). Cervix BT: D2cc rectum <75 Gy EQD2₃, bladder <90 Gy EQD2₃. These are QUANTEC-derived (2010).',
    vivaAns: '"A DVH graphically summarises the dose distribution within a structure. The cumulative DVH plots the volume receiving at least a given dose. Key DVH metrics like V20 for lung (Vx = volume receiving ≥x Gy) and Dmax for serial OARs guide plan optimisation. DVH cannot tell you WHERE in the organ the dose is deposited."',
    pitfall: 'DVH compresses 3D dose information into 2D — it loses spatial information. Two plans with identical DVHs may have very different spatial dose distributions. For serial OARs (cord, bowel), location of hot spot matters as much as the DVH metric.',
    reference: 'QUANTEC, IJROBP 2010;76(3 Suppl). ICRU Report 83. AAPM TG-263 (nomenclature).'
  },
  {
    id: 23, term: 'QUANTEC Dose Constraints', category: 'Planning', examWeight: 3,
    shortDef: 'Evidence-based OAR dose-volume constraints. IJROBP 2010. Organ-specific parallel/serial classification.',
    details: 'Key QUANTEC constraints (conventional fractionation, ~2 Gy/fr): Spinal cord: Dmax 50 Gy (<0.2% myelitis); 45 Gy standard. Brain: V12Gy <10 cm³ (SRS; <5% radionecrosis). Brainstem: Dmax 54 Gy (<5% necrosis). Optic nerve/chiasm: Dmax 55 Gy (fractionated), <8–12 Gy SRS (single). Lung: V20 <30–35% (<20% pneumonitis G2), Dmean <20 Gy. Liver: Dmean <30–32 Gy (Child-Pugh A, RILD <5%). Rectum: V75 <15%, V70 <25%, V65 <35% (prostate standard). Heart: Dmean <26 Gy (<15% cardiac mortality), V25 <10% (pericarditis). Parotid: Dmean <26 Gy (<20% xerostomia) or mean contralateral <20 Gy. Kidney: Dmean <18 Gy bilateral (<5% insufficiency).',
    formula: 'Serial OAR → Dmax constraint dominant. Parallel OAR → Mean dose / Vx constraint dominant.',
    clinicalExample: 'Prostate IMRT: rectal V75<15% → allows dose escalation to 78–80 Gy. H&N IMRT: contralateral parotid mean <26 Gy (PARSPORT) → reduces xerostomia. Lung SBRT: different constraints from RTOG 0236/0618 (critical structure Dmax 1fr tables).',
    vivaAns: '"QUANTEC (2010) provides evidence-based dose-volume constraints for major OARs in conventional fractionation. Serial organs like the spinal cord are constrained by maximum dose; parallel organs like lung and liver are constrained by mean dose or volume parameters (V20, Dmean). These must be scaled using EQD2 when using hypofractionation or SBRT."',
    pitfall: 'QUANTEC constraints are for CONVENTIONAL fractionation (1.8–2 Gy/fr). For SBRT/SRS, use dedicated SBRT constraint tables (RTOG 0236, 0618, Timmerman organs-at-risk tables) — NOT QUANTEC numbers directly. Converting with EQD2 is acceptable if no SBRT-specific data exist.',
    reference: 'Marks LB et al. QUANTEC. IJROBP. 2010;76(3 Suppl):S1. Timmerman RD. SBRT constraints. J Clin Oncol. 2008.'
  },
  {
    id: 24, term: 'Therapeutic Ratio', category: 'Planning', examWeight: 3,
    shortDef: 'Ratio of doses producing 5% NTCP vs 95% TCP. Clinically: ability to cure without unacceptable toxicity.',
    details: 'Mathematical: TR = D(5%NTCP) / D(95%TCP). Clinical: the overlap region between TCP and NTCP curves. Widened by: (1) Physical precision (IMRT, IGRT, protons — reduce OAR dose), (2) Biological manipulation (radiosensitizers ↑TCP; radioprotectors ↓NTCP), (3) Dose escalation if OAR constraints allow, (4) Hypofractionation for low α/β tumours. Narrowed by: tumour adjacent to critical OAR, large volume, radioresistant histology.',
    formula: 'TR = D[5% NTCP] / D[95% TCP] → ideally >1.2',
    clinicalExample: 'Parotid tumour vs parotid OAR in same gland: narrow TR. IMRT salivary gland: dose painting allows target coverage while sparing contralateral gland. Cervix RT: BT provides rapid dose falloff (ISL) → wide TR vs EBRT alone.',
    vivaAns: '"The therapeutic ratio is the ratio of the dose producing 5% normal tissue complications to the dose achieving 95% tumour control. Every advance in radiation oncology — from fractionation to IMRT to proton therapy — aims to widen this ratio by either increasing TCP or decreasing NTCP."',
    pitfall: 'Always link therapeutic ratio to a SPECIFIC clinical example in the viva — abstract answers score fewer marks. Show how IMRT, BT, or protons specifically widen it for a named disease site.',
    reference: 'Suit H. The Gray Lecture 2001: coming technical advances in radiation oncology. IJROBP. 2002.'
  },

  // ── TECHNIQUES ─────────────────────────────────────────────────────────────
  {
    id: 25, term: 'IMRT / VMAT', category: 'Techniques', examWeight: 3,
    shortDef: 'IMRT: inverse-planned, non-uniform MLC fluence. VMAT (Otto 2008): continuous arc + dynamic MLC + variable dose rate.',
    details: 'IMRT inverse planning: clinician sets dose objectives (goals + constraints) → optimiser solves for MLC leaf sequences. Step-and-shoot: sequential segments. DMLC: continuously moving leaves. VMAT: gantry rotation + MLC + dose rate vary simultaneously → 2–4 min treatment. Clinical advantages: concave isodoses, simultaneous integrated boost (SIB). Disadvantages: increased monitor units (more leakage dose), longer planning time, requires QA (AAPM TG-119, TG-218).',
    formula: 'SIB BED: each voxel receives different d/fr → EQD2 must be computed per voxel: EQD2 = d(d+α/β)/(2+α/β)',
    clinicalExample: 'PARSPORT IMRT: contralateral parotid mean 26 Gy (IMRT) vs 45 Gy (3D-CRT) → 36% vs 74% grade ≥2 xerostomia. Prostate VMAT: rectal V70<20%, V50<50% achievable in 2 arcs. H&N SIB: 70/63/56 Gy to GTV/CTV-HiRisk/CTV-LoRisk in 35fr.',
    vivaAns: '"IMRT uses inverse planning to create non-uniform beam intensities via dynamic MLC motion, allowing concave dose distributions around OARs impossible with 3D-CRT. VMAT extends this to continuous arc delivery. The key advantage is superior OAR sparing — demonstrated in the PARSPORT trial for parotid sparing in H&N cancer."',
    pitfall: 'IMRT increases the total number of monitor units (3–5× 3D-CRT) → increases low-dose bath to the patient → small but real theoretical increase in secondary malignancy risk over decades. Relevant for young patients (paediatric, testicular).',
    reference: 'Nutting CM et al. PARSPORT. Lancet Oncol. 2011. AAPM TG-119 (IMRT commissioning).'
  },
  {
    id: 26, term: 'IGRT & CBCT', category: 'Techniques', examWeight: 3,
    shortDef: 'Onboard kV/MV imaging ± CBCT before/during treatment. Reduces inter-fraction setup error. Allows PTV margin reduction.',
    details: 'Inter-fraction motion: daily setup variation. Intra-fraction motion: prostate drift, breathing. CBCT: kV cone-beam CT acquired on LINAC. Compared to reference CT → 6DOF couch corrections. Protocols: soft tissue match (prostate) vs bony anatomy match (spine). 4D-CBCT: captures respiratory motion for SBRT. Alternatives: kV-kV orthogonal, Calypso (4D EM transponders), MR-LINAC real-time.',
    formula: 'PTV margin (van Herk): M = 2.5Σ + 0.7σ where Σ=systematic error, σ=random error (institution-specific)',
    clinicalExample: 'Prostate (daily CBCT soft-tissue match): PTV = CTV+5mm → reduces rectal V70 by 10–15% vs 10mm margin. Lung SBRT (CBCT + 4DCT): ITV (internal target volume) ± 3mm → PTV 8mm vs no IGRT 15mm.',
    vivaAns: '"IGRT uses onboard imaging, typically CBCT, to verify patient position relative to the reference treatment CT before each fraction. It corrects for inter-fraction positional variation, allowing reduction of PTV margins from ~10mm to 3–5mm. This is essential for SBRT/SABR and prostate IMRT where tight OAR constraints demand accurate target localisation."',
    pitfall: 'CBCT does NOT account for INTRA-fraction motion (prostate drift during treatment, breathing). For these, use real-time tracking (Calypso, gating, MRgRT). CBCT correction corrects the position at START of treatment, not during it.',
    reference: 'AAPM TG-179 (IGRT). Van Herk M. Semin Radiat Oncol. 2004;14:52.'
  },
  {
    id: 27, term: 'SRS & SBRT / SABR', category: 'Techniques', examWeight: 3,
    shortDef: 'SRS: intracranial, 1–5fr, submm precision. SBRT/SABR: extracranial, 1–5fr, ablative dose (BED₁₀ >100 Gy).',
    details: 'SRS: ≤4 fractions, <3 cm, stereotactic frame/mask. Brain mets: 1fr 12–24 Gy (margin dose); AVM; TN. SBRT/SABR: ≤5 fractions, extracranial. Lung: 54/3fr or 60/5fr (peripheral) or 50/5fr (central). Liver: 30–60 Gy/3–6fr. Spine: 16–24 Gy/1–3fr (ASTRO). Prostate: 36.25 Gy/5fr. Key requirement: ≥3 non-coplanar beams/arcs, CBCT each fraction, respiratory management, ≤5% isodose inhomogeneity within PTV accepted.',
    formula: 'BED₁₀ for 54 Gy/3fr = 54×(1+18/10) = 54×2.8 = 151.2 Gy₁₀ (ablative)',
    clinicalExample: 'RTOG 0236 (Timmerman 2010): 54 Gy/3fr peripheral NSCLC → 3y pLC 97.6%, 3y OS 56%. SABR-COMET (Palma 2019): SBRT to ≤5 oligomets → 5y OS 42% vs 18% SOC. SPINE (Sahgal): 24 Gy/2fr — cord Dmax <17 Gy/2fr (AAPM TG-101).',
    vivaAns: '"SBRT delivers ablative doses in 1–5 fractions using submillimetre precision, achieving BED₁₀ >100 Gy. The radiobiological mechanisms include conventional cell kill plus vascular endothelial apoptosis and immune activation. RTOG 0236 established 54 Gy/3fr as standard for peripheral early-stage NSCLC with 3-year local control >97%."',
    pitfall: 'SBRT "central zone" lung (within 2 cm of proximal bronchial tree): use 50 Gy/5fr (not 54/3fr) — 3fr schedule causes unacceptable central airway toxicity. Timmerman organ-at-risk tables for SBRT are MANDATORY and differ from QUANTEC conventional fractionation constraints.',
    reference: 'Timmerman R et al. RTOG 0236. JAMA. 2010. AAPM TG-101. ASTRO SBRT guidelines 2022.'
  },

  // ── SAFETY ─────────────────────────────────────────────────────────────────
  {
    id: 28, term: 'ALARA', category: 'Safety', examWeight: 2,
    shortDef: 'As Low As Reasonably Achievable. Three pillars: Time (↓), Distance (↑), Shielding (↑).',
    details: 'ICRP 103 principle. Requires balancing radiation dose reduction against economic and social factors. Dose limits (ICRP 103): Occupational: effective 20 mSv/yr (5y average), 50 mSv max single year; equivalent dose: lens 20 mSv/yr (2011 revised), extremities/skin 500 mSv/yr. Public: 1 mSv/yr effective. Emergency workers: 100 mSv (life-saving). Three pillars: TIME (minimise exposure duration), DISTANCE (ISL — doubling distance reduces dose 4×), SHIELDING (TVL/HVL calculations).',
    formula: 'HVL = 0.693/μ | TVL₁ = 3.32 × HVL | Transmission T = e^(−nHVL×0.693)',
    clinicalExample: 'HDR BT: remote afterloader eliminates staff dose (time=0 during treatment). Fluoroscopy: operator stands behind shield, uses shortest acquisition time. LINAC maze: barrier design uses TVL to calculate primary + scatter shielding.',
    vivaAns: '"ALARA requires that radiation doses be kept as low as reasonably achievable, accounting for economic and societal factors — not zero dose. It is implemented through three principles: minimising time, maximising distance (inverse square law), and optimising shielding. Dose limits under ICRP 103: occupational 20 mSv/yr effective dose; public 1 mSv/yr."',
    pitfall: '"Reasonably Achievable" is legally important — ALARA does not demand infinite reduction regardless of cost. Examiners penalise candidates who say "minimise dose to zero" — the principle is OPTIMISATION within constraints.',
    reference: 'ICRP Publication 103 (2007). AERB Regulations. NCRP Report 151 (linac shielding).'
  },
  {
    id: 29, term: 'Half-Value Layer (HVL) & TVL', category: 'Safety', examWeight: 2,
    shortDef: 'HVL: thickness reducing intensity by 50%. TVL: reduces to 10%. Used for shielding design.',
    details: 'HVL = 0.693/μ (where μ = linear attenuation coefficient). TVL₁ = 3.32 × HVL (for homogeneous beam). For heterogeneous beams: TVL₁ (primary) ≠ TVL_e (equilibrium/secondary). Narrow vs broad beam: broad beam attenuation is less than narrow (scatter adds to transmitted dose → use BSF). Primary barrier: handles direct beam. Secondary barrier: scattered + leakage. 6 MV primary TVL in concrete ≈ 34 cm; in lead ≈ 5.7 cm.',
    formula: 'HVL = 0.693/μ | TVL₁ = 3.32 HVL | n TVL needed = log₁₀(workload/design goal)',
    clinicalExample: 'LINAC bunker primary wall: 6 MV beam, workload W=450 Gy/wk. Design goal 0.02 mSv/wk public. TVL = 34 cm concrete. Number of TVLs = log₁₀(W × use factor / design goal). Typical primary wall: 150–200 cm concrete.',
    vivaAns: '"The HVL is the thickness of material that reduces radiation intensity by half; it equals 0.693 divided by the linear attenuation coefficient. The TVL (tenth-value layer) reduces intensity to 10% and equals 3.32 HVL. These parameters determine primary and secondary shielding requirements for LINAC bunker design per NCRP Report 151."',
    pitfall: 'HVL/TVL are energy-dependent. High-energy photons (18 MV) require thicker shielding than 6 MV. Also: 18 MV produces neutrons via (γ,n) photonuclear reaction — requires additional neutron shielding (polyethylene + boron). Standard concrete TVL calculations do NOT include neutron component.',
    reference: 'NCRP Report 151 (2005). McGinley PH. Shielding techniques for radiation oncology facilities.'
  },
  {
    id: 30, term: 'Bolus & Compensators', category: 'Techniques', examWeight: 2,
    shortDef: 'Bolus: tissue-equivalent material to eliminate skin sparing or fill surface irregularity. Compensator: custom attenuator for dose uniformity.',
    details: 'Bolus (flat, tissue-equivalent: wax, Superflab, wet gauze): (1) Bring Dmax to surface (skin = target: chest wall, scalp scar), (2) Fill surface irregularity (neck, chest wall post-mastectomy), (3) Increase surface dose for boost. Thickness: 0.5–1.5 cm. Compensator (custom-machined cerrobend/lead): modulates beam to produce uniform dose at depth accounting for irregular surface and internal heterogeneity. Replaced by IMRT/MLC for most applications.',
    formula: 'Compensator thickness at each point: t = [(D_prescribed - D_actual) × (μ_comp)] / μ_comp',
    clinicalExample: 'Post-mastectomy chest wall (CW) RT: 0.5–1.0 cm bolus on CW to boost skin to >95% prescription. Without bolus: CW skin receives ~50–60% dose. Scalp angiosarcoma: 1 cm bolus + electrons or VMAT. Bolus use reduces the skin-sparing advantage — justified only when skin is target.',
    vivaAns: '"Bolus is a tissue-equivalent material placed on the patient\'s skin to eliminate the skin-sparing effect of megavoltage beams, bringing the dose maximum to the surface. It is used when the skin itself is the target, such as post-mastectomy chest wall radiation or scalp tumours."',
    pitfall: 'Bolus must be in DIRECT CONTACT with skin — air gaps between bolus and skin create an unintended build-up region, partially restoring skin sparing and under-dosing the target. Air gap of even 3–5 mm significantly reduces surface dose.',
    reference: 'Khan FM ch. 12. AAPM TG-176 (bolus).'
  },
  {
    id: 31, term: 'Wedge Filter', category: 'Physics', examWeight: 2,
    shortDef: 'Attenuating beam modifier. Wedge angle = tilt of isodose at 10 cm depth. Hinge angle = 180° − 2× wedge angle.',
    details: 'Physical wedge: steel/lead, permanent tilt. Dynamic wedge: moving jaw creates equivalent tilt without extra material. Enhanced dynamic wedge (Varian EDW): most modern systems. Motorised wedge (Elekta). Wedge angle: angle between the tilted isodose line at 10 cm and the perpendicular. Hinge angle: θ_hinge = 180° − 2 × θ_wedge (for two-field wedge pair). Wedge transmission factor (WF): 0.2–0.8 (changes MU calculation).',
    formula: 'Hinge angle = 180° − 2 × Wedge angle | MU ∝ 1/WF (more MU needed with wedge)',
    clinicalExample: 'Breast tangents: 15° or 30° physical wedge corrects medial-lateral dose gradient (sloped chest wall). Hinge angle for two beams: if wedge 45°, hinge = 90° → beams perpendicular. Post-op parotid: wedge pair 45° to achieve homogeneous dose to triangular target.',
    vivaAns: '"A wedge filter is a beam modifier that produces a gradient in beam intensity, tilting the isodose curves. The wedge angle is the tilt of the isodose line at 10 cm depth. For a wedge pair, the optimal hinge angle is 180 minus twice the wedge angle. Modern LINACs use dynamic or motorised wedges eliminating the need for physical metal wedges."',
    pitfall: 'Physical wedge orientation matters: "heel" (thick end) attenuates more → isodose tilts toward toe (thin end). Inserting wedge upside down gives opposite tilt — a catastrophic error. Dynamic wedge polarity must be verified in QA.',
    reference: 'Khan FM ch. 11. AAPM TG-45.'
  }
];

const CAT_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Units:       { bg: 'bg-blue-950/30',   text: 'text-blue-400',   border: 'border-blue-800/30', dot: 'bg-blue-500' },
  Radiobiology:{ bg: 'bg-rose-950/30',   text: 'text-rose-400',   border: 'border-rose-800/30', dot: 'bg-rose-500' },
  Physics:     { bg: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-800/30', dot: 'bg-purple-500' },
  Planning:    { bg: 'bg-emerald-950/30',text: 'text-emerald-400',border: 'border-emerald-800/30', dot: 'bg-emerald-500' },
  Techniques:  { bg: 'bg-amber-950/30',  text: 'text-amber-400',  border: 'border-amber-800/30', dot: 'bg-amber-500' },
  Safety:      { bg: 'bg-gray-800/60',   text: 'text-gray-400',   border: 'border-gray-700/30', dot: 'bg-gray-500' }
};

const CATEGORIES = ['All', 'Radiobiology', 'Physics', 'Planning', 'Techniques', 'Units', 'Safety'];

const VivaDefinitionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showHigh, setShowHigh] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || (sec as any).title || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (sec.items || (sec as any).rows || []).map((item: any) => ({ k: item.label || item.k, v: item.value || item.v }))
  }));


  const filtered = useMemo(() => DEFS.filter(d =>
    (cat === 'All' || d.category === cat) &&
    (!showHigh || d.examWeight === 3) &&
    (!search || d.term.toLowerCase().includes(search.toLowerCase()) || d.shortDef.toLowerCase().includes(search.toLowerCase()))
  ), [search, cat, showHigh]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-24 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-purple-900/60 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-white">Viva Voce Definitions</h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">{DEFS.length} terms · 6 categories · Examiner-level · Guideline-referenced</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search term, formula, concept…"
            className="w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[13px] text-white placeholder-gray-600 outline-none focus:border-purple-700"/>
        </div>

        {/* Category filter + High-yield toggle */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                  cat === c ? 'bg-purple-700 border-purple-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setShowHigh(!showHigh)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
              showHigh ? 'bg-yellow-700 border-yellow-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
            ⭐ High
          </button>
        </div>
      </div>

      <div className="px-3 pt-2">
        {/* Stats */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {(['Radiobiology','Physics','Planning','Techniques','Units','Safety'] as const).map(c => {
            const st = CAT_STYLE[c];
            return (
              <div key={c} className={`${st.bg} border ${st.border} rounded-lg p-2 text-center`}>
                <div className={`text-sm font-black ${st.text}`}>{DEFS.filter(d=>d.category===c).length}</div>
                <div className="text-[10px] text-gray-600 leading-tight">{c.slice(0,5)}</div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-600 mb-2">{filtered.length} term{filtered.length !== 1 ? 's' : ''} shown{showHigh ? ' · ⭐ High-yield only' : ''}</p>

        {/* Definition list */}
        {filtered.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-8">No terms match your search.</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(def => {
              const st = CAT_STYLE[def.category];
              const open = expandedId === def.id;
              return (
                <div key={def.id} className={`border ${open ? st.border : 'border-gray-700/40'} rounded-xl overflow-hidden transition-all`}>
                  <button onClick={() => setExpandedId(open ? null : def.id)}
                    className="w-full flex items-start gap-2 p-3 text-left hover:bg-white/5 transition-all">
                    <div className="flex-shrink-0 mt-0.5 flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${st.dot}`}></div>
                      {def.examWeight === 3 && <span className="text-[10px]">⭐</span>}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{def.category}</span>
                        {def.examWeight === 3 && <span className="text-[10px] text-yellow-500 font-bold">HIGH YIELD</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{def.term}</h3>
                      <p className="text-xs text-gray-500 leading-snug">{def.shortDef}</p>
                    </div>
                    <svg className={`w-3 h-3 text-gray-600 flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {open && (
                    <div className="border-t border-gray-700/30 px-3 pb-3 pt-2 space-y-2.5">
                      {/* Definition */}
                      <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Definition</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{def.details}</p>
                      </div>

                      {/* Formula */}
                      {def.formula && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2">
                          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">📐 Formula / Values</p>
                          <p className="text-xs text-yellow-200 font-mono leading-relaxed">{def.formula}</p>
                        </div>
                      )}

                      {/* Clinical example */}
                      <div className={`${st.bg} border ${st.border} rounded-lg p-2`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${st.text}`}>⚡ Clinical Example</p>
                        <p className="text-xs text-gray-200 leading-relaxed">{def.clinicalExample}</p>
                      </div>

                      {/* Viva answer + pitfall */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-2">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">🎓 Model Viva Answer</p>
                          <p className="text-xs text-emerald-200 leading-relaxed italic">{def.vivaAns}</p>
                        </div>
                        <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-2">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">⚠️ Common Pitfall</p>
                          <p className="text-xs text-red-200 leading-relaxed">{def.pitfall}</p>
                        </div>
                      </div>

                      {/* Reference */}
                      <p className="text-xs text-gray-600 italic border-t border-gray-700/30 pt-2">{def.reference}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Viva Strategy */}
        <div className="mt-4 bg-gray-800/50 border border-gray-700/40 rounded-xl p-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">📋 Viva Strategy</h3>
          <div className="space-y-1.5">
            {[
              ['1', 'Start with DEFINITION (formula/units)', 'text-blue-400'],
              ['2', 'State SI UNIT and legacy equivalent', 'text-yellow-400'],
              ['3', 'Give CLINICAL SITE EXAMPLE (named trial)', 'text-green-400'],
              ['4', 'State KEY CONSTRAINT / QUANTEC value', 'text-orange-400'],
              ['5', 'Acknowledge LIMITATION or PITFALL', 'text-red-400'],
            ].map(([n, text, col]) => (
              <div key={n as string} className="flex items-start gap-2">
                <span className={`text-xs font-black ${col} flex-shrink-0`}>{n}.</span>
                <p className="text-xs text-gray-400">{text as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 pb-2 text-center border-t border-gray-800 mt-3">
          <p className="text-[8px] text-gray-700 uppercase tracking-widest font-bold">Rad-Calc Pro · RNT Medical College · Dr. Narendra Rathore</p>
          <p className="text-[8px] text-gray-700 mt-0.5">Khan · Hall & Giaccia · ICRU 50/62/83 · QUANTEC 2010 · ICRP 103</p>
        </div>
      </div>
    </div>
  );
};

export default VivaDefinitionsPage;