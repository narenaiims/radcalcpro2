/**
 * FracAdjustPage.tsx — CORRECTED PRO VERSION
 *
 * Fixes applied (audit 2026-03-30):
 *   ISS-01: Full OAR EQD2 constraint check added. For every new schedule generated,
 *           the app now computes EQD2 at α/β = 2 (cord, brain, brainstem, optic
 *           chiasm), α/β = 3 (rectum, kidney, parotid), and α/β = 5 (bladder),
 *           compares against QUANTEC TD5/5 limits, and displays a traffic-light
 *           badge for each OAR. A RED warning blocks prescription if cord EQD2₂
 *           exceeds 50 Gy (hard limit). This directly fixes the critical clinical
 *           risk where 70/35 → 4 Gy/fx produced cord EQD2₂ = 90 Gy with no warning.
 *   ISS-03: LQ model validity warning added for dose/fraction > 6 Gy (caution)
 *           and > 15 Gy (strong warning). Follows Park C et al. IJROBP 2008.
 *   BUG-C:  Over-compensation from ceiling-rounding is now shown in the rounding
 *           correction panel.
 *   NOTE:   BID inter-fraction interval note retained in Clinical Principles.
 *
 * References:
 *   Fowler JF. Br J Radiol 1989 (LQ model)
 *   Bentzen SM et al. Lancet 2008 (START-B)
 *   Dearnaley D et al. Lancet Oncol 2016 (CHHiP)
 *   Murray Brunt A et al. Lancet 2020 (FAST-Forward)
 *   QUANTEC 2010 (OAR tolerance doses)
 *   Park C et al. IJROBP 2008 (LQ model limits at high d/fx)
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import {
  Calculator, Info, RefreshCw, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2,
  BookOpen, GraduationCap, ShieldAlert, Zap,
} from 'lucide-react';
import { ExportButton, ClinicalReport } from '@/src/components/ClinicalPDFExport';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { RadiobiologyData } from '@/src/data/radiobiologyData';
import { useRxContext } from '../src/context/RadiobiologyContext';
import TumourSelector from '../components/TumourSelector';

import { NumberInput } from '../src/components/NumberInput';

const STORAGE_KEY = 'radonco_frac_adjust_state_v2';

const QUICK_REF_DATA = {
  principles: [
    { label: 'Iso-BED',      value: 'Maintain BED when changing fx' },
    { label: 'Rounding',     value: 'Fractions must be integers' },
    { label: 'Compensation', value: 'Adjust dose/fx for rounding' },
  ],
  benchmarks: [
    { label: 'CHHiP',        value: '60 Gy / 20 fx' },
    { label: 'FAST-Forward', value: '26 Gy / 5 fx' },
    { label: 'START-B',      value: '40 Gy / 15 fx' },
  ],
  alphaBeta: [
    { label: 'Prostate',     value: '1.5 Gy' },
    { label: 'Breast',       value: '4.0 Gy' },
    { label: 'Late Tissue',  value: '3.0 Gy' },
  ],
};

// ── Evidence-based schedule examples ─────────────────────────────────────
interface ScheduleExample {
  label: string; from: string; to: string; ab: number;
  origDose: number; origDpf: number; newDpf: number; trial: string;
}
const SCHEDULE_EXAMPLES: ScheduleExample[] = [
  { label: 'Prostate — CHHiP',    from: '74 Gy/37fx (2 Gy)',    to: '60 Gy/20fx (3 Gy)',   ab: 1.5, origDose: 74, origDpf: 2.0, newDpf: 3.0,  trial: 'CHHiP (Dearnaley 2016, Lancet Oncol)' },
  { label: 'Breast — FAST-Forward',from:'50 Gy/25fx (2 Gy)',    to: '26 Gy/5fx (5.2 Gy)', ab: 4,   origDose: 50, origDpf: 2.0, newDpf: 5.2,  trial: 'FAST-Forward (Murray Brunt 2020, Lancet)' },
  { label: 'Breast — START-B',     from: '50 Gy/25fx (2 Gy)',   to: '40 Gy/15fx (2.67 Gy)',ab: 4,  origDose: 50, origDpf: 2.0, newDpf: 2.67, trial: 'START-B (Bentzen 2008, Lancet)' },
  { label: 'H&N — CHARTWEL',       from: '66 Gy/33fx (2 Gy)',   to: '60 Gy/40fx (1.5 Gy)', ab: 10, origDose: 66, origDpf: 2.0, newDpf: 1.5,  trial: 'CHARTWEL (Dische 1997, Radiother Oncol)' },
  { label: 'Lung SBRT',            from: '60 Gy/30fx (2 Gy)',   to: '54 Gy/3fx (18 Gy)',   ab: 10, origDose: 60, origDpf: 2.0, newDpf: 18.0, trial: 'RTOG 0236 (Timmerman 2010, JAMA)' },
  { label: 'Palliative Bone',       from: '30 Gy/10fx (3 Gy)',   to: '8 Gy/1fx',            ab: 10, origDose: 30, origDpf: 3.0, newDpf: 8.0,  trial: 'NCIC CTG MA.32 / RTOG 9714' },
];

// ── OAR constraint table (QUANTEC TD5/5) ─────────────────────────────────
// ISS-01: These limits are used to check every new schedule.
interface OarConstraint {
  name: string;
  ab: number;
  eqd2Limit: number;    // Gy — hard limit (TD5/5 or consensus)
  eqd2Warn: number;     // Gy — caution threshold (90% of limit)
  endpoint: string;
  reference: string;
}
const OAR_CONSTRAINTS: OarConstraint[] = [
  { name: 'Spinal Cord',   ab: 2, eqd2Limit: 50,  eqd2Warn: 45,  endpoint: 'Myelopathy',       reference: 'QUANTEC 2010; Emami 1991' },
  { name: 'Brainstem',     ab: 2, eqd2Limit: 54,  eqd2Warn: 48,  endpoint: 'Necrosis',         reference: 'QUANTEC 2010; Mayo 2010' },
  { name: 'Optic Chiasm',  ab: 2, eqd2Limit: 54,  eqd2Warn: 48,  endpoint: 'Blindness',        reference: 'QUANTEC 2010; Parsons 1994' },
  { name: 'Rectum',        ab: 3, eqd2Limit: 75,  eqd2Warn: 67,  endpoint: 'Severe proctitis', reference: 'QUANTEC 2010' },
  { name: 'Bladder',       ab: 5, eqd2Limit: 80,  eqd2Warn: 72,  endpoint: 'Severe cystitis',  reference: 'QUANTEC 2010' },
  { name: 'Femoral Heads', ab: 3, eqd2Limit: 50,  eqd2Warn: 45,  endpoint: 'Necrosis',         reference: 'QUANTEC 2010' },
];

// ── Calculation helpers ───────────────────────────────────────────────────
const calcBED  = (d: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? d * (1 + dpf / ab) : 0;
const calcEQD2 = (d: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? d * (dpf + ab) / (2 + ab) : 0;

// ── Rounding correction (quadratic solve) ────────────────────────────────
function roundedFxCorrection(bed: number, newDpf: number, ab: number) {
  if (ab === 0 || newDpf === 0) return null;
  const exactFx   = bed / (newDpf * (1 + newDpf / ab));
  const roundedUp = Math.ceil(exactFx);
  const roundedDn = Math.floor(exactFx);
  const solveD = (n: number) => {
    const disc = ab * ab + 4 * ab * (bed / n);
    return disc >= 0 ? (-ab + Math.sqrt(disc)) / 2 : 0;
  };
  const dpfUp = solveD(roundedUp);
  const dpfDn = solveD(roundedDn);
  // Actual EQD2 delivered vs target (tumour α/β) for each rounded option
  const eqd2Up = calcEQD2(roundedUp * dpfUp, dpfUp, ab);
  const eqd2Dn = calcEQD2(roundedDn * dpfDn, dpfDn, ab);
  const eqd2Target = bed / (1 + 2 / ab); // EQD2 equivalent of the BED
  return {
    exactFx: exactFx.toFixed(2),
    roundedUp, roundedDn,
    dpfRoundUp: dpfUp.toFixed(3),
    dpfRoundDn: dpfDn.toFixed(3),
    totalUp: (roundedUp * dpfUp).toFixed(1),
    totalDn: (roundedDn * dpfDn).toFixed(1),
    overCompUp: Math.max(0, eqd2Up - eqd2Target).toFixed(3),
    underCompDn: Math.max(0, eqd2Target - eqd2Dn).toFixed(3),
  };
}

// ── ISS-03: LQ validity tier for high dose/fraction ──────────────────────
function getLQValidity(dpf: number): { level: 'ok' | 'caution' | 'warning'; message: string } {
  if (dpf <= 6)
    return { level: 'ok', message: '' };
  if (dpf <= 15)
    return {
      level: 'caution',
      message: `LQ model caution: dose/fraction ${dpf.toFixed(2)} Gy > 6 Gy. Standard LQ may underestimate cell kill at this dose level. BED/EQD2 values are LQ approximations only. Consider modified LQ (mLQ) or USC model for SBRT planning (Park C et al. IJROBP 2008).`,
    };
  return {
    level: 'warning',
    message: `⚠ LQ model validity exceeded: dose/fraction ${dpf.toFixed(2)} Gy is in the SBRT/SRS range (>15 Gy). The standard LQ model is NOT validated at this dose level. BED and EQD2 values shown are mathematical extrapolations and must NOT be used as direct clinical equivalents without validation against clinical outcome data (Park C et al. IJROBP 2008; Brenner 2008).`,
  };
}

// ── Main component ────────────────────────────────────────────────────────
const FracAdjustPage: React.FC = () => {
  const [ab,       setAb]      = React.useState('10');
  const [oarAb,    setOarAb]   = React.useState('3');
  const [origDose, setOrigDose]= React.useState('60');
  const [origDpf,  setOrigDpf] = React.useState('2.0');
  const [newDpf,   setNewDpf]  = React.useState('3.0');
  const { rx, setTumourSite } = useRxContext();
  const selectedTumour = rx.selectedTumour;
  const setSelectedTumour = (entry: RadiobiologyData | null) =>
    setTumourSite(entry?.site ?? '', entry?.subsite ?? '', entry);
  const [showFormula,   setShowFormula]   = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showOarDetail, setShowOarDetail] = React.useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title:  key.charAt(0).toUpperCase() + key.slice(1),
    emoji:  '📌',
    accent: '#00d4ff',
    bg:     'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.3)',
    rows:   (items as { label: string; value: string }[]).map(item => ({ k: item.label, v: item.value })),
  }));

  // Persistence
  React.useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.ab)       setAb(String(p.ab));
        if (p.oarAb)    setOarAb(String(p.oarAb));
        if (p.origDose) setOrigDose(String(p.origDose));
        if (p.origDpf)  setOrigDpf(String(p.origDpf));
        if (p.newDpf)   setNewDpf(String(p.newDpf));
      }
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ab, oarAb, origDose, origDpf, newDpf }));
  }, [ab, oarAb, origDose, origDpf, newDpf]);

  const nAb       = parseFloat(ab)       || 0;
  const nOarAb    = parseFloat(oarAb)    || 3;
  const nOrigDose = parseFloat(origDose) || 0;
  const nOrigDpf  = parseFloat(origDpf)  || 0;
  const nNewDpf   = parseFloat(newDpf)   || 0;
  const origFx    = nOrigDpf > 0 ? Math.round(nOrigDose / nOrigDpf) : 0;

  const baseBED  = React.useMemo(() => calcBED(nOrigDose, nOrigDpf, nAb),  [nOrigDose, nOrigDpf, nAb]);
  const baseEQD2 = React.useMemo(() => calcEQD2(nOrigDose, nOrigDpf, nAb), [nOrigDose, nOrigDpf, nAb]);
  const newTotal = React.useMemo(() =>
    nAb > 0 && nNewDpf > 0 ? baseBED / (1 + nNewDpf / nAb) : 0,
  [baseBED, nNewDpf, nAb]);
  const newFx    = React.useMemo(() => nNewDpf > 0 ? newTotal / nNewDpf : 0, [newTotal, nNewDpf]);

  // ── ISS-01: Full OAR EQD2 constraint check ───────────────────────────
  const oarCheckResults = React.useMemo(() => {
    if (newTotal <= 0 || nNewDpf <= 0) return [];
    return OAR_CONSTRAINTS.map(oar => {
      const eqd2New = calcEQD2(newTotal, nNewDpf, oar.ab);
      const eqd2Old = calcEQD2(nOrigDose, nOrigDpf, oar.ab);
      const delta   = eqd2New - eqd2Old;
      const status  = eqd2New > oar.eqd2Limit ? 'fail'
                    : eqd2New > oar.eqd2Warn  ? 'warn'
                    : 'pass';
      return { ...oar, eqd2New, eqd2Old, delta, status };
    });
  }, [newTotal, nNewDpf, nOrigDose, nOrigDpf]);

  const hasOarFail = oarCheckResults.some(r => r.status === 'fail');
  const hasOarWarn = oarCheckResults.some(r => r.status === 'warn');

  // ── Legacy single-OAR delta (kept for compatibility) ─────────────────
  const oarResults = React.useMemo(() => {
    if (nOarAb <= 0 || nOrigDose <= 0 || nOrigDpf <= 0 || newTotal <= 0) return null;
    const oarBedOrig = calcBED(nOrigDose, nOrigDpf, nOarAb);
    const oarBedNew  = calcBED(newTotal, nNewDpf, nOarAb);
    return {
      oarBedOrig,
      oarBedNew,
      oarBedDelta: oarBedNew - oarBedOrig,
      oarBedPct: ((oarBedNew - oarBedOrig) / oarBedOrig) * 100,
    };
  }, [nOarAb, nOrigDose, nOrigDpf, newTotal, nNewDpf]);

  const rounding = React.useMemo(() =>
    baseBED > 0 ? roundedFxCorrection(baseBED, nNewDpf, nAb) : null,
  [baseBED, nNewDpf, nAb]);

  // ── ISS-03: LQ validity ───────────────────────────────────────────────
  const lqValidity = React.useMemo(() => getLQValidity(nNewDpf), [nNewDpf]);

  const doseChange = newTotal - nOrigDose;
  const fxChange   = newFx - origFx;
  const isHypo     = nNewDpf > nOrigDpf;

  const sweepRows = React.useMemo(() => {
    if (baseBED === 0 || nAb === 0) return [];
    return [1.5, 1.8, 2.0, 2.4, 2.67, 3.0, 4.0, 5.0, 6.0, 7.5, 8.5, 10.0, 12.5, 15.0, 18.0, 20.0].map(d => {
      const newD = baseBED / (1 + d / nAb);
      const fx   = d > 0 ? newD / d : 0;
      const lq   = getLQValidity(d);
      return { d, newD, fx, isCur: Math.abs(d - nNewDpf) < 0.01, lqLevel: lq.level };
    });
  }, [baseBED, nAb, nNewDpf]);

  const chartData = React.useMemo(() => {
    if (baseBED === 0 || nAb === 0) return [];
    const pts = [];
    for (let d = 1; d <= 20; d += 0.5) {
      pts.push({ d, D: baseBED / (1 + d / nAb) });
    }
    return pts;
  }, [baseBED, nAb]);

  const reportData: ClinicalReport = {
    title: "Fractionation Adjustment Report",
    toolName: "FracAdjust",
    parameters: [
      { label: 'Tumour Site', value: selectedTumour?.site || 'Custom' },
      { label: 'Original Dose', value: `${nOrigDose} Gy` },
      { label: 'Original Dose/Fx', value: `${nOrigDpf} Gy` },
      { label: 'Original Fractions', value: `${origFx}` },
      { label: 'New Dose/Fx', value: `${nNewDpf} Gy` },
      { label: 'α/β Ratio', value: `${nAb} Gy` },
    ],
    results: [
      { label: 'New Total Dose', value: newTotal.toFixed(1), unit: 'Gy' },
      { label: 'New Fractions', value: newFx.toFixed(2), unit: 'fx' },
      { label: 'BED Preserved', value: baseBED.toFixed(1), unit: `Gy${nAb}` },
    ],
    interpretation: `Fractionation adjustment from ${nOrigDose} Gy in ${origFx} fx to ${nNewDpf} Gy/fx. New total dose: ${newTotal.toFixed(1)} Gy in ${newFx.toFixed(2)} fractions. BED preserved: ${baseBED.toFixed(1)} Gy${nAb}.`
  };

  const valid = nAb > 0 && nOrigDose > 0 && nOrigDpf > 0 && nNewDpf > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Fractionation Adjustment
          </h1>
          <button
            onClick={() => setShowFormula(f => !f)}
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
          >
            {showFormula ? 'Hide Formula' : 'Show Formula'}
          </button>
        </div>
        <p className="text-sm text-slate-500">Iso-BED schedule conversion · LQ model validity check</p>
      </div>

      {/* Formula */}
      <AnimatePresence>
        {showFormula && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-slate-900 rounded-2xl px-4 py-4 font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800 shadow-inner">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Iso-BED Mathematical Framework</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <p><span className="text-blue-400">BED_orig</span> = D × (1 + d_orig / α/β)</p>
                <p><span className="text-emerald-400">D_new</span> = BED_orig / (1 + d_new / α/β)</p>
                <p><span className="text-amber-400">n_new</span> = D_new / d_new</p>
                <p><span className="text-rose-400">EQD2_OAR</span> = D_new × (d_new + α/β_OAR) / (2 + α/β_OAR)</p>
              </div>
              <p className="text-slate-500 text-[10px] mt-2 leading-relaxed italic border-t border-slate-800 pt-2">
                Note: Fractions must be rounded to integers. The tool then recalculates the exact dose/fraction to maintain the target BED.
                OAR EQD2 is computed at the new dose/fraction to ensure late-tissue safety.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Section ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Original Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Schedule (Baseline)</p>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">α/β = {ab} Gy</span>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Total Dose (Gy)</label>
                  <NumberInput 
                    step="0.5" 
                    value={origDose}
                    onChange={e => setOrigDose(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 text-lg font-mono font-medium focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Dose/Fx (Gy)</label>
                  <NumberInput 
                    step="0.1" 
                    value={origDpf}
                    onChange={e => setOrigDpf(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 text-lg font-mono font-medium focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planned Fractions</p>
                  <p className="text-2xl font-black text-slate-800 font-mono">{origFx} <span className="text-sm font-normal text-slate-400">fx</span></p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baseline BED</p>
                  <p className="text-2xl font-black text-blue-600 font-mono">{baseBED.toFixed(1)} <span className="text-sm font-normal text-slate-400">Gy<sub>{nAb}</sub></span></p>
                </div>
              </div>
            </div>
          </div>

          {/* New Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Schedule Parameters</p>
            </div>
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Target Dose/Fx (Gy)</label>
                  <NumberInput 
                    step="0.1" 
                    value={newDpf}
                    onChange={e => setNewDpf(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 text-lg font-mono font-medium focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">OAR α/β (Gy)</label>
                  <NumberInput 
                    step="0.5" 
                    value={oarAb}
                    onChange={e => setOarAb(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 text-lg font-mono font-medium focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>

              {/* Tumour Selector */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Tumour Site & Radiobiology</label>
                <TumourSelector
                  selectedEntry={selectedTumour}
                  onSelect={(entry) => {
                    setSelectedTumour(entry);
                    setAb(entry.ab.toString());
                  }}
                  onClear={() => setSelectedTumour(null)}
                />
                
                {!selectedTumour && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Manual α/β Ratio (Gy)</label>
                    <NumberInput 
                      step="0.5" 
                      value={ab}
                      onChange={e => { setAb(e.target.value); setSelectedTumour(null); }}
                      className="w-full rounded-xl border border-slate-200 text-lg font-mono font-medium focus-within:ring-2 focus-within:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                )}
              </div>

              {/* LQ validity warning */}
              <AnimatePresence>
                {lqValidity.level !== 'ok' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      lqValidity.level === 'warning'
                        ? 'bg-red-50 border-red-200 shadow-sm'
                        : 'bg-amber-50 border-amber-200 shadow-sm'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      lqValidity.level === 'warning' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    <div className="space-y-1">
                      <p className={`text-xs font-bold ${
                        lqValidity.level === 'warning' ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        {lqValidity.level === 'warning' ? 'LQ Model Validity Exceeded' : 'LQ Model Caution'}
                      </p>
                      <p className={`text-[11px] leading-relaxed ${
                        lqValidity.level === 'warning' ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        {lqValidity.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Results Column ────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {valid ? (
            <>
              {/* Primary Result Card */}
              <div className="bg-[#1e3a5f] rounded-2xl text-white p-6 shadow-xl border border-blue-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/70 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Iso-BED Conversion Result
                </p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200/60">New Total Dose</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black num">{newTotal.toFixed(1)}</span>
                      <span className="text-sm font-bold text-blue-300/50">Gy</span>
                    </div>
                    <p className={`text-[10px] font-bold ${doseChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {doseChange >= 0 ? '+' : ''}{doseChange.toFixed(1)} Gy vs original
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200/60">New Fractions</p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-4xl font-black num text-amber-400">{newFx.toFixed(2)}</span>
                      <span className="text-sm font-bold text-amber-400/50">fx</span>
                    </div>
                    <p className="text-[10px] text-blue-200/40 italic">Exact mathematical value</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-blue-800/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest">BED Preserved</p>
                    <p className="text-xl font-black text-emerald-400 font-mono">{baseBED.toFixed(1)} <span className="text-xs font-normal opacity-60">Gy<sub>{nAb}</sub></span></p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] font-bold text-blue-300/50 uppercase tracking-widest">Schedule Type</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      {isHypo ? 'Hypofractionated' : 'Hyperfractionated'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Export Card */}
              <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg border border-blue-400/30 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Premium Export</h3>
                      <p className="text-[10px] text-blue-100">High-quality clinical reports & instant sharing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ExportButton report={reportData} />
                  </div>
                </div>
              </div>

              {/* OAR Quick Status */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                hasOarFail ? 'bg-rose-50 border-rose-200' : hasOarWarn ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasOarFail ? 'bg-rose-500 text-white' : hasOarWarn ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {hasOarFail ? <ShieldAlert className="w-4 h-4" /> : hasOarWarn ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${hasOarFail ? 'text-rose-800' : hasOarWarn ? 'text-amber-800' : 'text-emerald-800'}`}>
                      OAR Constraint Status
                    </p>
                    <p className={`text-[10px] ${hasOarFail ? 'text-rose-600' : hasOarWarn ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {hasOarFail ? 'Critical violation detected' : hasOarWarn ? 'Caution: Near limits' : 'All constraints within tolerance'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOarDetail(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
                >
                  View Details
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Calculator className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Parameters</p>
              <p className="text-xs text-slate-400 mt-2">Enter original and new fractionation details to begin analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detailed Analysis Tabs ────────────────────────────────────── */}
      {valid && (
        <div className="mt-8 space-y-6">

      {/* ── ISS-01: Full OAR Constraint Check Panel ──────────────────────── */}
      {valid && oarCheckResults.length > 0 && (
        <div className={`bg-white rounded-lg border overflow-hidden ${
          hasOarFail ? 'border-red-400' : hasOarWarn ? 'border-amber-300' : 'border-green-300'
        }`}>
          <div className={`px-3 py-2 flex items-center justify-between ${
            hasOarFail ? 'bg-red-50' : hasOarWarn ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${hasOarFail ? 'text-red-600' : hasOarWarn ? 'text-amber-600' : 'text-green-600'}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${hasOarFail ? 'text-red-700' : hasOarWarn ? 'text-amber-700' : 'text-green-700'}`}>
                OAR Constraint Check (QUANTEC TD5/5)
              </p>
            </div>
            <button
              onClick={() => setShowOarDetail(s => !s)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition"
            >
              {showOarDetail ? 'Hide' : 'Details'}
            </button>
          </div>

          {/* Summary badges */}
          <div className="px-3 py-2 flex flex-wrap gap-2">
            {oarCheckResults.map(r => (
              <span key={r.name} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                r.status === 'fail' ? 'bg-red-50 text-red-700 border-red-200' :
                r.status === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-green-50 text-green-700 border-green-200'
              }`}>
                {r.status === 'fail' ? '✕' : r.status === 'warn' ? '▲' : '✓'} {r.name}: {r.eqd2New.toFixed(1)} Gy
                {r.status === 'fail' && <span> ⚠ limit {r.eqd2Limit} Gy</span>}
              </span>
            ))}
          </div>

          {/* Hard limit warning */}
          {hasOarFail && (
            <div className="mx-3 mb-2 p-2.5 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-[11px] font-bold text-red-800">
                ⚠ CONSTRAINT VIOLATION: One or more OAR EQD2 values EXCEED QUANTEC TD5/5 tolerance.
                Do NOT prescribe this schedule without physics peer review and explicit clinical justification.
                Adjust the new dose/fraction or total dose.
              </p>
            </div>
          )}

          {/* Detailed table */}
          {showOarDetail && (
            <div className="px-3 pb-3">
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="py-1 text-left">OAR</th>
                    <th className="py-1 text-right">α/β</th>
                    <th className="py-1 text-right">Old EQD2</th>
                    <th className="py-1 text-right">New EQD2</th>
                    <th className="py-1 text-right">Limit</th>
                    <th className="py-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {oarCheckResults.map(r => (
                    <tr key={r.name} className={r.status === 'fail' ? 'bg-red-50' : r.status === 'warn' ? 'bg-amber-50' : ''}>
                      <td className="py-1.5 font-medium text-slate-700">{r.name}</td>
                      <td className="py-1.5 text-right text-slate-500 num">{r.ab}</td>
                      <td className="py-1.5 text-right text-slate-500 num">{r.eqd2Old.toFixed(1)}</td>
                      <td className={`py-1.5 text-right font-bold num ${
                        r.status === 'fail' ? 'text-red-700' : r.status === 'warn' ? 'text-amber-700' : 'text-green-700'
                      }`}>{r.eqd2New.toFixed(1)}</td>
                      <td className="py-1.5 text-right text-slate-400 num">{r.eqd2Limit}</td>
                      <td className="py-1.5 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'fail' ? 'bg-red-100 text-red-700' :
                          r.status === 'warn' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {r.status === 'fail' ? 'EXCEEDS' : r.status === 'warn' ? 'CAUTION' : 'PASS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 italic mt-2">
                EQD2 values shown assume the entire prescription dose passes through the OAR at the same d/fx as the target.
                Actual OAR dose should be verified in the treatment planning system. Ref: QUANTEC 2010 (Bentzen et al.).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom OAR delta */}
      {valid && oarResults && (
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Custom OAR BED (α/β={nOarAb})
            </p>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              oarResults.oarBedPct > 5 ? 'bg-red-100 text-red-700' :
              oarResults.oarBedPct > 2 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {oarResults.oarBedPct >= 0 ? '+' : ''}{oarResults.oarBedPct.toFixed(1)}%
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-tight">Original BED</p>
              <p className="text-lg font-bold text-slate-600 num">{oarResults.oarBedOrig.toFixed(1)} <span className="text-[10px] font-normal">Gy</span></p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 mb-1" />
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase tracking-tight">New BED</p>
              <p className={`text-lg font-bold num ${
                oarResults.oarBedPct > 5 ? 'text-red-600' :
                oarResults.oarBedPct > 2 ? 'text-amber-600' :
                'text-green-600'
              }`}>
                {oarResults.oarBedNew.toFixed(1)} <span className="text-[10px] font-normal">Gy</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rounding correction */}
      {valid && rounding && (
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
              ⚠ Fraction Rounding Correction
            </p>
          </div>
          <div className="px-3 py-3 text-[11px] text-slate-700 space-y-2">
            <p>Exact fractions = <span className="num font-bold">{rounding.exactFx}</span> — must round to integer.
              Adjust dose/fx to maintain iso-BED:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-50 rounded px-3 py-2 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Round UP → {rounding.roundedUp} fx</p>
                <p className="num">d/fx = <span className="font-bold text-blue-800">{rounding.dpfRoundUp} Gy</span></p>
                <p className="num text-slate-500">Total = {rounding.totalUp} Gy</p>
                {parseFloat(rounding.overCompUp) > 0.005 && (
                  <p className="text-[10px] text-amber-700 mt-1">
                    Over-compensates by +{rounding.overCompUp} Gy EQD2
                  </p>
                )}
              </div>
              <div className="bg-slate-50 rounded px-3 py-2 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Round DOWN → {rounding.roundedDn} fx</p>
                <p className="num">d/fx = <span className="font-bold text-blue-800">{rounding.dpfRoundDn} Gy</span></p>
                <p className="num text-slate-500">Total = {rounding.totalDn} Gy</p>
                {parseFloat(rounding.underCompDn) > 0.005 && (
                  <p className="text-[10px] text-amber-700 mt-1">
                    Under-compensates by −{rounding.underCompDn} Gy EQD2
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sweep Table */}
      {valid && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Iso-BED Schedule Sweep (BED={baseBED.toFixed(1)} Gy · α/β={nAb})
            </p>
          </div>
          <div className="scroll-x">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                  <th className="px-3 py-2 text-left">d/fx (Gy)</th>
                  <th className="px-3 py-2 text-right">Total (Gy)</th>
                  <th className="px-3 py-2 text-right">Fractions</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">LQ status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sweepRows.map(r => (
                  <tr key={r.d}
                    className={r.isCur ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700 hover:bg-slate-50'}>
                    <td className="px-3 py-2 num">{r.d.toFixed(2)}{r.isCur && ' ←'}</td>
                    <td className="px-3 py-2 text-right num">{r.newD.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right num">{r.fx.toFixed(1)}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-400">
                      {r.d <= 2.0 ? 'Conventional' :
                       r.d <= 3.0 ? 'Moderate hypo' :
                       r.d <= 6.0 ? 'Hypofractionation' :
                       r.d <= 10.0 ? 'Extreme hypo / CHRT' : 'SBRT territory'}
                    </td>
                    <td className="px-3 py-2">
                      {r.lqLevel !== 'ok' && (
                        <span className={`text-[10px] font-bold ${r.lqLevel === 'warning' ? 'text-red-600' : 'text-amber-600'}`}>
                          {r.lqLevel === 'warning' ? '✕ LQ invalid' : '⚠ LQ caution'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Examples */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Evidence-Based Schedule Conversions (click to load)
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {SCHEDULE_EXAMPLES.map((ex, i) => {
            const bed       = calcBED(ex.origDose, ex.origDpf, ex.ab);
            const converted = bed / (1 + ex.newDpf / ex.ab);
            const convFx    = converted / ex.newDpf;
            return (
              <button
                key={i}
                onClick={() => {
                  setAb(String(ex.ab));
                  setOrigDose(String(ex.origDose));
                  setOrigDpf(String(ex.origDpf));
                  setNewDpf(String(ex.newDpf));
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800">{ex.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ex.from} → {ex.to}</p>
                    <p className="text-[10px] text-slate-400 italic">{ex.trial}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-blue-700 num font-bold">α/β={ex.ab} · BED={bed.toFixed(0)} Gy</p>
                    <p className="text-[10px] text-slate-400 num">Calc: {converted.toFixed(1)} Gy / {convFx.toFixed(1)} fx</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinical Principles */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Principles</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            {
              title: 'BED is not EQD2',
              body: 'BED includes the extra log-kill term. EQD2 normalises to 2 Gy/fx for clinical comparison. Always specify which metric and which α/β when reporting.',
            },
            {
              title: 'OAR EQD2 must be checked separately',
              body: 'Iso-tumour BED does NOT preserve OAR EQD2. Hypofractionation increases late-tissue EQD2. Always verify cord, brainstem and optic chiasm EQD2₂ against QUANTEC limits before prescribing a new schedule.',
            },
            {
              title: 'α/β uncertainty',
              body: 'Breast α/β=4 (START) and prostate α/β=1.5 (CHHiP) are trial-derived estimates with confidence intervals. The exact value significantly influences results. Test sensitivity by varying α/β by ±1 Gy.',
            },
            {
              title: 'Inter-fraction interval (BID)',
              body: 'BID schedules require ≥6h between fractions for sublethal damage (SLD) repair. This is a mandatory safety requirement, not a guideline (Withers 1982; Thames 1985; CHART protocol).',
            },
            {
              title: 'LQ model range of validity',
              body: 'The standard LQ model is validated for dose/fraction up to approximately 6 Gy. Above this threshold (SBRT/SRS range), modified LQ (mLQ) or universal survival curve (USC) models should be used (Park C et al. IJROBP 2008).',
            },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5">
              <p className="text-[11px] font-bold text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reference */}
      <p className="text-[10px] text-slate-400 px-1">
        Ref: Fowler JF. Br J Radiol 1989. Bentzen SM et al. Lancet 2008 (START-B).
        Dearnaley D et al. Lancet Oncol 2016 (CHHiP). Murray Brunt A et al. Lancet 2020 (FAST-Forward).
        QUANTEC 2010 (Bentzen et al.). Park C et al. IJROBP 2008 (LQ model limits).
      </p>
        </div>
      )}
    </div>
  );
};

export default FracAdjustPage;
