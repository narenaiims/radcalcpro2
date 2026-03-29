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
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
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
type TabType = 'Practice' | 'Checker' | 'Pearls' | 'Quiz' | 'ReRT';

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
    notes: 'Sahgal protocol: new course ≤25 Gy EQD2₂ if prior ≤45 Gy EQD2₂ (cumulative). This is for cases with prior conventional RT, do not conflate with de-novo SBRT spine point constraints (RTOG 0631). Recovery ~50% at 6 months, ~80% at 2 years. NEVER sum physical doses — EQD2 currency only.',
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
  const [quizMode, setQuizMode] = useState(false);
  const [region,    setRegion]    = useState<Region>('Pelvis');
  const [selId,     setSelId]     = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState('Std 2Gy');
  const [totalDose, setTotalDose] = useState('70');
  const [fractions, setFractions] = useState('35');
  const [showScaled,    setShowScaled]    = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedIdx,   setExpandedIdx]   = useState<string | number | null>('region-list');
  const [metrics,       setMetrics]       = useState<Record<string, string>>({});

  // Quiz State
  const [qIdx,      setQIdx]      = useState(0);
  const [qAnswered, setQAnswered] = useState<number | null>(null);
  const [qScore,    setQScore]    = useState(0);
  const [qDone,     setQDone]     = useState(false);
  const [qFilter,   setQFilter]   = useState<'all' | 'intern' | 'resident' | 'fellow'>('all');

  // Fractionation
  const preset   = FRACTIONATION_PRESETS[presetKey as keyof typeof FRACTIONATION_PRESETS];
  const isCustom = presetKey === 'Custom';
  const dFx      = isCustom ? ((parseFloat(totalDose) / parseFloat(fractions)) || 2.0) : (preset?.dosePerFx ?? 2.0);
  const nFx      = isCustom ? (parseInt(fractions)   || 25)  : (preset?.nFx       ?? 25);
  
  useEffect(() => {
    console.log('Debug: isCustom=', isCustom, 'totalDose=', totalDose, 'fractions=', fractions, 'dFx=', dFx, 'nFx=', nFx);
  }, [isCustom, totalDose, fractions, dFx, nFx]);
  const regimeKey = preset?.regime ?? 'conventional';
  const isRef2Gy  = Math.abs(dFx - 2.0) < 0.05;

  const oars = useMemo(() => {
    return OAR_DATABASE.filter(o =>
      o.region === region
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [region]);

  const selOAR: OARData | undefined = useMemo(() =>
    selId ? OAR_DATABASE.find(o => o.id === selId) : undefined,
  [selId]);

  // Auto-select first OAR when region changes
  useEffect(() => {
    if (oars.length > 0) {
      const currentOarInRegion = oars.find(o => o.id === selId);
      if (!currentOarInRegion) {
        setSelId(oars[0].id);
      }
    }
  }, [region, oars, selId]);

  // Rolling pearl ticker
  const [pearlTick, setPearlTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPearlTick(i => (i + 1) % CLINICAL_PEARLS.length), 12000);
    return () => clearInterval(t);
  }, []);

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

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen relative">
      <div className="atmosphere-bg" />
      <div className="mesh-grid" />

      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
        title="OAR Reference"
      />

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal" />
            <p className="label-micro text-teal">QUANTEC / HyTEC Database</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">OAR Dose Limits</h1>
          <p className="text-xs md:text-sm text-slate-500 font-serif italic max-w-xl">
            Comprehensive database of organ-at-risk constraints with real-time EQD2 scaling and evidence-based toxicity thresholds.
          </p>
        </div>
        
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-4">
          <div className="text-left md:text-right">
            <p className="label-micro opacity-40">Active Regime</p>
            <p className="text-xl md:text-2xl font-black text-white font-mono">
              {dFx.toFixed(1)} Gy × {Math.round(nFx)} fx
            </p>
          </div>
          <button
            onClick={() => setQuizMode(!quizMode)}
            className={`btn-premium py-2 px-4 flex items-center gap-2 ${quizMode ? 'btn-primary' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="whitespace-nowrap">{quizMode ? 'Back' : 'Quiz'}</span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {quizMode ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            {qDone ? (
              <section className="card-premium p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-teal" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight">Assessment Complete</h2>
                  <p className="text-slate-400 font-serif italic">You've completed the OAR constraints review.</p>
                </div>
                <div className="text-6xl font-black text-white">
                  {qScore}<span className="text-2xl text-slate-600">/{OAR_QUIZ_QUESTIONS.length}</span>
                </div>
                <button
                  onClick={() => { setQIdx(0); setQScore(0); setQDone(false); setQAnswered(null); }}
                  className="btn-premium btn-primary py-3 px-8"
                >
                  Restart Assessment
                </button>
              </section>
            ) : (
              <section className="card-premium p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold">
                      {qIdx + 1}
                    </div>
                    <div>
                      <p className="label-micro opacity-40">Question {qIdx + 1} of {OAR_QUIZ_QUESTIONS.length}</p>
                      <p className="text-xs font-bold text-white">{curQ?.difficulty.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label-micro opacity-40">Score</p>
                    <p className="text-xl font-black text-teal">{qScore}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white leading-tight">
                  {curQ?.question}
                </h2>

                <div className="space-y-3">
                  {curQ?.options.map((opt, i) => {
                    let status = 'default';
                    if (qAnswered !== null) {
                      if (i === curQ.correctIndex) status = 'correct';
                      else if (i === qAnswered) status = 'wrong';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => { setQAnswered(i); if (i === curQ.correctIndex) setQScore(s => s + 1); }}
                        disabled={qAnswered !== null}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                          status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
                          status === 'wrong' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                          'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <span className="font-medium">{opt}</span>
                        {status === 'correct' && <CheckCircle className="w-5 h-5" />}
                        {status === 'wrong' && <AlertTriangle className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>

                {qAnswered !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-teal/5 rounded-xl border border-teal/10 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-teal">
                      <Info className="w-4 h-4" />
                      <p className="label-micro">Clinical Explanation</p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      {curQ?.explanation}
                    </p>
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setQAnswered(null);
                          if (qIdx + 1 >= OAR_QUIZ_QUESTIONS.length) setQDone(true);
                          else setQIdx(i => i + 1);
                        }}
                        className="btn-premium btn-primary py-2 px-6"
                      >
                        {qIdx === OAR_QUIZ_QUESTIONS.length - 1 ? 'Finish' : 'Next Question'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reference"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ── Left Column: Region & OAR List ────────────────── */}
              <div className="lg:col-span-3 space-y-6 sticky top-[72px] lg:top-8 z-30 bg-[#060810]/80 backdrop-blur-md lg:bg-transparent -mx-4 px-4 py-4 lg:mx-0 lg:px-0 lg:py-0 border-b border-white/5 lg:border-none">
                {/* Region Selector inside Left Column */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <Activity className="w-4 h-4 text-teal" />
                    <h3 className="label-micro opacity-40 uppercase tracking-widest">Select Anatomy Region</h3>
                  </div>
                  <div className="flex lg:grid lg:grid-cols-2 gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
                    {REGIONS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setRegion(r.id); setSelId(null); }}
                        className={`px-3 py-2 rounded-xl border transition-all text-left flex-shrink-0 lg:flex-shrink ${
                          region === r.id
                            ? 'bg-teal/10 border-teal/50 shadow-sm shadow-teal/5'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <p className={`text-[10px] font-bold leading-tight whitespace-nowrap lg:whitespace-normal ${region === r.id ? 'text-white' : 'text-slate-400'}`}>
                          {r.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <Shield className="w-4 h-4 text-teal" />
                    <h3 className="label-micro opacity-40">Organs in {region}</h3>
                  </div>
                  <div className="flex lg:block lg:space-y-2 gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar lg:max-h-[50vh] lg:overflow-y-auto pr-2 custom-scrollbar">
                    {oars.map(oar => (
                      <button
                        key={oar.id}
                        onClick={() => setSelId(oar.id)}
                        className={`min-w-[140px] lg:min-w-0 text-left p-3 rounded-xl border transition-all group flex-shrink-0 lg:flex-shrink ${
                          selId === oar.id
                            ? 'bg-teal/10 border-teal/50 shadow-md shadow-teal/5'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-bold truncate ${selId === oar.id ? 'text-white' : 'text-slate-400'}`}>
                            {oar.name}
                          </p>
                          <ChevronRight className={`w-3 h-3 transition-transform hidden lg:block ${selId === oar.id ? 'text-teal translate-x-1' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 uppercase">
                            {oar.type}
                          </span>
                          {metrics[oar.id] && (
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              checkerResults.find(r => r.oar.id === oar.id)?.status === 'fail' ? 'bg-red-500' :
                              checkerResults.find(r => r.oar.id === oar.id)?.status === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <section className="card-premium p-4 space-y-4 hidden lg:block">
                  <div className="flex items-center justify-between">
                    <h3 className="label-micro opacity-40">Active Regime</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-teal font-bold font-mono">{dFx.toFixed(1)} Gy × {Math.round(nFx)} fx</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(FRACTIONATION_PRESETS).map(key => (
                      <button
                        key={key}
                        onClick={() => setPresetKey(key)}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all ${
                          presetKey === key
                            ? 'bg-teal text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  
                  {isCustom && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 uppercase">Total (Gy)</p>
                        <input
                          type="number"
                          value={totalDose}
                          onChange={e => setTotalDose(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-teal"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] text-slate-500 uppercase">Fractions</p>
                        <input
                          type="number"
                          value={fractions}
                          onChange={e => setFractions(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-teal"
                        />
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* ── Right Column: OAR Details & Constraints ────────────────── */}
              <div className="lg:col-span-9 space-y-6">
                {/* Mobile Fractionation - only visible on mobile */}
                <div className="lg:hidden mt-6">
                  <section className="card-premium p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="label-micro opacity-40">Active Regime</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-teal font-bold font-mono">{dFx.toFixed(1)} Gy × {Math.round(nFx)} fx</span>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {Object.keys(FRACTIONATION_PRESETS).map(key => (
                        <button
                          key={key}
                          onClick={() => setPresetKey(key)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                            presetKey === key
                              ? 'bg-teal text-white'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    {isCustom && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div className="space-y-1">
                          <p className="text-[8px] text-slate-500 uppercase">Total (Gy)</p>
                          <input
                            type="number"
                            value={totalDose}
                            onChange={e => setTotalDose(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-teal"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-slate-500 uppercase">Fractions</p>
                          <input
                            type="number"
                            value={fractions}
                            onChange={e => setFractions(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-teal"
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {selOAR ? (
                  <div className="space-y-6">
                    <section className="card-premium p-6 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selOAR.name}</h2>
                            <span className="px-3 py-1 bg-teal/10 border border-teal/50 rounded-full text-[10px] font-bold text-teal uppercase tracking-widest">
                              {selOAR.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 font-serif italic leading-relaxed max-w-2xl">
                            {selOAR.organFunction}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="label-micro opacity-40">Plan Metric</p>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number" step="0.1"
                                placeholder="Enter value"
                                value={metrics[selOAR.id] ?? ''}
                                onChange={e => setMetrics(m => ({ ...m, [selOAR.id]: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-mono w-24 text-center text-white focus:outline-none focus:ring-1 focus:ring-teal"
                              />
                              {metrics[selOAR.id] && (
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                  checkerResults.find(r => r.oar.id === selOAR.id)?.status === 'fail' ? 'bg-red-500/20 text-red-400' :
                                  checkerResults.find(r => r.oar.id === selOAR.id)?.status === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {checkerResults.find(r => r.oar.id === selOAR.id)?.status}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                          <p className="label-micro opacity-40">Clinical Significance</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{selOAR.whyItMatters}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="label-micro opacity-40">PRV Expansion</p>
                          <p className="text-xs text-white font-bold">{selOAR.prvExpansion || 'None specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="label-micro opacity-40">Re-RT Guidance</p>
                          <p className="text-xs text-slate-400 italic">{REIRRT[selOAR.id]?.notes || 'No specific data'}</p>
                        </div>
                      </div>
                    </section>

                    <section className="card-premium overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-teal" />
                          <h2 className="label-micro">Dose Constraints (Active Regime: {dFx.toFixed(1)} Gy × {Math.round(nFx)} fx)</h2>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[9px] text-slate-500 uppercase">Absolute</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            <span className="text-[9px] text-slate-500 uppercase">Hard</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                              <th className="px-6 py-4 label-micro">Endpoint</th>
                              <th className="px-6 py-4 label-micro">Metric</th>
                              <th className="px-6 py-4 label-micro text-right">Limit (Ref)</th>
                              <th className="px-6 py-4 label-micro text-right">EQD2 Scaled</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {selOAR.constraints.map((c, ci) => {
                              const { scaled, scalable, ab } = getScaled(c, selOAR.id) as { scaled: number | string, eqd2: number | string, scalable: boolean, ab: number };
                              const limitToShow = (showScaled && scalable && !isRef2Gy) ? scaled : c.limit;
                              const isScaled    = showScaled && scalable && !isRef2Gy;

                              return (
                                <tr key={ci} className="hover:bg-white/[0.01] transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${c.priority === 'Absolute' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                      <p className="text-sm font-bold text-white">{c.toxicityEndpoint}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{c.regime.join(', ')}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-slate-400">{c.metric}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${EVIDENCE_COLORS[c.evidenceLevel]}`}>
                                        Ev: {c.evidenceLevel.replace('Level_', '')}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-lg font-black text-white font-mono">
                                      {c.limit} <span className="text-[10px] font-normal text-slate-500">{c.unit}</span>
                                    </p>
                                    <p className="text-[9px] text-slate-500 uppercase">Ref: {c.regime.includes('conventional') ? '2Gy/fx' : c.regime.join(', ')}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="space-y-0.5">
                                      <p className={`text-lg font-black font-mono ${isScaled ? 'text-teal' : 'text-slate-600'}`}>
                                        {typeof limitToShow === 'number' ? limitToShow.toFixed(2) : limitToShow}
                                      </p>
                                      <p className="text-[9px] text-slate-500">α/β: {ab}</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Constraints List */}
                      <div className="md:hidden divide-y divide-white/5">
                        {selOAR.constraints.map((c, ci) => {
                          const { scaled, scalable, ab } = getScaled(c, selOAR.id) as { scaled: number | string, eqd2: number | string, scalable: boolean, ab: number };
                          const limitToShow = (showScaled && scalable && !isRef2Gy) ? scaled : c.limit;
                          const isScaled    = showScaled && scalable && !isRef2Gy;

                          return (
                            <div key={ci} className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.priority === 'Absolute' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                  <p className="text-sm font-bold text-white">{c.toxicityEndpoint}</p>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase border ${EVIDENCE_COLORS[c.evidenceLevel]}`}>
                                  Ev: {c.evidenceLevel.replace('Level_', '')}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="label-micro opacity-40 mb-1">Metric</p>
                                  <p className="text-xs text-slate-400">{c.metric}</p>
                                  <p className="text-[9px] text-slate-500 uppercase mt-1">{c.regime.join(', ')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="label-micro opacity-40 mb-1">Limit (Ref: {c.regime.includes('conventional') ? '2Gy/fx' : c.regime.join(', ')})</p>
                                  <p className="text-lg font-black text-white font-mono">
                                    {c.limit} <span className="text-[10px] font-normal text-slate-500">{c.unit}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                <div>
                                  <p className="label-micro opacity-40">α/β: {ab}</p>
                                </div>
                                <div className="text-right">
                                  <p className="label-micro opacity-40 mb-1">EQD2 Scaled</p>
                                  <p className={`text-lg font-black font-mono ${isScaled ? 'text-teal' : 'text-slate-600'}`}>
                                    {typeof limitToShow === 'number' ? limitToShow.toFixed(2) : limitToShow}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Regime Overview Section */}
                    <section className="card-premium overflow-hidden">
                      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal" />
                          <h2 className="label-micro">Regime Overview (All Applicable)</h2>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                              <th className="px-6 py-4 label-micro">Regime</th>
                              <th className="px-6 py-4 label-micro">Constraint</th>
                              <th className="px-6 py-4 label-micro text-right">Limit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {selOAR.constraints.map((c, ci) => (
                              c.regime.map((regime, ri) => (
                                <tr key={`${ci}-${ri}`} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="px-6 py-4 text-xs text-slate-400 capitalize">{regime.replace('_', ' ')}</td>
                                  <td className="px-6 py-4 text-xs text-white">{c.metric}</td>
                                  <td className="px-6 py-4 text-right text-sm font-bold text-teal font-mono">{c.limit} {c.unit}</td>
                                </tr>
                              ))
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card-premium p-6 bg-blue-500/5 border-blue-500/10">
                        <div className="flex items-center gap-2 text-blue-400 mb-3">
                          <BookOpen className="w-4 h-4" />
                          <h3 className="label-micro">Evidence Sources</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(selOAR.constraints.flatMap(c => c.source || []))).map((s, i) => (
                            <span key={i} className="text-[9px] px-2 py-1 bg-white/5 rounded text-slate-500 uppercase tracking-wider">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="card-premium p-6 bg-teal-500/5 border-teal-500/10">
                        <div className="flex items-center gap-2 text-teal mb-3">
                          <Zap className="w-4 h-4" />
                          <h3 className="label-micro">Clinical Pearls</h3>
                        </div>
                        <div className="space-y-2">
                          {selOAR.clinicalPearls?.map((p, i) => (
                            <p key={i} className="text-[10px] text-slate-400 leading-relaxed italic border-l border-teal/30 pl-3">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card-premium p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Shield className="w-12 h-12 text-slate-700" />
                    <p className="text-slate-500 italic">Select an organ from the list to view detailed constraints.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reference footer ─────────────────────────────────── */}
      <footer className="text-[9px] text-slate-500 px-1 space-y-1 border-t border-white/5 pt-6 mt-12 opacity-50">
        <p>QUANTEC (Marks LB et al. IJROBP 76(3) Suppl 2010) · HyTEC (Grimm/Herman et al. 2021)</p>
        <p>GEC-ESTRO EMBRACE II (Pötter 2021) · AAPM TG-101 · TG-158 (cisplatin/cochlea)</p>
        <p>RTOG/NRG protocol constraints · Emami 1991 TD values · Darby NEJM 2013 (heart)</p>
        <p className="text-[8px] mt-2">
          For clinical decisions, consult institutional protocols and multidisciplinary team. 
          Calculations are for reference only.
        </p>
      </footer>
    </div>
  );
};

export default OARReferencePage;
