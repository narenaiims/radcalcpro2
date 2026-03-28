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
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData } from '../src/data/radiobiologyData';

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
  const [tab,      setTab]      = useState<'calc'|'scenarios'|'guidance'>('calc');

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

        {/* OAR note */}
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-800 leading-relaxed">
          {oar.notes}
          <span className="block text-[11px] text-amber-600 mt-0.5 italic">
            {oar.references.join(' · ')}
          </span>
        </div>
      </div>

      {/* ── Custom α/β & limit if custom OAR ─────────────────────────── */}
      {oarId === 'custom' && (
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-3 flex gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">α/β (Gy)</label>
            <input type="number" step="0.5" value={customAb}
              onChange={e => setCustomAb(e.target.value)} className="input-clinical num w-20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">BED limit (Gy)</label>
            <input type="number" step="5" value={customLim}
              onChange={e => setCustomLim(e.target.value)} className="input-clinical num w-24" />
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200">
        {(['calc','scenarios','guidance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t === 'calc' ? 'Calculator' : t === 'scenarios' ? 'Sensitivity' : 'Clinical Guide'}
          </button>
        ))}
      </div>

      {/* ════ TAB: Calculator ════════════════════════════════════════ */}
      {tab === 'calc' && (
        <div className="space-y-3">

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
              <div className="flex items-center gap-3">
                <input type="number" step="1" value={months}
                  onChange={e => setMonths(e.target.value)} className="input-clinical num w-24" />
                <span className="text-xs text-slate-500">
                  Recovery applied: <span className="font-bold num text-blue-700">
                    {(calc.recFrac * 100).toFixed(0)}%
                  </span>
                  {' '}({oar.recoveryModel === 'none' ? 'No model' : oar.recoveryModel})
                </span>
              </div>
              {oar.recoveryModel !== 'none' && (
                <div className="mt-3">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[11px] text-slate-500 font-semibold">Recovery Model: Step Function</p>
                    <p className="text-[10px] text-slate-400">
                      Threshold: {oar.recoveryThresholdMonths}m · Target: {(Math.min(oar.maxRecovery, oar.recoveryFraction) * 100).toFixed(0)}%
                    </p>
                  </div>
                  
                  {/* Step Function Graph */}
                  <div className="relative h-[40px] w-full border-b border-l border-slate-300 ml-6 mb-4 mt-2" style={{ width: 'calc(100% - 24px)' }}>
                    {/* X-axis labels */}
                    <div className="absolute bottom-[-16px] left-0 text-[9px] text-slate-400 transform -translate-x-1/2">0m</div>
                    <div className="absolute bottom-[-16px] text-[9px] text-slate-400 font-bold" style={{ left: `${(oar.recoveryThresholdMonths / Math.max(12, mo + 2)) * 100}%`, transform: 'translateX(-50%)' }}>{oar.recoveryThresholdMonths}m</div>
                    <div className="absolute bottom-[-16px] right-0 text-[9px] text-slate-400 transform translate-x-1/2">{Math.max(12, mo + 2)}m</div>
                    
                    {/* Y-axis labels */}
                    <div className="absolute top-[-4px] left-[-24px] text-[9px] text-slate-400">{(Math.min(oar.maxRecovery, oar.recoveryFraction) * 100)}%</div>
                    <div className="absolute bottom-[-4px] left-[-16px] text-[9px] text-slate-400">0%</div>
                    
                    {/* The Step Line */}
                    <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                      <polyline 
                        points={`0,40 ${(oar.recoveryThresholdMonths / Math.max(12, mo + 2)) * 100},40 ${(oar.recoveryThresholdMonths / Math.max(12, mo + 2)) * 100},0 100,0`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      {/* Current position marker */}
                      <circle 
                        cx={`${(mo / Math.max(12, mo + 2)) * 100}`} 
                        cy={mo >= oar.recoveryThresholdMonths ? 0 : 40} 
                        r="4" 
                        fill={mo >= oar.recoveryThresholdMonths ? "#22c55e" : "#f59e0b"} 
                        stroke="#fff"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  {mo >= oar.recoveryThresholdMonths - 2 && mo < oar.recoveryThresholdMonths && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2">
                      <div className="mt-0.5 text-amber-500">⚠️</div>
                      <div>
                        <p className="text-xs font-bold text-amber-800">Partial Recovery Zone (No Credit Yet)</p>
                        <p className="text-[11px] text-amber-700 leading-tight mt-0.5">
                          Interval is {mo} months. Recovery credit ({(Math.min(oar.maxRecovery, oar.recoveryFraction) * 100).toFixed(0)}%) activates at {oar.recoveryThresholdMonths} months. 
                          Exact days remaining: <span className="font-bold">{Math.ceil((oar.recoveryThresholdMonths - mo) * 30.44)} days</span>.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-blue-600/70 italic mt-2">
                    Recovery is a step-function per {oar.recoveryModel === 'sahgal' ? 'Sahgal 2012' : 'Nieder 2013'}; 0% recovery is credited for intervals below the threshold.
                  </p>
                </div>
              )}
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
              <div className="col-span-2 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5 num">
                d/fx = {dpf2.toFixed(2)} Gy &nbsp;|&nbsp;
                BED{ab} = {calc.bed2.toFixed(1)} Gy &nbsp;|&nbsp;
                EQD2 = {calc.eqd2.toFixed(1)} Gy
              </div>
            </div>
          </div>

          {/* Results */}
          <div className={`rounded-lg border px-4 py-3 ${STATUS_STYLES[calc.status].bg}`}>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-70 mb-3">Cumulative Result</p>

            <div className="grid grid-cols-3 gap-3 text-center border-b border-current/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider opacity-60">{oar.recoveryModel === 'sahgal' ? 'EQD2_1 effective' : 'BED1 effective'}</p>
                <p className="text-lg font-black num">{oar.recoveryModel === 'sahgal' ? (calc.effectBed1 / (1 + 2 / ab)).toFixed(1) : calc.effectBed1.toFixed(1)}</p>
                <p className="text-[11px] opacity-50">{oar.recoveryModel === 'sahgal' ? `Gy EQD2` : `Gy${ab}`}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider opacity-60">{oar.recoveryModel === 'sahgal' ? 'EQD2_2' : 'BED2'}</p>
                <p className="text-lg font-black num">{oar.recoveryModel === 'sahgal' ? calc.eqd2.toFixed(1) : calc.bed2.toFixed(1)}</p>
                <p className="text-[11px] opacity-50">{oar.recoveryModel === 'sahgal' ? `Gy EQD2` : `Gy${ab}`}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider opacity-60">{oar.recoveryModel === 'sahgal' ? 'Cumulative EQD2' : 'Cumulative BED'}</p>
                <p className="text-2xl font-black num">{oar.recoveryModel === 'sahgal' ? calc.cumEQD2.toFixed(1) : calc.cumBED.toFixed(1)}</p>
                <p className="text-[11px] opacity-50">{oar.recoveryModel === 'sahgal' ? `Gy EQD2` : `Gy${ab}`}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className={STATUS_STYLES[calc.status].badge}>
                  {calc.status === 'pass' ? 'Within limit' : calc.status === 'warn' ? 'Near limit' : 'EXCEEDS LIMIT'}
                </span>
                <p className="text-[11px] mt-1 opacity-70">
                  {oar.recoveryModel === 'sahgal' ? (
                    <>
                      Limit: {oar.eqd2Limit} Gy EQD2 &nbsp;·&nbsp;
                      {calc.status !== 'fail'
                        ? `Headroom: ${(oar.eqd2Limit - calc.cumEQD2).toFixed(1)} Gy`
                        : `Exceeded by ${(calc.cumEQD2 - oar.eqd2Limit).toFixed(1)} Gy`}
                    </>
                  ) : (
                    <>
                      Limit: {bedLimit} Gy{ab} &nbsp;·&nbsp;
                      {calc.status !== 'fail'
                        ? `Headroom: ${calc.headroom.toFixed(1)} Gy`
                        : `Exceeded by ${(calc.cumBED - bedLimit).toFixed(1)} Gy`}
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] opacity-60 uppercase tracking-wider">Max safe re-RT</p>
                <p className="text-base font-black num">{Math.max(0, calc.maxSafeTotal).toFixed(1)} Gy</p>
                <p className="text-[11px] opacity-50">at {dpf2.toFixed(1)} Gy/fx</p>
              </div>
            </div>

            {/* BED bar */}
            <div className="mt-3 h-2 bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  calc.status === 'pass' ? 'bg-green-600' :
                  calc.status === 'warn' ? 'bg-amber-500' : 'bg-red-600'}`}
                style={{ width: `${Math.min(100, (calc.cumBED / bedLimit) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] opacity-50 mt-0.5">
              <span>0</span>
              <span>{oar.recoveryModel === 'sahgal' ? `${oar.eqd2Limit} Gy EQD2 (limit)` : `${bedLimit} Gy (limit)`}</span>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB: Sensitivity ══════════════════════════════════════ */}
      {tab === 'scenarios' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Re-RT dose sensitivity at {dpf2.toFixed(1)} Gy/fx ({f2} fx).
            Recovery = {(calc.recFrac * 100).toFixed(0)}% applied to Course 1.
          </p>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="scroll-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="px-3 py-2 text-left">Re-RT dose</th>
                    <th className="px-3 py-2 text-right">d/fx</th>
                    <th className="px-3 py-2 text-right">{oar.recoveryModel === 'sahgal' ? 'EQD2_2' : 'BED2'}</th>
                    <th className="px-3 py-2 text-right">{oar.recoveryModel === 'sahgal' ? 'Cum EQD2' : 'Cum BED'}</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sensitivityRows.map(r => (
                    <tr key={r.dose}
                      className={r.isCur ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700'}>
                      <td className="px-3 py-2 num">{r.dose} Gy{r.isCur && ' ←'}</td>
                      <td className="px-3 py-2 text-right num">{dpf2.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right num">{oar.recoveryModel === 'sahgal' ? (r.b2 / (1 + 2 / ab)).toFixed(1) : r.b2.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right num">{oar.recoveryModel === 'sahgal' ? (r.cum / (1 + 2 / ab)).toFixed(1) : r.cum.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        <span className={`result-badge ${r.status}`}>
                          {r.status === 'pass' ? 'OK' : r.status === 'warn' ? 'Near' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recovery model table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recovery vs Time Interval</p>
            </div>
            <div className="scroll-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="px-3 py-2 text-left">Interval</th>
                    <th className="px-3 py-2 text-right">Recovery</th>
                    <th className="px-3 py-2 text-right">{oar.recoveryModel === 'sahgal' ? 'Eff. EQD2_1' : 'Eff. BED1'}</th>
                    <th className="px-3 py-2 text-right">Headroom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[3,5,6,12,18,24,36].map(m => {
                    const rec  = getRecoveryFraction(oar, m);
                    const eBed = calc.bed1 * (1 - rec);
                    const room = Math.max(0, bedLimit - eBed - calc.bed2);
                    const isCur = m === mo;
                    return (
                      <tr key={m} className={isCur ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700'}>
                        <td className="px-3 py-2">{m} months{isCur && ' ←'}</td>
                        <td className="px-3 py-2 text-right num">{(rec * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2 text-right num">{oar.recoveryModel === 'sahgal' ? (eBed / (1 + 2 / ab)).toFixed(1) : eBed.toFixed(1)} Gy</td>
                        <td className={`px-3 py-2 text-right num ${room > 10 ? 'text-green-700' : room > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                          {room > 0 ? `+${oar.recoveryModel === 'sahgal' ? (room / (1 + 2 / ab)).toFixed(1) : room.toFixed(1)} Gy` : `${oar.recoveryModel === 'sahgal' ? (room / (1 + 2 / ab)).toFixed(1) : room.toFixed(1)} Gy`}
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

          {/* General principles */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">General Re-irradiation Principles</p>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { title: 'Contour prior RT volumes', body: 'Import prior RT plan or contour prior RT field on current CT. Calculate cumulative DVH for all critical OARs. Physics peer review is mandatory.' },
                { title: 'Recovery is tissue-specific', body: 'Spinal cord: 25% recovery after 6 months (Nieder). Brain: unclear recovery. Liver, kidney, lung: some recovery over 12–24 months. No validated model for most organs.' },
                { title: 'BED additivity assumptions', body: 'BED is strictly additive only if fractions are separated by ≥6h (sublethal damage repair). Between-course recovery modifies effective BED₁, not BED₂.' },
                { title: 'Clinical decision factors', body: 'Performance status, prior toxicity, new tumour volume, overlap of PTV with prior fields, intent (curative vs palliative), and patient wishes all factor into re-RT candidacy.' },
                { title: 'Documentation requirement', body: 'All re-irradiation cases require documented rationale, cumulative dose calculations, MDT discussion, and enhanced patient consent covering cumulative toxicity risks.' },
              ].map((item, i) => (
                <div key={i} className="px-3 py-2.5">
                  <p className="text-[11px] font-bold text-slate-800 mb-0.5">{item.title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OAR recovery summary */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">OAR Recovery Summary</p>
            </div>
            <div className="scroll-x">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="px-3 py-2 text-left">OAR</th>
                    <th className="px-3 py-2 text-center">α/β</th>
                    <th className="px-3 py-2 text-center">BED limit</th>
                    <th className="px-3 py-2 text-center">Recovery</th>
                    <th className="px-3 py-2 text-left">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {OAR_MODELS.filter(o => o.id !== 'custom').map(o => (
                    <tr key={o.id} className="text-slate-700 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{o.name}</td>
                      <td className="px-3 py-2 text-center num">{o.ab}</td>
                      <td className="px-3 py-2 text-center num">{o.bedLimit} Gy</td>
                      <td className="px-3 py-2 text-center">
                        {o.recoveryModel === 'none'
                          ? <span className="text-slate-400">None</span>
                          : <span className="text-green-700 font-bold">{(o.recoveryFraction * 100).toFixed(0)}% after {o.recoveryThresholdMonths}m</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[10px] italic">{o.recoveryModel === 'none' ? '—' : o.recoveryModel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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