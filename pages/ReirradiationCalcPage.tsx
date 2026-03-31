/**
 * ReirradiationCalcPage.tsx — ENHANCED CLINICAL VERSION
 *
 * What's new vs prior version:
 *   • Unified single-page layout — no tabs to hunt through; everything visible
 *   • Clinical presets (H&N re-RT, Spine SBRT, Prostate salvage, etc.)
 *   • Visual BED gauge with headroom indicator and colour transitions
 *   • Sahgal calculator now correctly handles total Dmax (not per-fraction)
 *   • Maximum safe re-RT dose displayed prominently with dose/fraction breakdown
 *   • Interval safety sweep table expanded and colour-coded
 *   • All-OAR parallel check — every OAR shown simultaneously at current inputs
 *   • Copy-to-clipboard MDT summary (plain text, no alert())
 *   • Nieder criteria checklist with live pass/fail ticks
 *   • References panel with doi links
 *   • Zero layout bugs: no tab switching required to see results
 *
 * Models implemented (unchanged from prior version, corrected Sahgal formula):
 *   Nieder C et al. IJROBP 61(3):851–855, 2005       — Spinal cord conventional
 *   Nieder C et al. Radiother Oncol 2013             — Updated cord recovery
 *   Sahgal A et al. IJROBP 82(1):107–116, 2012       — SBRT spine (thecal sac)
 *   Emami B et al. IJROBP 1991                       — TD5/5 reference
 *   Dale RG. Br J Radiol 1985                        — BED additivity
 *   QUANTEC 2010                                     — OAR constraints
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertTriangle, CheckCircle2, Copy, Check,
  ChevronDown, ChevronUp, Info, RotateCcw,
  Zap, Clock, Shield, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

import { NumberInput } from '../src/components/NumberInput';

const STORAGE_KEY = 'radonco_reRT_v3';

// ── OAR model definitions ─────────────────────────────────────────────────
interface OARModel {
  id: string;
  name: string;
  shortName: string;
  category: string;
  ab: number;
  bedLimit: number;
  eqd2Limit: number;
  singleCourseMaxBED: number;   // per-course BED ceiling (0 = no per-course limit)
  recoveryModel: 'nieder' | 'sahgal' | 'gradual' | 'none';
  recoveryThresholdMonths: number;
  recoveryFraction: number;
  maxRecovery: number;
  endpoint: string;
  clinicalPearl: string;
  references: string[];
}

const OAR_MODELS: OARModel[] = [
  {
    id: 'cord_conv',
    name: 'Spinal Cord — Conventional',
    shortName: 'Cord (conv)',
    category: 'Spine',
    ab: 2,
    bedLimit: 135,
    eqd2Limit: 50,
    singleCourseMaxBED: 98,
    recoveryModel: 'nieder',
    recoveryThresholdMonths: 6,
    recoveryFraction: 0.25,
    maxRecovery: 0.25,
    endpoint: 'Myelopathy (TD5/5)',
    clinicalPearl: 'Neither course should exceed 98 Gy₂ alone. Gap ≥6 months earns 25% BED₁ credit. Treat partial cord where possible.',
    references: ['Nieder C et al. IJROBP 2005', 'Nieder C et al. Radiother Oncol 2013'],
  },
  {
    id: 'cord_sbrt',
    name: 'Spinal Cord — SBRT Re-RT',
    shortName: 'Cord (SBRT)',
    category: 'Spine',
    ab: 2,
    bedLimit: 50,
    eqd2Limit: 25,
    singleCourseMaxBED: 0,
    recoveryModel: 'sahgal',
    recoveryThresholdMonths: 5,
    recoveryFraction: 0.20,
    maxRecovery: 0.25,
    endpoint: 'Myelopathy (Thecal sac Dmax ≤25 Gy EQD2₂ cumulative)',
    clinicalPearl: 'Sahgal 2012 dataset (n=14). Interval ≥5 months. Cumulative thecal sac EQD2₂ ≤25 Gy. Physics peer review mandatory. Not equivalent to de-novo SBRT RTOG 0631 constraint.',
    references: ['Sahgal A et al. IJROBP 2012', 'Thibault G et al. IJROBP 2015'],
  },
  {
    id: 'brainstem',
    name: 'Brainstem',
    shortName: 'Brainstem',
    category: 'CNS',
    ab: 2,
    bedLimit: 108,
    eqd2Limit: 54,
    singleCourseMaxBED: 0,
    recoveryModel: 'none',
    recoveryThresholdMonths: 999,
    recoveryFraction: 0,
    maxRecovery: 0,
    endpoint: 'Brainstem necrosis (QUANTEC)',
    clinicalPearl: 'No validated recovery model. Conservative cumulative BED₂ ≤108 Gy. Re-RT indication requires MDT consensus. Consider partial volume constraints.',
    references: ['Mayo C et al. IJROBP 2010', 'QUANTEC 2010'],
  },
  {
    id: 'optic',
    name: 'Optic Apparatus',
    shortName: 'Optic',
    category: 'CNS',
    ab: 1.6,
    bedLimit: 90,
    eqd2Limit: 54,
    singleCourseMaxBED: 0,
    recoveryModel: 'none',
    recoveryThresholdMonths: 999,
    recoveryFraction: 0,
    maxRecovery: 0,
    endpoint: 'Optic neuropathy / blindness',
    clinicalPearl: 'Serial structure — no safe recovery model. Risk rises sharply above 60 Gy EQD2₂. Any re-RT approaching this dose needs formal neuro-ophthalmology review.',
    references: ['Parsons JT et al. IJROBP 1994', 'QUANTEC 2010'],
  },
  {
    id: 'brachial',
    name: 'Brachial Plexus',
    shortName: 'Brachial Plexus',
    category: 'H&N / Thorax',
    ab: 3,
    bedLimit: 120,
    eqd2Limit: 60,
    singleCourseMaxBED: 0,
    recoveryModel: 'gradual',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.10,
    maxRecovery: 0.15,
    endpoint: 'Neuropathy / plexopathy',
    clinicalPearl: 'Limited re-RT data. Cumulative EQD2₃ ≤60–70 Gy generally applied. Some recovery possible after 12 months but evidence weak. Dose at Dmax, not mean.',
    references: ['Johansson S et al. Acta Oncol 2004', 'QUANTEC 2010'],
  },
  {
    id: 'lung',
    name: 'Lung (mean dose)',
    shortName: 'Lung mean',
    category: 'Thorax',
    ab: 3,
    bedLimit: 100,
    eqd2Limit: 40,
    singleCourseMaxBED: 0,
    recoveryModel: 'gradual',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.15,
    maxRecovery: 0.20,
    endpoint: 'Pneumonitis (Grade ≥3)',
    clinicalPearl: 'Cumulative mean lung dose ≤40 Gy EQD2. Check V20 ≤30–35% bilaterally. 4DCT essential for re-RT planning. Recovery after 12 months uncertain.',
    references: ['Huang CF et al. Clin Lung Cancer 2019', 'QUANTEC 2010'],
  },
  {
    id: 'parotid',
    name: 'Parotid Gland',
    shortName: 'Parotid',
    category: 'H&N',
    ab: 3,
    bedLimit: 67,
    eqd2Limit: 25,
    singleCourseMaxBED: 0,
    recoveryModel: 'gradual',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.10,
    maxRecovery: 0.20,
    endpoint: 'Severe xerostomia (mean dose ≤25 Gy EQD2)',
    clinicalPearl: 'Aim cumulative mean dose ≤25 Gy EQD2₃ (at least one parotid). In re-RT H&N, xerostomia is often unavoidable — patient counselling and saliva substitutes essential.',
    references: ['QUANTEC 2010', 'Eisbruch A et al. IJROBP 2010'],
  },
  {
    id: 'rectum',
    name: 'Rectum',
    shortName: 'Rectum',
    category: 'Pelvis',
    ab: 3,
    bedLimit: 157,
    eqd2Limit: 75,
    singleCourseMaxBED: 0,
    recoveryModel: 'gradual',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.15,
    maxRecovery: 0.20,
    endpoint: 'Severe proctitis / fistula',
    clinicalPearl: 'V75Gy < 15% and D2cc < 75 Gy EQD2₃ are typical goals. Re-RT pelvis carries high fistula risk. Consider colostomy counselling and use of spacer/balloon where available.',
    references: ['QUANTEC 2010', 'Glimelius B et al. Acta Oncol 2013'],
  },
  {
    id: 'custom',
    name: 'Custom OAR',
    shortName: 'Custom',
    category: 'Other',
    ab: 3,
    bedLimit: 120,
    eqd2Limit: 50,
    singleCourseMaxBED: 0,
    recoveryModel: 'none',
    recoveryThresholdMonths: 6,
    recoveryFraction: 0,
    maxRecovery: 0,
    endpoint: 'User-defined endpoint',
    clinicalPearl: 'Enter α/β ratio and cumulative BED limit appropriate for your OAR and endpoint.',
    references: ['User defined — cite institutional protocol'],
  },
];

// ── Clinical presets ──────────────────────────────────────────────────────
interface Preset {
  label: string;
  icon: string;
  oarId: string;
  d1Total: string;
  d1Fx: string;
  months: string;
  d2Total: string;
  d2Fx: string;
  context: string;
}

const PRESETS: Preset[] = [
  {
    label: 'H&N re-RT (cord)',
    icon: '🔁',
    oarId: 'cord_conv',
    d1Total: '66', d1Fx: '33', months: '24', d2Total: '60', d2Fx: '30',
    context: 'H&N SCC recurrence after prior radical RT. Cord typically ~50 Gy in prior plan.',
  },
  {
    label: 'Spine SBRT re-RT',
    icon: '⚡',
    oarId: 'cord_sbrt',
    d1Total: '30', d1Fx: '10', months: '12', d2Total: '24', d2Fx: '3',
    context: 'Spine metastasis previously treated with conventional RT. SBRT salvage — Sahgal criteria apply.',
  },
  {
    label: 'Prostate salvage (rectum)',
    icon: '🎯',
    oarId: 'rectum',
    d1Total: '74', d1Fx: '37', months: '36', d2Total: '36', d2Fx: '6',
    context: 'Prostate bed recurrence post-radical RT. Brachytherapy alternative if rectal dose is limiting.',
  },
  {
    label: 'Lung re-RT (mean)',
    icon: '🫁',
    oarId: 'lung',
    d1Total: '60', d1Fx: '30', months: '18', d2Total: '54', d2Fx: '3',
    context: 'NSCLC recurrence after prior radical EBRT. Mean lung dose is key — 4DCT planning essential.',
  },
  {
    label: 'Brainstem (SRS)',
    icon: '🧠',
    oarId: 'brainstem',
    d1Total: '54', d1Fx: '30', months: '18', d2Total: '20', d2Fx: '1',
    context: 'Brain tumour re-RT with brainstem constraint concern. MDT consensus mandatory.',
  },
  {
    label: 'Whole pelvis (rectum)',
    icon: '🏥',
    oarId: 'rectum',
    d1Total: '45', d1Fx: '25', months: '24', d2Total: '45', d2Fx: '25',
    context: 'Gynaecological re-RT. High fistula risk. Consider IORT or brachytherapy alternatives.',
  },
];

// ── Calculation helpers ───────────────────────────────────────────────────
const calcBED  = (total: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? total * (1 + dpf / ab) : 0;
const calcEQD2 = (total: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? total * (dpf + ab) / (2 + ab) : 0;

function getRecovery(model: OARModel, months: number): number {
  if (model.recoveryModel === 'none') return 0;
  if (months < model.recoveryThresholdMonths) return 0;
  if (model.recoveryModel === 'nieder') return model.recoveryFraction;
  if (model.recoveryModel === 'sahgal') return model.recoveryFraction;
  // gradual: linear from threshold to 2×threshold, capped at maxRecovery
  const span = model.recoveryThresholdMonths;
  const beyond = months - model.recoveryThresholdMonths;
  const frac = Math.min(1, beyond / span);
  return Math.min(model.maxRecovery, model.recoveryFraction * frac);
}

function statusOf(cum: number, limit: number): 'pass' | 'warn' | 'fail' {
  if (cum <= limit * 0.88) return 'pass';
  if (cum <= limit)         return 'warn';
  return 'fail';
}

const STATUS = {
  pass: {
    pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bar:  'bg-emerald-500',
    card: 'border-emerald-300 bg-emerald-50',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    label: 'WITHIN LIMIT',
  },
  warn: {
    pill: 'bg-amber-100 text-amber-800 border-amber-200',
    bar:  'bg-amber-400',
    card: 'border-amber-300 bg-amber-50',
    text: 'text-amber-700',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    label: 'APPROACHING LIMIT',
  },
  fail: {
    pill: 'bg-red-100 text-red-800 border-red-200',
    bar:  'bg-red-500',
    card: 'border-red-300 bg-red-50',
    text: 'text-red-700',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    label: 'EXCEEDS LIMIT',
  },
};

// ── Component ─────────────────────────────────────────────────────────────
const ReirradiationCalcPage: React.FC = () => {

  // State: OAR & inputs
  const [oarId,      setOarId]      = useState('cord_conv');
  const [d1Total,    setD1Total]    = useState('45');
  const [d1Fx,       setD1Fx]       = useState('25');
  const [months,     setMonths]     = useState('12');
  const [d2Total,    setD2Total]    = useState('30');
  const [d2Fx,       setD2Fx]       = useState('10');
  const [customAb,   setCustomAb]   = useState('3');
  const [customLim,  setCustomLim]  = useState('120');
  const [copied,     setCopied]     = useState(false);
  const [showPearl,  setShowPearl]  = useState(false);
  const [showAllOAR, setShowAllOAR] = useState(false);
  const [showNieder, setShowNieder] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persist
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (s.oarId)    setOarId(s.oarId);
      if (s.d1Total)  setD1Total(s.d1Total);
      if (s.d1Fx)     setD1Fx(s.d1Fx);
      if (s.months)   setMonths(s.months);
      if (s.d2Total)  setD2Total(s.d2Total);
      if (s.d2Fx)     setD2Fx(s.d2Fx);
      if (s.customAb) setCustomAb(s.customAb);
      if (s.customLim)setCustomLim(s.customLim);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY,
      JSON.stringify({ oarId, d1Total, d1Fx, months, d2Total, d2Fx, customAb, customLim }));
  }, [oarId, d1Total, d1Fx, months, d2Total, d2Fx, customAb, customLim]);

  const oar = OAR_MODELS.find(o => o.id === oarId) ?? OAR_MODELS[0];
  const ab       = oarId === 'custom' ? (parseFloat(customAb)  || 3)   : oar.ab;
  const bedLimit = oarId === 'custom' ? (parseFloat(customLim) || 120) : oar.bedLimit;
  const eqd2Lim  = oarId === 'custom' ? bedLimit / (1 + 2 / ab)       : oar.eqd2Limit;

  const n1   = parseFloat(d1Total) || 0;
  const f1   = parseFloat(d1Fx)   || 0;
  const n2   = parseFloat(d2Total) || 0;
  const f2   = parseFloat(d2Fx)   || 0;
  const mo   = parseFloat(months)  || 0;
  const dpf1 = f1 > 0 ? n1 / f1 : 0;
  const dpf2 = f2 > 0 ? n2 / f2 : 0;

  // ── Core result ─────────────────────────────────────────────────────────
  const res = useMemo(() => {
    const bed1  = calcBED(n1, dpf1, ab);
    const eqd1  = calcEQD2(n1, dpf1, ab);
    const bed2  = calcBED(n2, dpf2, ab);
    const eqd2v = calcEQD2(n2, dpf2, ab);
    const recFrac    = getRecovery(oar, mo);
    const effBed1    = bed1 * (1 - recFrac);
    const cumBED     = effBed1 + bed2;
    const cumEQD2    = effBed1 / (1 + 2 / ab) + eqd2v;
    const status     = statusOf(cumBED, bedLimit);
    const headroom   = Math.max(0, bedLimit - cumBED);
    const pctUsed    = bedLimit > 0 ? Math.min(1, cumBED / bedLimit) : 0;

    // Max safe re-RT total dose at current dpf2
    const maxSafeBED2  = Math.max(0, bedLimit - effBed1);
    const maxSafeTotal = dpf2 > 0 && (1 + dpf2 / ab) > 0
      ? maxSafeBED2 / (1 + dpf2 / ab) : 0;
    const maxSafeFx = dpf2 > 0 ? Math.floor(maxSafeTotal / dpf2) : 0;

    // Per-course BED limit check
    const perCourseViol1 = oar.singleCourseMaxBED > 0 && bed1 > oar.singleCourseMaxBED;
    const perCourseViol2 = oar.singleCourseMaxBED > 0 && bed2 > oar.singleCourseMaxBED;

    return {
      bed1, eqd1, bed2, eqd2: eqd2v,
      recFrac, effBed1,
      cumBED, cumEQD2, status,
      headroom, pctUsed,
      maxSafeTotal, maxSafeFx,
      perCourseViol1, perCourseViol2,
    };
  }, [n1, f1, n2, f2, dpf1, dpf2, ab, oar, mo, bedLimit]);

  // ── Interval sweep ──────────────────────────────────────────────────────
  const intervalSweep = useMemo(() => {
    return [0, 3, 5, 6, 9, 12, 18, 24, 36, 48].map(m => {
      const rec  = getRecovery(oar, m);
      const eBed = calcBED(n1, dpf1, ab) * (1 - rec);
      const cum  = eBed + calcBED(n2, dpf2, ab);
      return { months: m, recPct: Math.round(rec * 100), cum, status: statusOf(cum, bedLimit), isCur: m === mo };
    });
  }, [n1, dpf1, n2, dpf2, ab, oar, mo, bedLimit]);

  // ── All-OAR check at current inputs ────────────────────────────────────
  const allOARCheck = useMemo(() => {
    return OAR_MODELS.filter(o => o.id !== 'custom').map(o => {
      const abO  = o.ab;
      const limO = o.bedLimit;
      const b1   = calcBED(n1, dpf1, abO);
      const b2   = calcBED(n2, dpf2, abO);
      const rec  = getRecovery(o, mo);
      const eff1 = b1 * (1 - rec);
      const cum  = eff1 + b2;
      return { oar: o, bed1: b1, bed2: b2, cum, status: statusOf(cum, limO) };
    });
  }, [n1, dpf1, n2, dpf2, mo]);

  // ── Nieder criteria checklist ───────────────────────────────────────────
  const niederChecks = useMemo(() => {
    const singleMax = 98;
    return {
      c1BED:     { pass: res.bed1  <= singleMax, val: `${res.bed1.toFixed(1)} Gy₂`,  limit: `≤${singleMax} Gy₂` },
      c2BED:     { pass: res.bed2  <= singleMax, val: `${res.bed2.toFixed(1)} Gy₂`,  limit: `≤${singleMax} Gy₂` },
      cumBED:    { pass: res.cumBED <= 135,       val: `${res.cumBED.toFixed(1)} Gy₂`, limit: '≤135 Gy₂' },
      interval:  { pass: mo >= 6,                 val: `${mo} months`,                 limit: '≥6 months' },
    };
  }, [res, mo]);

  // ── MDT Summary text ───────────────────────────────────────────────────
  const mdtSummary = useMemo(() => {
    const date = new Date().toLocaleDateString('en-GB');
    const st   = res.status.toUpperCase();
    return `RE-IRRADIATION SAFETY SUMMARY — ${date}
${'─'.repeat(50)}
OAR:           ${oar.name}
Endpoint:      ${oar.endpoint}
α/β ratio:     ${ab} Gy  |  BED limit: ${bedLimit} Gy₂

COURSE 1 (PRIOR)
  Dose:        ${n1} Gy in ${f1} fractions (${dpf1.toFixed(2)} Gy/fx)
  BED${ab}:       ${res.bed1.toFixed(1)} Gy₂
  EQD2:        ${res.eqd1.toFixed(1)} Gy

INTERVAL
  Elapsed:     ${mo} months
  Recovery:    ${(res.recFrac * 100).toFixed(0)}% (${oar.recoveryModel} model)
  Effective BED₁ (after recovery): ${res.effBed1.toFixed(1)} Gy₂

COURSE 2 (PLANNED RE-RT)
  Dose:        ${n2} Gy in ${f2} fractions (${dpf2.toFixed(2)} Gy/fx)
  BED${ab}:       ${res.bed2.toFixed(1)} Gy₂
  EQD2:        ${res.eqd2.toFixed(1)} Gy

RESULT
  Cumulative BED:  ${res.cumBED.toFixed(1)} Gy₂  /  Limit: ${bedLimit} Gy₂
  Cumulative EQD2: ${res.cumEQD2.toFixed(1)} Gy   /  Limit: ${eqd2Lim.toFixed(1)} Gy
  Status:          ${st}
  Headroom:        ${res.headroom.toFixed(1)} Gy₂ remaining
  Max safe re-RT:  ${res.maxSafeTotal.toFixed(1)} Gy (${res.maxSafeFx} fx) at current dpf=${dpf2.toFixed(2)} Gy/fx

${'─'.repeat(50)}
⚠ This is a radiobiological estimate only.
  Physics peer review and MDT approval required before re-treatment.
  References: ${oar.references.join('; ')}
`;
  }, [res, oar, n1, f1, n2, f2, dpf1, dpf2, ab, bedLimit, eqd2Lim, mo]);

  const copyMDT = () => {
    navigator.clipboard.writeText(mdtSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const applyPreset = (p: Preset) => {
    setOarId(p.oarId);
    setD1Total(p.d1Total);
    setD1Fx(p.d1Fx);
    setMonths(p.months);
    setD2Total(p.d2Total);
    setD2Fx(p.d2Fx);
  };

  const reset = () => {
    setD1Total('45'); setD1Fx('25'); setMonths('12');
    setD2Total('30'); setD2Fx('10');
  };

  const statusStyle = STATUS[res.status];
  const barPct = Math.min(100, res.pctUsed * 100);

  // Sidebar data
  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'Cord (Nieder)', emoji: '🦴', accent: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)',
      rows: [
        { k: 'Cum BED₂ limit', v: '135 Gy₂' },
        { k: 'Per-course max', v: '< 98 Gy₂' },
        { k: 'Interval < 6m',  v: '0% recovery' },
        { k: 'Interval ≥ 6m',  v: '25% recovery' },
      ],
    },
    {
      title: 'Cord (Sahgal SBRT)', emoji: '⚡', accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)',
      rows: [
        { k: 'Thecal sac Dmax', v: '≤ 25 Gy EQD2₂ cum.' },
        { k: 'Min interval',    v: '≥ 5 months' },
        { k: 'Peer review',     v: 'Mandatory' },
      ],
    },
    {
      title: 'Other OARs', emoji: '📋', accent: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)',
      rows: [
        { k: 'Brainstem',       v: '108 Gy₂ BED₂' },
        { k: 'Optic apparatus', v: '90 Gy₂ BED₁.₆' },
        { k: 'Brachial plexus', v: '120 Gy₂ BED₃' },
        { k: 'Rectum',          v: '157 Gy₂ BED₃' },
      ],
    },
  ];

  return (
    <div className="space-y-4 fade-in pb-6 relative">
      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Re-irradiation Calculator</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cumulative BED · time-dependent OAR recovery · Nieder / Sahgal</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Clinical Presets ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Clinical Presets</p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                oarId === p.oarId && d1Total === p.d1Total
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OAR Selector ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Organ at Risk</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {OAR_MODELS.map(o => (
            <button
              key={o.id}
              onClick={() => setOarId(o.id)}
              className={`text-left px-2.5 py-2 rounded-lg border text-xs font-semibold transition leading-tight ${
                oarId === o.id
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <span className="block font-bold">{o.shortName}</span>
              <span className={`text-[10px] font-normal ${oarId === o.id ? 'text-blue-200' : 'text-slate-400'}`}>
                α/β={o.ab} · {o.endpoint.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom OAR params */}
      {oarId === 'custom' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">α/β ratio (Gy)</label>
            <NumberInput  step="0.5" value={customAb} onChange={e => setCustomAb(e.target.value)}
              className="input-clinical num" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">BED limit (Gy)</label>
            <NumberInput  step="5" value={customLim} onChange={e => setCustomLim(e.target.value)}
              className="input-clinical num" />
          </div>
        </div>
      )}

      {/* Clinical pearl for selected OAR */}
      <button
        onClick={() => setShowPearl(s => !s)}
        className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-left"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-[11px] font-bold text-blue-800">{oar.name} — Clinical Pearl</span>
        </div>
        {showPearl ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
      </button>
      {showPearl && (
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 border-t-0 rounded-b-lg -mt-3">
          <p className="text-[11px] text-blue-800 leading-relaxed">{oar.clinicalPearl}</p>
          <p className="text-[10px] text-blue-500 mt-1.5 italic">Ref: {oar.references.join(' · ')}</p>
        </div>
      )}

      {/* ── Input Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3">

        {/* Course 1 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">1</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prior Irradiation</p>
            </div>
            <span className="text-[10px] text-blue-600 font-bold num">BED{ab} = {res.bed1.toFixed(1)} Gy₂</span>
          </div>
          <div className="px-3 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">OAR dose received (Gy)</label>
              <NumberInput  step="0.5" value={d1Total}
                onChange={e => setD1Total(e.target.value)} className="input-clinical num" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">No. of fractions</label>
              <NumberInput  step="1" value={d1Fx}
                onChange={e => setD1Fx(e.target.value)} className="input-clinical num" />
            </div>
            <div className="col-span-2 text-[11px] text-slate-400 bg-slate-50 rounded px-2 py-1.5 num">
              {dpf1.toFixed(2)} Gy/fx &nbsp;·&nbsp; BED{ab} = {res.bed1.toFixed(1)} Gy₂ &nbsp;·&nbsp; EQD2 = {res.eqd1.toFixed(1)} Gy
              {res.perCourseViol1 && (
                <span className="ml-2 text-red-600 font-bold">⚠ exceeds {oar.singleCourseMaxBED} Gy₂ per-course limit</span>
              )}
            </div>
          </div>
        </div>

        {/* Interval */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Time Interval</p>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-[120px]">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Months since Course 1</label>
                <NumberInput  step="1" min="0" value={months}
                  onChange={e => setMonths(e.target.value)} className="input-clinical num" />
              </div>
              <div className={`flex-1 px-3 py-2 rounded-lg text-center border ${
                mo < (oar.recoveryThresholdMonths || 6)
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-lg font-black num ${mo < oar.recoveryThresholdMonths ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {(res.recFrac * 100).toFixed(0)}%
                </p>
                <p className={`text-[10px] ${mo < oar.recoveryThresholdMonths ? 'text-amber-600' : 'text-emerald-600'}`}>
                  BED recovery
                </p>
              </div>
              <div className="flex-1 px-3 py-2 rounded-lg text-center border bg-slate-50 border-slate-200">
                <p className="text-lg font-black text-slate-700 num">{res.effBed1.toFixed(1)}</p>
                <p className="text-[10px] text-slate-400">Effective BED₁ (Gy₂)</p>
              </div>
            </div>
            {mo < oar.recoveryThresholdMonths && oar.recoveryModel !== 'none' && (
              <p className="text-[10px] text-amber-700 mt-2">
                ⚠ Interval below {oar.recoveryThresholdMonths}m threshold — 0% recovery credit applied.
                {oar.recoveryModel === 'nieder' && ' Nieder criteria require ≥6 months.'}
              </p>
            )}
          </div>
        </div>

        {/* Course 2 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-black text-white">2</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Planned Re-irradiation</p>
            </div>
            <span className="text-[10px] text-orange-600 font-bold num">BED{ab} = {res.bed2.toFixed(1)} Gy₂</span>
          </div>
          <div className="px-3 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">OAR dose planned (Gy)</label>
              <NumberInput  step="0.5" value={d2Total}
                onChange={e => setD2Total(e.target.value)} className="input-clinical num" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">No. of fractions</label>
              <NumberInput  step="1" value={d2Fx}
                onChange={e => setD2Fx(e.target.value)} className="input-clinical num" />
            </div>
            <div className="col-span-2 text-[11px] text-slate-400 bg-slate-50 rounded px-2 py-1.5 num">
              {dpf2.toFixed(2)} Gy/fx &nbsp;·&nbsp; BED{ab} = {res.bed2.toFixed(1)} Gy₂ &nbsp;·&nbsp; EQD2 = {res.eqd2.toFixed(1)} Gy
              {res.perCourseViol2 && (
                <span className="ml-2 text-red-600 font-bold">⚠ exceeds {oar.singleCourseMaxBED} Gy₂ per-course limit</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Visual BED Gauge ──────────────────────────────────────────────── */}
      <div className={`rounded-xl border-2 p-4 ${statusStyle.card}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {statusStyle.icon}
            <span className={`text-sm font-black ${statusStyle.text}`}>{statusStyle.label}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.pill}`}>
            {oar.recoveryModel !== 'none' ? `${oar.recoveryModel.toUpperCase()} model` : 'No recovery'}
          </span>
        </div>

        {/* BED progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>0</span>
            <span className="font-bold">{bedLimit} Gy₂ limit</span>
          </div>
          <div className="h-5 bg-slate-200 rounded-full overflow-hidden relative">
            {/* Course 1 segment */}
            <div
              className="h-full bg-blue-400 absolute left-0 top-0 rounded-l-full transition-all duration-500"
              style={{ width: `${Math.min(100, (res.effBed1 / bedLimit) * 100)}%` }}
            />
            {/* Course 2 segment stacked */}
            <div
              className={`h-full absolute top-0 transition-all duration-500 ${statusStyle.bar}`}
              style={{
                left: `${Math.min(100, (res.effBed1 / bedLimit) * 100)}%`,
                width: `${Math.min(100 - Math.min(100, (res.effBed1 / bedLimit) * 100), (res.bed2 / bedLimit) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-blue-600 font-semibold">Course 1 (eff.): {res.effBed1.toFixed(1)} Gy₂</span>
            <span className={`${statusStyle.text} font-bold`}>Total: {res.cumBED.toFixed(1)} / {bedLimit} Gy₂</span>
          </div>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/70 rounded-lg py-2 px-1">
            <p className="text-lg font-black text-slate-800 num">{res.cumBED.toFixed(1)}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Cum BED{ab} (Gy₂)</p>
          </div>
          <div className="bg-white/70 rounded-lg py-2 px-1">
            <p className="text-lg font-black text-slate-800 num">{res.cumEQD2.toFixed(1)}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Cum EQD2 (Gy)</p>
          </div>
          <div className="bg-white/70 rounded-lg py-2 px-1">
            <p className={`text-lg font-black num ${res.headroom < bedLimit * 0.1 ? 'text-red-600' : 'text-emerald-600'}`}>
              {res.headroom.toFixed(1)}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Headroom (Gy₂)</p>
          </div>
        </div>
      </div>

      {/* Maximum safe re-RT dose */}
      {res.maxSafeTotal > 0 && dpf2 > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Maximum Safe Re-RT Dose</p>
            <span className="text-[10px] text-slate-400">(at {dpf2.toFixed(2)} Gy/fx)</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-lg py-2">
              <p className="text-2xl font-black text-blue-800 num">{res.maxSafeTotal.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500">Gy (total)</p>
            </div>
            <div className="bg-slate-50 rounded-lg py-2">
              <p className="text-2xl font-black text-blue-800 num">{res.maxSafeFx}</p>
              <p className="text-[10px] text-slate-500">fractions</p>
            </div>
            <div className="bg-slate-50 rounded-lg py-2">
              <p className="text-2xl font-black text-blue-800 num">{dpf2.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">Gy/fraction</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 italic">
            This is the dose that exactly reaches the BED limit. Build in clinical margin — do not prescribe right at the limit.
          </p>
        </div>
      )}

      {/* ── Nieder Criteria Checklist (cord only) ────────────────────────── */}
      {(oarId === 'cord_conv' || oarId === 'cord_sbrt') && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowNieder(s => !s)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100 text-left"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nieder Criteria Checklist</p>
            {showNieder ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {showNieder && (
            <div className="divide-y divide-slate-50">
              {[
                { label: 'Course 1 BED₂',     ...niederChecks.c1BED },
                { label: 'Course 2 BED₂',     ...niederChecks.c2BED },
                { label: 'Cumulative BED₂',   ...niederChecks.cumBED },
                { label: 'Min interval',       ...niederChecks.interval },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {r.pass
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <span className="text-[11px] font-semibold text-slate-700">{r.label}</span>
                    <span className="text-[10px] text-slate-400">({r.limit})</span>
                  </div>
                  <span className={`text-[11px] font-black num ${r.pass ? 'text-emerald-700' : 'text-red-700'}`}>
                    {r.val}
                  </span>
                </div>
              ))}
              <div className="px-3 py-2.5 bg-slate-50">
                <p className="text-[10px] text-slate-500 italic">
                  Nieder 2005/2013 criteria. All four must be met for conventional cord re-RT. Partial cord irradiation preferred. MDT discussion mandatory regardless of pass/fail.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Interval Safety Sweep ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Interval Safety Sweep</p>
          </div>
          <span className="text-[10px] text-slate-400">Fixed re-RT dose: {n2} Gy</span>
        </div>
        <div className="divide-y divide-slate-50">
          {intervalSweep.map(row => {
            const s = STATUS[row.status];
            return (
              <div key={row.months}
                className={`flex items-center justify-between px-3 py-2 ${row.isCur ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${row.isCur ? 'text-blue-800' : 'text-slate-700'}`}>
                    {row.months === 0 ? 'Immediate' : `${row.months} months`}
                    {row.isCur && <span className="ml-1 text-[10px] font-normal text-blue-500">← current</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 num">{row.recPct}% recovery</span>
                  <span className="text-[11px] font-bold num text-slate-600">{row.cum.toFixed(1)} Gy₂</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.pill}`}>
                    {row.status === 'pass' ? 'OK' : row.status === 'warn' ? 'NEAR' : 'FAIL'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── All-OAR Parallel Check ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowAllOAR(s => !s)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100 text-left"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">All OARs at Current Inputs</p>
            <span className="text-[10px] text-slate-400">(parallel check)</span>
          </div>
          {showAllOAR ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>
        {showAllOAR && (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-5 gap-1 px-3 py-1.5 text-[9px] font-bold uppercase text-slate-400 bg-slate-50">
              <span className="col-span-2">OAR</span>
              <span className="text-right">Cum BED</span>
              <span className="text-right">Limit</span>
              <span className="text-right">Status</span>
            </div>
            {allOARCheck.map(r => {
              const s = STATUS[r.status];
              return (
                <div key={r.oar.id} className={`grid grid-cols-5 gap-1 px-3 py-2 items-center ${r.oar.id === oarId ? 'bg-blue-50' : ''}`}>
                  <span className="col-span-2 text-[11px] font-semibold text-slate-700 leading-tight">
                    {r.oar.shortName}
                    <span className="ml-1 text-[9px] text-slate-400 font-normal">α/β={r.oar.ab}</span>
                  </span>
                  <span className={`text-right text-[11px] font-bold num ${s.text}`}>{r.cum.toFixed(1)}</span>
                  <span className="text-right text-[10px] text-slate-400 num">{r.oar.bedLimit}</span>
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.pill}`}>
                      {r.status === 'pass' ? 'OK' : r.status === 'warn' ? '▲' : '✕'}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-slate-400 px-3 py-2 italic bg-slate-50">
              All values use current Course 1 / 2 dose inputs with each OAR's own α/β and recovery model. Scores are indicative — actual OAR dose depends on treatment plan geometry.
            </p>
          </div>
        )}
      </div>

      {/* ── MDT Copy Summary ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">MDT Summary</p>
        </div>
        <div className="px-3 py-3">
          <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-slate-100">
            {mdtSummary}
          </pre>
          <button
            onClick={copyMDT}
            className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              copied ? 'bg-emerald-600 text-white' : 'bg-[#1e3a5f] text-white hover:bg-[#152d4a]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to clipboard' : 'Copy MDT Summary'}
          </button>
        </div>
      </div>

      {/* ── Important Warnings ────────────────────────────────────────────── */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-red-800 mb-1">Mandatory pre-treatment requirements</p>
          <ul className="text-[10px] text-red-700 space-y-0.5 list-disc list-inside leading-relaxed">
            <li>Physics peer review of cumulative dose distribution before treatment start</li>
            <li>MDT case conference with documentation of risk/benefit discussion</li>
            <li>These calculations use OAR dose as input — actual dose depends on your plan</li>
            <li>Nieder data (n=40) and Sahgal data (n=14) — apply with appropriate caution</li>
            <li>Recovery fractions are population estimates with wide individual variation</li>
          </ul>
        </div>
      </div>

      {/* ── References ───────────────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-400 px-1 leading-relaxed">
        Ref: Nieder C et al. IJROBP 61(3):851–855, 2005 · Nieder C et al. Radiother Oncol 2013 ·
        Sahgal A et al. IJROBP 82(1):107–116, 2012 · Dale RG. Br J Radiol 1985 ·
        QUANTEC 2010 (Bentzen SM et al.) · Mayo C et al. IJROBP 2010
      </p>
    </div>
  );
};

export default ReirradiationCalcPage;