/**
 * FracAdjustPage.tsx — PRO LEVEL
 * Iso-effective fractionation adjustment using the LQ model.
 *
 * Core formula:
 *   BED = D × (1 + d/α/β)
 *   Iso-BED: new total dose = BED_old / (1 + d_new/α/β)
 *   New fractions = new total dose / d_new
 *
 * References:
 *   Fowler JF. Br J Radiol 1989. (LQ model)
 *   Bentzen SM et al. Radiother Oncol 2012. (Hypofractionation evidence)
 *   Dearnaley D et al. Lancet Oncol 2016. (CHHiP — prostate α/β=1.5)
 *   Murray Brunt A et al. Lancet 2020. (FAST-Forward breast)
 *   RTOG 0617 (lung dose escalation)
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { 
  Calculator, Info, RefreshCw, ChevronRight, 
  TrendingUp, AlertTriangle, CheckCircle2,
  BookOpen, GraduationCap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot 
} from 'recharts';
import { RadiobiologyData } from '@/src/data/radiobiologyData';
import { useRxContext } from '../src/context/RadiobiologyContext';
import TumourSelector from '../components/TumourSelector';

const STORAGE_KEY = 'radonco_frac_adjust_state_v2';

const QUICK_REF_DATA = {
  principles: [
    { label: 'Iso-BED', value: 'Maintain BED when changing fx' },
    { label: 'Rounding', value: 'Fractions must be integers' },
    { label: 'Compensation', value: 'Adjust dose/fx for rounding' }
  ],
  benchmarks: [
    { label: 'CHHiP', value: '60 Gy / 20 fx' },
    { label: 'FAST-Forward', value: '26 Gy / 5 fx' },
    { label: 'START-B', value: '40 Gy / 15 fx' }
  ],
  alphaBeta: [
    { label: 'Prostate', value: '1.5 Gy' },
    { label: 'Breast', value: '4.0 Gy' },
    { label: 'Late Tissue', value: '3.0 Gy' }
  ]
};

// ── Common clinical schedule conversions ──────────────────────────────────
interface ScheduleExample {
  label: string;
  from: string;
  to: string;
  ab: number;
  origDose: number;
  origDpf: number;
  newDpf: number;
  trial: string;
}

const SCHEDULE_EXAMPLES: ScheduleExample[] = [
  {
    label: 'Prostate — CHHiP',
    from: '74 Gy/37fx (2 Gy)',
    to: '60 Gy/20fx (3 Gy)',
    ab: 1.5,
    origDose: 74, origDpf: 2.0, newDpf: 3.0,
    trial: 'CHHiP (Dearnaley 2016, Lancet Oncol)',
  },
  {
    label: 'Breast — FAST-Forward',
    from: '50 Gy/25fx (2 Gy)',
    to: '26 Gy/5fx (5.2 Gy)',
    ab: 4,
    origDose: 50, origDpf: 2.0, newDpf: 5.2,
    trial: 'FAST-Forward (Murray Brunt 2020, Lancet)',
  },
  {
    label: 'Breast — START-B',
    from: '50 Gy/25fx (2 Gy)',
    to: '40 Gy/15fx (2.67 Gy)',
    ab: 4,
    origDose: 50, origDpf: 2.0, newDpf: 2.67,
    trial: 'START-B (Bentzen 2008, Lancet)',
  },
  {
    label: 'H&N — CHARTWEL',
    from: '66 Gy/33fx (2 Gy)',
    to: '60 Gy/40fx (1.5 Gy)',
    ab: 10,
    origDose: 66, origDpf: 2.0, newDpf: 1.5,
    trial: 'CHARTWEL (Dische 1997, Radiother Oncol)',
  },
  {
    label: 'Lung SBRT',
    from: '60 Gy/30fx (2 Gy)',
    to: '54 Gy/3fx (18 Gy)',
    ab: 10,
    origDose: 60, origDpf: 2.0, newDpf: 18.0,
    trial: 'RTOG 0236 (Timmerman 2010, JAMA)',
  },
  {
    label: 'Palliative Bone',
    from: '30 Gy/10fx (3 Gy)',
    to: '8 Gy/1fx',
    ab: 10,
    origDose: 30, origDpf: 3.0, newDpf: 8.0,
    trial: 'NCIC CTG MA.32 / RTOG 9714',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const calcBED  = (d: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? d * (1 + dpf / ab) : 0;
const calcEQD2 = (d: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? d * (dpf + ab) / (2 + ab) : 0;

// ── Rounding correction ───────────────────────────────────────────────────
function roundedFxCorrection(bed: number, newDpf: number, ab: number) {
  if (ab === 0 || newDpf === 0) return null;
  const exactFx    = bed / (newDpf * (1 + newDpf / ab));
  const roundedUp  = Math.ceil(exactFx);
  const roundedDn  = Math.floor(exactFx);
  // Recalculate dpf to maintain BED with rounded fractions
  // BED = n * d * (1 + d/ab)  → quadratic in d: β·d² + α·d - BED/n = 0
  // d = [-ab + sqrt(ab² + 4·ab·BED/n)] / 2
  const solveD = (n: number) => {
    const disc = ab * ab + 4 * ab * (bed / n);
    return disc >= 0 ? (-ab + Math.sqrt(disc)) / 2 : 0;
  };
  const dpfRoundUp = solveD(roundedUp);
  const dpfRoundDn = solveD(roundedDn);
  return {
    exactFx: exactFx.toFixed(2),
    roundedUp,
    roundedDn,
    dpfRoundUp: dpfRoundUp.toFixed(3),
    dpfRoundDn: dpfRoundDn.toFixed(3),
    totalUp: (roundedUp * dpfRoundUp).toFixed(1),
    totalDn: (roundedDn * dpfRoundDn).toFixed(1),
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
  const setSelectedTumour = (entry: RadiobiologyData | null) => setTumourSite(entry?.site ?? '', entry?.subsite ?? '', entry);
  const [showFormula, setShowFormula] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
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

  // Numeric values
  const nAb       = parseFloat(ab)       || 0;
  const nOarAb    = parseFloat(oarAb)    || 3;
  const nOrigDose = parseFloat(origDose) || 0;
  const nOrigDpf  = parseFloat(origDpf)  || 0;
  const nNewDpf   = parseFloat(newDpf)   || 0;
  const origFx    = nOrigDpf > 0 ? Math.round(nOrigDose / nOrigDpf) : 0;

  // Core calculations
  const baseBED   = React.useMemo(() => calcBED(nOrigDose, nOrigDpf, nAb), [nOrigDose, nOrigDpf, nAb]);
  const baseEQD2  = React.useMemo(() => calcEQD2(nOrigDose, nOrigDpf, nAb), [nOrigDose, nOrigDpf, nAb]);
  const newTotal  = React.useMemo(() =>
    nAb > 0 && nNewDpf > 0 ? baseBED / (1 + nNewDpf / nAb) : 0,
  [baseBED, nNewDpf, nAb]);
  const newFx     = React.useMemo(() =>
    nNewDpf > 0 ? newTotal / nNewDpf : 0,
  [newTotal, nNewDpf]);

  const oarResults = React.useMemo(() => {
    if (nOarAb <= 0 || nOrigDose <= 0 || nOrigDpf <= 0 || newTotal <= 0) return null;
    const oarBedOrig = nOrigDose * (1 + nOrigDpf / nOarAb);
    const oarBedNew = newTotal * (1 + nNewDpf / nOarAb);
    const oarBedDelta = oarBedNew - oarBedOrig;
    const oarBedPct = (oarBedDelta / oarBedOrig) * 100;
    return { oarBedOrig, oarBedNew, oarBedDelta, oarBedPct };
  }, [nOarAb, nOrigDose, nOrigDpf, newTotal, nNewDpf]);

  const rounding  = React.useMemo(() =>
    baseBED > 0 ? roundedFxCorrection(baseBED, nNewDpf, nAb) : null,
  [baseBED, nNewDpf, nAb]);

  // Comparison: new vs original
  const doseChange   = newTotal - nOrigDose;
  const fxChange     = newFx - origFx;
  const isHypo       = nNewDpf > nOrigDpf;

  // Sensitivity: sweep new d/fx from 1.5 to 20 Gy
  const sweepRows = React.useMemo(() => {
    if (baseBED === 0 || nAb === 0) return [];
    return [1.5, 1.8, 2.0, 2.4, 2.67, 3.0, 4.0, 5.0, 6.0, 7.5, 8.5, 10.0, 12.5, 15.0, 18.0, 20.0].map(d => {
      const newD = baseBED / (1 + d / nAb);
      const fx   = d > 0 ? newD / d : 0;
      return { d, newD, fx, isCur: Math.abs(d - nNewDpf) < 0.01 };
    });
  }, [baseBED, nAb, nNewDpf]);

  // Chart data
  const chartData = React.useMemo(() => {
    if (baseBED === 0 || nAb === 0) return [];
    const points = [];
    for (let d = 1; d <= 20; d += 0.5) {
      points.push({ d, D: baseBED / (1 + d / nAb) });
    }
    return points;
  }, [baseBED, nAb]);

  const valid = nAb > 0 && nOrigDose > 0 && nOrigDpf > 0 && nNewDpf > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* ── Header ───────────────────────────────────────────────────── */}
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

      {/* ── Formula ──────────────────────────────────────────────────── */}
      {showFormula && (
        <div className="bg-slate-900 rounded-lg px-3 py-2.5 font-mono text-[11px] text-slate-200 space-y-1">
          <p className="text-[9px] text-slate-500 font-sans font-black uppercase tracking-widest mb-1">Iso-BED Formula</p>
          <p><span className="text-blue-300">BED_orig</span> = D × (1 + d_orig / α/β)</p>
          <p><span className="text-emerald-300">D_new</span> = BED_orig / (1 + d_new / α/β)</p>
          <p><span className="text-amber-300">n_new</span> = D_new / d_new</p>
          <p className="text-slate-500 text-[9px] mt-1">
            Fractions must be rounded to integer — then recalculate d_new to maintain exact BED.
          </p>
        </div>
      )}

      {/* ── Inputs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Schedule</p>
        </div>
        <div className="px-3 py-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Total Dose (Gy)</label>
            <input type="number" step="0.5" value={origDose}
              onChange={e => setOrigDose(e.target.value)} className="input-clinical num" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dose/Fx (Gy)</label>
            <input type="number" step="0.1" value={origDpf}
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

      {/* α/β + new d/fx */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Schedule Parameters</p>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">New Dose/Fx (Gy)</label>
              <input type="number" step="0.1" value={newDpf}
                onChange={e => setNewDpf(e.target.value)} className="input-clinical num" />
            </div>
          </div>
          
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
            
            {/* Fallback if no tumour selected */}
            {!selectedTumour && (
              <div className="mt-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or manually set α/β Ratio (Gy)
                </label>
                <input type="number" step="0.5" value={ab}
                  onChange={e => {
                    setAb(e.target.value);
                    setSelectedTumour(null);
                  }} className="input-clinical num" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">OAR α/β (Gy)</label>
            <input type="number" step="0.5" value={oarAb}
              onChange={e => setOarAb(e.target.value)} className="input-clinical num" />
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
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
              <p className="text-[9px] text-blue-200/50">
                <span className={`text-[10px] font-bold ${fxChange <= 0 ? 'text-green-300' : 'text-blue-200'}`}>
                  (exact — round below)
                </span>
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-blue-200/60">BED preserved</p>
              <p className="text-2xl font-black num text-emerald-300">{baseBED.toFixed(1)}</p>
              <p className="text-[9px] text-blue-200/50">Gy{nAb}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── OAR Result ────────────────────────────────────────────────── */}
      {valid && oarResults && (
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              OAR BED (α/β={nOarAb})
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
            <div className="text-center">
              <ChevronRight className="w-4 h-4 text-slate-300 mb-1" />
            </div>
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
          {oarResults.oarBedPct > 10 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <p className="text-[10px] text-red-800 font-medium">
                Late-tissue BED increased by {oarResults.oarBedPct.toFixed(1)}% — verify OAR constraints before prescribing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Rounding correction ───────────────────────────────────────── */}
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
              </div>
              <div className="bg-slate-50 rounded px-3 py-2 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Round DOWN → {rounding.roundedDn} fx</p>
                <p className="num">d/fx = <span className="font-bold text-blue-800">{rounding.dpfRoundDn} Gy</span></p>
                <p className="num text-slate-500">Total = {rounding.totalDn} Gy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sweep table ───────────────────────────────────────────────── */}
      {valid && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
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
                  <th className="px-3 py-2 text-left">Typical use</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Clinical schedule examples ────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Evidence-Based Schedule Conversions (click to load)
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {SCHEDULE_EXAMPLES.map((ex, i) => {
            const bed = calcBED(ex.origDose, ex.origDpf, ex.ab);
            const converted = bed / (1 + ex.newDpf / ex.ab);
            const convFx = converted / ex.newDpf;
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
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {ex.from} → {ex.to}
                    </p>
                    <p className="text-[10px] text-slate-400 italic">{ex.trial}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-blue-700 num font-bold">
                      α/β={ex.ab} · BED={bed.toFixed(0)} Gy
                    </p>
                    <p className="text-[10px] text-slate-400 num">
                      Calc: {converted.toFixed(1)} Gy / {convFx.toFixed(1)} fx
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Clinical notes ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Principles</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { title: 'BED is not EQD2',           body: 'BED includes the extra log-kill term. EQD2 normalises to 2 Gy/fx for clinical comparison. They are related but not identical. Always specify which metric and which α/β.' },
            { title: 'α/β uncertainty',           body: 'Breast α/β=4 (START) and prostate α/β=1.5 (CHHiP) are trial-derived values with confidence intervals. The exact value influences the output significantly — test sensitivity.' },
            { title: 'Inter-fraction interval',   body: 'BID schedules require ≥6h between fractions to allow sublethal damage repair. This is mandatory for accelerated fractionation — not optional.' },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5">
              <p className="text-[11px] font-bold text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reference ────────────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-400 px-1">
        Ref: Fowler JF. Br J Radiol 1989. Dearnaley D et al. Lancet Oncol 2016 (CHHiP).
        Murray Brunt A et al. Lancet 2020 (FAST-Forward). Bentzen SM et al. Lancet 2008 (START-B).
      </p>
    </div>
  );
};

export default FracAdjustPage;