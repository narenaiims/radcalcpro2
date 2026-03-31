/**
 * TDFPage.tsx — PRO LEVEL
 * Time-Dose-Fractionation (TDF) factor — historical radiobiology tool.
 *
 * Formula (Orton & Ellis 1973):
 *   TDF = n × d^1.538 × (T/n)^−0.169 × 10^−3
 *   where: n = fractions, d = dose/fx (Gy), T = overall time (days)
 *
 * TDF is a pre-LQ model. Valid range: 1.8–3.0 Gy/fx conventional fractionation.
 * NOT validated for SBRT (>5 Gy/fx) — use BED/EQD2 instead.
 *
 * Historical context:
 *   Ellis F. Clin Radiol 1969 (NSD — Normal Standard Dose, precursor to TDF)
 *   Orton CG, Ellis F. Br J Radiol 1973 (TDF tables)
 *   Kirk J et al. Br J Radiol 1971 (CRE — Cumulative Radiation Effect)
 *   Thames HD, Hendry JH. Fractionation in Radiotherapy. Taylor & Francis 1987.
 */
import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import TumourSelector from '../components/TumourSelector';
import { RadiobiologyData } from '../src/data/radiobiologyData';
import { useRxContext } from '../src/context/RadiobiologyContext';

import { NumberInput } from '../src/components/NumberInput';

// ── Constants & Presets ───────────────────────────────────────────────────────
const QUICK_REF_DATA = [
  {
    category: "Historical Models",
    items: [
      { label: "NSD (Ellis 1969)", value: "D × N^−0.24 × T^−0.11" },
      { label: "CRE (Kirk 1971)", value: "D × N^−0.25 × T^−0.11" },
      { label: "TDF (Orton 1973)", value: "n × d^1.538 × (T/n)^−0.169 × 10^−3" },
    ]
  },
  {
    category: "TDF Thresholds",
    items: [
      { label: "Palliative Range", value: "< 60" },
      { label: "OAR Tolerance Zone", value: "60 - 80" },
      { label: "Radical Range", value: "80 - 100" },
      { label: "High Risk (Necrosis)", value: "> 100" },
    ]
  },
  {
    category: "Limitations",
    items: [
      { label: "SBRT/Hypofractionation", value: "Not Validated (>5 Gy/fx)" },
      { label: "Tissue Specificity", value: "No α/β ratio" },
      { label: "Repair Kinetics", value: "No mechanistic basis" },
    ]
  }
];

// ── TDF formula (Orton-Ellis) ─────────────────────────────────────────────
const calcTDF = (n: number, d: number, T: number): number => {
  if (n <= 0 || d <= 0 || T <= 0) return 0;
  // Orton-Ellis formula requires dose per fraction in rads (cGy)
  const d_cGy = d * 100;
  return n * Math.pow(d_cGy, 1.538) * Math.pow(T / n, -0.169) * 0.001;
};

// ── BED helper for comparison ─────────────────────────────────────────────
const calcBED  = (D: number, d: number, ab: number) =>
  ab > 0 && d > 0 ? D * (1 + d / ab) : 0;
const calcEQD2 = (D: number, d: number, ab: number) =>
  ab > 0 && d > 0 ? D * (d + ab) / (2 + ab) : 0;

// ── Common schedule reference ─────────────────────────────────────────────
const REF_SCHEDULES = [
  { label: '30/10 (WBRT/bone)', n: 10, d: 3.0, T: 14 },
  { label: '40/20 (palliative)', n: 20, d: 2.0, T: 28 },
  { label: '45/25 (EBRT pelvic)', n: 25, d: 1.8, T: 35 },
  { label: '50/25 (standard)',   n: 25, d: 2.0, T: 35 },
  { label: '60/30 (radical)',    n: 30, d: 2.0, T: 42 },
  { label: '64/32 (H&N)',        n: 32, d: 2.0, T: 44 },
  { label: '66/33 (H&N)',        n: 33, d: 2.0, T: 46 },
  { label: '70/35 (H&N radical)',n: 35, d: 2.0, T: 49 },
  { label: '50.4/28 (GI)',       n: 28, d: 1.8, T: 38 },
  { label: '45/20 (breast hypo)',n: 20, d: 2.25,T: 28 },
];

// ── Viva questions ─────────────────────────────────────────────────────────
const VIVA_POINTS = [
  {
    q: 'What does TDF stand for and who introduced it?',
    a: 'Time-Dose-Fractionation. Introduced by Orton & Ellis (1973) as a simplification of Ellis\'s NSD (Normal Standard Dose) model (1969), which itself derived from Strandqvist\'s isoeffect curves (1944).',
  },
  {
    q: 'What is the TDF formula and what do the exponents mean?',
    a: 'TDF = n × d^1.538 × (T/n)^−0.169 × 10^−3. The exponent 1.538 reflects dose-per-fraction sensitivity (high-dose fx more effective per unit dose — repair/repopulation penalty). The exponent −0.169 reflects time dependency (longer treatment = lower effect per unit time due to repopulation).',
  },
  {
    q: 'How does TDF relate to NSD and CRE?',
    a: 'NSD (Ellis 1969): NSD = D × N^−0.24 × T^−0.11. TDF is a tabular reformulation of NSD. CRE (Kirk 1971) is a similar model using CRE = D × N^−0.25 × T^−0.11. All three are pre-LQ empirical models. TDF has largely been superseded by BED/EQD2.',
  },
  {
    q: 'What are the limitations of TDF compared to LQ model?',
    a: '(1) Not validated for SBRT/hypofractionation (>5 Gy/fx). (2) Does not account for α/β ratio — one model for all tissues. (3) No mechanistic basis for repair kinetics. (4) Time factor (T) is approximate. LQ is mechanistically grounded in DSB repair biology.',
  },
  {
    q: 'What TDF value corresponds to standard tolerance doses?',
    a: 'TDF ≈ 100 corresponds approximately to TD5/5 for several critical structures (Orton-Ellis, 1973). 60 Gy/30fx gives TDF ≈ 97–98. Spinal cord tolerance (45 Gy/25fx) gives TDF ≈ 70–72.',
  },
  {
    q: 'Why is TDF still tested in physics vivas?',
    a: 'TDF represents the historical development of fractionation theory — understanding it demonstrates knowledge of radiobiology evolution. It also illustrates dose-rate and time-factor effects which are still relevant in brachytherapy dose-rate considerations.',
  },
];

// ── Main component ────────────────────────────────────────────────────────
const TDFPage: React.FC = () => {
  const [dpf,      setDpf]      = useState('2.0');
  const [fx,       setFx]       = useState('30');
  const [days,     setDays]     = useState('42');
  const [alphaBeta, setAlphaBeta] = useState('10');
  const { rx, setTumourSite } = useRxContext();
  const selectedTumour = rx.selectedTumour;
  const setSelectedTumour = (entry: RadiobiologyData | null) => setTumourSite(entry?.site ?? '', entry?.subsite ?? '', entry);
  const [showViva, setShowViva] = useState(false);
  const [openViva, setOpenViva] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));


  const n = parseFloat(fx)   || 0;
  const d = parseFloat(dpf)  || 0;
  const T = parseFloat(days) || 0;
  const ab = selectedTumour?.ab ?? selectedTumour?.alphaBeta ?? 10;
  const D = n * d;

  const tdf  = useMemo(() => calcTDF(n, d, T), [n, d, T]);
  const bed  = useMemo(() => calcBED(D, d, ab), [D, d, ab]);
  const eqd2 = useMemo(() => calcEQD2(D, d, ab), [D, d, ab]);
  const bedLate = useMemo(() => calcBED(D, d, 3), [D, d]);

  // TDF interpretation
  const tdfInterp = tdf <= 0 ? null :
    tdf < 60  ? { text: 'Sub-tolerance (palliative range)', level: 'info'  } :
    tdf < 80  ? { text: 'Intermediate (OAR tolerance zone)', level: 'pass'  } :
    tdf < 100 ? { text: 'Approaching tissue tolerance (~TD5/5)', level: 'warn'  } :
    tdf < 110 ? { text: 'Near TD5/5 — monitor carefully', level: 'warn'  } :
                { text: 'Exceeds TD5/5 benchmark — high toxicity risk', level: 'fail'  };

  const INTERP_STYLES = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    pass: 'bg-green-50 border-green-200 text-green-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    fail: 'bg-red-50 border-red-200 text-red-800',
  };

  const valid = n > 0 && d > 0 && T > 0;
  const isHypo = d > 3.0;
  const isVeryHypo = d > 5.0;

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
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">TDF Factor Solver</h1>
          <p className="text-sm text-slate-500">Orton-Ellis 1973 · Historical fractionation model</p>
        </div>
        <button onClick={() => setShowViva(v => !v)}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
          {showViva ? 'Hide' : 'Viva'}
        </button>
      </div>

      {/* ── Validity warning ─────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <span className="font-bold">Validity range:</span> 1.8–3.0 Gy/fx (conventional fractionation).
        TDF is <span className="font-bold">NOT validated</span> for SBRT (&gt;5 Gy/fx) — use BED/EQD2 instead.
        Orton &amp; Ellis, Br J Radiol 1973.
      </div>

      {/* ── Formula display ──────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-200 space-y-1">
        <p className="text-[11px] text-slate-500 font-sans font-black uppercase tracking-widest mb-1">Orton-Ellis Formula</p>
        <p className="text-amber-300">TDF = n × d(cGy)<sup>1.538</sup> × (T/n)<sup>−0.169</sup> × 10<sup>−3</sup></p>
        <p className="text-slate-400 text-[10px]">= n × [d(Gy)×100]<sup>1.538</sup> × (T/n)<sup>−0.169</sup> × 10<sup>−3</sup></p>
        <p className="text-slate-500 text-[11px]">n = fractions · d = dose/fx · T = overall time (days)</p>
      </div>

      {/* ── Inputs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Schedule Parameters</p>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Dose/Fx (Gy)</label>
              <NumberInput  step="0.1" min="0.1" max="30"
                value={dpf} onChange={e => setDpf(e.target.value)}
                className={`input-clinical num ${isVeryHypo ? 'border-red-300' : isHypo ? 'border-amber-300' : ''}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fractions</label>
              <NumberInput  step="1" min="1"
                value={fx} onChange={e => setFx(e.target.value)}
                className="input-clinical num" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-500">Overall Time (d)</label>
                <button 
                  onClick={() => setDays(String(Math.ceil((n / 5) * 7)))}
                  className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
                >
                  Auto (5 fx/wk)
                </button>
              </div>
              <NumberInput  step="1" min="1"
                value={days} onChange={e => setDays(e.target.value)}
                className="input-clinical num" />
            </div>
          </div>

          {/* Tumour Selector for alpha/beta */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Tumour Site & α/β (for BED/EQD2 comparison)
            </label>
            <TumourSelector
              selectedEntry={selectedTumour}
              onSelect={(entry) => {
                setSelectedTumour(entry);
                setAlphaBeta(entry.ab.toString());
              }}
              onClear={() => setSelectedTumour(null)}
            />
            {!selectedTumour && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Or manually set α/β Ratio (Gy)
                </label>
                <NumberInput
                   step="0.1" min="0.5" max="20"
                  value={alphaBeta}
                  onChange={e => {
                    setAlphaBeta(e.target.value);
                    setSelectedTumour(null);
                  }}
                  className="input-clinical num"
                />
              </div>
            )}
          </div>
        </div>
        {isHypo && (
          <div className={`px-3 py-2 border-t text-xs font-medium ${isVeryHypo ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            {isVeryHypo
              ? '⚠ d/fx > 5 Gy: TDF not validated. Use BED/EQD2 pages instead.'
              : '⚠ d/fx > 3 Gy: At the limit of TDF validity range.'}
          </div>
        )}
        {T < n && T > 0 && (
          <div className="px-3 py-2 border-t text-xs font-medium bg-red-50 border-red-200 text-red-700">
            ⚠ T &lt; n: overall time shorter than fraction count implies &gt;1 fraction/day. TDF is not validated for BID or accelerated schedules — use BED/EQD2 instead.
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
      {valid && (
        <>
          <div className="bg-[#1e3a5f] rounded-lg text-white px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-200/70 mb-3">Results</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              <div className="border-r border-blue-800/40">
                <p className="text-[11px] uppercase tracking-wider text-blue-200/60">TDF</p>
                <p className="text-3xl font-black num text-amber-300">{tdf.toFixed(2)}</p>
                <p className="text-[11px] text-blue-200/50">Orton-Ellis</p>
              </div>
              <div className="border-r border-blue-800/40">
                <p className="text-[11px] uppercase tracking-wider text-blue-200/60">Total Dose</p>
                <p className="text-xl font-black num">{D.toFixed(1)}</p>
                <p className="text-[11px] text-blue-200/50">Gy</p>
              </div>
              <div className="border-r border-blue-800/40">
                <p className="text-[11px] uppercase tracking-wider text-blue-200/60">BED<sub>{ab}</sub></p>
                <p className="text-xl font-black num text-emerald-300">{bed.toFixed(1)}</p>
                <p className="text-[11px] text-blue-200/50">Gy (LQ)</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-blue-200/60">EQD2<sub>{ab}</sub></p>
                <p className="text-xl font-black num text-blue-200">{eqd2.toFixed(1)}</p>
                <p className="text-[11px] text-blue-200/50">Gy (LQ)</p>
              </div>
            </div>
          </div>

          {/* TDF interpretation */}
          {tdfInterp && (
            <div className={`rounded-lg px-3 py-2 border text-xs font-medium ${INTERP_STYLES[tdfInterp.level as keyof typeof INTERP_STYLES]}`}>
              TDF = {tdf.toFixed(2)}: {tdfInterp.text}
            </div>
          )}

          {/* Late tissue BED */}
          <div className="bg-white rounded-lg border border-slate-200 px-3 py-2.5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">LQ Model Comparison</p>
            <div className="grid grid-cols-2 gap-x-6 text-xs">
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500">BED<sub>{ab}</sub> (tumour)</span>
                <span className="num font-bold text-slate-800">{bed.toFixed(2)} Gy</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500">EQD2<sub>{ab}</sub></span>
                <span className="num font-bold text-slate-800">{eqd2.toFixed(2)} Gy</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500">BED₃ (late)</span>
                <span className="num font-bold text-red-700">{bedLate.toFixed(2)} Gy</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 py-1">
                <span className="text-slate-500">EQD2₃</span>
                <span className="num font-bold text-red-700">{calcEQD2(D, d, 3).toFixed(2)} Gy</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              TDF does not differentiate α/β — LQ late-tissue BED₃ is more clinically relevant for OAR assessment.
            </p>
          </div>
        </>
      )}

      {/* ── Common schedules reference table ─────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Common Schedule TDF Reference (click to load)
          </p>
        </div>
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                <th className="px-3 py-2 text-left">Schedule</th>
                <th className="px-3 py-2 text-right">TDF</th>
                <th className="px-3 py-2 text-right">BED<sub>{ab}</sub></th>
                <th className="px-3 py-2 text-right">EQD2<sub>{ab}</sub></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {REF_SCHEDULES.map((s, i) => {
                const sTDF  = calcTDF(s.n, s.d, s.T);
                const sBED  = calcBED(s.n * s.d, s.d, ab);
                const sEQD2 = calcEQD2(s.n * s.d, s.d, ab);
                const isCur = Math.abs(s.d - d) < 0.01 && s.n === n;
                return (
                  <tr key={i}
                    onClick={() => { setDpf(String(s.d)); setFx(String(s.n)); setDays(String(s.T)); }}
                    className={`cursor-pointer ${isCur ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <td className="px-3 py-2">{s.label}{isCur && ' ←'}</td>
                    <td className={`px-3 py-2 text-right num font-bold ${sTDF > 100 ? 'text-red-600' : sTDF > 80 ? 'text-amber-700' : 'text-slate-700'}`}>
                      {sTDF.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right num">{sBED.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right num">{sEQD2.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Time sensitivity table ────────────────────────────────────── */}
      {valid && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Overall Time Sensitivity ({n} fx · {d} Gy/fx)
            </p>
          </div>
          <div className="scroll-x">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                  <th className="px-3 py-2 text-left">Time (days)</th>
                  <th className="px-3 py-2 text-right">TDF</th>
                  <th className="px-3 py-2 text-right">vs baseline</th>
                  <th className="px-3 py-2 text-left">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[Math.round(T * 0.7), Math.round(T * 0.85), T, Math.round(T * 1.15), Math.round(T * 1.3)].map(t => {
                  const tdfT = calcTDF(n, d, t);
                  const delta = tdfT - tdf;
                  const isCur = t === T;
                  return (
                    <tr key={t} className={isCur ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700'}>
                      <td className="px-3 py-2 num">{t}{isCur && ' ←'}</td>
                      <td className="px-3 py-2 text-right num">{tdfT.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right num ${delta < 0 ? 'text-green-700' : delta > 0 ? 'text-red-600' : ''}`}>
                        {isCur ? '—' : (delta >= 0 ? '+' : '') + delta.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {t < T ? 'Accelerated' : t > T ? 'Prolonged (gap/holiday)' : 'Planned'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historical context ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Historical Development</p>
        </div>
        <div className="divide-y divide-slate-50 text-xs">
          {[
            { year: '1944', event: 'Strandqvist', detail: 'Isoeffect curves from skin reactions — first graphical dose-fractionation model.' },
            { year: '1961', event: 'Cohen',       detail: 'Modified Strandqvist to separate tumour and normal tissue curves.' },
            { year: '1969', event: 'Ellis (NSD)', detail: 'Normal Standard Dose: NSD = D × N⁻⁰·²⁴ × T⁻⁰·¹¹. First algebraic model.' },
            { year: '1971', event: 'Kirk (CRE)',  detail: 'Cumulative Radiation Effect — similar to NSD with slightly different exponents.' },
            { year: '1973', event: 'Orton-Ellis (TDF)', detail: 'TDF tables — simplified NSD for clinical use. Still used in vivas.' },
            { year: '1976', event: 'Thames',      detail: 'α/β concept applied to fractionation — precursor to modern LQ.' },
            { year: '1982', event: 'LQ model',    detail: 'Fowler, Thames, Withers — LQ formalism adopted. BED/EQD2 supersede TDF.' },
          ].map(item => (
            <div key={item.year} className="flex gap-3 px-3 py-2">
              <span className="text-[11px] font-black text-blue-700 flex-shrink-0 w-8 num">{item.year}</span>
              <span className="font-bold text-slate-800 flex-shrink-0 w-20">{item.event}</span>
              <span className="text-slate-600 leading-relaxed">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Viva Q&A ─────────────────────────────────────────────────── */}
      {showViva && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Viva Questions — TDF &amp; Fractionation History
          </p>
          {VIVA_POINTS.map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenViva(openViva === i ? null : i)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <p className="text-[12px] font-semibold text-slate-800">{item.q}</p>
                <span className="text-slate-400 flex-shrink-0 text-lg">{openViva === i ? '−' : '+'}</span>
              </button>
              {openViva === i && (
                <div className="px-3 pb-3 pt-0 border-t border-slate-100">
                  <p className="text-[12px] text-slate-700 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Reference ────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 px-1">
        Ref: Orton CG, Ellis F. Br J Radiol 1973;46:529–537.
        Ellis F. Clin Radiol 1969;20:1–7.
        Thames HD, Hendry JH. Fractionation in Radiotherapy. Taylor &amp; Francis 1987.
        Fowler JF. Br J Radiol 1989.
      </p>
    </div>
  );
};

export default TDFPage;