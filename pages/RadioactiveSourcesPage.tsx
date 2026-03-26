import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Source {
  id: string;
  name: string;
  symbol: string;
  Z: number;
  A: number;
  category: 'EBRT' | 'HDR' | 'LDR' | 'PDR' | 'Systemic-β' | 'Systemic-α' | 'Diagnostic';
  halfLife: string;
  halfLifeDays: number;
  energy: string;
  energyKeV: number;
  emissions: string[];
  hvlPb: string;
  tvlPb: string;
  specificActivity: string;
  rbe: string;
  let: string;
  production: string;
  decayProduct: string;
  pros: string[];
  cons: string[];
  clinicalUse: string[];
  dosimetry: string;
  shielding: string;
  idealFor: string;
  notIdealFor: string;
  physics: string;
  safetyClass: string;
  examPearls: string[];
  keyTrials: string[];
  bedExample?: string;
  activityRange?: string;
  oar?: string;
}

// ─── QUICK REF DATA ───────────────────────────────────────────────────────────
const QUICK_REF_DATA = {
  halfLives: [
    { label: 'Ir-192 (HDR)', value: '73.8 days' },
    { label: 'Co-60 (EBRT/HDR)', value: '5.27 years' },
    { label: 'I-125 (LDR)', value: '59.4 days' },
    { label: 'Pd-103 (LDR)', value: '17.0 days' },
    { label: 'Cs-131 (LDR)', value: '9.7 days' },
    { label: 'Y-90 (SIRT)', value: '64.1 hours' },
    { label: 'Lu-177 (Systemic)', value: '6.65 days' },
    { label: 'Ra-223 (Systemic)', value: '11.4 days' },
  ],
  energies: [
    { label: 'Ir-192 (Avg γ)', value: '380 keV' },
    { label: 'Co-60 (Avg γ)', value: '1.25 MeV' },
    { label: 'I-125 (Avg γ/X)', value: '28 keV' },
    { label: 'Y-90 (Max β)', value: '2.28 MeV' },
    { label: 'Ra-223 (Total α)', value: '~28 MeV' },
  ],
  hvl: [
    { label: 'Ir-192', value: '3.0 mm Pb' },
    { label: 'Co-60', value: '11.0 mm Pb' },
    { label: 'I-125', value: '0.025 mm Pb' },
    { label: '6 MV LINAC', value: '16.0 mm Pb' },
  ]
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SOURCES: Source[] = [
  // ══ EBRT ══
  {
    id: 'co60',
    name: 'Cobalt-60',
    symbol: '⁶⁰Co',
    Z: 27, A: 60,
    category: 'EBRT',
    halfLife: '5.27 years',
    halfLifeDays: 1925,
    energy: '1.17 MeV + 1.33 MeV (avg 1.25 MeV)',
    energyKeV: 1250,
    emissions: ['γ (two lines)', 'β⁻ (to Ni-60 stable)'],
    hvlPb: '11 mm Pb',
    tvlPb: '36 mm Pb',
    specificActivity: '1,131 Ci/g',
    rbe: '1.0 (reference)',
    let: '~0.3 keV/μm (low LET)',
    production: 'Neutron activation of ⁵⁹Co in nuclear reactor: ⁵⁹Co + n → ⁶⁰Co',
    decayProduct: '⁶⁰Ni (stable) via β⁻ emission',
    activityRange: '5,000–10,000 Ci at loading; Gamma Knife: 30 Ci/source × 192 sources',
    pros: [
      'No electricity required — works during power failures (ideal LMICs)',
      'Simple robust mechanics — minimal downtime, low maintenance cost',
      'Gamma Knife: 192 focused sources → highest precision intracranial SRS (<0.5 mm)',
      'Cost-effective: ~$500K–1M vs $3–5M LINAC installation',
      'Uniform predictable photon spectrum (two discrete lines vs LINAC bremsstrahlung)',
      'Source output reproducible — no klystron/magnetron drift',
      'Long clinical history: established PDD/TMR/TPR data, comprehensive beam commissioning library',
    ],
    cons: [
      'Large geometric penumbra (~1 cm) due to 1.5–2 cm source diameter — poor field sharpness',
      'Source decay ~1%/month → monthly output recalibration mandatory',
      'Cannot be switched off — heavy shielding required 24/7 even when idle',
      'Low Dmax (0.5 cm depth) — more skin dose than 6 MV LINAC (Dmax 1.5 cm)',
      'Lower PDD at 10 cm: ~55% vs 6 MV 67% — less depth penetration',
      'No electron beam mode available',
      'Radioactive waste: expensive long-term storage (53 years to background)',
      'Fixed photon energy — cannot optimise depth-dose for different tumour depths',
      'Source exchange every 5–8 years: radiation safety complexity, transport regulations',
    ],
    clinicalUse: [
      'Curative/palliative EBRT in LMICs (Africa, South Asia, Latin America)',
      'Gamma Knife (Leksell): gold standard intracranial SRS for AVM, mets, trigeminal neuralgia',
      'Theragun/Rotating gamma system: body SBRT (limited centres)',
      'Historical basis for all EBRT dosimetry references (IAEA TRS-277, TRS-398)',
    ],
    dosimetry: 'IAEA TRS-398: reference dosimetry at 5 cm depth in water, 10×10 cm field, 80 cm SSD. NK × kQ method. Ionisation chamber (Farmer-type). Output in cGy/MU (Co-60: cGy/s, calibrated in terms of air-kerma rate). Monthly output check mandatory due to 1%/month decay.',
    shielding: 'Primary barrier: TVL₁ = 36 mm Pb (primary). Secondary: scatter + leakage. Bunker walls typically 1.5–2 m concrete. Source storage: tungsten/depleted uranium shield in ON/OFF position. Transport: Type-B package (IAEA regulations, AERB).',
    idealFor: 'LMICs with unreliable power supply; Gamma Knife intracranial SRS; palliative EBRT in resource-limited settings',
    notIdealFor: 'Precision SBRT/SABR; electron therapy; sites requiring sharp penumbra (H&N IMRT); daily adaptive RT',
    physics: 'Decay: ⁶⁰Co → ⁶⁰Ni* → ⁶⁰Ni + 2γ (1.173 + 1.332 MeV). Source: cylindrical metallic pellets in stainless steel capsule, double encapsulation (ISO 2919). Compton scattering dominant at 1.25 MeV — bone/tissue differential absorption minimal. Build-up cap needed for calibration.',
    safetyClass: 'Category 1 (IAEA) — can be fatal within minutes if unshielded at close range',
    oar: 'Skin: Dmax 0.5 cm means 100% dose at surface → bolus-equivalent without bolus. Penumbra: 80–20% penumbra width ~10 mm vs LINAC ~4 mm',
    examPearls: [
      '1%/month source decay → dose rate falls from 200 cGy/min to 170 cGy/min over 5 years',
      'Gamma Knife: 192 Co-60 sources each 30 Ci → 5,760 Ci total → converges at isocentre',
      'Co-60 TVL: 36 mm Pb — 3 TVLs = 108 mm Pb reduces to 0.1% of primary',
      'Specific activity 1,131 Ci/g → compact source possible despite high activity',
      'Two γ lines at 1.173 and 1.332 MeV → "average" 1.25 MeV used in dosimetry',
      'f-factor (rad/R) for Co-60 in tissue = 0.957 (vs air = 0.876)',
      'Penumbra formula: P = s(SSD+d−SDD)/SDD; large source size s → large penumbra',
    ],
    keyTrials: [
      'Leksell 1968: First Gamma Knife use — framework for stereotactic radiosurgery',
      'RTOG 90-05: SRS dose prescription based on Co-60 Gamma Knife dosimetry',
      'Johns HE 1951: First clinical Co-60 unit at Victoria Hospital, London Ontario',
    ],
    bedExample: 'Gamma Knife AVM: 20 Gy/1fx → BED₃ = 20×(1+20/3) = 153 Gy₃ (ablative)',
  },
  {
    id: 'linac6mv',
    name: 'LINAC — 6 MV Photons',
    symbol: 'X (6MV)',
    Z: 0, A: 0,
    category: 'EBRT',
    halfLife: 'N/A (electrical)',
    halfLifeDays: 0,
    energy: '0–6 MeV bremsstrahlung (avg ~2 MeV)',
    energyKeV: 2000,
    emissions: ['X-rays (bremsstrahlung)', 'Electrons (contaminant)'],
    hvlPb: '16 mm Pb',
    tvlPb: '53 mm Pb',
    specificActivity: 'N/A',
    rbe: '1.0',
    let: '~0.3 keV/μm (low LET)',
    production: 'Electron gun → waveguide acceleration → tungsten target → bremsstrahlung X-rays',
    decayProduct: 'N/A — no radioactive waste',
    activityRange: 'Output: 400–600 MU/min (dose rate mode), up to 2400 MU/min (VMAT/FFF)',
    pros: [
      'Can be switched OFF instantly — no radiation when off (unlike Co-60)',
      'Sharp penumbra (4–5 mm) due to small focal spot (~2 mm) → precision IMRT/SBRT',
      'Multiple energies: 6, 10, 15, 18 MV + electron modes (4–20 MeV) on same unit',
      'IMRT/VMAT/SBRT capability with MLC — complex dose sculpting',
      'Higher PDD at 10 cm: ~67% (6 MV) vs 55% Co-60 → better depth penetration',
      'Skin sparing: Dmax 1.5 cm (6 MV) vs 0.5 cm Co-60',
      'No radioactive waste disposal issue',
      'FFF (Flattening Filter Free): 1400–2400 MU/min → ultra-fast SBRT delivery',
      'On-board kV/CBCT imaging for IGRT — same gantry',
      'MR-LINAC (Elekta Unity/ViewRay): simultaneous MRI + RT — online adaptive',
    ],
    cons: [
      'Requires electricity — fails in power outages (critical for LMICs)',
      'Complex engineering: klystron, magnetron, waveguide, MLC → higher maintenance cost',
      'Capital cost: $3–5M + infrastructure (vault, chiller, power)',
      'Annual maintenance: $200–400K/year vs $50K for Co-60',
      'Photon contamination of electron beams from scattering foil',
      '18 MV+ produces neutrons via (γ,n) reactions → activation of patient/room',
      'MLC leakage 1–2% → higher peripheral dose vs blocked fields',
      'Regular QA intensive: AAPM TG-142 monthly/annual tests mandatory',
    ],
    clinicalUse: [
      'All modern curative EBRT: IMRT, VMAT, SBRT, SRS (linac-based)',
      'Paediatric RT: multiple energies, electron therapy for superficial targets',
      'H&N IMRT: complex dose painting, salivary gland sparing (PARSPORT)',
      'Breast VMAT/tangents: cardiac sparing, FAST-Forward hypofractionation',
      'Prostate SBRT: 36.25 Gy/5fx (PACE-B standard)',
      'MR-LINAC: pancreas SBRT adaptive, prostate, rectum online replanning',
    ],
    dosimetry: 'IAEA TRS-398 / AAPM TG-51: reference dosimetry at 10 cm depth (10×10 cm, 100 cm SSD). kQ,Qo correction for beam quality. Absolute dose: 1 cGy/MU at reference conditions. Output constancy: ±2% tolerance (AAPM TG-142). Monthly output check, annual absolute calibration.',
    shielding: 'Primary TVL₁: 53 mm Pb / 340 mm concrete (6 MV). 18 MV: additional neutron shielding (polyethylene + boron). Maze design to attenuate scatter. NCRP Report 151 shielding calculations. Door: 25–50 mm Pb equivalent.',
    idealFor: 'All modern precision RT: IMRT, VMAT, SBRT, SRS; multi-energy needs; integrated IGRT; research centres',
    notIdealFor: 'LMIC without reliable power/engineers; simple palliative RT where Co-60 suffices economically',
    physics: 'Electrons accelerated to MeV energies in waveguide (standing/travelling wave). Hit tungsten target → bremsstrahlung spectrum (continuous 0 to peak energy). Flattening filter (FF) produces flat beam profile. FFF removes FF → higher dose rate, slightly peaked beam. MLC (80–160 leaves): leaf width 2.5–10 mm for field shaping.',
    safetyClass: 'No radioactive source — LINAC interlock system is primary safety (IAEA Class 5)',
    oar: 'MLC leakage: 1–2% through closed leaves. Tongue-and-groove effect: under-dose at leaf junctions. AAPM TG-119: IMRT dosimetry verification mandatory before first patient treatment.',
    examPearls: [
      '6 MV Dmax = 1.5 cm; 10 MV = 2.5 cm; 15 MV = 3.0 cm (approximately 0.6× energy in cm)',
      'FFF 6 MV: dose rate 1400 MU/min vs FF 600 MU/min → 60% faster SBRT delivery',
      '18 MV neutron production: patient activation → delayed gamma emission → staff dose concern',
      'AAPM TG-142: monthly output tolerance ±2%; annual mechanical ±1 mm isocenter',
      'Focal spot 2 mm → penumbra 4–5 mm (vs Co-60 source 15 mm → penumbra 10 mm)',
      'MLC leaf transmission 1–2% → IMRT increases total MU 3–5× → higher peripheral dose',
    ],
    keyTrials: [
      'PARSPORT (Nutting 2011): LINAC IMRT → 36% vs 74% grade ≥2 xerostomia reduction',
      'PACE-B (Brand 2023): 36.25 Gy/5fx LINAC SBRT non-inferior to EBRT for prostate',
      'FAST-Forward (2020): 26 Gy/5fx LINAC non-inferior to 40 Gy/15fx breast',
    ],
    bedExample: 'H&N IMRT 70 Gy/35fx: BED₁₀ = 70×(1+2/10) = 84 Gy₁₀ (standard curative)',
  },

  // ══ HDR ══
  {
    id: 'ir192',
    name: 'Iridium-192',
    symbol: '¹⁹²Ir',
    Z: 77, A: 192,
    category: 'HDR',
    halfLife: '73.8 days',
    halfLifeDays: 73.8,
    energy: '~380 keV (complex spectrum: 9 gamma lines, avg 350–380 keV)',
    energyKeV: 380,
    emissions: ['γ (multiple lines 295–612 keV)', 'β⁻ (to ¹⁹²Pt)'],
    hvlPb: '3.0 mm Pb',
    tvlPb: '10 mm Pb',
    specificActivity: '~9,600 Ci/g (HDR source: ~10 Ci / 370 GBq)',
    rbe: '1.0 (clinical convention)',
    let: '~0.4 keV/μm',
    production: 'Neutron activation: ¹⁹¹Ir + n → ¹⁹²Ir (nuclear reactor)',
    decayProduct: '¹⁹²Pt (38%) + ¹⁹²Os (62%) via β⁻ and electron capture',
    activityRange: 'HDR source: 10 Ci (370 GBq). LDR wire: 1–5 Ci. Source diameter: 0.86 mm (HDR); length 3.5–5 mm',
    pros: [
      'IDEAL HDR SOURCE: High specific activity → miniaturised 0.86 mm diameter source',
      'Remote afterloading eliminates staff radiation exposure completely',
      'Precise dwell position control (2.5 mm steps) → dose optimisation (IPSA, HIPO)',
      'Versatile: GYN, prostate, breast, skin, H&N, bronchus, oesophagus, rectum, bile duct',
      'Short treatment time (minutes) → outpatient HDR possible',
      'Physically small source → fits all standard applicators (ring, tandem, interstitial needles)',
      'GEC-ESTRO validated dosimetry: EQD2 summation for EBRT+BT combined treatment',
      'TG-43 dosimetry model: well characterised dose-rate tables, anisotropy functions',
      'Rapid dose falloff (inverse square law) → precise OAR sparing',
    ],
    cons: [
      'Short half-life 73.8 days → source exchange every 3–4 months (costly: ~$30K/source)',
      'High activity (10 Ci) requires dedicated HDR vault or mobile shield',
      'Complex equipment: afterloader motor, step-and-shoot mechanism, position verification',
      'Radioactive waste: ¹⁹²Ir classified as high-activity sealed source (IAEA Cat 2)',
      'Gamma energy 380 keV → significant scatter/penetration → staff shielding required during loading',
      'Source fracture/stuck source emergency: requires emergency response protocol',
      'TRAK (Total Reference Air Kerma) must be re-measured quarterly (source decay)',
    ],
    clinicalUse: [
      'GYN HDR: cervical cancer (tandem + ring/ovoid) — GEC-ESTRO EMBRACE protocol',
      'Prostate HDR boost: 15 Gy/1fx or 10.5 Gy/2fx — ASCENDE-RT trial',
      'Accelerated Partial Breast Irradiation (APBI): ICOS/ASBS protocols',
      'H&N: nasopharynx boost, oral cavity, lip, skin',
      'Endobronchial BT: haemoptysis, obstructive lung cancer',
      'Oesophageal BT: palliation of dysphagia (12 Gy/2fx)',
      'Rectal/Anal: boost with interstitial template',
      'Bile duct (PTBD-guided): cholangiocarcinoma intraluminal BT',
    ],
    dosimetry: 'AAPM TG-43/TG-43U1 formalism: D(r,θ) = Sk × Λ × G(r,θ)/G(r₀,θ₀) × g(r) × F(r,θ). Sk = Air kerma strength (measured quarterly in air at 1 m). Λ = dose rate constant. g(r) = radial dose function. F(r,θ) = anisotropy function. Treatment planning: IPSA (Inverse Planning Simulated Annealing) or HIPO. GEC-ESTRO: D90(HR-CTV) ≥85 Gy EQD2₁₀ for cervix.',
    shielding: 'HDR vault: mobile shield (40 mm Pb) or dedicated concrete vault. Radiation survey >25 μSv/h requires investigation. Emergency response: long-handled forceps, lead-lined container. Gamma camera survey after each treatment to confirm source retraction.',
    idealFor: 'GYN HDR (cervix, endometrium, vaginal vault); prostate HDR boost; APBI; any intracavitary/interstitial HDR',
    notIdealFor: 'Permanent implants (too short T½ and too high energy); systemic treatment; sites requiring permanent seed implant',
    physics: 'Complex decay scheme: 38% β⁻ to ¹⁹²Pt + 62% electron capture to ¹⁹²Os. Emits 9 principal γ lines (0.296–0.612 MeV). Mean energy 380 keV → dose fall-off: r² (inverse square) + attenuation. HVL 3 mm Pb → moderate penetration. Source encapsulation: 316L stainless steel welded capsule, double wall, laser weld tested to ISO 2919.',
    safetyClass: 'IAEA Category 2 — can cause permanent injury within hours of unshielded exposure',
    oar: 'Cervix HDR: D2cc rectum <75 Gy EQD2₃; D2cc bladder <90 Gy EQD2₃; D2cc sigmoid <75 Gy EQD2₃ (GEC-ESTRO EMBRACE)',
    examPearls: [
      'Source exchange every ~3 months: 73.8 days T½ → activity halves in 74 days',
      'HDR source diameter 0.86 mm → fits 1.3 mm inner diameter standard catheters',
      'Air kerma strength Sk units: U = 1 μGy·m²/h = 1 cGy·cm²/h',
      'TG-43: dose rate at 1 cm = Sk × Λ × 1/1² = Sk × 1.108 (for Ir-192)',
      'EMBRACE trial: D90≥85 Gy EQD2₁₀ → 3y LC 92%, OS 74% (cervix N=731)',
      'Inverse square law dominant within first 5 cm — dose at 2 cm = 25% of dose at 1 cm',
      '10 Ci source → dose rate at 1 cm ≈ 2–3 Gy/min → typical HDR treatment 3–10 min',
    ],
    keyTrials: [
      'EMBRACE (Pötter 2021): Image-guided BT cervix → D90 ≥85 Gy EQD2 → 92% 3y LC',
      'ASCENDE-RT (Morris 2017): HDR boost 115 Gy vs LDR 167 Gy PSA-RFS equal, HDR less toxicity',
      'APBI GEC-ESTRO trial: multicath Ir-192 APBI non-inferior to WBI for early breast',
    ],
    bedExample: 'Cervix HDR 7 Gy×4fx: BED₁₀ = 4×7×[1+7/10] = 47.6 Gy₁₀; EQD2₁₀ = 47.6/1.2 = 39.7 Gy',
  },
  {
    id: 'co60_hdr',
    name: 'Cobalt-60 (HDR)',
    symbol: '⁶⁰Co HDR',
    Z: 27, A: 60,
    category: 'HDR',
    halfLife: '5.27 years',
    halfLifeDays: 1925,
    energy: '1.25 MeV (avg)',
    energyKeV: 1250,
    emissions: ['γ (1.17 + 1.33 MeV)'],
    hvlPb: '11 mm Pb',
    tvlPb: '36 mm Pb',
    specificActivity: '1,131 Ci/g',
    rbe: '1.0',
    let: '~0.3 keV/μm',
    production: 'Reactor activation ⁵⁹Co + n → ⁶⁰Co',
    decayProduct: '⁶⁰Ni (stable)',
    activityRange: 'HDR source: 3,000–7,000 Ci (111–259 TBq) — MUCH higher than Ir-192',
    pros: [
      '5.27 year half-life → source change every 5–8 years (vs 3 months for Ir-192)',
      'Significant cost saving: one Co-60 source vs 15–20 Ir-192 replacements over same period',
      'IAEA PACT programme: promotes Co-60 HDR in LMICs as affordable alternative',
      'Output remains clinically useful for 5+ years with recalibration',
      'Robust, proven technology — Eckert & Ziegler Bebig GmbH MultiSource system',
    ],
    cons: [
      'Higher energy (1.25 MeV) → thicker vault shielding required vs Ir-192 (380 keV)',
      'Higher dose rate at distance → larger protection zone around HDR bunker',
      'Slightly larger source diameter → minor applicator compatibility issues vs 0.86 mm Ir-192',
      '1%/month output decay → frequent recalibration of dwell times (like teletherapy Co-60)',
      'Limited published TG-43 data vs extensive Ir-192 literature',
    ],
    clinicalUse: [
      'GYN HDR in LMICs (Eckert & Ziegler MultiSource system)',
      'Same clinical indications as Ir-192 HDR — GYN, prostate, APBI',
      'Increasingly adopted where Ir-192 supply chain is difficult',
    ],
    dosimetry: 'TG-43U1 formalism — same as Ir-192. Sk measured quarterly (slower decay than Ir-192). Dose-rate constant Λ slightly different due to different photon spectrum and encapsulation.',
    shielding: 'Significantly more shielding than Ir-192 due to 1.25 MeV gamma. TVL₁ 36 mm Pb vs 10 mm for Ir-192. Bunker wall: additional 30–50 cm concrete vs Ir-192 suite.',
    idealFor: 'LMIC HDR programmes; cost-constrained centres; where Ir-192 isotope supply is unreliable',
    notIdealFor: 'Centres with well-established Ir-192 supply chain and standard HDR vault (over-engineered shielding)',
    physics: 'Same Co-60 decay as teletherapy but much higher activity in compact source. The higher gamma energy (1.25 MeV vs 0.38 MeV for Ir-192) means MORE penetrating — requires heavier vault but also means slightly better tissue penetration for deep-seated implants.',
    safetyClass: 'IAEA Category 1 — potentially fatal within minutes unshielded at close range',
    oar: 'Same GEC-ESTRO constraints as Ir-192 HDR (dose is equivalent at clinical distances)',
    examPearls: [
      'Co-60 HDR source ~4,000 Ci vs Ir-192 HDR 10 Ci — 400× higher activity but similar clinical dose rates at implant distances due to different TG-43 parameters',
      'TVL Co-60 = 36 mm Pb vs Ir-192 = 10 mm Pb — 3.6× more lead shielding needed',
      'T½ 5.27 years: 1 source change per machine lifetime vs 15–20 changes for Ir-192',
      'Bebig MultiSource: uses 60Co miniature source 0.5 mm × 3.5 mm encapsulated',
    ],
    keyTrials: [
      'IAEA PACT: Global programme promoting Co-60 HDR as equitable access solution',
      'Strnad V 2011: Co-60 vs Ir-192 HDR interstitial breast — equivalent dosimetry',
    ],
    bedExample: 'Same BED calculations as Ir-192 (identical dose prescription)',
  },

  // ══ LDR ══
  {
    id: 'i125',
    name: 'Iodine-125',
    symbol: '¹²⁵I',
    Z: 53, A: 125,
    category: 'LDR',
    halfLife: '59.4 days',
    halfLifeDays: 59.4,
    energy: '27–35 keV (X-ray + γ)',
    energyKeV: 28,
    emissions: ['γ (35.5 keV)', 'X-rays (27–32 keV)', 'IC electrons', 'Auger electrons'],
    hvlPb: '0.025 mm Pb (near-zero)',
    tvlPb: '0.08 mm Pb',
    specificActivity: '2,189 Ci/g',
    rbe: '1.4 (some radiobiological data suggest higher at low dose rates)',
    let: '~1.2 keV/μm',
    production: 'Xe-124 + n → Xe-125 (T½=17h) → ¹²⁵I (electron capture) in reactor; or cyclotron',
    decayProduct: '¹²⁵Te (stable) via electron capture',
    activityRange: 'LDR prostate seed: 0.3–0.5 mCi/seed (0.3–0.43 U air kerma strength); 70–120 seeds per implant',
    pros: [
      'IDEAL LDR PROSTATE SOURCE: Low energy → minimal radiation to staff/public',
      'Permanent implant — no need to retrieve seeds',
      'Thin lead foil or simple distance protection adequate (0.025 mm Pb = HVL)',
      'Continuously decreasing dose rate exploits LDR radiobiology (repair of sublethal damage)',
      'Dose prescribed over T½ × 7 = 416 days (effectively complete at 3 T½ = 178 days)',
      'Outpatient procedure — day-case surgery',
      'NCRP 51: patients can return home same day (dose to public minimal)',
      'Established NIST traceable calibration (WAFAC method for LDR)',
      'Low dose rate (5–10 cGy/hr) → increased normal tissue repair between dose delivery',
    ],
    cons: [
      'Auger electrons: very short range (<0.1 mm) → most energy deposited near source',
      'Low energy → tissue attenuation significant at >5–8 cm',
      'Seed migration reported: ~1% seeds migrate to lung/lymph nodes (usually benign)',
      'Permanent implant: radiation precautions for patient (close contact, pregnancy near patient)',
      'Pre-plan or real-time US planning required: operator-dependent procedure',
      'Not suitable for large prostates >60 cc without ADT downsizing',
      'Urethral dose concern: D10 urethra constraint requires careful dosimetry',
      'Cannot modify dose after implant — irreversible',
      'Long treatment period (active irradiation for months) — psychological for patients',
    ],
    clinicalUse: [
      'LDR prostate brachytherapy: low-risk (NCCN preferred option) and select intermediate-risk',
      'COMS ophthalmic plaque: uveal melanoma (I-125 plaque, 85 Gy to apex)',
      'Brain tumour implants: glioblastoma (investigational, Gliasite)',
      'Lung: permanent seed implant for intraoperative tumour bed (investigational)',
    ],
    dosimetry: 'AAPM TG-43U1: Sk (air kerma strength in U = μGy·m²/h). Reference point dosimetry. V100, V150, D90 metrics. Prostate prescription: 145 Gy (monotherapy) or 110 Gy (boost). Post-implant CT/MRI at 4 weeks: D90 ≥130 Gy = adequate implant. NIST WAFAC calibration for LDR sources.',
    shielding: 'Essentially self-shielding within patient tissue. Patient: avoid prolonged close contact with pregnant women/children for 2 months (precautionary). Operating room: no specific vault required. Disposal: seeds decay in patient or collected at autopsy if clinically indicated.',
    idealFor: 'Low-risk prostate cancer LDR monotherapy; uveal melanoma ocular plaque; operator experienced in TRUS-guided implant',
    notIdealFor: 'Large prostates (>60 cc); prior TURP; intermediate/high risk disease (use HDR or EBRT); sites distant from implant area',
    physics: 'Electron capture: ¹²⁵I + e⁻ → ¹²⁵Te* → ¹²⁵Te + γ (35.5 keV) + X-rays + Auger e⁻. Very low energy photons → mean free path in tissue ~5 cm → dose localised to implant volume. TG-43 anisotropy function significant at ends of seed (seed end effects). Titanium encapsulation with radio-opaque X-ray marker.',
    safetyClass: 'IAEA Category 5 — unlikely to cause permanent injury (low activity/energy)',
    oar: 'Prostate LDR: D10 urethra <150% prescription (145 Gy → urethra <217 Gy). Rectal V100 <1.3 cc. D0.1cc rectum <200 Gy.',
    examPearls: [
      'HVL only 0.025 mm Pb → thin lead sheet blocks nearly all radiation',
      'Auger electrons: biological effectiveness may be higher for double-strand breaks near DNA',
      'Seed size: 4.5 mm × 0.8 mm titanium capsule — X-ray and MRI visible',
      '145 Gy prescription = total dose over all time (permanent implant)',
      'Post-implant D90 ≥130 Gy: biochemical control equivalent to radical prostatectomy',
      'ABS guideline 2012: I-125 preferred over Pd-103 for PSA <10, Gleason ≤6 (slower growing)',
    ],
    keyTrials: [
      'ProtecT trial (Hamdy 2016): LDR BT vs RP vs surveillance — equal 10y PCa mortality',
      'ASCENDE-RT (Morris 2017): LDR boost vs HDR boost — PSA-RFS equivalent at 9y',
      'COMS (Collaborative Ocular Melanoma Study): I-125 plaque vs enucleation — equal survival',
    ],
    bedExample: 'I-125 145 Gy LDR (dose rate 8 cGy/hr): BED₁.₅ = 145×[1 + (8 cGy/hr)/(0.1578 Gy/hr × 1.5)] = ~500 Gy₁.₅ (LDR BED formula)',
  },
  {
    id: 'pd103',
    name: 'Palladium-103',
    symbol: '¹⁰³Pd',
    Z: 46, A: 103,
    category: 'LDR',
    halfLife: '17.0 days',
    halfLifeDays: 17.0,
    energy: '20–23 keV (avg 21 keV)',
    energyKeV: 21,
    emissions: ['X-rays (20–23 keV)', 'Auger electrons', 'IC electrons'],
    hvlPb: '0.008 mm Pb',
    tvlPb: '0.03 mm Pb',
    specificActivity: '~76,800 Ci/g',
    rbe: '1.5–1.9 (estimated, based on higher dose rate vs I-125)',
    let: '~1.5 keV/μm',
    production: 'Cyclotron: ¹⁰³Rh + p → ¹⁰³Pd',
    decayProduct: '¹⁰³Rh (stable)',
    activityRange: '1.0–2.5 mCi/seed (initial activity); 90–120 seeds per prostate implant',
    pros: [
      'Shorter T½ (17d vs 59d for I-125) → faster dose delivery → theoretically better for faster-proliferating tumours',
      'Lower energy than I-125 → even greater self-shielding (0.008 mm Pb HVL)',
      'Higher initial dose rate (similar biology to HDR) → potential for faster tumour kill',
      'ABS: preferred for higher Gleason score intermediate-risk (faster tumour repopulation)',
      'Complete effective irradiation in ~5 T½ = 85 days (vs 5 months for I-125)',
    ],
    cons: [
      'Higher initial dose rate (20–30 cGy/hr vs 8 cGy/hr I-125) → more acute urinary symptoms',
      'Shorter T½: treatment "complete" in 3 months — less forgiving of poor implant geometry',
      'More expensive than I-125 seeds ($25 vs $15 per seed approximate)',
      'Less published long-term data than I-125',
      'Prescription dose higher (125 Gy vs 145 Gy I-125) reflects lower biologically effective dose per TG-43',
    ],
    clinicalUse: [
      'LDR prostate: intermediate-risk disease (Gleason 7, PSA 10–20)',
      'Prostate boost: 90–100 Gy Pd-103 + 40–50 Gy EBRT',
      'COMS ophthalmic plaque: uveal melanoma (less common than I-125)',
    ],
    dosimetry: 'TG-43U1 formalism. Prescription: 125 Gy (monotherapy) or 90–100 Gy (boost). Higher Λ (dose rate constant) than I-125. NIST calibration (WAFAC).',
    shielding: 'Even simpler than I-125 — 0.008 mm Pb HVL. Essentially no external shielding needed.',
    idealFor: 'Intermediate-risk prostate with higher Gleason score where faster dose delivery may benefit; operator preference',
    notIdealFor: 'Low-risk slow-growing prostate (I-125 equally effective with less acute toxicity)',
    physics: 'Electron capture → ¹⁰³Rh + characteristic X-rays (20–23 keV). Very low penetration in tissue. Higher dose rate than I-125 despite similar energy → radiobiology closer to HDR.',
    safetyClass: 'IAEA Category 5',
    oar: 'Prostate: D10 urethra <180% of 125 Gy prescription = <225 Gy. Rectal V80 <1 cc.',
    examPearls: [
      'Pd-103 vs I-125: shorter T½ → theoretical advantage for fast-proliferating tumours',
      'Prescription 125 Gy (Pd-103) vs 145 Gy (I-125) — both achieve similar BED to target',
      'ABS 2012: Pd-103 preferred for Gleason ≥7, I-125 for Gleason ≤6',
      'HVL = 0.008 mm Pb — aluminium foil would provide meaningful shielding',
    ],
    keyTrials: [
      'Potters L 2004: Pd-103 vs I-125 PSF — no significant difference in biochemical control',
      'ABS consensus 2012: both seeds appropriate, selection based on Gleason/PSA/dose rate preference',
    ],
    bedExample: 'Pd-103 125 Gy (dose rate 20 cGy/hr): BED₁.₅ higher than I-125 per Gy due to faster delivery',
  },
  {
    id: 'cs131',
    name: 'Cesium-131',
    symbol: '¹³¹Cs',
    Z: 55, A: 131,
    category: 'LDR',
    halfLife: '9.7 days',
    halfLifeDays: 9.7,
    energy: '29–34 keV (avg 29 keV)',
    energyKeV: 29,
    emissions: ['X-rays 29–34 keV', 'Auger electrons'],
    hvlPb: '0.025 mm Pb',
    tvlPb: '0.08 mm Pb',
    specificActivity: 'Very high (shortest T½)',
    rbe: '1.5–2.0 (estimated)',
    let: '~1.3 keV/μm',
    production: 'Cyclotron: ¹³⁰Ba(p,γ)¹³¹Cs or reactor neutron activation',
    decayProduct: '¹³¹Xe (stable) via electron capture',
    activityRange: '3.0–5.0 mCi/seed (highest initial dose rate of LDR seeds)',
    pros: [
      'Shortest T½ (9.7d) of clinical LDR seeds → treatment "complete" in ~7 weeks',
      'Highest initial dose rate → best for fastest-dividing tumours',
      'Intraoperative use: tumour bed implant immediately after resection (IORT equivalent)',
      'Brain tumour implants: tumour cell doubling time 2–7 days — faster delivery potentially beneficial',
      'Reduced radiation precautions period vs I-125 (3× faster decay)',
    ],
    cons: [
      'Very high initial dose rate → maximum acute toxicity',
      'Short T½: less forgiving of underdose — all energy delivered quickly, cannot compensate',
      'Most expensive LDR seed',
      'Limited long-term clinical data vs I-125',
      'Intraoperative setup complexity',
    ],
    clinicalUse: [
      'Brain tumour resection cavity: intraoperative permanent implant (GBM, metastases)',
      'Prostate LDR (limited centres): highest Gleason score intermediate-risk',
      'Head and neck: intraoperative implant at resection margin',
    ],
    dosimetry: 'TG-43U1. Prescription 115 Gy (monotherapy). Highest Λ among LDR seeds.',
    shielding: 'Similar to I-125 (same HVL). Shorter precautions period due to faster decay.',
    idealFor: 'Intraoperative tumour bed implant; fast-proliferating tumours; short radiation precautions needed',
    notIdealFor: 'Standard prostate LDR where I-125/Pd-103 have far more evidence base',
    physics: 'Electron capture → ¹³¹Xe + characteristic X-rays. Near-identical energy to I-125 but 6× faster decay → 6× higher initial dose rate for same prescription.',
    safetyClass: 'IAEA Category 5',
    oar: 'Similar constraints to I-125 prostate. Brain: avoid hippocampus, eloquent cortex.',
    examPearls: [
      'Cs-131 T½ 9.7d: fastest clinical LDR source — "complete" in 7 weeks',
      'Cs-131 fills niche between LDR and IORT for intraoperative applications',
      'Three LDR seed energies: Cs-131 (29 keV) ≈ I-125 (28 keV) > Pd-103 (21 keV)',
    ],
    keyTrials: [
      'Brachman D 2019: Cs-131 brain implant after resection — Phase II safety data',
      'Wernicke AG 2021: Cs-131 scalp/skull lesions intraoperative — excellent local control',
    ],
    bedExample: 'Cs-131 115 Gy at 50 cGy/hr initial: highest BED₁.₅ of LDR seeds due to dose rate',
  },
  {
    id: 'cs137',
    name: 'Cesium-137',
    symbol: '¹³⁷Cs',
    Z: 55, A: 137,
    category: 'LDR',
    halfLife: '30.1 years',
    halfLifeDays: 10987,
    energy: '662 keV',
    energyKeV: 662,
    emissions: ['γ (662 keV)', 'β⁻ (to Ba-137m)'],
    hvlPb: '5.5 mm Pb',
    tvlPb: '18 mm Pb',
    specificActivity: '88 Ci/g',
    rbe: '1.0',
    let: '~0.4 keV/μm',
    production: 'Nuclear fission byproduct: �²³⁵U fission → ¹³⁷Cs (fission fragment)',
    decayProduct: '¹³⁷Ba (stable) via β⁻ → Ba-137m → ¹³⁷Ba + γ 662 keV',
    activityRange: 'LDR tube/pellet: 10–50 mCi; Selectron LDR: 40 pellets at 40 mCi each',
    pros: [
      '30-year half-life → source lasts clinical machine lifetime without replacement',
      'Well-established LDR GYN dosimetry (Manchester system developed with Cs-137)',
      'No source exchange needed → long-term cost effective',
      'Simple dosimetry: single monoenergetic gamma line (662 keV)',
      'Remote afterloading (Selectron): eliminates staff dose during LDR insertions',
    ],
    cons: [
      'Now mostly REPLACED by Ir-192 HDR (faster, outpatient, better dose optimisation)',
      'High energy 662 keV → heavy shielding for LDR suite (5.5 mm Pb HVL)',
      'Inpatient hospitalisation required for LDR (2–3 days) → resource intensive',
      'No dose painting possible (fixed pellet positions vs programmable dwell times)',
      '30-year source: nuclear waste legacy — requires decades of storage/disposal',
      'Fission product — regulatory complexity for import/export',
    ],
    clinicalUse: [
      'Historical: GYN LDR (cervix, endometrium, vaginal cuff) — Manchester/Paris system',
      'PDR Cs-137: obsolete, replaced by Ir-192 PDR',
      'Still used in some LMICs with Selectron LDR remote afterloaders',
      'Calibration sources: Cs-137 reference for ionisation chamber calibration',
    ],
    dosimetry: 'Manchester/ICRU 38 system. Milligram-hours (mg·h) historical unit. Modern: TG-43 formalism adapted. Selectron: 48 pellet positions, 2.5 mm step. GYN dose points: ICRU rectal and bladder reference points.',
    shielding: 'LDR suite: 55 mm Pb equivalent (TVL 18 mm Pb × 3 = 54 mm). Patient room: lead-lined walls. Nursing staff: lead aprons mandatory during patient care. Remote afterloading removes source to safe when nurse enters.',
    idealFor: 'Historical context education; LMICs with existing Selectron systems; calibration reference',
    notIdealFor: 'New programme installation (Ir-192 HDR is superior in virtually all aspects)',
    physics: 'β⁻ decay to Ba-137m (T½=2.55 min) → 662 keV γ. Long T½ → minimal dose rate correction needed. Single energy line → well-characterised shielding calculation.',
    safetyClass: 'IAEA Category 3 — can cause permanent injury after hours of exposure',
    oar: 'Manchester system: rectal dose point A ≤6 Gy (LDR); ICRU 38 reference points for rectum/bladder documentation',
    examPearls: [
      'Manchester system Point A: 2 cm lateral to uterine canal, 2 cm superior to lateral fornix',
      'mg·h prescription: historical unit — 1 mg Ra equivalent = 1 mgRaEq = fixed activity standard',
      '30-year T½: one Cs-137 source serves entire clinical career of a radiation oncologist',
      'Cs-137 has essentially replaced Ra-226 but is itself now replaced by Ir-192 HDR',
    ],
    keyTrials: [
      'Manchester system (Paterson & Parker 1934): original dose distribution tables for Cs-137 GYN',
      'ICRU Report 38 (1985): bladder/rectal reference dose points — standardised LDR GYN dosimetry',
    ],
    bedExample: 'Cs-137 LDR cervix 70 Gy at 0.5 Gy/hr: BED₁₀ ≈ 70×[1+0.5/(10×0.05)] = 140 Gy₁₀',
  },
  {
    id: 'ra226',
    name: 'Radium-226',
    symbol: '²²⁶Ra',
    Z: 88, A: 226,
    category: 'LDR',
    halfLife: '1,600 years',
    halfLifeDays: 584000,
    energy: '830 keV (avg, complex spectrum)',
    energyKeV: 830,
    emissions: ['α (multiple)', 'β (multiple)', 'γ (multiple lines 0.18–2.4 MeV)', 'Radon-222 gas daughter'],
    hvlPb: '12 mm Pb',
    tvlPb: '40 mm Pb',
    specificActivity: '1 Ci/g (defines the Curie unit)',
    rbe: '1.0 (γ component)',
    let: 'Mixed — γ component low LET; α daughters high LET',
    production: 'Natural decay of ²³⁸U series. Originally from Joachimsthal mines (Curies, 1898)',
    decayProduct: '²²²Rn (Radon gas, T½=3.8d) → multiple daughters → stable ²⁰⁶Pb',
    activityRange: 'Historical: 0.5–50 mg needles/tubes for GYN, H&N, breast implants',
    pros: [
      'Historical ONLY: established all foundational brachytherapy dosimetry',
      '1,600-year T½ → source never needs replacement (used same needles for decades)',
      'Defined the Curie unit: 1 Ci = activity of 1 gram of Ra-226',
      'Marie Curie Nobel Prize 1911: Ra isolation enabled first brachytherapy treatments',
    ],
    cons: [
      'OBSOLETE — completely replaced. No new clinical use worldwide',
      'Radon-222 gas daughter: leaking needles → room contamination, inhalation hazard',
      'Complex decay chain → unpredictable dose with encapsulation failure',
      'Source fragility: needles crack → Ra powder release → contamination emergency',
      'Extreme radiotoxicity if ingested: bone-seeker → causes bone necrosis, leukaemia',
      '1,600-year T½ = permanent nuclear waste requiring centuries of storage',
      'Very high dose rates to staff: HVL 12 mm Pb → substantial shielding needed',
      'IAEA: Ra-226 orphan sources are major security concern worldwide',
    ],
    clinicalUse: [
      'HISTORICAL ONLY: GYN cancer (Paris 1903, Manchester 1930s), oral cavity, skin, breast',
      'Now found only in historical source inventories, museums, or orphan source incidents',
      'Educational: defines Curie, establishes basis for all BT dosimetry principles',
    ],
    dosimetry: 'mg-hour system: activity in mg Ra, time in hours. Equivalent mass (mgRaEq) still referenced in historical literature. Dose distributions: Paterson-Parker tables for needles/planar implants.',
    shielding: 'Historical: rubber gloves, forceps, lead screen. Modern: if encountered as orphan source — call national nuclear regulatory authority immediately.',
    idealFor: 'Historical education only — understanding the origins of brachytherapy',
    notIdealFor: 'Any clinical use — absolutely contraindicated in modern practice',
    physics: 'Complex decay chain: ²²⁶Ra → ²²²Rn (α, 3.8d) → ²¹⁸Po → ²¹⁴Pb → ²¹⁴Bi → ²¹⁴Po → ²¹⁰Pb → ²¹⁰Bi → ²¹⁰Po → ²⁰⁶Pb. Radon gas escape is the critical hazard — encapsulation breach releases invisible radioactive gas.',
    safetyClass: 'IAEA Category 1–2 (depending on activity) — ORPHAN SOURCE = major incident',
    oar: 'Not applicable — obsolete source',
    examPearls: [
      'Curie defined as activity of 1 gram Ra-226 = 3.7×10¹⁰ dps (now a unit not a substance)',
      'Ra-226 → Rn-222 daughter: radon gas escape = contamination emergency — sealed source CRITICAL',
      'Paterson-Parker tables: original dosimetry for planar/volume implants, still referenced historically',
      'Marie Curie likely died of aplastic anaemia from Ra-226 exposure (1934)',
      'Joachimsthal (Czech Republic): original Ra mining site; workers showed first radiation cancers',
    ],
    keyTrials: [
      'Curie M 1898: Ra-226 isolation — Nobel Prize Chemistry 1911',
      'Paterson R, Parker HM 1934: Manchester system dosimetry tables for Ra-226',
      'Regaud 1903: First GYN BT with Ra at Institut Curie, Paris',
    ],
    bedExample: 'N/A — obsolete. Historical: Ra needles prescribed in mg·hours',
  },

  // ══ SYSTEMIC β ══
  {
    id: 'i131',
    name: 'Iodine-131',
    symbol: '¹³¹I',
    Z: 53, A: 131,
    category: 'Systemic-β',
    halfLife: '8.02 days',
    halfLifeDays: 8.02,
    energy: 'β⁻ 606 keV (max 807 keV); γ 364 keV (81%)',
    energyKeV: 364,
    emissions: ['β⁻ (therapeutic)', 'γ 364 keV (imaging/contamination)'],
    hvlPb: '3.0 mm Pb',
    tvlPb: '10 mm Pb',
    specificActivity: '~125,000 Ci/g',
    rbe: '~1.0 (β)',
    let: 'β: 0.2–0.4 keV/μm (avg)',
    production: 'Nuclear fission byproduct; or Te-130(n,γ)Te-131→¹³¹I',
    decayProduct: '¹³¹Xe (stable) via β⁻',
    activityRange: 'Thyroid ablation: 30–100 mCi; Remnant ablation: 30–150 mCi; Metastatic DTC: 100–200 mCi; RAIR: 200–600 mCi',
    pros: [
      'Unique thyroid-specific uptake via NIS (sodium-iodide symporter) → exceptional tumour selectivity',
      'Thyroid ablation: most successful targeted radiotherapy in oncology (~95% cure DTC)',
      'Diagnostic (low dose) + therapeutic (high dose) with same isotope — theranostics paradigm',
      'Well-established dosing: 30–200 mCi based on remnant size/metastatic disease',
      'Oral administration: capsule or liquid — simple outpatient (low dose) or inpatient (high dose)',
      'I-131 MIBG: neuroblastoma, phaeochromocytoma (Azedra approved 2018)',
      'Low cost: widely available from fission reactors worldwide',
    ],
    cons: [
      'γ 364 keV → significant external exposure to staff/public → isolation required >600 MBq',
      'Thyroid stunning with diagnostic I-131: use I-123 for pre-therapy scan to avoid',
      'Radiation thyroiditis (acute): painful neck swelling 3–5 days post-therapy',
      'Sialadenitis: salivary gland inflammation (cumulative dose effect)',
      'Secondary malignancy risk (leukaemia): >600 mCi cumulative (small but documented)',
      'Female fertility: temporary amenorrhoea; avoid pregnancy 6–12 months post-therapy',
      'Dry eye/lacrimal duct injury: nasolacrimal drainage NIS uptake',
      'Requires low-iodine diet 2 weeks pre-therapy; TSH stimulation (rhTSH or withdrawal)',
    ],
    clinicalUse: [
      'Differentiated thyroid cancer (DTC): remnant ablation post-thyroidectomy (ATA guideline)',
      'Metastatic DTC: RAI-avid pulmonary/bone mets — 200 mCi doses',
      'RAIR (RAI-resistant): consider lenvatinib/sorafenib (ATA 2015)',
      'Graves disease/toxic nodule: 10–15 mCi ablation',
      'I-131 MIBG: neuroblastoma (paediatric), phaeochromocytoma (Azedra 500 mCi fixed dose)',
      'Dosimetric approach: Benua-Leeper dosimetry for metastatic disease',
    ],
    dosimetry: 'MIRD (Medical Internal Radiation Dosimetry): S-factors. Thyroid absorbed dose ≈ activity(MBq) × uptake(%) × 0.23 Gy/MBq·% (simplified). Post-therapy scan at 5–7 days (γ 364 keV imaging). Dosimetric maximum: 200 cGy whole blood dose; <80 mCi retained at 48h (lung mets protocol).',
    shielding: 'Isolation room: lead-lined walls (3 mm Pb). Toilet flushing precautions. Patient isolation: ≥600 MBq (inpatient) until <25 μSv/h at 1 m. Staff: dosimetry badges, thyroid bioassay monthly. Waste: decay-in-storage 10 T½ = 80 days before sewer disposal.',
    idealFor: 'Differentiated thyroid cancer post-thyroidectomy; RAI-avid metastases; Graves disease; I-131 MIBG tumours',
    notIdealFor: 'RAI-resistant DTC (BRAF V600E mutations); medullary/anaplastic thyroid (no NIS); non-NIS-expressing tumours',
    physics: 'NIS (sodium-iodide symporter): thyroid cells actively pump I⁻ against gradient using Na gradient (2Na⁺:1I⁻). TSH stimulates NIS expression 10×. β⁻ path length in tissue: 0.8 mm (mean) → crossfire effect for neighbouring cells. γ 364 keV: exits body → imaging and external dose to others.',
    safetyClass: 'IAEA Category 3–4 depending on activity',
    oar: 'Bone marrow: limit to 200 cGy (Benua-Leeper). Lung: <80 mCi/cycle if diffuse lung mets (radiation pneumonitis). Cumulative dose >600 mCi: leukaemia risk ~1%.',
    examPearls: [
      'NIS pump: 2Na⁺ in, 1I⁻ in — TSH stimulation 10× increases uptake',
      'Thyroid stunning: I-131 pretherapy scan reduces subsequent therapy uptake — use I-123 instead',
      'Benua-Leeper dosimetry: limits 200 cGy bone marrow, 80 mCi retained at 48h',
      'RAIR: often due to BRAF V600E → loss of NIS expression. Selumetinib can restore RAI uptake (Ho 2013)',
      'ATA 2015: low-risk DTC → no RAI benefit. High-risk: 100–200 mCi. Intermediate: selective use.',
    ],
    keyTrials: [
      'HiLo trial (Mallick 2012): 1.1 GBq vs 3.7 GBq — equal ablation success (low-risk DTC)',
      'IoN trial (Schlumberger 2012): rhTSH vs withdrawal — equal efficacy, better QoL with rhTSH',
      'Ho AL 2013 NEJM: Selumetinib restores RAI uptake in RAIR DTC — 63% PR',
    ],
    bedExample: 'I-131 thyroid: absorbed dose 50–300 Gy to thyroid (well above ablative threshold ~300 Gy for Graves)',
  },
  {
    id: 'lu177',
    name: 'Lutetium-177',
    symbol: '¹⁷⁷Lu',
    Z: 71, A: 177,
    category: 'Systemic-β',
    halfLife: '6.65 days',
    halfLifeDays: 6.65,
    energy: 'β⁻ 498 keV (max); γ 208 keV (11%), 113 keV (6%)',
    energyKeV: 208,
    emissions: ['β⁻ (therapeutic, 79% branching)', 'γ (imaging, 11% at 208 keV)'],
    hvlPb: '1.5 mm Pb',
    tvlPb: '5 mm Pb',
    specificActivity: '~940 Ci/g',
    rbe: '~1.0 (β)',
    let: 'β: 0.2–0.4 keV/μm',
    production: 'Reactor: ¹⁷⁶Lu(n,γ)¹⁷⁷Lu (direct); or ¹⁷⁶Yb(n,γ)¹⁷⁷Yb→¹⁷⁷Lu (indirect — higher purity)',
    decayProduct: '¹⁷⁷Hf (stable) via β⁻',
    activityRange: 'Lu-177-PSMA-617: 7.4 GBq/cycle × 6 cycles; Lu-177-DOTATATE: 7.4 GBq/cycle × 4 cycles',
    pros: [
      'IDEAL THERANOSTIC β SOURCE: β-therapy + γ-imaging with single isotope',
      'VISION trial: OS benefit in mCRPC (OS 15.3 vs 11.3 mo, HR 0.62) — FDA approved 2022',
      'NETTER-1: Lu-177-DOTATATE OS benefit in midgut NETs — FDA approved 2018',
      'Dual γ lines (208, 113 keV) allow SPECT dosimetry during treatment',
      'β range 0.67 mm mean (0.2–1.8 mm tissue range) → localised dose; minimal crossfire',
      'Low γ dose → outpatient administration feasible (vs I-131 inpatient)',
      'Peptide/antibody conjugation versatility: PSMA, DOTATATE, DOTA-antibodies',
      'T½ 6.65d: ideal balance of treatment duration and decay for repeated cycles',
    ],
    cons: [
      'Cost: $50,000–100,000 USD per treatment course (6 cycles)',
      'Requires matched Ga-68 PSMA/DOTATATE PET for patient selection (theranostic pair)',
      'Myelosuppression: grade 3–4 thrombocytopaenia in 8–9% (VISION)',
      'Renal dosimetry mandatory: kidney is dose-limiting organ (cold ALAC amino acids to reduce)',
      'Short half-life: shipping time constraints — must be produced near treatment centre',
      'Salivary gland toxicity: PSMA-617 uptake in parotids → xerostomia (grade 1–2 ~30%)',
      'Patient isolation: 24–48h post-injection recommended (γ component)',
    ],
    clinicalUse: [
      'Lu-177-PSMA-617 (Pluvicto/Lutetium vipivotide tetraxetan): mCRPC post-ARPI + taxane (VISION trial)',
      'Lu-177-DOTATATE (Lutathera): somatostatin receptor-positive midgut NETs (NETTER-1)',
      'Investigational: Lu-177-PSMA breast, melanoma, other PSMA-expressing tumours',
      'Lu-177-anti-CD20: B-cell lymphoma (emerging)',
    ],
    dosimetry: 'MIRD dosimetry + SPECT/CT post-injection (24h, 48h, 168h scans). Dosimetry-guided: kidney mean dose <23 Gy/cycle, <40 Gy cumulative (ALAC renal protection). Red marrow: <2 Gy/cycle. Tumour absorbed dose 20–100 Gy/lesion. EANM dosimetry guidelines 2021.',
    shielding: 'γ 208 keV: 1.5 mm Pb HVL. Standard nuclear medicine facility. Lead aprons for procedures. Patient: avoid prolonged close contact for 48h. Urine: radioactive waste disposal ≥10 T½ = 67 days decay-in-storage.',
    idealFor: 'mCRPC (PSMA+); midgut NETs (SSTR+); any PSMA/SSTR-expressing tumour confirmed on PET — theranostic approach',
    notIdealFor: 'PSMA-negative mCRPC (confirmed on PSMA PET); renal insufficiency (eGFR <30); extensive prior myelotoxic treatment',
    physics: 'Lu-177 β⁻ mean range 0.67 mm in tissue — shorter than I-131 (0.8 mm). Suitable for micrometastases (crossfire) but also for large lesions. γ 208 keV (11%) exits body → SPECT imaging for dosimetry without separate tracer. Peptide conjugate PSMA-617 targets PSMA (prostate-specific membrane antigen) on prostate cancer cells.',
    safetyClass: 'IAEA Category 4',
    oar: 'Kidney: most critical. ALAC amino acid infusion reduces kidney uptake 30–40%. Red marrow: CBC before each cycle. Salivary glands: cooling pads reduce PSMA uptake during injection.',
    examPearls: [
      'VISION trial: Lu-177-PSMA + SoC vs SoC — rPFS 8.7 vs 3.4 mo; OS 15.3 vs 11.3 mo (HR 0.62)',
      'NETTER-1: Lu-177-DOTATATE vs 30 Gy octreotide — PFS HR 0.18 (82% risk reduction)',
      'Theranostic pair: Ga-68-PSMA PET (diagnosis) + Lu-177-PSMA (therapy) — same ligand, different metal',
      '208 keV γ emission: enables SPECT dosimetry DURING treatment (no separate scan needed)',
      'ALAC (amino acid solution): lysine + arginine competitively inhibit renal tubular reabsorption of PSMA-617',
    ],
    keyTrials: [
      'VISION (Sartor 2021, NEJM): Lu-177-PSMA-617 mCRPC — OS benefit, FDA approval March 2022',
      'NETTER-1 (Strosberg 2017, NEJM): Lu-177-DOTATATE midgut NETs — PFS benefit, FDA approval 2018',
      'TheraP (Hofman 2021, Lancet): Lu-177-PSMA vs cabazitaxel mCRPC — PSA response 66% vs 37%',
    ],
    bedExample: 'Lu-177-PSMA: kidney absorbed dose 4–6 Gy/cycle × 6 = 24–36 Gy cumulative (below 40 Gy limit)',
  },
  {
    id: 'y90',
    name: 'Yttrium-90',
    symbol: '⁹⁰Y',
    Z: 39, A: 90,
    category: 'Systemic-β',
    halfLife: '64.1 hours',
    halfLifeDays: 2.67,
    energy: 'β⁻ 2.28 MeV (max), 0.935 MeV (avg) — PURE β emitter',
    energyKeV: 935,
    emissions: ['β⁻ (near-pure: >99.98%)', 'Bremsstrahlung X-rays (minor)', 'Positron (0.0032% — enables PET imaging)'],
    hvlPb: '7 mm Pb (bremsstrahlung)',
    tvlPb: '25 mm Pb',
    specificActivity: '~545,000 Ci/g',
    rbe: '~1.0 (β)',
    let: 'β: 0.2–0.5 keV/μm (avg)',
    production: 'Sr-90/Y-90 generator system (⁹⁰Sr T½=28.8y → ⁹⁰Y); or reactor production',
    decayProduct: '⁹⁰Zr (stable) via β⁻',
    activityRange: 'SIRT: 1–3 GBq per treatment; Zevalin: 11.1 MBq/kg (up to 1,184 MBq max)',
    pros: [
      'Pure β emitter → minimal external radiation exposure to staff/public (near-zero γ)',
      'High β energy (2.28 MeV max) → 11 mm mean tissue range → excellent for large liver tumours',
      'SIRT (SIR-Spheres/TheraSphere): selective hepatic intra-arterial delivery → high tumoural dose',
      'Short T½ 64h → treatment complete in ~7 days',
      '⁹⁰Y PET possible via positron (0.003%): PET/CT at 1–4h post for dosimetry verification',
      'Zevalin (ibritumomab tiuxetan): anti-CD20 Ab-Y90 conjugate — lymphoma treatment',
      'Dose rates achievable: >100 Gy to liver tumours (ablative)',
    ],
    cons: [
      'Pure β → CANNOT image with standard gamma camera (no useful γ emission)',
      'Requires pre-treatment ⁹⁹ᵐTc-MAA hepatic perfusion scan for lung shunt fraction',
      'Radiation pneumonitis: if lung shunt >20% → contraindicated',
      'Short T½ → logistics: must treat within hours of delivery from generator',
      'High energy β → Perspex/acrylic shielding mandatory (NOT lead — bremsstrahlung would increase)',
      'No in-vivo dosimetry easily available (rely on pre-treatment calculation)',
      'Biliary toxicity: radiation cholecystitis, biliary stricture from non-target delivery',
    ],
    clinicalUse: [
      'SIRT (Selective Internal Radiation Therapy): HCC, liver metastases (CRC, NETs, breast)',
      'TheraSphere (glass microspheres): HCC, portal vein thrombosis — 20,000–40,000 Gy to tumour',
      'SIR-Spheres (resin): colorectal liver mets + chemotherapy (SIRFLOX)',
      'Zevalin (ibritumomab tiuxetan): relapsed/refractory follicular NHL (FDA approved 2002)',
      'Radiosynovectomy: ⁹⁰Y silicate for knee joint (inflammatory arthritis)',
    ],
    dosimetry: 'MIRD dosimetry: pre-treatment ⁹⁹ᵐTc-MAA mimics Y-90 distribution. Lung shunt fraction must be <10–20%. Tumour absorbed dose target: ≥120 Gy (HCC TheraSphere). SIRTEX partition model. Post-treatment: ⁹⁰Y PET/CT at 2–4h confirms distribution.',
    shielding: 'β shielding: Perspex/acrylic (NOT lead — bremsstrahlung). 8 mm acrylic reduces surface dose 99%. Syringe shield: acrylic/lucite. No special patient isolation required (no γ). Disposal: 10 T½ = 27 days decay-in-storage.',
    idealFor: 'Hepatic SIRT (HCC, liver mets); Y-90 Zevalin lymphoma; large tumour volumes requiring high-dose β therapy',
    notIdealFor: 'Extrahepatic disease dominant; lung shunt >20%; severe liver failure; non-SIRT applications where imaging required',
    physics: 'Near-pure β emitter (>99.98%). β max energy 2.28 MeV → mean tissue range 11 mm → crossfire effect for cells up to 11 mm from labelled microsphere. Bremsstrahlung from high-energy β + tissue → continuous X-ray spectrum (usable for imaging but low yield). PET via 0.0032% positron emission → ⁹⁰Y PET/CT feasible at 1h post-injection.',
    safetyClass: 'IAEA Category 3',
    oar: 'Liver: non-tumour liver V30 <70% for Child-Pugh A. Lung: mean lung dose <25 Gy (SIRT). GI: non-target deposition → radiation gastritis/duodenitis (pre-coil prophylaxis).',
    examPearls: [
      'Pure β: shield with Perspex NOT lead (Bremsstrahlung increases if lead used)',
      '⁹⁰Y PET via 0.0032% positron: enables post-therapy dosimetry without separate tracer',
      'TheraSphere: glass microspheres, 20–40 Gy/microsphere, 40–80 Gy/kg liver dose',
      'Lung shunt >20%: absolute contraindication for SIRT (radiation pneumonitis risk)',
      'Zevalin: first FDA-approved radioimmunotherapy — anti-CD20 Ab + Y-90',
    ],
    keyTrials: [
      'SIRFLOX (Van Hazel 2016): SIRT + FOLFOX vs FOLFOX alone — PFS benefit liver mets CRC',
      'SARAH (Vilgrain 2017): SIRT vs sorafenib HCC — no OS benefit but PFS benefit',
      'Cady B 1998: TheraSphere HCC pilot — high complete response rates',
    ],
    bedExample: 'SIRT TheraSphere: 120 Gy tumour dose → BED₁₀ impossible to calculate (microsphere continuous irradiation): dose rate physics applies',
  },

  // ══ SYSTEMIC α ══
  {
    id: 'ra223',
    name: 'Radium-223',
    symbol: '²²³Ra',
    Z: 88, A: 223,
    category: 'Systemic-α',
    halfLife: '11.4 days',
    halfLifeDays: 11.4,
    energy: 'α 5.78 MeV (principal) + decay chain α/β; total α energy ~28 MeV',
    energyKeV: 5780,
    emissions: ['α (4 per decay chain)', 'β⁻ (minor)', 'γ (minor, 82 keV)'],
    hvlPb: 'α: 0.04 mm air (paper stops α); γ: 0.3 mm Pb',
    tvlPb: 'α self-shielding in body; γ: 1 mm Pb',
    specificActivity: '~52,000 Ci/g',
    rbe: '20 (α particles — ICRP wR)',
    let: '80–230 keV/μm (HIGH LET)',
    production: 'Decay generator: ²²⁷Ac (T½=22y) → ²²³Ra (generator-based)',
    decayProduct: '²²³Ra → ²¹⁹Rn → ²¹⁵Po → ²¹¹Pb → ²¹¹Bi → ²⁰⁷Tl → ²⁰⁷Pb (stable)',
    activityRange: 'Xofigo: 55 kBq/kg IV × 6 cycles at 4-week intervals',
    pros: [
      'FIRST RT AGENT WITH OS BENEFIT IN SOLID TUMOUR (ALSYMPCA 2013)',
      'α particles: 80–230 keV/μm HIGH LET → dense DNA double-strand breaks → OER ~1',
      'Path length only 2–10 cell diameters → precise bone marrow sparing',
      'Ca²⁺ mimetic: naturally targets bone metastases (hydroxyapatite incorporation)',
      'No need for companion diagnostic in approved indication (mCRPC symptomatic bone mets)',
      'Simple IV administration: 55 kBq/kg, outpatient, no isolation required',
      'RBE 20× — clinically equivalent to 20× higher photon dose',
      'Minimal γ emission → essentially no external radiation hazard to staff/public',
      'ALSYMPCA: OS benefit 14.9 vs 11.3 mo (HR 0.70), reduced SREs',
    ],
    cons: [
      'Bone-only metastases indication: NOT for visceral metastases or lymph node-only disease',
      'EMA/FDA warning: combination with abiraterone + prednisone increased fractures/mortality (ERA 223)',
      'Myelosuppression: grade 3–4 neutropaenia 2–3%, thrombocytopaenia 6%',
      'Limited to 6 cycles — no established re-treatment protocol',
      'Narrow indication: mCRPC + symptomatic bone mets + no visceral mets + post-docetaxel or unfit',
      'Not available in all centres (supply chain ²²⁷Ac generator)',
      'Rn-219 daughter gas: theoretical concern but negligible at clinical doses',
    ],
    clinicalUse: [
      'mCRPC (Xofigo): castration-resistant prostate cancer, symptomatic bone mets, no visceral mets',
      'Investigational: Ac-225-PSMA (next generation α therapy) — TAT (targeted alpha therapy)',
      'Investigational: breast cancer bone mets (RADIUM-4 trial)',
      'Combines with ARPI: cabozantinib (COMET trials) — visceral mets question',
    ],
    dosimetry: 'MIRD-based: bone surface absorbed dose 1–2 Gy per cycle (but high RBE × 20 = effective 20–40 Gy equivalent). Red marrow: 0.1–0.3 Gy/cycle × 6 = 0.6–1.8 Gy. Bone surface: target organ — exact dosimetry difficult in vivo. EANM dosimetry working group Ra-223.',
    shielding: 'α: paper/thin plastic — completely stopped. γ 82 keV (minor): routine precautions. Patient: no isolation needed. Urine/faeces: precautionary handling 1 week. Staff: gloves for preparation. Lead apron not required for α component (unnecessary, bremsstrahlung minimal).',
    idealFor: 'mCRPC with symptomatic bone mets, no visceral disease, CRPC stage; α therapy biology education',
    notIdealFor: 'Visceral metastases (lung, liver, brain involvement); lymph node dominant disease; combination with abiraterone+prednisone (ERA 223 safety signal)',
    physics: 'Ca²⁺ mimicry: Ra²⁺ ion (same charge/size as Ca²⁺) → preferential uptake at osteoblastic bone met sites. α particles: 5.78 MeV, range 40–80 μm tissue (2–10 cell diameters). 4 α particles per complete decay chain → dense DSB clusters → non-repairable damage. OER ~1 → effective against hypoxic bone met cells. HIGH LET: DNA damage from single α track equivalent to multiple photon hits.',
    safetyClass: 'IAEA Category 4 (low external hazard due to α, but internal contamination is serious)',
    oar: 'Bone marrow: primary concern. CBC monthly. Hold if ANC <1,500/μL or platelets <50,000/μL. No specific DVH constraint — systemic agent.',
    examPearls: [
      'FIRST and ONLY RT agent to show OS benefit in solid tumour at time of approval (ALSYMPCA 2013)',
      'RBE = 20: 55 kBq/kg × RBE 20 = biologically equivalent to much higher photon dose',
      'Path length 40–80 μm: ONLY 2–10 cell diameters → bone-marrow sparing by geometry',
      'ERA 223: Ra-223 + abiraterone + prednisone → increased fractures → BLACK BOX WARNING',
      'Ca²⁺ mimicry: same charge (+2) and ionic radius as Ca²⁺ → same bone uptake mechanism',
      'High LET → OER ~1: effective regardless of tumour oxygenation status at bone met sites',
    ],
    keyTrials: [
      'ALSYMPCA (Parker 2013, NEJM): Ra-223 vs placebo mCRPC — OS 14.9 vs 11.3 mo, HR 0.70',
      'ERA 223 (Smith 2019): Ra-223 + abiraterone — increased fractures/mortality → WARNING',
      'RADIUM-4: Ra-223 in breast cancer bone mets — ongoing',
    ],
    bedExample: 'Ra-223 α particles: BED concept not directly applicable (LET-based damage). Physical dose 1–2 Gy × RBE 20 = ~20–40 Gy equivalent biological dose per cycle.',
  },
];

const CAT_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: string }> = {
  EBRT:       { label: 'EBRT/Teletherapy', color: 'text-sky-400',    bg: 'bg-sky-950/40',    border: 'border-sky-700/40',    dot: 'bg-sky-500',    icon: '☢' },
  HDR:        { label: 'HDR Brachytherapy', color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-700/40', dot: 'bg-orange-500', icon: '⚡' },
  LDR:        { label: 'LDR Brachytherapy', color: 'text-yellow-400', bg: 'bg-yellow-950/40', border: 'border-yellow-700/40', dot: 'bg-yellow-500', icon: '🌱' },
  PDR:        { label: 'PDR Brachytherapy', color: 'text-lime-400',   bg: 'bg-lime-950/40',   border: 'border-lime-700/40',   dot: 'bg-lime-500',   icon: '🔄' },
  'Systemic-β': { label: 'Systemic β Therapy', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-700/40', dot: 'bg-purple-500', icon: 'β' },
  'Systemic-α': { label: 'Systemic α Therapy', color: 'text-rose-400',   bg: 'bg-rose-950/40',   border: 'border-rose-700/40',   dot: 'bg-rose-500',   icon: 'α' },
};

const IDEAL_SOURCES = [
  {
    title: 'Ideal EBRT Source',
    criteria: [
      { label: 'Energy', ideal: '1–10 MeV photons (megavoltage)', reason: 'Skin sparing, depth penetration, minimal bone absorption differential' },
      { label: 'Switch-off', ideal: 'Can be turned off instantly', reason: 'No radiation when not treating — safety, no continuous shielding' },
      { label: 'Penumbra', ideal: 'Point source or small focal spot', reason: 'Sharp field edges → precise OAR avoidance, IMRT capability' },
      { label: 'Output', ideal: 'High, stable dose rate (400–600 MU/min)', reason: 'Short treatment times, reproducible dosimetry' },
      { label: 'Versatility', ideal: 'Multiple energies + electron mode', reason: 'Both photon and electron therapy on single machine' },
      { label: 'Waste', ideal: 'No radioactive waste', reason: 'No disposal cost or long-term storage obligation' },
    ],
    winner: 'LINAC (6 MV) — ticks every box. Co-60 wins only for LMIC power-unreliable settings and Gamma Knife SRS.',
    winnerColor: 'text-sky-400',
  },
  {
    title: 'Ideal HDR Brachy Source',
    criteria: [
      { label: 'Size', ideal: '<1 mm diameter', reason: 'Fits all applicator types (ring, tandem, interstitial needles)' },
      { label: 'Energy', ideal: 'Moderate (200–600 keV)', reason: 'Significant dose fall-off, manageable shielding, tissue penetration' },
      { label: 'Half-life', ideal: '60–90 days', reason: 'Not too short (frequent changes) nor too long (waste)' },
      { label: 'Activity', ideal: '10 Ci in small volume', reason: 'High dose rate (Gy/min) for practical treatment times' },
      { label: 'Dosimetry', ideal: 'Well characterised (TG-43)', reason: 'Validated anisotropy/radial dose functions' },
      { label: 'Safety', ideal: 'Remote afterloading possible', reason: 'Zero staff dose during treatment delivery' },
    ],
    winner: 'Ir-192 — ticks every box. Co-60 HDR wins for LMIC cost considerations (5yr T½).',
    winnerColor: 'text-orange-400',
  },
  {
    title: 'Ideal LDR Permanent Seed',
    criteria: [
      { label: 'Energy', ideal: '20–35 keV (low)', reason: 'Self-shielded in patient, minimal external radiation' },
      { label: 'Half-life', ideal: '2–6 months', reason: 'Long enough to deliver biological dose, short enough for patient concerns' },
      { label: 'Dose rate', ideal: '5–10 cGy/hr', reason: 'LDR radiobiology: continuous low-dose-rate tissue repair' },
      { label: 'Size', ideal: '<5 mm × 1 mm', reason: 'Implantable with standard 18-gauge needles' },
      { label: 'Encapsulation', ideal: 'Titanium sealed', reason: 'No leakage, permanent implant safe' },
      { label: 'Shielding', ideal: 'Paper/thin foil stops radiation', reason: 'No vault required in OR, outpatient implant' },
    ],
    winner: 'I-125 — gold standard for prostate LDR. Pd-103 for faster-growing tumours. Cs-131 for intraoperative.',
    winnerColor: 'text-yellow-400',
  },
  {
    title: 'Ideal Systemic Therapeutic Source',
    criteria: [
      { label: 'Targeting', ideal: 'High tumour-to-normal ratio uptake', reason: 'Selective delivery — theranostic principle' },
      { label: 'Emission', ideal: 'β or α for therapy + γ/positron for imaging', reason: 'Theranostic: treat + track simultaneously' },
      { label: 'Half-life', ideal: '1–14 days', reason: 'Long enough for tumour delivery, short enough for excretion' },
      { label: 'Energy', ideal: 'β: 0.5–2 MeV; α: 5–9 MeV', reason: 'Adequate tissue range for heterogeneous tumours' },
      { label: 'Waste', ideal: 'Rapidly excreted', reason: 'Reduced normal tissue dose, patient released faster' },
      { label: 'RBE', ideal: 'High (α) or standard (β)', reason: 'α: RBE 20, overcomes radioresistance, OER ~1' },
    ],
    winner: 'Lu-177 (PSMA/DOTATATE) for β-theranostics. Ra-223 for α-bone-targeting. Ac-225 emerging α-theranostic.',
    winnerColor: 'text-purple-400',
  },
];

const COMPARISON_AXES = [
  { key: 'halfLifeDays', label: 'Half-life (days)', logScale: true },
  { key: 'energyKeV', label: 'Energy (keV)' },
];

export default function RadioactiveSourcesPage() {
  const [selCat, setSelCat] = useState<string>('All');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'detail' | 'compare' | 'ideal' | 'quiz'>('detail');
  const [activeSection, setActiveSection] = useState<'overview' | 'pros' | 'cons' | 'clinical' | 'dosimetry' | 'physics' | 'pearls'>('overview');
  const [qIdx, setQIdx] = useState(0);
  const [selOpt, setSelOpt] = useState<number | null>(null);
  const [showFB, setShowFB] = useState(false);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
  }));


  const QUIZ = useMemo(() => [
    { q: 'Which isotope is used as the HDR brachytherapy source in the Gamma Knife for intracranial SRS?', opts: ['Ir-192', 'Co-60', 'Cs-137', 'I-125'], ans: 1, exp: 'Leksell Gamma Knife uses 192 individual Co-60 sources (each ~30 Ci) focused at a single isocentre. Co-60 also used in Elekta Bravos HDR unit. Ir-192 is standard HDR for GYN/prostate but NOT used in Gamma Knife.' },
    { q: 'ALSYMPCA trial: Ra-223 (Xofigo) demonstrated OS benefit. What is the mechanism of bone targeting?', opts: ['PSMA receptor binding', 'Ca²⁺ mimicry (same ionic radius as Ca²⁺)', 'Bisphosphonate conjugation', 'Somatostatin receptor binding'], ans: 1, exp: 'Ra²⁺ has same charge (+2) and ionic radius as Ca²⁺ → incorporated into hydroxyapatite at bone met sites. OS: 14.9 vs 11.3 months (HR 0.70). NOT PSMA (that is Lu-177-PSMA). NOT bisphosphonate — Ra is the active therapeutic agent itself.' },
    { q: 'Ir-192 HDR source must be exchanged approximately how often?', opts: ['Every year', 'Every 5 years', 'Every 3–4 months', 'Every 2 weeks'], ans: 2, exp: 'Ir-192 T½ = 73.8 days. After 3–4 months (approximately 2 half-lives), activity falls from 10 Ci to 2.5 Ci — dose rates become impractically low. Source exchange every 3–4 months. Compare to Co-60 HDR: T½ 5.27 years → change every 5–8 years.' },
    { q: 'For low-risk prostate LDR brachytherapy with I-125, what is the standard prescription dose?', opts: ['100 Gy', '125 Gy', '145 Gy', '160 Gy'], ans: 2, exp: '145 Gy for I-125 LDR prostate monotherapy (ABS guideline). Pd-103: 125 Gy. Cs-131: 115 Gy. These reflect different dose rates and biological effectiveness. Post-implant QA: D90 ≥130 Gy on CT at 4 weeks = adequate implant.' },
    { q: 'Which source is a near-PURE beta emitter with minimal gamma emission?', opts: ['I-131 (606 keV β + 364 keV γ)', 'Lu-177 (498 keV β + 208 keV γ)', 'Y-90 (2.28 MeV β, no significant γ)', 'Ra-223 (alpha + minor γ)'], ans: 2, exp: 'Y-90 is >99.98% pure β emitter (2.28 MeV max). Minimal γ → no useful gamma camera imaging (use bremsstrahlung or 0.003% positron for Y-90 PET). I-131 has 364 keV γ (81% abundance). Lu-177 has 208 keV γ (11%). Shielding: Perspex/acrylic for Y-90 (NOT lead — bremsstrahlung).' },
    { q: 'GEC-ESTRO EMBRACE trial: What is the D90(HR-CTV) threshold for adequate HDR cervix brachytherapy?', opts: ['75 Gy EQD2₁₀', '85 Gy EQD2₁₀', '100 Gy EQD2₁₀', '65 Gy EQD2₁₀'], ans: 1, exp: '85 Gy EQD2₁₀ to HR-CTV (high-risk CTV) = target dose threshold in EMBRACE. Results: D90 ≥85 Gy → 3-year local control 92%. Combined EBRT (45 Gy) + HDR BT: total EQD2₁₀ to tumour ~85–95 Gy. OAR limits: D2cc rectum <75 Gy EQD2₃, bladder <90 Gy EQD2₃.' },
    { q: 'What is the RBE of alpha particles (Ra-223, Ac-225) used in ICRP radiation protection weighting?', opts: ['1', '2', '10', '20'], ans: 3, exp: 'ICRP 103: wR (radiation weighting factor) for alpha particles = 20. This means 1 Gy of α radiation has the same stochastic risk as 20 Gy of photons. For Ra-223: actual biological effectiveness for bone marrow is estimated 3–10 (lower than wR=20) due to geometric sparing. RBE for deterministic effects in tumour: potentially higher.' },
    { q: 'VISION trial (Lu-177-PSMA-617): What was the overall survival benefit?', opts: ['OS 12.3 vs 9.1 months (HR 0.72)', 'OS 15.3 vs 11.3 months (HR 0.62)', 'OS 18.0 vs 14.0 months (HR 0.78)', 'No OS benefit, only PFS benefit'], ans: 1, exp: 'VISION trial (Sartor 2021, NEJM): Lu-177-PSMA-617 + SoC vs SoC alone. OS: 15.3 vs 11.3 months (HR 0.62, p<0.001). rPFS: 8.7 vs 3.4 months (HR 0.40). FDA approved March 2022 as Pluvicto. Requires PSMA PET confirmation of PSMA-positive disease before treatment.' },
    { q: 'Y-90 shielding: why is Perspex/acrylic used instead of lead?', opts: ['Lead is too heavy for syringe shields', 'Lead would increase bremsstrahlung X-ray production', 'Acrylic is cheaper', 'Lead absorbs beta particles too slowly'], ans: 1, exp: 'Pure β emitters like Y-90: high-energy electrons slow down in matter → produce bremsstrahlung X-rays. High-Z materials (lead, Z=82) produce MORE bremsstrahlung than low-Z materials. Acrylic/Perspex (low Z, mostly carbon/hydrogen) stops β with minimal bremsstrahlung production. Use acrylic for ALL pure β emitters.' },
    { q: 'What critical warning exists for Ra-223 (Xofigo) combination therapy?', opts: ['Cannot combine with docetaxel', 'ERA 223: combination with abiraterone + prednisone increased fractures and mortality', 'Cannot combine with pembrolizumab', 'Requires denosumab pre-treatment'], ans: 1, exp: 'ERA 223 trial (Smith 2019): Ra-223 + abiraterone + prednisone vs abiraterone + prednisone alone — increased fractures (28.6% vs 11.4%) and higher mortality in combination arm. FDA/EMA black box warning: do NOT combine Ra-223 with abiraterone + prednisone. Can combine with other ARPIs (enzalutamide) without this safety signal — being investigated.' },
  ], []);

  const cats = ['All', 'EBRT', 'HDR', 'LDR', 'Systemic-β', 'Systemic-α'];
  const filtered = useMemo(() =>
    selCat === 'All' ? SOURCES : SOURCES.filter(s => s.category === selCat), [selCat]);

  const active = SOURCES.find(s => s.id === activeId);
  const cm = active ? CAT_META[active.category] : null;

  const curQ = QUIZ[qIdx];
  const handleAns = (i: number) => {
    if (showFB) return;
    setSelOpt(i); setShowFB(true);
    if (i === curQ.ans) setQScore(s => s + 1);
  };
  const nextQ = () => {
    setShowFB(false); setSelOpt(null);
    if (qIdx < QUIZ.length - 1) setQIdx(q => q + 1); else setQDone(true);
  };
  const resetQ = () => { setQIdx(0); setQScore(0); setSelOpt(null); setShowFB(false); setQDone(false); };

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
          <div className="w-7 h-7 rounded-lg bg-yellow-900/60 flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 text-sm font-black">☢</span>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-white">Radioactive Sources — Radiation Oncology</h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">{SOURCES.length} sources · EBRT · HDR · LDR · Systemic · TG-43 · MIRD · Trial-referenced</p>
          </div>
        </div>
        <div className="flex gap-1 mb-1.5 overflow-x-auto no-scrollbar">
          {([['detail','📋 Sources'],['compare','⚖️ Compare'],['ideal','🏆 Ideal'],['quiz','❓ Quiz']] as [string,string][]).map(([id,label]) => (
            <button key={id} onClick={() => setView(id as 'detail' | 'compare' | 'ideal' | 'quiz')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition-all ${
                view === id ? 'bg-yellow-700 border-yellow-600 text-white' : 'bg-gray-800/60 border-gray-700/40 text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {cats.map(c => (
            <button key={c} onClick={() => { setSelCat(c); setActiveId(null); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                selCat === c ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800/60 border-gray-700/40 text-gray-600'}`}>
              {c === 'All' ? 'All' : (CAT_META[c]?.icon + ' ' + c)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2 space-y-2">

        {/* ══ DETAIL VIEW ══ */}
        {view === 'detail' && (
          <>
            {/* Source list */}
            {!activeId && (
              <div className="space-y-1.5">
                {filtered.map(s => {
                  const m = CAT_META[s.category];
                  return (
                    <button key={s.id} onClick={() => { setActiveId(s.id); setActiveSection('overview'); }}
                      className={`w-full text-left border ${m.border} ${m.bg} rounded-xl p-3 hover:brightness-110 transition-all`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${m.color}`}>{m.icon} {m.label}</span>
                            <span className="text-[12px] font-black text-gray-500 font-mono">{s.symbol}</span>
                          </div>
                          <h3 className="text-[14px] font-black text-white">{s.name}</h3>
                          <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{s.idealFor.slice(0, 80)}…</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-[13px] font-black ${m.color}`}>{s.halfLife}</p>
                          <p className="text-[10px] text-gray-600">{s.energy.split('(')[0].trim().slice(0, 20)}</p>
                          <p className="text-[11px] text-yellow-400 font-bold mt-0.5">HVL {s.hvlPb}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Source detail */}
            {activeId && active && cm && (
              <div className="space-y-2">
                <button onClick={() => setActiveId(null)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                  All sources
                </button>

                {/* Identity card */}
                <div className={`border ${cm.border} ${cm.bg} rounded-xl p-3`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-14 h-14 rounded-xl border ${cm.border} flex items-center justify-center flex-shrink-0`}>
                      <div className="text-center">
                        <div className={`text-2xl font-black ${cm.color} leading-none`}>{active.symbol.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '')}</div>
                        <div className="text-[9px] text-gray-600 font-mono">Z={active.Z || '—'}</div>
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${cm.color} mb-0.5`}>{cm.icon} {cm.label}</div>
                      <h2 className="text-lg font-black text-white">{active.name}</h2>
                      <p className="text-[11px] text-gray-400 font-mono">{active.symbol} · T½: {active.halfLife}</p>
                    </div>
                  </div>
                  {/* Key metrics grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    {[
                      { l: 'Energy', v: active.energy.split('(')[0].trim().slice(0, 22), col: 'text-yellow-400' },
                      { l: 'HVL (Pb)', v: active.hvlPb, col: 'text-blue-400' },
                      { l: 'RBE', v: active.rbe, col: 'text-purple-400' },
                      { l: 'Emissions', v: active.emissions.join(', ').slice(0, 20), col: 'text-orange-400' },
                      { l: 'Sp. Activity', v: active.specificActivity.slice(0, 20), col: 'text-green-400' },
                      { l: 'LET', v: active.let, col: 'text-rose-400' },
                    ].map(r => (
                      <div key={r.l} className="bg-gray-900/60 border border-gray-700/30 rounded-lg p-1.5">
                        <p className="text-[9px] text-gray-600 uppercase tracking-wider">{r.l}</p>
                        <p className={`text-[11px] font-bold ${r.col} leading-tight`}>{r.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section tabs */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {([
                    ['overview','📊 Overview'],['pros','✅ Pros'],['cons','❌ Cons'],
                    ['clinical','💊 Clinical'],['dosimetry','📐 Dosimetry'],['physics','⚛ Physics'],['pearls','💡 Pearls']
                  ] as [string, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setActiveSection(id as 'overview' | 'pros' | 'cons' | 'clinical' | 'dosimetry' | 'physics' | 'pearls')}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition-all ${
                        activeSection === id ? `${cm.bg} ${cm.border} ${cm.color}` : 'bg-gray-800/40 border-gray-700/30 text-gray-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── OVERVIEW ── */}
                {activeSection === 'overview' && (
                  <div className="space-y-2">
                    <div className={`${cm.bg} border ${cm.border} rounded-xl p-3`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${cm.color} mb-1`}>🏆 Ideal For</p>
                      <p className="text-[13px] text-gray-200 leading-relaxed">{active.idealFor}</p>
                    </div>
                    {active.notIdealFor && (
                      <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-3">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">⚠️ Not Ideal For</p>
                        <p className="text-[13px] text-red-200 leading-relaxed">{active.notIdealFor}</p>
                      </div>
                    )}
                    {active.activityRange && (
                      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">📊 Activity Range</p>
                        <p className="text-[12px] text-gray-300">{active.activityRange}</p>
                      </div>
                    )}
                    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">🔬 Production</p>
                      <p className="text-[12px] text-gray-300">{active.production}</p>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">⚰️ Decay Product</p>
                      <p className="text-[12px] text-gray-300">{active.decayProduct}</p>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">🛡 Safety Class</p>
                      <p className="text-[12px] text-gray-300">{active.safetyClass}</p>
                    </div>
                    {active.bedExample && (
                      <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">📐 BED Example</p>
                        <p className="text-[12px] font-mono text-indigo-200">{active.bedExample}</p>
                      </div>
                    )}
                    {active.oar && (
                      <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">🫀 OAR Constraints</p>
                        <p className="text-[12px] text-amber-200 leading-relaxed">{active.oar}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PROS ── */}
                {activeSection === 'pros' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Advantages</p>
                    {active.pros.map((p, i) => (
                      <div key={i} className="flex gap-2 bg-green-950/20 border border-green-800/20 rounded-xl p-2.5">
                        <span className="text-green-500 text-[12px] flex-shrink-0 mt-0.5">✓</span>
                        <p className="text-[13px] text-green-200 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CONS ── */}
                {activeSection === 'cons' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Disadvantages / Limitations</p>
                    {active.cons.map((c, i) => (
                      <div key={i} className="flex gap-2 bg-red-950/20 border border-red-800/20 rounded-xl p-2.5">
                        <span className="text-red-500 text-[12px] flex-shrink-0 mt-0.5">❌</span>
                        <p className="text-[13px] text-red-200 leading-relaxed">{c}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CLINICAL ── */}
                {activeSection === 'clinical' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Clinical Applications</p>
                    {active.clinicalUse.map((u, i) => (
                      <div key={i} className="flex gap-2 bg-blue-950/20 border border-blue-800/20 rounded-xl p-2.5">
                        <span className="text-blue-400 text-[12px] flex-shrink-0">{i + 1}.</span>
                        <p className="text-[13px] text-blue-200 leading-relaxed">{u}</p>
                      </div>
                    ))}
                    {active.keyTrials && active.keyTrials.length > 0 && (
                      <>
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-2">📚 Key Trials</p>
                        {active.keyTrials.map((t, i) => (
                          <div key={i} className="flex gap-2 bg-yellow-950/20 border border-yellow-800/20 rounded-xl p-2.5">
                            <span className="text-yellow-400 text-[11px] flex-shrink-0">▸</span>
                            <p className="text-[13px] text-yellow-200 leading-relaxed">{t}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* ── DOSIMETRY ── */}
                {activeSection === 'dosimetry' && (
                  <div className="space-y-2">
                    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1.5">📐 Dosimetry</p>
                      <p className="text-[13px] text-gray-200 leading-relaxed">{active.dosimetry}</p>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">🛡 Shielding</p>
                      <p className="text-[13px] text-gray-200 leading-relaxed">{active.shielding}</p>
                    </div>
                  </div>
                )}

                {/* ── PHYSICS ── */}
                {activeSection === 'physics' && (
                  <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">⚛ Nuclear Physics</p>
                    <p className="text-[13px] text-gray-200 leading-relaxed">{active.physics}</p>
                  </div>
                )}

                {/* ── PEARLS ── */}
                {activeSection === 'pearls' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Exam Pearls</p>
                    {active.examPearls.map((p, i) => (
                      <div key={i} className="flex gap-2 bg-yellow-950/20 border border-yellow-800/20 rounded-xl p-2.5">
                        <span className="text-yellow-500 text-[11px] flex-shrink-0 mt-0.5">★</span>
                        <p className="text-[13px] text-yellow-200 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══ COMPARE VIEW ══ */}
        {view === 'compare' && (
          <div className="space-y-2">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1">Head-to-Head Comparison</p>

            {/* HDR Ir-192 vs Co-60 */}
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-[12px] font-black text-orange-400 mb-2">HDR: Ir-192 vs Co-60</p>
              <div className="space-y-1.5">
                {[
                  { param: 'Half-life', ir: '73.8 days', co: '5.27 years', winner: 'Co-60 (less replacements)' },
                  { param: 'Source change', ir: 'Every 3–4 months', co: 'Every 5–8 years', winner: 'Co-60 (cost saving)' },
                  { param: 'Energy', ir: '380 keV', co: '1,250 keV', winner: 'Ir-192 (easier shielding)' },
                  { param: 'Shielding (TVL)', ir: '10 mm Pb', co: '36 mm Pb', winner: 'Ir-192 (3× thinner walls)' },
                  { param: 'Source size', ir: '0.86 mm ⌀', co: 'Slightly larger', winner: 'Ir-192 (fits all applicators)' },
                  { param: 'TG-43 data', ir: 'Extensive (gold standard)', co: 'Limited published data', winner: 'Ir-192 (clinical evidence)' },
                  { param: 'LMIC cost', ir: '15–20 sources over 5yr', co: '1 source for 5yr', winner: 'Co-60 (dramatically cheaper)' },
                ].map((r, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 text-[12px] py-1 border-b border-gray-700/20 last:border-0">
                    <span className="text-gray-500 font-bold col-span-1">{r.param}</span>
                    <span className="text-orange-300 col-span-1">{r.ir}</span>
                    <span className="text-sky-300 col-span-1">{r.co}</span>
                    <span className="text-green-400 col-span-1 text-[11px]">{r.winner}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LDR Seeds */}
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-xs font-black text-yellow-400 mb-2">LDR Seeds: I-125 vs Pd-103 vs Cs-131</p>
              <div className="space-y-1.5">
                {[
                  { param: 'Half-life', i125: '59.4 days', pd103: '17.0 days', cs131: '9.7 days' },
                  { param: 'Energy (avg)', i125: '28 keV', pd103: '21 keV', cs131: '29 keV' },
                  { param: 'Dose rate', i125: '8 cGy/hr', pd103: '20 cGy/hr', cs131: '50 cGy/hr' },
                  { param: 'Prescription', i125: '145 Gy', pd103: '125 Gy', cs131: '115 Gy' },
                  { param: 'Best for', i125: 'Low-risk, GS≤6', pd103: 'GS 7, faster tumours', cs131: 'Intraoperative, brain' },
                  { param: 'ABS preference', i125: '1st choice LDR', pd103: 'GS7 intermediate', cs131: 'IORT niche' },
                ].map((r, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 text-[14px] py-1 border-b border-gray-700/20 last:border-0">
                    <span className="text-gray-500 font-bold">{r.param}</span>
                    <span className="text-yellow-300">{r.i125}</span>
                    <span className="text-amber-300">{r.pd103}</span>
                    <span className="text-lime-300">{r.cs131}</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-1 text-[12px] text-gray-600 mt-1">
                  <span></span><span>I-125</span><span>Pd-103</span><span>Cs-131</span>
                </div>
              </div>
            </div>

            {/* Systemic sources */}
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-xs font-black text-purple-400 mb-2">Systemic Therapy: Lu-177 vs Y-90 vs Ra-223</p>
              <div className="space-y-1.5">
                {[
                  { param: 'Emission', lu: 'β⁻ + γ', y90: 'Pure β⁻', ra: 'α + minor γ' },
                  { param: 'RBE', lu: '1.0', y90: '1.0', ra: '20 (α)' },
                  { param: 'Range in tissue', lu: '0.67 mm', y90: '11 mm', ra: '40–80 μm' },
                  { param: 'Imaging possible', lu: 'Yes (SPECT 208 keV)', y90: 'PET (0.003%)', ra: 'Very limited' },
                  { param: 'Theranostic pair', lu: 'Ga-68 PSMA/DOTATATE', y90: 'Tc-99m MAA (pre)', ra: 'No matched scan' },
                  { param: 'OS trial', lu: 'VISION/NETTER-1 ✓', y90: 'SIRT (PFS only)', ra: 'ALSYMPCA ✓' },
                  { param: 'Key indication', lu: 'mCRPC, NETs', y90: 'Liver SIRT, lymphoma', ra: 'Bone mets mCRPC' },
                ].map((r, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 text-[14px] py-1 border-b border-gray-700/20 last:border-0">
                    <span className="text-gray-500 font-bold">{r.param}</span>
                    <span className="text-purple-300">{r.lu}</span>
                    <span className="text-blue-300">{r.y90}</span>
                    <span className="text-rose-300">{r.ra}</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-1 text-[12px] text-gray-600 mt-1">
                  <span></span><span>Lu-177</span><span>Y-90</span><span>Ra-223</span>
                </div>
              </div>
            </div>

            {/* Historical timeline */}
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Evolution of Clinical Sources</p>
              {[
                { year: '1898', event: 'Ra-226 isolated (Curie) → first brachytherapy source', col: 'text-red-400' },
                { year: '1934', event: 'Manchester system: Ra-226 dosimetry tables (Paterson-Parker)', col: 'text-orange-400' },
                { year: '1951', event: 'Co-60 teletherapy first clinical use (Johns, London Ontario)', col: 'text-yellow-400' },
                { year: '1960s', event: 'Cs-137 replaces Ra-226 for GYN LDR (safer, no Rn gas)', col: 'text-lime-400' },
                { year: '1960s', event: 'Ir-192 wire introduced for interstitial implants', col: 'text-green-400' },
                { year: '1983', event: 'Gamma Knife (Leksell): Co-60 SRS — intracranial precision', col: 'text-teal-400' },
                { year: '1985', event: 'I-125 prostate LDR seeds: transrectal US-guided implant', col: 'text-blue-400' },
                { year: '1990s', event: 'Ir-192 HDR remote afterloading replaces Cs-137 LDR GYN', col: 'text-indigo-400' },
                { year: '2002', event: 'Y-90 Zevalin: first radioimmunotherapy FDA approval', col: 'text-violet-400' },
                { year: '2013', event: 'Ra-223 (Xofigo) FDA: first alpha therapy with OS benefit (ALSYMPCA)', col: 'text-purple-400' },
                { year: '2018', event: 'Lu-177-DOTATATE (Lutathera) FDA: NETs (NETTER-1)', col: 'text-rose-400' },
                { year: '2022', event: 'Lu-177-PSMA-617 (Pluvicto) FDA: mCRPC (VISION)', col: 'text-red-400' },
                { year: '2024+', event: 'Ac-225-PSMA emerging: α-theranostics, next generation targeted α therapy', col: 'text-gray-400' },
              ].map((r, i) => (
                <div key={i} className="flex gap-2 py-1 border-b border-gray-700/20 last:border-0">
                  <span className={`text-[14px] font-black ${r.col} w-10 flex-shrink-0`}>{r.year}</span>
                  <p className="text-[14px] text-gray-400 leading-snug">{r.event}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ IDEAL SOURCES ══ */}
        {view === 'ideal' && (
          <div className="space-y-3">
            {IDEAL_SOURCES.map((s, si) => (
              <div key={si} className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                <h3 className="text-[16px] font-black text-white mb-2">🏆 {s.title}</h3>
                <div className="space-y-1.5 mb-3">
                  {s.criteria.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-700/20 last:border-0 items-start">
                      <div>
                        <p className="text-[12px] font-black text-gray-500 uppercase">{c.label}</p>
                        <p className="text-[14px] text-yellow-300 font-mono leading-tight">{c.ideal}</p>
                      </div>
                      <p className="text-[14px] text-gray-400 col-span-2 leading-snug">{c.reason}</p>
                    </div>
                  ))}
                </div>
                <div className={`rounded-lg p-2.5 border`} style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">VERDICT</p>
                  <p className={`text-sm font-black ${s.winnerColor} leading-snug`}>{s.winner}</p>
                </div>
              </div>
            ))}

            {/* Ideal source properties summary table */}
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Properties of an Ideal Radioisotope for Therapy</p>
              {[
                { prop: 'Half-life', ideal: 'Long enough to deliver dose; short enough to minimise waste hazard', example: 'Lu-177: 6.65d; I-125: 59d; Ir-192: 74d' },
                { prop: 'Emission type', ideal: 'β or α for therapy; γ/positron for imaging (theranostics)', example: 'Lu-177 (β+γ); Ra-223 (α+γ); Y-90 (pure β)' },
                { prop: 'Energy', ideal: 'Sufficient tissue range; not too penetrating (OAR sparing)', example: 'Lu-177 β 0.67mm mean range; I-125 γ 5cm range' },
                { prop: 'Target specificity', ideal: 'High tumour:normal ratio via receptor/biological targeting', example: 'PSMA (prostate); SSTR (NETs); NIS (thyroid)' },
                { prop: 'Production', ideal: 'Reactor or cyclotron-producible; generator-based ideal', example: 'Lu-177 reactor; Ga-68 generator; I-131 reactor' },
                { prop: 'Dosimetry', ideal: 'Well-characterised; imaging-based dosimetry possible', example: 'TG-43 (BT); MIRD+SPECT (systemic)' },
                { prop: 'Toxicity', ideal: 'Therapeutic window: tumour dose >> critical organ dose', example: 'ALAC kidney protection for Lu-177; bone marrow for Ra-223' },
                { prop: 'Availability', ideal: 'Reliable global supply chain; regulatory approved', example: 'Ir-192 from NRU Canada/NTP SA; Lu-177 from IBA/Curium' },
              ].map((r, i) => (
                <div key={i} className="py-2 border-b border-gray-700/20 last:border-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-xs font-black text-white">{r.prop}</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-snug mb-0.5">{r.ideal}</p>
                  <p className="text-[10px] text-yellow-400 font-mono">{r.example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ QUIZ ══ */}
        {view === 'quiz' && (
          <div className="space-y-2">
            {!qDone ? (
              <div className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-yellow-400">Q {qIdx + 1} of {QUIZ.length}</span>
                  <span className="text-[9px] text-gray-600">Score: {qScore}</span>
                </div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full mb-3">
                  <div className="h-0.5 bg-yellow-600 rounded-full" style={{ width: `${(qIdx / QUIZ.length) * 100}%` }}></div>
                </div>
                <h3 className="text-[12px] font-bold text-white leading-snug mb-3">{curQ.q}</h3>
                <div className="space-y-1.5">
                  {curQ.opts.map((opt, i) => (
                    <button key={i} disabled={showFB} onClick={() => handleAns(i)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                        showFB
                          ? i === curQ.ans ? 'bg-green-900/40 border-green-700 text-green-300'
                            : i === selOpt ? 'bg-red-900/40 border-red-700 text-red-300'
                            : 'bg-gray-700/20 border-gray-700 text-gray-600'
                          : 'bg-gray-700/40 border-gray-600/60 text-gray-200 hover:border-yellow-700 active:scale-[0.99]'}`}>
                      <span className="font-black text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  ))}
                </div>
                {showFB && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
                        {selOpt === curQ.ans ? '✅ Correct' : '❌ Incorrect'} — Explanation
                      </p>
                      <p className="text-[10px] text-gray-300 leading-relaxed">{curQ.exp}</p>
                    </div>
                    <button onClick={nextQ} className="w-full py-2.5 bg-yellow-700 hover:bg-yellow-600 text-white text-[11px] font-bold rounded-lg transition-all">
                      {qIdx === QUIZ.length - 1 ? 'Finish →' : 'Next →'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800/70 border border-gray-700/40 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{qScore >= 8 ? '🎓' : qScore >= 6 ? '📚' : '🔄'}</div>
                <h2 className="text-sm font-black text-white">{qScore}/{QUIZ.length} · {Math.round(qScore / QUIZ.length * 100)}%</h2>
                <div className="w-full h-2 bg-gray-700 rounded-full my-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${qScore >= 8 ? 'bg-green-500' : qScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${(qScore / QUIZ.length) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-500 mb-4">
                  {qScore >= 8 ? 'Excellent — Fellow level knowledge' : qScore >= 6 ? 'Good — Senior Resident level' : 'Review sources in detail tab'}
                </p>
                <button onClick={resetQ} className="w-full py-2 bg-yellow-700 text-white text-[11px] font-bold rounded-lg hover:bg-yellow-600 transition">Retry Quiz</button>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 pb-2 border-t border-gray-800 text-center">
          <p className="text-[8px] text-gray-700 uppercase tracking-widest font-bold">Rad-Calc Pro · RNT Medical College · Dr. Narendra Rathore</p>
          <p className="text-[8px] text-gray-700 mt-0.5">AAPM TG-43 · MIRD · ICRP 103 · GEC-ESTRO · VISION · ALSYMPCA · NETTER-1 · ABS 2012</p>
        </div>
      </div>
    </div>
  );
}