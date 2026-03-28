/**
 * ReirradiationCalcPage.tsx — PRO LEVEL
 * Cumulative BED with time-dependent recovery for re-irradiation planning.
 *
 * Models implemented:
 *   Nieder C et al. IJROBP 61(3):851–855, 2005       — Spinal cord
 *   Nieder C et al. Radiother Oncol 2013             — Updated cord recovery
 *   Sahgal A et al. IJROBP 82(1):107–116, 2012       — SBRT spine
 *   Emami B et al. IJROBP 1991                       — TD5/5 reference
 *   Dale RG. Br J Radiol 1985                        — BED additivity
 */
import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight, GraduationCap, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

const STORAGE_KEY = 'radonco_reRT_state_v1';

const QUICK_REF_DATA = [
  {
    category: "Spinal Cord (Nieder)",
    items: [
      { label: "Interval < 6m", value: "0% Recovery" },
      { label: "Interval ≥ 6m", value: "25% Recovery" },
      { label: "Cum BED₂ Limit", value: "135 Gy₂" },
      { label: "Single Course", value: "< 98 Gy₂" },
    ]
  },
  {
    category: "Spinal Cord (Sahgal)",
    items: [
      { label: "SBRT Interval", value: "≥ 5 months" },
      { label: "Thecal Sac Dmax", value: "≤ 25 Gy EQD2" },
      { label: "α/β Ratio", value: "2 Gy" },
    ]
  },
  {
    category: "Other OARs (α/β=3)",
    items: [
      { label: "Brainstem", value: "100 Gy₂ (BED)" },
      { label: "Optic App.", value: "90 Gy₂ (BED)" },
      { label: "Brachial Plexus", value: "120 Gy₂ (BED)" },
    ]
  }
];

// ── OAR models ────────────────────────────────────────────────────────────
interface OARModel {
  id: string;
  name: string;
  ab: number;
  bedLimit: number;        // Gy (BED, using OAR ab)
  eqd2Limit: number;       // Gy (EQD2 α/β=OAR ab)
  recoveryModel: 'nieder' | 'none' | 'sahgal';
  recoveryThresholdMonths: number;
  recoveryFraction: number;    // fraction recovered after threshold
  maxRecovery: number;         // maximum possible recovery fraction
  notes: string;
  references: string[];
}

const OAR_MODELS: OARModel[] = [
  {
    id: 'cord_conventional',
    name: 'Spinal Cord (conventional)',
    ab: 2,
    bedLimit: 135,
    eqd2Limit: 50,
    recoveryModel: 'nieder',
    recoveryThresholdMonths: 6,
    recoveryFraction: 0.25,
    maxRecovery: 0.25,
    notes: 'Nieder model: <6 months = 0% recovery; ≥6 months = 25% recovery (fixed). Cumulative BED₂ ≤135 Gy generally accepted. Some institutions use 130 Gy.',
    references: ['Nieder et al. IJROBP 2005', 'Nieder et al. Radiother Oncol 2013'],
  },
  {
    id: 'cord_sbrt',
    name: 'Spinal Cord (SBRT re-RT)',
    ab: 2,
    bedLimit: 50,
    eqd2Limit: 25,
    recoveryModel: 'sahgal',
    recoveryThresholdMonths: 5,
    recoveryFraction: 0.20,
    maxRecovery: 0.25,
    notes: 'Sahgal 2012 (14 cases): SBRT re-irradiation. Thecal sac Dmax ≤ 25 Gy EQD2 (α/β=2) cumulative. Interval ≥5 months. High risk — physics peer review mandatory.',
    references: ['Sahgal et al. IJROBP 2012', 'Thibault et al. IJROBP 2015'],
  },
  {
    id: 'brainstem',
    name: 'Brainstem',
    ab: 2.0,
    bedLimit: 108,
    eqd2Limit: 54,
    recoveryModel: 'none',
    recoveryThresholdMonths: 999,
    recoveryFraction: 0,
    maxRecovery: 0,
    notes: 'Standard QUANTEC (Mayo 2010) uses α/β = 2–3 Gy. Cumulative BED₂ <108 Gy₂ (54 Gy EQD2) typically used. Re-RT highly individualised — multidisciplinary decision required.',
    references: ['QUANTEC 2010', 'Mayo et al. IJROBP 2010'],
  },
  {
    id: 'optic',
    name: 'Optic Apparatus',
    ab: 1.6,
    bedLimit: 90,
    eqd2Limit: 54,
    recoveryModel: 'none',
    recoveryThresholdMonths: 999,
    recoveryFraction: 0,
    maxRecovery: 0,
    notes: 'No recovery model. Cumulative Dmax ≤54 Gy (EQD2 α/β=1.6). Optic neuropathy risk rises sharply above 60 Gy. Highly serial structure.',
    references: ['QUANTEC 2010', 'Parsons et al. IJROBP 1994'],
  },
  {
    id: 'brachial_plexus',
    name: 'Brachial Plexus',
    ab: 3,
    bedLimit: 120,
    eqd2Limit: 60,
    recoveryModel: 'none',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.10,
    maxRecovery: 0.15,
    notes: 'Conventional: Dmax ≤66 Gy. Re-RT cumulative EQD2 ≤60–70 Gy typically used. Limited data — use with caution.',
    references: ['QUANTEC 2010', 'Johansson et al. Acta Oncol 2004'],
  },
  {
    id: 'lung',
    name: 'Lung (mean dose)',
    ab: 3,
    bedLimit: 100,
    eqd2Limit: 40,
    recoveryModel: 'none',
    recoveryThresholdMonths: 12,
    recoveryFraction: 0.15,
    maxRecovery: 0.20,
    notes: 'Mean lung dose cumulative ≤40 Gy EQD2. Some recovery likely after 12 months but data limited. V20 should remain ≤30–35%.',
    references: ['QUANTEC 2010', 'Huang et al. Clin Lung Cancer 2019'],
  },
  {
    id: 'custom',
    name: 'Custom OAR',
    ab: 3,
    bedLimit: 120,
    eqd2Limit: 50,
    recoveryModel: 'none',
    recoveryThresholdMonths: 6,
    recoveryFraction: 0.25,
    maxRecovery: 0.25,
    notes: 'User-defined OAR. Enter α/β and cumulative BED limit manually.',
    references: ['User defined'],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const calcBED  = (total: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? total * (1 + dpf / ab) : 0;
const calcEQD2 = (total: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? total * (dpf + ab) / (2 + ab) : 0;

function getRecoveryFraction(model: OARModel, months: number): number {
  if (model.recoveryModel === 'none') return 0;
  const targetRecovery = Math.min(model.maxRecovery, model.recoveryFraction);
  if (months < model.recoveryThresholdMonths) return 0;
  return targetRecovery;
}

// ── Status helper ─────────────────────────────────────────────────────────
function bedStatus(cumBED: number, limit: number): 'pass' | 'warn' | 'fail' {
  if (cumBED <= limit * 0.90) return 'pass';
  if (cumBED <= limit)        return 'warn';
  return 'fail';
}

const STATUS_STYLES = {
  pass: { bg: 'bg-green-50 border-green-300 text-green-800', badge: 'result-badge pass' },
  warn: { bg: 'bg-amber-50 border-amber-300 text-amber-800', badge: 'result-badge warn' },
  fail: { bg: 'bg-red-50 border-red-300 text-red-800',       badge: 'result-badge fail' },
};

// ── Component ─────────────────────────────────────────────────────────────
const ReirradiationCalcPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));

  const [oarId,    setOarId]    = useState(() => localStorage.getItem('reirrad_oarId') || 'cord_conventional');
  const [d1Total,  setD1Total]  = useState(() => localStorage.getItem('reirrad_d1Total') || '45');
  const [d1Fx,     setD1Fx]     = useState(() => localStorage.getItem('reirrad_d1Fx') || '25');
  const [months,   setMonths]   = useState(() => localStorage.getItem('reirrad_months') || '12');
  const [d2Total,  setD2Total]  = useState(() => localStorage.getItem('reirrad_d2Total') || '30');
  const [d2Fx,     setD2Fx]     = useState(() => localStorage.getItem('reirrad_d2Fx') || '10');
  const [customAb, setCustomAb] = useState(() => localStorage.getItem('reirrad_customAb') || '3');
  const [customLim,setCustomLim]= useState(() => localStorage.getItem('reirrad_customLim') || '120');
  const [tab, setTab] = useState<'nieder'|'sahgal'|'scenarios'|'guidance'>('nieder');
  const [sahgalPriorEQD2, setSahgalPriorEQD2] = useState('0');
  const [sahgalPlannedDmax, setSahgalPlannedDmax] = useState('0');
  const [sahgalFx, setSahgalFx] = useState('1');

  useEffect(() => {
    localStorage.setItem('reirrad_oarId', oarId);
    localStorage.setItem('reirrad_d1Total', d1Total);
    localStorage.setItem('reirrad_d1Fx', d1Fx);
    localStorage.setItem('reirrad_months', months);
    localStorage.setItem('reirrad_d2Total', d2Total);
    localStorage.setItem('reirrad_d2Fx', d2Fx);
    localStorage.setItem('reirrad_customAb', customAb);
    localStorage.setItem('reirrad_customLim', customLim);
  }, [oarId, d1Total, d1Fx, months, d2Total, d2Fx, customAb, customLim]);

  const oar = OAR_MODELS.find(o => o.id === oarId) ?? OAR_MODELS[0];
  const ab  = oarId === 'custom' ? (parseFloat(customAb) || 3) : oar.ab;
  const bedLimit = oarId === 'custom' ? (parseFloat(customLim) || 120) : oar.bedLimit;

  // Numeric values
  const n1 = parseFloat(d1Total) || 0;
  const f1 = parseFloat(d1Fx)   || 0;
  const n2 = parseFloat(d2Total) || 0;
  const f2 = parseFloat(d2Fx)   || 0;
  const mo = parseFloat(months)  || 0;

  const dpf1 = f1 > 0 ? n1 / f1 : 0;
  const dpf2 = f2 > 0 ? n2 / f2 : 0;

  const calc = useMemo(() => {
    const bed1  = calcBED(n1, dpf1, ab);
    const eqd1  = calcEQD2(n1, dpf1, ab);
    const bed2  = calcBED(n2, dpf2, ab);
    const eqd2v = calcEQD2(n2, dpf2, ab);

    const recFrac    = getRecoveryFraction(oar, mo);
    const effectBed1 = bed1 * (1 - recFrac);
    const cumBED     = effectBed1 + bed2;
    const cumEQD2    = effectBed1 / (1 + 2 / ab) + eqd2v;

    const status = bedStatus(cumBED, bedLimit);
    const headroom = Math.max(0, bedLimit - cumBED);

    // Maximum safe re-RT dose (solve: effectBed1 + bed2_max = bedLimit)
    // bed2_max = (bedLimit - effectBed1)
    // n2_max * (1 + dpf2/ab) = bedLimit - effectBed1
    // Assume same dpf2: n2_max = (bedLimit - effectBed1) / (1 + dpf2/ab)
    const maxSafeTotal = dpf2 > 0 && (1 + dpf2/ab) > 0
      ? (bedLimit - effectBed1) / (1 + dpf2 / ab) : 0;

    return {
      bed1, eqd1, bed2, eqd2: eqd2v,
      recFrac, effectBed1,
      cumBED, cumEQD2,
      status, headroom, maxSafeTotal
    };
  }, [n1, f1, n2, f2, dpf1, dpf2, ab, oar, mo, bedLimit]);

  // Sensitivity: re-RT dose vs cumBED status
  const sensitivityRows = useMemo(() => {
    if (dpf2 <= 0) return [];
    const steps = [10, 15, 20, 25, 30, 35, 40, 45, 50];
    const recFrac = getRecoveryFraction(oar, mo);
    const effectBed1 = calcBED(n1, dpf1, ab) * (1 - recFrac);
    return steps.map(dose => {
      const b2  = calcBED(dose, dpf2, ab);
      const cum = effectBed1 + b2;
      return { dose, b2, cum, status: bedStatus(cum, bedLimit), isCur: Math.abs(dose - n2) < 0.1 };
    });
  }, [n1, dpf1, n2, dpf2, ab, oar, mo, bedLimit]);

  // Sahgal calculation
  const sahgalCalc = useMemo(() => {
    const priorEQD2 = parseFloat(sahgalPriorEQD2) || 0;
    const plannedDmax = parseFloat(sahgalPlannedDmax) || 0;
    const fx = parseFloat(sahgalFx) || 1;
    
    // Simple Sahgal model: cumulative EQD2 = prior + planned
    // Planned EQD2 = Dmax * (Dmax/fx + ab) / (2 + ab) with ab=2
    const plannedEQD2 = plannedDmax * (plannedDmax/fx + 2) / (2 + 2);
    const cumEQD2 = priorEQD2 + plannedEQD2;
    const limit = 25;
    
    return {
      priorEQD2, plannedEQD2, cumEQD2, limit,
      status: cumEQD2 <= limit ? 'pass' : 'fail'
    };
  }, [sahgalPriorEQD2, sahgalPlannedDmax, sahgalFx]);

  // MDT Summary Generator
  const generateMDT = () => {
    const summary = `MDT Re-irradiation Summary
--------------------------
OAR: ${oar.name}
Interval: ${months} months
Course 1: ${d1Total} Gy / ${d1Fx} fx (BED: ${calc.bed1.toFixed(1)})
Course 2: ${d2Total} Gy / ${d2Fx} fx (BED: ${calc.bed2.toFixed(1)})
Cumulative BED: ${(calc.effectBed1 + calc.bed2).toFixed(1)} / ${bedLimit} Gy
Status: ${calc.status.toUpperCase()}

Recommendation: [Insert recommendation here]
`;
    alert(summary);
  };

  return (
    <div className="space-y-4 fade-in pb-2">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Re-irradiation Calculator</h1>
        <p className="text-sm text-slate-500">Cumulative BED with time-dependent OAR recovery · Nieder / Sahgal models</p>
      </div>

      {/* ── OAR selector ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Select OAR Model</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {OAR_MODELS.map(o => (
            <button key={o.id} onClick={() => setOarId(o.id)}
              className={`text-left px-2.5 py-2 rounded-lg border text-sm font-semibold transition leading-tight
                ${oarId === o.id
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
            >
              <span className="block">{o.name}</span>
              <span className={`text-[11px] font-normal ${oarId === o.id ? 'text-blue-200' : 'text-slate-400'}`}>
                α/β={o.ab} · {o.recoveryModel === 'sahgal' ? `EQD2 limit ${o.eqd2Limit}` : `BED limit ${o.bedLimit}`} Gy
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200">
        {(['nieder','sahgal','scenarios','guidance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t === 'nieder' ? 'Nieder' : t === 'sahgal' ? 'Sahgal' : t === 'scenarios' ? 'Sensitivity' : 'Clinical Guide'}
          </button>
        ))}
      </div>

      {/* ════ TAB: Nieder (Conventional) ════════════════════════════════ */}
      {tab === 'nieder' && (
        <div className="space-y-3">
          {/* Visual Cumulative BED Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">Visual Cumulative BED Timeline</h3>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
              <span>Course 1: {calc.bed1.toFixed(1)} Gy</span>
              <span className="text-slate-400">← {months} months →</span>
              <span>Course 2: {calc.bed2.toFixed(1)} Gy</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{ width: `${(calc.effectBed1 / (calc.effectBed1 + calc.bed2)) * 100}%` }}></div>
              <div className="bg-blue-300 h-full" style={{ width: `${(calc.bed2 / (calc.effectBed1 + calc.bed2)) * 100}%` }}></div>
            </div>
            <p className="text-xs mt-2">Effective BED1: {calc.effectBed1.toFixed(1)} Gy | Cumulative: {(calc.effectBed1 + calc.bed2).toFixed(1)} / {bedLimit} Gy</p>
          </div>

          {/* Inputs */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Course 1 — Prior Irradiation</p>
            </div>
            <div className="px-3 py-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">OAR Dose (Gy)</label>
                <input type="number" step="0.5" value={d1Total}
                  onChange={e => setD1Total(e.target.value)} className="input-clinical num" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">No. of Fractions</label>
                <input type="number" step="1" value={d1Fx}
                  onChange={e => setD1Fx(e.target.value)} className="input-clinical num" />
              </div>
              <div className="col-span-2 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5 num">
                d/fx = {dpf1.toFixed(2)} Gy &nbsp;|&nbsp;
                BED{ab} = {calc.bed1.toFixed(1)} Gy &nbsp;|&nbsp;
                EQD2 = {calc.eqd1.toFixed(1)} Gy
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Time Interval</p>
            </div>
            <div className="px-3 py-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Months elapsed since Course 1 completed
              </label>
              <input type="number" step="1" value={months}
                  onChange={e => setMonths(e.target.value)} className="input-clinical num w-24" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Course 2 — Re-irradiation</p>
            </div>
            <div className="px-3 py-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">OAR Dose (Gy)</label>
                <input type="number" step="0.5" value={d2Total}
                  onChange={e => setD2Total(e.target.value)} className="input-clinical num" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">No. of Fractions</label>
                <input type="number" step="1" value={d2Fx}
                  onChange={e => setD2Fx(e.target.value)} className="input-clinical num" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: Sahgal (SBRT Spine) ══════════════════════════════════ */}
      {tab === 'sahgal' && (
        <div className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Sahgal SBRT Spine Re-RT</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Prior Cord EQD2₂ (Gy)</label>
              <input type="number" value={sahgalPriorEQD2} onChange={e => setSahgalPriorEQD2(e.target.value)} className="input-clinical num" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Planned SBRT Thecal Sac Dmax/fx (Gy)</label>
              <input type="number" value={sahgalPlannedDmax} onChange={e => setSahgalPlannedDmax(e.target.value)} className="input-clinical num" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Number of SBRT Fractions (1–5)</label>
              <input type="number" min="1" max="5" value={sahgalFx} onChange={e => setSahgalFx(e.target.value)} className="input-clinical num" />
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${sahgalCalc.status === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-bold">Cumulative Thecal Sac EQD2₂: {sahgalCalc.cumEQD2.toFixed(1)} Gy</p>
            <p className="text-xs">Limit: {sahgalCalc.limit} Gy</p>
            <p className="text-xs font-bold mt-2">{sahgalCalc.status === 'pass' ? 'PASS' : 'FAIL'}</p>
          </div>
          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded">Physics peer review MANDATORY. Multidisciplinary case conference required.</p>
        </div>
      )}

      {/* ════ TAB: Sensitivity ══════════════════════════════════════ */}
      {tab === 'scenarios' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Min Safe Interval Calculator</p>
            </div>
            <div className="scroll-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="px-3 py-2 text-left">Interval (mo)</th>
                    <th className="px-3 py-2 text-right">Safety Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[3,5,6,12,18,24,36].map(m => {
                    const rec  = getRecoveryFraction(oar, m);
                    const eBed = calc.bed1 * (1 - rec);
                    const cum = eBed + calc.bed2;
                    const status = bedStatus(cum, bedLimit);
                    return (
                      <tr key={m} className={m === mo ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700'}>
                        <td className="px-3 py-2">{m} months{m === mo && ' ←'}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`result-badge ${status}`}>
                            {status === 'pass' ? 'OK' : status === 'warn' ? 'Near' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: Clinical Guidance ════════════════════════════════ */}
      {tab === 'guidance' && (
        <div className="space-y-3">
          <button onClick={generateMDT} className="flex items-center gap-2 w-full justify-center bg-blue-700 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-800">
            <FileText size={16} /> Generate MDT Summary
          </button>
          {/* Nieder criteria */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nieder Criteria for Spinal Cord Re-RT (2005/2013)
              </p>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { criterion: 'BED₂ of each course', value: '< 98 Gy₂ each', note: 'Neither course should individually approach TD5/5' },
                { criterion: 'Cumulative BED₂', value: '≤ 135 Gy₂', note: 'Hard limit. Some use 130 Gy₂ conservatively.' },
                { criterion: 'Minimum interval', value: '≥ 6 months', note: 'Allows partial (25%) recovery. Shorter intervals = 0% recovery credit.' },
                { criterion: 'Partial cord irradiation', value: 'Preferred', note: 'Retreating same cord segment = higher risk. Lateral approach preferred.' },
                { criterion: 'SBRT re-RT (Sahgal)', value: 'Cumulative Thecal sac Dmax ≤ 25 Gy EQD2', note: 'For cases with prior conventional RT. In 3–5 fx. Physics peer review mandatory. Do not conflate with de-novo RTOG 0631 point constraint.' },
              ].map((r, i) => (
                <div key={i} className="px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-800">{r.criterion}</span>
                    <span className="text-[11px] font-black num text-blue-800 flex-shrink-0">{r.value}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Reference ────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 px-1">
        Ref: Nieder C et al. IJROBP 61(3):851–855, 2005.
        Sahgal A et al. IJROBP 82(1):107–116, 2012.
        Dale RG. Br J Radiol 1985. QUANTEC 2010.
      </p>

      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />
    </div>
  );
};

export default ReirradiationCalcPage;
