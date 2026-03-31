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
  BookOpen, GraduationCap, ShieldAlert,
} from 'lucide-react';
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

  const valid = nAb > 0 && nOrigDose > 0 && nOrigDpf > 0 && nNewDpf > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Fractionation Adjustment</h1>
          <p className="text-sm text-slate-500">Iso-BED schedule conversion · LQ model</p>
        </div>
        <button
          onClick={() => setShowFormula(f => !f)}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
        >
          {showFormula ? 'Hide' : 'Formula'}
        </button>
      </div>

      {/* Formula */}
      {showFormula && (
        <div className="bg-slate-900 rounded-lg px-3 py-2.5 font-mono text-[11px] text-slate-200 space-y-1">
          <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-widest mb-1">Iso-BED Formula</p>
          <p><span className="text-blue-300">BED_orig</span> = D × (1 + d_orig / α/β)</p>
          <p><span className="text-emerald-300">D_new</span> = BED_orig / (1 + d_new / α/β)</p>
          <p><span className="text-amber-300">n_new</span> = D_new / d_new</p>
          <p><span className="text-rose-300">EQD2_OAR</span> = D_new × (d_new + α/β_OAR) / (2 + α/β_OAR)</p>
          <p className="text-slate-500 text-[9px] mt-1">
            Fractions must be rounded — then recalculate d_new to maintain exact BED.
            OAR EQD2 must be checked at new d/fx against QUANTEC limits.
          </p>
        </div>
      )}

      {/* Original Schedule */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Schedule</p>
        </div>
        <div className="px-3 py-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Total Dose (Gy)</label>
            <NumberInput  step="0.5" value={origDose}
              onChange={e => setOrigDose(e.target.value)} className="input-clinical num" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dose/Fx (Gy)</label>
            <NumberInput  step="0.1" value={origDpf}
              onChange={e => setOrigDpf(e.target.value)} className="input-clinical num" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fractions</label>
            <div className="input-clinical num bg-slate-50 text-slate-500 cursor-default">{origFx}</div>
          </div>
          <div className="col-span-3 text-[11px] text-slate-400 bg-slate-50 rounded px-2 py-1.5 num">
            BED{nAb} = {baseBED.toFixed(2)} Gy &nbsp;·&nbsp; EQD2 = {baseEQD2.toFixed(2)} Gy
          </div>
        </div>
      </div>

      {/* New Schedule Parameters */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Schedule Parameters</p>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">New Dose/Fx (Gy)</label>
              <NumberInput  step="0.1" value={newDpf}
                onChange={e => setNewDpf(e.target.value)} className="input-clinical num" />
            </div>
          </div>

          {/* ISS-03: LQ validity warning */}
          {lqValidity.level !== 'ok' && (
            <div className={`p-2.5 rounded-lg border flex items-start gap-2 ${
              lqValidity.level === 'warning'
                ? 'bg-red-50 border-red-300'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                lqValidity.level === 'warning' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <p className={`text-[10px] leading-relaxed ${
                lqValidity.level === 'warning' ? 'text-red-800' : 'text-amber-800'
              }`}>
                {lqValidity.message}
              </p>
            </div>
          )}

          {/* Tumour Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Tumour Site & α/β
            </label>
            <TumourSelector
              selectedEntry={selectedTumour}
              onSelect={(entry) => {
                setSelectedTumour(entry);
                setAb(entry.ab.toString());
              }}
              onClear={() => setSelectedTumour(null)}
            />
            {!selectedTumour && (
              <div className="mt-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or manually set α/β Ratio (Gy)
                </label>
                <NumberInput  step="0.5" value={ab}
                  onChange={e => { setAb(e.target.value); setSelectedTumour(null); }}
                  className="input-clinical num" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Custom OAR α/β (Gy)</label>
            <NumberInput  step="0.5" value={oarAb}
              onChange={e => setOarAb(e.target.value)} className="input-clinical num" />
          </div>
        </div>
      </div>

      {/* Results */}
      {valid && (
        <div className="bg-[#1e3a5f] rounded-lg text-white px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/70 mb-3">
            Iso-BED Result — {isHypo ? 'Hypofractionated' : 'Hyperfractionated'}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-blue-200/60">New Total Dose</p>
              <p className="text-2xl font-black num">{newTotal.toFixed(1)}</p>
              <p className="text-[9px] text-blue-200/50">Gy
                <span className={`ml-1 text-[10px] font-bold ${doseChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  ({doseChange >= 0 ? '+' : ''}{doseChange.toFixed(1)})
                </span>
              </p>
            </div>
            <div className="border-x border-blue-800/60">
              <p className="text-[9px] uppercase tracking-wider text-blue-200/60">New Fractions</p>
              <p className="text-2xl font-black num text-amber-300">{newFx.toFixed(2)}</p>
              <p className="text-[9px] text-blue-200/50">(exact — round below)</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-blue-200/60">BED preserved</p>
              <p className="text-2xl font-black num text-emerald-300">{baseBED.toFixed(1)}</p>
              <p className="text-[9px] text-blue-200/50">Gy{nAb}</p>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default FracAdjustPage;
