/**
 * OARReferencePage.tsx — PRO LEVEL v5
 *
 * Sources: QUANTEC 2010 · HyTEC 2021 · GEC-ESTRO EMBRACE II
 *          RTOG/NRG protocols · AAPM TG-101 · TG-158 · Emami 1991
 *
 * Features:
 *  - Full constraint database with EQD2 live-scaling per selected regime
 *  - Evidence-graded constraints (1A → Expert) with toxicity endpoints
 *  - LKB NTCP model display per OAR
 *  - DVH Plan Checker with pass / near / fail traffic-light
 *  - 20 rotating clinical pearls (full radiobiological basis)
 *  - Re-irradiation guidance per OAR (cumulative EQD2 limits)
 *  - 20-question MCQ Quiz with difficulty tiers + explanations
 *  - Quick-reference sidebar
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, ChevronRight, GraduationCap, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle, Info, Activity, Shield,
  RefreshCw, BarChart2, Zap
} from 'lucide-react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import {
  OAR_DATABASE,
  FRACTIONATION_PRESETS,
  Region,
  OARData,
  Constraint,
  scaleConstraintToRegime,
  OAR_QUIZ_QUESTIONS,
  OARQuizQuestion,
  EvidenceLevel,
} from '../src/services/oarDataService';

// ─── Types ─────────────────────────────────────────────────────────────────
type TabType = 'Constraints' | 'Checker' | 'Pearls' | 'Quiz' | 'ReRT';

// ─── α/β reference values (conservative, late-responding tissue) ───────────
const DEFAULT_AB: Record<string, number> = {
  brainstem: 2.1, spinal_cord: 2.0, spinal_cord_sbrt: 2.0,
  spinal_cord_lumbar: 2.0, optic_chiasm: 2.0, cochlea: 3.0,
  pituitary: 3.0, hippocampus: 2.0, lens: 1.2, brain_whole: 2.0,
  parotid: 3.0, submandibular: 3.0, oral_cavity: 3.0, pcm: 3.0,
  larynx: 3.0, mandible: 3.0, brachial_plexus: 2.0, carotid: 3.0,
  heart: 2.5, cardiac_sub: 2.5, lung: 3.0, esophagus: 3.0,
  trachea: 3.0, liver: 3.0, kidneys: 3.0, stomach: 3.0,
  duodenum: 3.0, small_bowel: 3.0, rectum: 3.0, bladder: 3.0,
  femoral_heads: 1.8, penile_bulb: 3.0, ovaries: 3.0, uterus: 3.0,
  pelvic_floor: 3.0,
};

// ─── Re-irradiation cumulative limits ──────────────────────────────────────
interface ReRTEntry {
  maxCumEQD2: number;
  unit: string;
  minInterval: string;
  notes: string;
  recoveryModel: string;
  reference: string;
}

const REIRRT: Record<string, ReRTEntry> = {
  spinal_cord: {
    maxCumEQD2: 70, unit: 'Gy EQD2₂',
    minInterval: '≥6 months (12+ preferred)',
    notes: 'Sahgal protocol: new course ≤25 Gy EQD2₂ if prior ≤45 Gy EQD2₂. Recovery ~50% at 6 months, ~80% at 2 years. NEVER sum physical doses — EQD2 currency only.',
    recoveryModel: '~50% sub-lethal damage repaired at 6 months. Cumulative BED₂: prior + 0.5×recovery × new.',
    reference: 'Sahgal 2012 IJROBP; Nieder 2005',
  },
  brainstem: {
    maxCumEQD2: 100, unit: 'Gy EQD2₂',
    minInterval: '≥6 months',
    notes: 'Limited data. Conservative estimate: cumulative EQD2₂ ≤100 Gy. Surface more tolerant than core. If brainstem core involved, apply spinal cord guidance.',
    recoveryModel: 'Partial recovery; less documented than spinal cord.',
    reference: 'Emami 1991; Expert consensus',
  },
  optic_chiasm: {
    maxCumEQD2: 60, unit: 'Gy EQD2₂',
    minInterval: '≥12 months',
    notes: 'Very limited re-RT data. Cumulative EQD2₂ ≤60 Gy; RON risk rises steeply above this. Re-SRS to peri-optic lesion requires multidisciplinary discussion.',
    recoveryModel: 'Minimal documented recovery.',
    reference: 'HyTEC 2021; Expert consensus',
  },
  lung: {
    maxCumEQD2: 20, unit: 'Gy mean EQD2₃ (MLD)',
    minInterval: '≥6 months',
    notes: 'Parallel organ — cumulative mean lung dose (MLD) ≤20 Gy EQD2₃. V20Gy data not algebraically addable. Add prior + new V20 should not exceed 35%. Pulmonary fibrosis in prior field reduces tolerance.',
    recoveryModel: 'Minimal in fibrotic regions; some in normal parenchyma.',
    reference: 'Expert consensus; Heyd 2016',
  },
  heart: {
    maxCumEQD2: 10, unit: 'Gy Dmean',
    minInterval: '≥6 months',
    notes: 'Each 1 Gy increase in Dmean = 7.4% relative increase in MACE (Darby 2013). Cumulative Dmean ≤10 Gy preferred. Prior cardiac disease triples absolute risk.',
    recoveryModel: 'Minimal myocardial/vascular recovery. Late fibrosis progressive.',
    reference: 'Darby NEJM 2013; EBCTCG 2014',
  },
  rectum: {
    maxCumEQD2: 140, unit: 'Gy EQD2₃',
    minInterval: '6–12 months',
    notes: 'Guckenberger model: cumulative V70Gy-EQD2₃ sum. Target cumulative EQD2₃ ≤140 Gy. Pelvic re-RT requires full bowel DVH reassessment. Sigmoid D2cc: same guidance.',
    recoveryModel: '30–50% sub-lethal damage recovery possible.',
    reference: 'Guckenberger 2021; TROG 03.04',
  },
  bladder: {
    maxCumEQD2: 120, unit: 'Gy EQD2₃',
    minInterval: '≥6 months',
    notes: 'GEC-ESTRO EMBRACE II: combined EBRT+BT D2cc ≤90 Gy EQD2₃. Re-irradiation beyond this markedly increases fistula risk. Track cumulative D2cc across all courses.',
    recoveryModel: 'Partial; progressive fibrosis limits recovery.',
    reference: 'GEC-ESTRO 2016; EMBRACE II',
  },
  small_bowel: {
    maxCumEQD2: 110, unit: 'Gy EQD2₃ Dmax',
    minInterval: '≥12 months',
    notes: 'Highest fistula/perforation risk in pelvic re-RT. Adhesions from first course impair recovery and increase risk. Consider surgical bowel displacement before re-RT.',
    recoveryModel: 'Limited. Adhesions from first course impair recovery.',
    reference: 'QUANTEC 2010; Kim 2012',
  },
  liver: {
    maxCumEQD2: 30, unit: 'Gy mean EQD2₃',
    minInterval: '≥3 months',
    notes: 'RILD risk proportional to cumulative mean liver dose. Child-Pugh B: limit ≈8 Gy mean (any fractionation). ≥700cc liver uninvolved must be below threshold per course.',
    recoveryModel: 'Hepatocyte regeneration possible; 3 months minimum.',
    reference: 'QUANTEC 2010; RTOG 1112',
  },
  kidneys: {
    maxCumEQD2: 18, unit: 'Gy mean EQD2₃ (per kidney)',
    minInterval: '≥3 months',
    notes: 'Bilateral renal function must be assessed. Single-kidney patients: mean ≤10 Gy. GFR tracking mandatory before re-RT. Nephrotoxic systemic therapy compounds risk.',
    recoveryModel: 'Moderate recovery. GFR tracking essential.',
    reference: 'QUANTEC 2010; Expert consensus',
  },
};

// ─── Clinical Pearls (20, with full radiobiological detail) ────────────────
const CLINICAL_PEARLS = [
  {
    tag: 'Radiobiology',
    title: 'EQD2 Scaling: Mandatory for Hypofractionation',
    pearl: 'Spinal cord TD5/5 = 45 Gy (2 Gy/fx). At 3 Gy/fx: iso-effective limit = 45 × (2+2)/(3+2) = 36 Gy. At 8 Gy/fx SBRT: = 45 × 4/10 = 18 Gy. Formula: D_scaled = D_ref × (d_ref + α/β) / (d_new + α/β). This scaling applies ONLY to Dmax/Dmean-type constraints. Volume (Vxx) constraints require full DVH recalculation.',
  },
  {
    tag: 'Head & Neck',
    title: 'Parotid QUANTEC: Dmean ≤25 Gy for Xerostomia',
    pearl: 'Dmean ≤25 Gy in ≥1 gland → <20% Grade 2 xerostomia (Level 1A, PARSPORT trial). At 2.67 Gy/fx (START-B): scaled = 25×5/4.67 = 26.8 Gy. The contralateral parotid is the priority in H&N IMRT. Submandibular gland: Dmean ≤39 Gy; contributes ~70% resting saliva despite being smaller.',
  },
  {
    tag: 'Head & Neck',
    title: 'Cochlea + Cisplatin: Multiplicative Ototoxicity',
    pearl: 'Dmean ≤45 Gy alone → <30% SNHL risk. With concurrent cisplatin: reduce to ≤35 Gy (AAPM TG-158, 2021). Interaction is multiplicative, not additive. Cumulative cisplatin dose >200 mg/m² greatly amplifies RT ototoxicity. Carboplatin has less ototoxicity. High-frequency hearing (4–8 kHz) is lost first.',
  },
  {
    tag: 'Thorax',
    title: 'Lung V20 and Pneumonitis: QUANTEC Thresholds',
    pearl: 'V20Gy <20% → ~20% pneumonitis risk. V20Gy >35% → >40% risk. Mean lung dose ≤20 Gy (2 Gy/fx). MLD IS scalable: at 8 Gy/fx SBRT: scaled MLD = 20×5/11 = 9.1 Gy. V20Gy threshold is NOT scalable directly — find iso-effective dose first: at 8 Gy/fx, α/β=3: equiv dose = 20×5/11 = 9.1 Gy → V9.1Gy equivalent.',
  },
  {
    tag: 'Thorax',
    title: 'Heart Dmean in Breast RT: EBCTCG Data',
    pearl: 'Each 1 Gy ↑ in mean heart dose = 7.4% relative ↑ in MACE, starting 5 years post-RT (Darby NEJM 2013). Left-sided target: Dmean <2 Gy. FAST-Forward (5.2 Gy/fx): scaled Dmean = 2×4.5/7.2 = 1.25 Gy. Pre-existing cardiac disease triples absolute risk. DIBH reduces mean heart dose by 50–60% and LAD by 70%.',
  },
  {
    tag: 'Pelvis',
    title: 'Rectal V70 and Late Haemorrhage in Prostate RT',
    pearl: 'V70Gy <20% is the strongest predictor of Grade 3 rectal bleeding (QUANTEC, Level 1A). At 7.25 Gy/fx (PACE-B): V36.25Gy < 1cc = EQD2₃: 36.25×(7.25+3)/5 = 74.3 Gy. EQD2₃ stays well below conventional V70 threshold. QUANTEC: rectal D2% (near-max) ≤75 Gy EQD2₃ for Grade ≥2 risk <15%.',
  },
  {
    tag: 'Radiobiology',
    title: 'Serial vs Parallel Organs: Constraint Philosophy',
    pearl: 'Serial organs (FSUs in series — cord, chiasm, bowel wall, urethra): one FSU damaged = organ failure. Dmax is the primary constraint. Parallel organs (FSUs in parallel — lung, liver, kidney, parotid): need critical volume exceeded. Mean dose and volume metrics dominant. Mixed organs (heart, rectum, bladder): both metrics matter. This is the basis for NTCP LKB n parameter selection.',
  },
  {
    tag: 'Radiobiology',
    title: 'LKB NTCP Model: The n Parameter',
    pearl: 'n → 1: pure parallel organ (lung n=0.99, parotid n=1.0, liver n=0.97). n → 0: pure serial organ (cord n=0.05, chiasm n=0.25, bowel n=0.07). m = steepness of dose-response sigmoid. TD50 = dose for 50% NTCP. NTCP <5% corresponds to published QUANTEC limits. LKB NTCP = Φ[(gEUD − TD50) / (m × TD50)].',
  },
  {
    tag: 'CNS',
    title: 'Hippocampal Sparing WBRT: RTOG 0933 / NRG CC001',
    pearl: 'RTOG 0933: HA-WBRT reduces cognitive decline vs historical WBRT. D100% hippocampus <9 Gy at 30 Gy/10fx. NRG CC001: HA-WBRT + memantine improves neurocognitive function (HR 0.74, p=0.01) vs WBRT alone. Contour bilateral hippocampi on T1 MRI per RTOG atlas. Add 5mm HA-PTV expansion. Applicable when metastases not within 5mm of hippocampus.',
  },
  {
    tag: 'CNS',
    title: 'Lens α/β = 1.2 Gy: Extreme Fraction Sensitivity',
    pearl: 'Lowest α/β of any clinical OAR — extreme late sensitivity to large fractions. ICRP revised cataract threshold: 0.5 Gy (deterministic acute); 5 Gy (fractionated). At 2.67 Gy/fx: iso-effective = 2×(2+1.2)/(2.67+1.2) = 1.65 Gy. At 7.25 Gy/fx SBRT: iso-effective = 2×3.2/8.45 = 0.76 Gy. Posterior subcapsular cataract: commonest RT-induced type.',
  },
  {
    tag: 'Pelvis',
    title: 'Bladder + Cervix BT: EQD2 Summation Across Modalities',
    pearl: 'GEC-ESTRO EMBRACE II: D2cc bladder (EBRT + BT combined) ≤90 Gy EQD2₃. Example: 45 Gy/25fx EBRT = EQD2₃ = 45 Gy. HDR 4×7 Gy: each = 7×(7+3)/5 = 14 Gy EQD2₃; total = 56 Gy. Combined = 101 Gy → exceeds limit → BT optimisation required. Sigmoid D2cc: ≤75 Gy EQD2₃ (often most limiting structure).',
  },
  {
    tag: 'Abdomen',
    title: 'Liver RILD: ALBI vs Child-Pugh Stratification',
    pearl: 'ALBI (Albumin-Bilirubin) grade is more discriminatory than Child-Pugh for RILD risk. CP-A (≤6): mean ≤30 Gy (2 Gy/fx); at 8 Gy/fx: scaled = 30×5/11 = 13.6 Gy. CP-B (7–9): mean ≤6 Gy. ≥700cc normal liver below tolerance is an ABSOLUTE constraint. RILD mechanism: hepatic venous occlusion → sinusoidal obstruction syndrome → liver failure.',
  },
  {
    tag: 'Head & Neck',
    title: 'Mandible ORN: Hypofractionation More Bone-Toxic',
    pearl: 'Dmax >70 Gy (2 Gy/fx) → ORN risk. At 2.2 Gy/fx: iso-effective = 70×(2.2+3)/5 = 72.8 Gy — hypofractionation is MORE bone-toxic per physical Gy (α/β = 3). Mandible V60Gy, tooth extraction after RT, steroid use, smoking, and osteoporosis all modulate risk. Hyperbaric oxygen reduces ORN incidence by ~50%.',
  },
  {
    tag: 'Radiobiology',
    title: 'PRV Concept: Plan to OAR, Record on PRV',
    pearl: 'Correct usage: (1) Contour OAR + PRV as separate structures. (2) Plan to OAR constraint as primary goal. (3) PRV constraint = slightly relaxed safety flag for QA. (4) Record dose on both OAR and PRV. Typical PRV margins: cord +5mm, brainstem +3mm, chiasm +3mm. PRV is NEVER the primary planning constraint.',
  },
  {
    tag: 'Radiobiology',
    title: 'EQD2 Volume Constraints: Cannot Scale Algebraically',
    pearl: 'V20Gy, V45Gy etc. CANNOT be scaled by LQ formula. The constraint involves both a dose threshold AND a volume. Changing d/fx changes the iso-effective dose threshold (scalable) but the actual DVH shifts non-linearly. Correct approach: (1) Find new iso-effective dose threshold. (2) Report Vxx at new threshold. Example lung: at 3 Gy/fx, V20→ V(20×5/5) = V20Gy (same, since α/β=3 and d=3).',
  },
  {
    tag: 'Thorax',
    title: 'Cardiac Substructures: Beyond Mean Heart Dose',
    pearl: 'HyTEC 2021: LAD Dmean <10 Gy (conventional). Left circumflex: Dmean <25 Gy. Right coronary: Dmean <30 Gy. Sinoatrial node: Dmax <25 Gy (arrhythmia risk). Whole-heart Dmean remains primary constraint but substructure dose adds prognostic value for MACE and conduction abnormalities. DIBH reduces LAD dose by 70%.',
  },
  {
    tag: 'Pelvis',
    title: 'Ovarian Function: Deterministic Effect Threshold',
    pearl: 'Premature ovarian failure (POF): D ≥2 Gy (2 Gy/fx) → ~30% POF risk in women <40 (QUANTEC). At 5 Gy/fx: iso-effective = 2×5/7 = 1.43 Gy. At single fraction SRS: iso-effective limit ≈0.5 Gy. Threshold is fertility-threatening. Oophoropexy (ovarian transposition) if preserving fertility. Cryopreservation before gonadotoxic RT.',
  },
  {
    tag: 'Re-RT',
    title: 'Re-irradiation: Cumulative EQD2 is the Only Valid Currency',
    pearl: 'Adding physical doses from two RT courses is INCORRECT — tissues have different dose-per-fraction sensitivity. Always: (1) Convert each course to EQD2 using appropriate α/β. (2) Apply tissue-specific recovery factor based on time interval. (3) Sum recovered EQD2 values. For cord: new EQD2₂ = cumulative − prior × recovery_factor. Minimum reporting: cumulative EQD2 with α/β stated.',
  },
  {
    tag: 'Pelvis',
    title: 'Penile Bulb Sparing for Erectile Function',
    pearl: 'Penile bulb Dmean <52.5 Gy (2 Gy/fx) associated with erectile function preservation (RTOG 0126). D50% <29.5 Gy (SBRT 5fx). Neurovascular bundles at 5 and 7 o\'clock positions on axial MRI. SpaceOAR hydrogel reduces rectal AND perineal body dose. Contour penile bulb specifically — do not omit from plan optimisation.',
  },
  {
    tag: 'Head & Neck',
    title: 'PCM and Dysphagia: Superior Constrictor Critical',
    pearl: 'Superior pharyngeal constrictor muscle (SPCM) Dmean <50 Gy correlates with reduced dysphagia/PEG-tube dependence (Eisbruch 2004). Middle PCM Dmean <60 Gy. Combined PCM mean <47 Gy (UK DARS trial, Level 1B). Dysphagia hierarchy: soft foods → liquids → PEG dependency. Swallowing rehabilitation during RT reduces long-term dysphagia by 30%.',
  },
];

// ─── Style maps ─────────────────────────────────────────────────────────────
const EVIDENCE_COLORS: Record<EvidenceLevel, string> = {
  Level_1A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Level_1B: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Level_2A: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Level_2B: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Level_3:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Expert:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const PRIORITY_STYLES: Record<string, string> = {
  Absolute: 'bg-red-500/10 text-red-500 border-red-500/20',
  Hard:     'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Soft:     'bg-white/5 text-slate-500 border-white/10',
  Goal:     'bg-teal-500/10 text-teal border-teal/20',
};

const TYPE_STYLES: Record<string, string> = {
  Serial:   'bg-red-500/10 text-red-400 border-red-500/20',
  Parallel: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Mixed:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const TAG_BG: Record<string, string> = {
  'Radiobiology': 'bg-violet-100 text-violet-700',
  'Head & Neck':  'bg-rose-100 text-rose-700',
  'Thorax':       'bg-sky-100 text-sky-700',
  'Pelvis':       'bg-teal-100 text-teal-700',
  'CNS':          'bg-indigo-100 text-indigo-700',
  'Abdomen':      'bg-amber-100 text-amber-700',
  'Re-RT':        'bg-orange-100 text-orange-700',
};

const DIFF_COLORS: Record<string, string> = {
  intern:   'bg-emerald-100 text-emerald-700',
  resident: 'bg-amber-100 text-amber-700',
  fellow:   'bg-red-100 text-red-700',
};

// ─── Regions ─────────────────────────────────────────────────────────────────
const REGIONS: { id: Region; label: string }[] = [
  { id: 'CNS',         label: 'CNS' },
  { id: 'HeadAndNeck', label: 'H&N' },
  { id: 'Thorax',      label: 'Thorax' },
  { id: 'Abdomen',     label: 'Abdomen' },
  { id: 'Pelvis',      label: 'Pelvis' },
  { id: 'Spine_SBRT',  label: 'Spine SBRT' },
];

// ─── EQD2 helper ─────────────────────────────────────────────────────────────
function scaleLimit(
  limit: number,
  metricType: Constraint['metricType'],
  ab: number,
  dNew: number
): { scaled: number; eqd2: number; scalable: boolean } {
  if (metricType === 'Vxx' || metricType === 'absolute_volume') {
    return { scaled: limit, eqd2: limit, scalable: false };
  }
  const result = scaleConstraintToRegime(limit, ab, 2.0, dNew);
  const eqd2   = result.BED_ref / (1 + 2 / ab);
  return { scaled: result.scaledLimit, eqd2, scalable: true };
}

// ─── LKB NTCP Calculator — proper named component (hooks MUST NOT be in IIFE) ──
interface NTCPModel { n: number; m: number; TD50: number; }

const NTCPCalculator: React.FC<{ ntcpModel: NTCPModel }> = ({ ntcpModel }) => {
  const { n, m, TD50 } = ntcpModel;
  const isParallel = n >= 0.7;

  const normCDF = (x: number) => {
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741,
          a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const sign = x < 0 ? -1 : 1;
    const t = 1 / (1 + p * Math.abs(x) / Math.SQRT2);
    const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x/2);
    return 0.5 * (1 + sign * y);
  };

  const [gEUD, setGEUD] = useState(TD50 * 0.7);
  const ntcp     = normCDF((gEUD - TD50) / (m * TD50));
  const ntcpPct  = (ntcp * 100).toFixed(1);
  const ntcpColor = ntcp < 0.05 ? 'text-emerald-400' : ntcp < 0.20 ? 'text-amber-400' : 'text-red-400';
  const riskLabel = ntcp < 0.05 ? 'Low (<5%)' : ntcp < 0.20 ? 'Moderate' : 'High (>20%)';

  return (
    <div className="bg-slate-900 rounded-xl px-3 py-2.5 font-mono text-white">
      <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-widest mb-2">
        LKB NTCP Calculator
      </p>
      <div className="flex gap-4 text-[11px] mb-2">
        <span>n = <span className="text-blue-300 font-bold">{n}</span></span>
        <span>m = <span className="text-emerald-300 font-bold">{m}</span></span>
        <span>TD50 = <span className="text-amber-300 font-bold">{TD50} Gy</span></span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-[10px] text-slate-400 font-sans w-28 flex-shrink-0">
          {isParallel ? 'Dmean (gEUD)' : 'Dmax (gEUD)'}
        </label>
        <input type="range" min={0} max={TD50 * 2} step={0.5}
          value={gEUD} onChange={e => setGEUD(parseFloat(e.target.value))}
          className="flex-1 accent-blue-400" />
        <input type="number" min={0} max={TD50 * 2} step={0.5}
          value={gEUD.toFixed(1)}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setGEUD(v); }}
          className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
        <span className="text-[9px] text-slate-500">Gy</span>
      </div>
      <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
        <div>
          <p className="text-[9px] text-slate-500 font-sans uppercase tracking-wider">NTCP</p>
          <p className={`text-xl font-black ${ntcpColor}`}>{ntcpPct}%</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-sans uppercase tracking-wider">Formula</p>
          <p className="text-[9px] text-slate-400 font-sans">
            Φ[({gEUD.toFixed(1)} − {TD50}) / ({m} × {TD50})]
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-sans uppercase tracking-wider">Risk</p>
          <p className={`text-[11px] font-bold font-sans ${ntcpColor}`}>{riskLabel}</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-500 font-sans mt-1.5">
        {isParallel
          ? `Parallel organ (n=${n}) — mean dose drives NTCP. Enter Dmean as gEUD.`
          : `Serial organ (n=${n}) — Dmax drives NTCP. Enter Dmax as gEUD.`}
        {' '}TD5/5 ≈ {(TD50 * (1 - 1.645 * m)).toFixed(1)} Gy
      </p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OARReferencePage: React.FC = () => {
  const [region,    setRegion]    = useState<Region>('Pelvis');
  const [tab,       setTab]       = useState<TabType>('Constraints');
  const [search,    setSearch]    = useState('');
  const [selId,     setSelId]     = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState('Std 2Gy');
  const [customDfx, setCustomDfx] = useState('');
  const [customNfx, setCustomNfx] = useState('');
  const [showScaled,    setShowScaled]    = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "α/β Ratios — Late Responding Tissue",
      emoji: "🧬",
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.3)",
      rows: [
        { k: 'Lens', v: '1.2 Gy' },
        { k: 'Femoral heads', v: '1.8 Gy' },
        { k: 'Spinal cord', v: '2.0 Gy' },
        { k: 'Brainstem', v: '2.1 Gy' },
        { k: 'Heart', v: '2.5 Gy' },
        { k: 'Lung / Parotid', v: '3.0 Gy' },
        { k: 'Bowel', v: '3.0 Gy' },
        { k: 'Cochlea', v: '3.0 Gy' },
        { k: 'Prostate tumour', v: '1.5 Gy' },
      ]
    },
    {
      title: "Organ Architecture",
      emoji: "🏗️",
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.3)",
      rows: [
        { k: 'Serial (Dmax driven)', v: 'Cord, Chiasm, Bowel wall, Urethra' },
        { k: 'Parallel (Mean driven)', v: 'Lung, Liver, Kidney, Parotid' },
        { k: 'Mixed', v: 'Heart, Rectum, Bladder' },
      ]
    },
    {
      title: "EQD2 Scaling",
      emoji: "🧮",
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.3)",
      rows: [
        { k: 'Formula', v: 'D_ref × (d_ref + α/β) / (d_new + α/β)', mono: true },
      ]
    },
    {
      title: "QUANTEC 2 Gy/fx Reference",
      emoji: "📊",
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      border: "rgba(245, 158, 11, 0.3)",
      rows: [
        { k: 'Spinal cord Dmax', v: '≤45 Gy' },
        { k: 'Brainstem Dmax', v: '≤54 Gy' },
        { k: 'Optic chiasm Dmax', v: '≤54 Gy' },
        { k: 'Lung V20Gy', v: '<20–35%' },
        { k: 'Lung MLD', v: '≤20 Gy' },
        { k: 'Parotid Dmean', v: '≤25 Gy (≥1 gland)' },
        { k: 'Heart Dmean', v: '<2 Gy (breast)' },
        { k: 'Liver Dmean (CP-A)', v: '≤30 Gy' },
      ]
    }
  ];
  const [pearlTag,      setPearlTag]      = useState('All');
  const [expandedIdx,   setExpandedIdx]   = useState<number | null>(null);
  const [metrics,       setMetrics]       = useState<Record<string, string>>({});

  // Quiz
  const [qIdx,      setQIdx]      = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore,    setQScore]    = useState(0);
  const [qDone,     setQDone]     = useState(false);
  const [qFilter,   setQFilter]   = useState<'all' | 'intern' | 'resident' | 'fellow'>('all');

  // Rolling pearl ticker
  const [pearlTick, setPearlTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPearlTick(i => (i + 1) % CLINICAL_PEARLS.length), 12000);
    return () => clearInterval(t);
  }, []);

  // Fractionation
  const preset   = (FRACTIONATION_PRESETS as any)[presetKey];
  const isCustom = presetKey === 'Custom';
  const dFx      = isCustom ? (parseFloat(customDfx) || 2.0) : (preset?.dosePerFx ?? 2.0);
  const nFx      = isCustom ? (parseInt(customNfx)   || 25)  : (preset?.nFx       ?? 25);
  const regimeKey = preset?.regime ?? 'conventional';
  const isRef2Gy  = Math.abs(dFx - 2.0) < 0.05;

  const oars = useMemo(() =>
    OAR_DATABASE.filter(o =>
      o.region === region &&
      (search === '' || o.name.toLowerCase().includes(search.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name)),
  [region, search]);

  const selOAR: OARData | undefined = useMemo(() =>
    OAR_DATABASE.find(o => o.id === selId) ?? oars[0],
  [selId, oars]);

  function getScaled(c: Constraint, oarId: string) {
    const ab = c.alphaBeta ?? DEFAULT_AB[oarId] ?? 3.0;
    const isSBRTSpecific = c.regime.length === 1 &&
      (c.regime[0].startsWith('SBRT') || c.regime[0] === 'SRS' || c.regime[0] === 'SRS_fractionated');
    if (isSBRTSpecific) {
      return { scaled: c.limit, eqd2: c.limit, scalable: false, isSBRTSpecific: true, ab };
    }
    return { ...scaleLimit(c.limit, c.metricType, ab, dFx), isSBRTSpecific: false, ab };
  }

  // Plan checker
  const checkerResults = useMemo(() => {
    return oars.map(oar => {
      const val = parseFloat(metrics[oar.id] ?? '');
      if (isNaN(val)) return null;
      const cons = oar.constraints.filter(c =>
        c.regime.includes(regimeKey) || c.regime.includes('conventional')
      );
      if (!cons.length) return null;
      const hard = cons.find(c => c.priority === 'Hard' || c.priority === 'Absolute') ?? cons[0];
      const ab = hard.alphaBeta ?? DEFAULT_AB[oar.id] ?? 3.0;
      const { scaled, scalable } = scaleLimit(hard.limit, hard.metricType, ab, dFx);
      const effectiveLimit = (showScaled && scalable && !isRef2Gy) ? scaled : hard.limit;
      const ratio  = val / effectiveLimit;
      const status = ratio < 0.9 ? 'pass' : ratio < 1.0 ? 'warn' : 'fail';
      return { oar, val, limit: effectiveLimit, publishedLimit: hard.limit, status, metric: hard.metric, scalable };
    }).filter(Boolean) as {
      oar: OARData; val: number; limit: number; publishedLimit: number;
      status: 'pass' | 'warn' | 'fail'; metric: string; scalable: boolean;
    }[];
  }, [oars, metrics, dFx, regimeKey, showScaled]);

  // Quiz
  const filteredQs = useMemo(() =>
    (OAR_QUIZ_QUESTIONS ?? []).filter(q => qFilter === 'all' || q.difficulty === qFilter),
  [qFilter]);

  const curQ: OARQuizQuestion | undefined = filteredQs[qIdx];

  // Pearl filter tags
  const allTags = ['All', ...Array.from(new Set(CLINICAL_PEARLS.map(p => p.tag)))];
  const filteredPearls = CLINICAL_PEARLS.filter(p => pearlTag === 'All' || p.tag === pearlTag);

  // Ticker pearl
  const tickerPearl = CLINICAL_PEARLS[pearlTick];

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-slam">
      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
        title="OAR Reference"
      />

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            <p className="label-micro text-teal">QUANTEC / HyTEC Database</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">OAR Dose Limits</h1>
          <p className="text-sm text-slate-500 font-serif italic">Evidence-based toxicity thresholds for clinical planning</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="label-micro opacity-40">Active Regime</p>
            <p className="text-xl font-black text-white font-mono">
              {dFx} Gy × {nFx} fx
            </p>
          </div>
        </div>
      </header>

      {/* ── Ticker ────────────────────────────────────────────────── */}
      <div className="bg-teal/5 border border-teal/10 rounded-xl p-4 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-teal" />
        </div>
        <div className="space-y-1">
          <p className="label-micro text-teal uppercase">{tickerPearl.tag}</p>
          <p className="text-sm font-bold text-white">{tickerPearl.title}</p>
          <p className="text-xs text-slate-400 leading-relaxed italic">{tickerPearl.pearl}</p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(['Constraints', 'Checker', 'Pearls', 'Quiz', 'ReRT'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              tab === t ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'ReRT' ? 'Re-RT' : t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'Constraints' && (
          <motion.div
            key="constraints"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* ── Controls ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <section className="card-premium p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="label-micro opacity-40">Fractionation Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(FRACTIONATION_PRESETS).map(k => (
                        <button
                          key={k}
                          onClick={() => { setPresetKey(k); setCustomDfx(''); setCustomNfx(''); }}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            presetKey === k ? 'bg-teal border-teal text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                      <button
                        onClick={() => setPresetKey('Custom')}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                          presetKey === 'Custom' ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {isCustom && (
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <label className="label-micro opacity-40">Dose/Fx</label>
                        <input
                          type="number"
                          value={customDfx}
                          onChange={e => setCustomDfx(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                          placeholder="2.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="label-micro opacity-40">Fractions</label>
                        <input
                          type="number"
                          value={customNfx}
                          onChange={e => setCustomNfx(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                          placeholder="25"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 ${showScaled ? 'text-teal animate-spin-slow' : 'text-slate-600'}`} />
                      <span className="text-xs font-bold text-slate-300">Auto-Scale Constraints</span>
                    </div>
                    <button
                      onClick={() => setShowScaled(!showScaled)}
                      className={`w-10 h-5 rounded-full transition-all relative ${showScaled ? 'bg-teal' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showScaled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                <section className="card-premium p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="label-micro opacity-40">Anatomical Regions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {REGIONS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setRegion(r.id); setSelId(null); setExpandedIdx(null); }}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            region === r.id ? 'bg-teal border-teal text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search OAR..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600"
                    />
                  </div>
                </section>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* OAR List */}
                  <div className="md:col-span-4 space-y-2 max-h-[800px] overflow-y-auto no-scrollbar pr-2">
                    {oars.map(o => (
                      <button
                        key={o.id}
                        onClick={() => { setSelId(o.id); setExpandedIdx(null); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all group ${
                          selId === o.id ? 'bg-teal/10 border-teal/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <p className={`text-sm font-bold ${selId === o.id ? 'text-white' : 'text-slate-400'}`}>{o.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${TYPE_STYLES[o.type]}`}>
                            {o.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* OAR Detail */}
                  <div className="md:col-span-8 space-y-6">
                    {selOAR && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <section className="card-premium p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selOAR.name}</h2>
                              <p className="text-xs text-slate-500 font-serif italic">{selOAR.organFunction}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${TYPE_STYLES[selOAR.type]}`}>
                              {selOAR.type} Architecture
                            </div>
                          </div>
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                              <Info className="w-3 h-3 inline mr-2 text-teal" />
                              {selOAR.whyItMatters}
                            </p>
                          </div>
                          {selOAR.prvExpansion && (
                            <div className="flex items-center gap-2 text-teal">
                              <Shield className="w-4 h-4" />
                              <p className="text-xs font-bold">PRV Margin: {selOAR.prvExpansion}</p>
                            </div>
                          )}
                        </section>

                        <section className="card-premium overflow-hidden">
                          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BarChart2 className="w-4 h-4 text-teal" />
                              <h2 className="label-micro">Dose Constraints</h2>
                            </div>
                            <p className="label-micro opacity-40">LQ Model α/β = {DEFAULT_AB[selOAR.id]} Gy</p>
                          </div>
                          <div className="divide-y divide-white/5">
                            {selOAR.constraints.map((c, i) => {
                              const { scaled, eqd2, scalable, isSBRTSpecific, ab } = getScaled(c, selOAR.id) as any;
                              const limitToShow = (showScaled && scalable && !isRef2Gy) ? scaled : c.limit;
                              const isScaled    = showScaled && scalable && !isRef2Gy;
                              const isExpanded  = expandedIdx === i;

                              return (
                                <div key={i} className={`transition-all ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
                                  <button
                                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                                    className="w-full text-left px-6 py-4 flex items-center justify-between group"
                                  >
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-white group-hover:text-teal transition-colors">{c.metric}</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${PRIORITY_STYLES[c.priority]}`}>
                                          {c.priority}
                                        </span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${EVIDENCE_COLORS[c.evidenceLevel]}`}>
                                          {c.evidenceLevel.replace('Level_', '')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-lg font-black font-mono ${isScaled ? 'text-teal' : 'text-white'}`}>
                                        ≤ {limitToShow.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">{c.unit}</span>
                                      </p>
                                      {isScaled && (
                                        <p className="text-[9px] text-slate-600">Pub: {c.limit} {c.unit}</p>
                                      )}
                                    </div>
                                  </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <p className="label-micro opacity-40 mb-1">Toxicity Endpoint</p>
                                        <p className="text-xs font-bold text-white">{c.toxicityEndpoint}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${
                                          c.toxicityGrade === 'Grade 5' ? 'text-red-500' :
                                          c.toxicityGrade === 'Grade 4' ? 'text-orange-500' : 'text-amber-500'
                                        }`}>
                                          {c.toxicityGrade}
                                        </p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <p className="label-micro opacity-40 mb-1">Radiobiology</p>
                                        <p className="text-xs text-slate-300">α/β = {ab} Gy</p>
                                        <p className="text-xs text-slate-300">EQD2 = {eqd2.toFixed(1)} Gy</p>
                                      </div>
                                    </div>
                                    {c.notes && (
                                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                        <p className="text-xs text-amber-200/80 leading-relaxed italic">
                                          {c.notes}
                                        </p>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-[10px] text-slate-600 italic">
                                      <span>Source: {c.source?.join(' · ')}</span>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Volume constraint note */}
                {!isRef2Gy && selOAR.constraints.some(c => c.metricType === 'Vxx' || c.metricType === 'absolute_volume') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] text-slate-600">
                    <span className="font-bold text-slate-700">ℹ Vxx constraints at {dFx} Gy/fx: </span>
                    Cannot be algebraically scaled by LQ. Iso-effective dose example (lung, α/β=3): V20Gy at 2 Gy/fx → V{(20 * (2 + 3) / (dFx + 3)).toFixed(1)}Gy at {dFx} Gy/fx. Requires DVH recalculation for exact equivalence.
                  </div>
                )}

                {/* TD5/TD50 Emami values */}
                {selOAR.constraints.some(c => c.tdxx) && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Emami TD Values (at 2 Gy/fx)</p>
                    </div>
                    <div className="px-3 py-2 flex gap-6 flex-wrap text-sm">
                      {selOAR.constraints.filter(c => c.tdxx).map((c, i) => {
                        const ab = c.alphaBeta ?? DEFAULT_AB[selOAR.id] ?? 3.0;
                        const td5s  = isRef2Gy ? c.tdxx!.td5  : scaleLimit(c.tdxx!.td5,  'Dmax', ab, dFx).scaled;
                        const td50s = isRef2Gy ? c.tdxx!.td50 : scaleLimit(c.tdxx!.td50, 'Dmax', ab, dFx).scaled;
                        return (
                          <div key={i}>
                            <p className="text-[9px] text-slate-400 mb-0.5">{c.metric}</p>
                            <p className="text-[11px] font-bold text-green-700 font-mono">
                              TD5/5: {td5s.toFixed(1)} Gy {!isRef2Gy ? `(pub: ${c.tdxx!.td5})` : ''}
                            </p>
                            <p className="text-[11px] font-bold text-red-700 font-mono">
                              TD50/5: {td50s.toFixed(1)} Gy {!isRef2Gy ? `(pub: ${c.tdxx!.td50})` : ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* NTCP LKB model */}
                {selOAR.ntcpModel && (
                  <NTCPCalculator ntcpModel={selOAR.ntcpModel} />
                )}

                {/* Clinical pearls for OAR */}
                {selOAR.clinicalPearls?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-1.5">Clinical Pearls</p>
                    <ul className="space-y-1">
                      {selOAR.clinicalPearls.map((p, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-amber-900">
                          <span className="text-amber-500 flex-shrink-0">◆</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Imaging tips */}
                {selOAR.imagingTips && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-[11px] text-blue-800">
                    <span className="font-bold">Contouring: </span>{selOAR.imagingTips}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)}

      {/* ══════════════════════════════════════════════════════
          TAB: Plan Checker
      ══════════════════════════════════════════════════════ */}
      {tab === 'Checker' && (
        <motion.div
          key="checker"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {/* Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800">
            <p className="font-bold mb-0.5">DVH Plan Checker — {presetKey} ({dFx} Gy/fx × {nFx} fx)</p>
            <p>
              Enter actual DVH metric values from your TPS. Limits are
              {!isRef2Gy
                ? ` EQD2-scaled to ${dFx} Gy/fx using LQ (α/β organ-specific).`
                : ' at 2 Gy/fx reference (no scaling needed).'
              }
              {' '}Select regime in Constraints tab to change fractionation.
            </p>
          </div>

          {/* Region selector */}
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map(r => (
              <button key={r.id} onClick={() => setRegion(r.id)}
                className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition
                  ${region === r.id ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Input table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                DVH Values — {region}
              </p>
              {!isRef2Gy && (
                <p className="text-[9px] text-blue-600 font-bold">Limits scaled to {dFx} Gy/fx</p>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {oars.map(oar => {
                const relCons = oar.constraints.filter(c =>
                  c.regime.includes(regimeKey) || c.regime.includes('conventional')
                );
                const hardCon = relCons.find(c => c.priority === 'Hard' || c.priority === 'Absolute') ?? relCons[0];
                if (!hardCon) return null;
                const ab = hardCon.alphaBeta ?? DEFAULT_AB[oar.id] ?? 3.0;
                const { scaled, scalable } = scaleLimit(hardCon.limit, hardCon.metricType, ab, dFx);
                const effectiveLimit = (showScaled && scalable && !isRef2Gy) ? scaled : hardCon.limit;
                const result = checkerResults.find(r => r.oar.id === oar.id);

                return (
                  <div key={oar.id}
                    className={`flex items-center gap-2 px-3 py-2 ${
                      result?.status === 'fail' ? 'bg-red-50' :
                      result?.status === 'warn' ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800">{oar.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {hardCon.metric.split('<')[0].trim()} ≤{' '}
                        <span className={!isRef2Gy && scalable ? 'text-blue-600 font-bold' : ''}>
                          {effectiveLimit.toFixed(1)} {hardCon.unit}
                        </span>
                        {!isRef2Gy && scalable && (
                          <span className="text-slate-300 ml-1">(pub: {hardCon.limit})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number" step="0.1"
                        placeholder={`≤${effectiveLimit.toFixed(1)}`}
                        value={metrics[oar.id] ?? ''}
                        onChange={e => setMetrics(m => ({ ...m, [oar.id]: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono w-20 text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      {result && (
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg flex-shrink-0 ${
                          result.status === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                          result.status === 'warn' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.status === 'pass' ? '✓ OK' :
                           result.status === 'warn' ? '⚠ Near' : '✗ FAIL'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>

          {/* Summary */}
          {checkerResults.length > 0 && (
            <div className="bg-[#1e3a5f] rounded-xl text-white px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-2">
                Plan Summary — {region}
              </p>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                {(['pass', 'warn', 'fail'] as const).map(s => (
                  <div key={s}>
                    <p className={`text-3xl font-black font-mono ${
                      s === 'pass' ? 'text-emerald-400' :
                      s === 'warn' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {checkerResults.filter(r => r.status === s).length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-blue-200/60">
                      {s === 'pass' ? 'Within limits' :
                       s === 'warn' ? 'Near limit (≥90%)' : 'Violated'}
                    </p>
                  </div>
                ))}
              </div>
              {checkerResults.filter(r => r.status === 'fail').length > 0 && (
                <div className="space-y-1 border-t border-blue-900 pt-2 mt-2">
                  <p className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Violated OARs</p>
                  {checkerResults.filter(r => r.status === 'fail').map((r, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="text-red-300">{r.oar.name}</span>
                      <span className="font-mono text-red-200">
                        {r.val.toFixed(1)} / {r.limit.toFixed(1)} {r.oar.constraints[0]?.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!isRef2Gy && (
                <p className="mt-2 text-center text-[9px] text-blue-200/50">
                  Limits EQD2-scaled to {dFx} Gy/fx · α/β organ-specific
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Clinical Pearls
      ══════════════════════════════════════════════════════ */}
      {tab === 'Pearls' && (
        <motion.div
          key="pearls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {/* Tag filter */}
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button key={tag} onClick={() => setPearlTag(tag)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  pearlTag === tag
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 px-1">
            {filteredPearls.length} pearls — including complete EQD2 scaling examples.
          </p>

          <div className="space-y-2">
            {filteredPearls.map((p, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-3 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${TAG_BG[p.tag] ?? 'bg-slate-100 text-slate-600'}`}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-800 mb-1">{p.title}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">{p.pearl}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Quiz
      ══════════════════════════════════════════════════════ */}
      {tab === 'Quiz' && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >

          {/* Difficulty filter */}
          {!qDone && (
            <div className="flex gap-1.5">
              {(['all', 'intern', 'resident', 'fellow'] as const).map(d => (
                <button key={d}
                  onClick={() => { setQFilter(d); setQIdx(0); setQScore(0); setQAnswered(null); }}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    qFilter === d
                      ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {d === 'all' ? `All (${(OAR_QUIZ_QUESTIONS ?? []).length})` : `${d} (${(OAR_QUIZ_QUESTIONS ?? []).filter(q => q.difficulty === d).length})`}
                </button>
              ))}
            </div>
          )}

          {filteredQs.length === 0 ? (
            <p className="text-sm text-slate-500 italic px-1">No questions for this difficulty level.</p>
          ) : qDone ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1e3a5f] rounded-xl text-white px-4 py-6 text-center space-y-3"
            >
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60">Quiz Complete</p>
              <p className="text-5xl font-black font-mono">
                {qScore}<span className="text-slate-500 text-2xl">/{filteredQs.length}</span>
              </p>
              <p className="text-sm text-blue-200">{Math.round(qScore / filteredQs.length * 100)}% correct</p>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                qScore / filteredQs.length >= 0.75 ? 'bg-emerald-700 text-white' :
                qScore / filteredQs.length >= 0.5  ? 'bg-amber-700 text-white' :
                'bg-red-700 text-white'
              }`}>
                {qScore / filteredQs.length >= 0.75 ? 'Excellent — FRCR/ABR Ready' :
                 qScore / filteredQs.length >= 0.5  ? 'Good — Review weak areas' :
                 'Needs further study'}
              </div>
              <button
                onClick={() => { setQIdx(0); setQScore(0); setQDone(false); setQAnswered(null); }}
                className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition mt-2"
              >
                Restart Quiz
              </button>
            </motion.div>
          ) : curQ ? (
            <div className="space-y-3">
              {/* Progress */}
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Q {qIdx + 1} of {filteredQs.length}</span>
                <span className="font-black text-blue-700">Score: {qScore}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-blue-600 rounded-full"
                  animate={{ width: `${(qIdx / filteredQs.length) * 100}%` }} />
              </div>

              {/* Source + difficulty badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${DIFF_COLORS[curQ.difficulty]}`}>
                  {curQ.difficulty}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{curQ.source}</span>
              </div>

              {/* Question */}
              <div className="bg-white rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{curQ.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {curQ.options.map((opt, i) => {
                  let style = 'bg-white border-slate-200 text-slate-700 hover:border-blue-300';
                  if (qAnswered !== null) {
                    if (i === curQ.correctIndex)
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
                        if (i === curQ.correctIndex) setQScore(s => s + 1);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition ${style}`}
                    >
                      <span className="font-black mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {qAnswered !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        {qAnswered === curQ.correctIndex
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <XCircle className="w-3.5 h-3.5 text-red-500" />
                        }
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                          {qAnswered === curQ.correctIndex ? 'Correct' : `Incorrect — Answer: ${String.fromCharCode(65 + curQ.correctIndex)}`}
                        </p>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">{curQ.explanation}</p>
                    </div>
                    {curQ.clinicalPearl && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-[10px] text-blue-800">
                        <span className="font-black text-blue-700">Pearl: </span>
                        {curQ.clinicalPearl}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {qAnswered !== null && (
                <button
                  onClick={() => {
                    setQAnswered(null);
                    if (qIdx + 1 >= filteredQs.length) setQDone(true);
                    else setQIdx(i => i + 1);
                  }}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black transition"
                >
                  {qIdx + 1 >= filteredQs.length ? 'See Final Score' : 'Next Question →'}
                </button>
              )}
            </div>
          ) : null}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Re-irradiation
      ══════════════════════════════════════════════════════ */}
      {tab === 'ReRT' && (
        <motion.div
          key="rert"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {/* Intro */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-[10px] text-orange-800">
            <p className="font-bold mb-0.5">Re-irradiation: Cumulative EQD2 is the ONLY valid currency.</p>
            <p>Adding physical doses from two courses is incorrect. Always: (1) Convert each course to EQD2 with the appropriate α/β. (2) Apply a tissue-specific recovery factor based on time interval. (3) Sum to check against cumulative limits below.</p>
          </div>

          {/* Select OAR with re-RT data */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Select OAR for Re-RT Guidance
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(REIRRT).map(id => {
                const oar = OAR_DATABASE.find(o => o.id === id);
                if (!oar) return null;
                return (
                  <button key={id} onClick={() => setSelId(id)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                      (selId === id || (!selId && id === Object.keys(REIRRT)[0]))
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    {oar.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Re-RT detail */}
          {(() => {
            const activeId = selId && REIRRT[selId] ? selId : Object.keys(REIRRT)[0];
            const entry = REIRRT[activeId];
            const oar   = OAR_DATABASE.find(o => o.id === activeId);
            if (!entry || !oar) return null;

            return (
              <div className="space-y-2">
                <div className="bg-white rounded-xl border border-orange-200 p-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 font-display">{oar.name}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_STYLES[oar.type]}`}>
                        {oar.type}
                      </span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 text-center flex-shrink-0">
                      <p className="text-[9px] text-orange-600 font-black uppercase">Max Cumulative</p>
                      <p className="text-base font-black text-orange-800 font-mono">{entry.maxCumEQD2}</p>
                      <p className="text-[9px] text-orange-600">{entry.unit}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Minimum Interval', value: entry.minInterval, color: 'text-blue-700' },
                      { label: 'Clinical Guidance', value: entry.notes, color: 'text-slate-700' },
                      { label: 'Recovery Model', value: entry.recoveryModel, color: 'text-violet-700' },
                      { label: 'Reference', value: entry.reference, color: 'text-slate-400 italic' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-[11px]">
                        <span className="font-black text-slate-600 block text-[9px] uppercase tracking-wider mb-0.5">{label}</span>
                        <p className={`leading-relaxed ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EQD2 calculation reminder */}
                <div className="bg-slate-900 text-white rounded-xl px-3 py-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    EQD2 Calculation Worked Example — {oar.name}
                  </p>
                  {(() => {
                    const ab = DEFAULT_AB[activeId] ?? 3.0;
                    const course1Total = 45; const course1DPF = 1.8;
                    const eqd2_1 = course1Total * (course1DPF + ab) / (2 + ab);
                    const course2Total = 24; const course2DPF = 3.0;
                    const eqd2_2 = course2Total * (course2DPF + ab) / (2 + ab);
                    const recovery = 0.5; // 6-month recovery factor
                    const cumulative = eqd2_1 * (1 - recovery) + eqd2_2;
                    return (
                      <div className="space-y-1 font-mono text-[10px]">
                        <p className="text-slate-300">Course 1: {course1Total} Gy / {course1Total/course1DPF} fx ({course1DPF} Gy/fx, α/β={ab})</p>
                        <p className="text-blue-300 ml-2">→ EQD2₍{ab}₎ = {course1Total} × ({course1DPF}+{ab}) / (2+{ab}) = <span className="font-black text-white">{eqd2_1.toFixed(1)} Gy</span></p>
                        <p className="text-slate-300 mt-1">Course 2 (after 6 months): {course2Total} Gy / {course2Total/course2DPF} fx ({course2DPF} Gy/fx)</p>
                        <p className="text-blue-300 ml-2">→ EQD2₍{ab}₎ = {course2Total} × ({course2DPF}+{ab}) / (2+{ab}) = <span className="font-black text-white">{eqd2_2.toFixed(1)} Gy</span></p>
                        <p className="text-amber-300 mt-1">Recovery factor at 6 months: ~{(recovery*100).toFixed(0)}% repaired</p>
                        <p className="text-amber-300 ml-2">→ Cumulative = {eqd2_1.toFixed(1)}×{(1-recovery)} + {eqd2_2.toFixed(1)} = <span className={`font-black ${cumulative <= entry.maxCumEQD2 ? 'text-emerald-300' : 'text-red-400'}`}>{cumulative.toFixed(1)} Gy</span></p>
                        <p className={`mt-1 text-[10px] font-black font-sans ${cumulative <= entry.maxCumEQD2 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {cumulative <= entry.maxCumEQD2
                            ? `✓ Within limit (${entry.maxCumEQD2} ${entry.unit})`
                            : `✗ EXCEEDS limit (${entry.maxCumEQD2} ${entry.unit}) — reduce course 2 dose`
                          }
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Universal re-RT principles */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Universal Re-RT Principles
            </p>
            {[
              { n: '1', t: 'EQD2 currency', d: 'Always convert ALL dose from ALL prior courses to EQD2 using the OAR-specific α/β before summing. Never add physical doses.' },
              { n: '2', t: 'Document prior doses', d: 'Retrieve original RT records: total dose, fractionation, field details. Estimate EQD2 for each OAR. When records unavailable, use conservative estimates.' },
              { n: '3', t: 'Recovery model', d: 'Apply tissue-specific recovery model based on time interval. Cord: ~50% at 6 months, ~80% at 2 years. Most tissues: similar. Fibrotic tissue: minimal recovery.' },
              { n: '4', t: 'Geometric dose overlap', d: 'Assess which OAR volumes overlap between courses. Hot-spot overlap is highest risk. Ensure new field does not reproduce identical OAR exposure.' },
              { n: '5', t: 'Multidisciplinary decision', d: 'All re-irradiation cases should be discussed at multidisciplinary tumour board. Document rationale, risks, patient consent, and expected benefit:risk ratio.' },
            ].map(item => (
              <div key={item.n} className="flex gap-3 mb-3 last:mb-0">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.n}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{item.t}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* ── Reference footer ─────────────────────────────────── */}
      <div className="text-[9px] text-slate-400 px-1 space-y-0.5 border-t border-slate-100 pt-3 mt-2">
        <p>QUANTEC (Marks LB et al. IJROBP 76(3) Suppl 2010) · HyTEC (Grimm/Herman et al. 2021)</p>
        <p>GEC-ESTRO EMBRACE II (Pötter 2021) · AAPM TG-101 · TG-158 (cisplatin/cochlea)</p>
        <p>RTOG/NRG protocol constraints · Emami 1991 TD values · Darby NEJM 2013 (heart)</p>
        <p className="text-[8px] text-slate-300">
          EQD2 scaling formula: D_scaled = D_ref × (d_ref + α/β) / (d_new + α/β). Reference d = 2 Gy/fx.
          Valid for Dmax/Dmean constraints only. Volume constraints require DVH recalculation.
          For clinical decisions, consult institutional protocols and multidisciplinary team.
        </p>
      </div>
    </div>
  );
};

export default OARReferencePage;
