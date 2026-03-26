import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, GraduationCap, Calculator, Activity, AlertTriangle, Printer } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { RadiobiologyData } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { AnimatedNumber } from "@/src/components/AnimatedNumber";
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from '@/src/components/PrintReport';
import { useRxContext } from '@/src/context/RadiobiologyContext';

const STORAGE_KEY = 'radonco_eqd2_state_v2';

// ── Sidebar Data ─────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'Common α/β Ratios',
    emoji: '🧬',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.4)',
    rows: [
      { k: 'Prostate', v: '1.5 Gy', mono: true },
      { k: 'CNS / Brain', v: '2.0 Gy', mono: true },
      { k: 'Late Tissue', v: '3.0 Gy', mono: true },
      { k: 'Breast', v: '4.0 Gy', mono: true },
      { k: 'Tumour / Early', v: '10.0 Gy', mono: true },
    ]
  },
  {
    title: 'Key Formulas',
    emoji: '📐',
    accent: '#38bdf8',
    bg: 'rgba(56,189,232,0.08)',
    border: 'rgba(56,189,232,0.4)',
    rows: [
      { k: 'BED', v: 'D × (1 + d / α/β)', mono: true },
      { k: 'EQD2', v: 'BED / (1 + 2 / α/β)', mono: true },
      { k: 'n (fractions)', v: 'D / d', mono: true },
    ]
  },
  {
    title: 'Clinical Thresholds',
    emoji: '🎯',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.4)',
    rows: [
      { k: 'Cervix (Radical)', v: '≥85 Gy EQD2₁₀', mono: false },
      { k: 'Prostate (Radical)', v: '≥74 Gy EQD2₁.₅', mono: false },
      { k: 'Spinal Cord (Max)', v: '≤50 Gy EQD2₂', mono: false },
    ]
  }
];

// ── LQ formula text ───────────────────────────────────────────────────────
const FormulaBlock: React.FC<{ ab: number }> = ({ ab }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-300 space-y-1.5 leading-relaxed">
    <div className="flex items-center gap-2 mb-2">
      <Calculator className="w-3.5 h-3.5 text-cyan-400" />
      <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-slate-400">LQ Model</p>
    </div>
    <p><span className="text-blue-400">BED</span> = D · (1 + d / α/β)</p>
    <p className="text-slate-500 pl-2 text-[10px]">where D = total dose, d = dose/fraction</p>
    <p><span className="text-emerald-400">EQD2</span> = BED / (1 + 2 / α/β)</p>
    <p className="text-slate-500 pl-2 text-[10px]">≡ n·d normalised to 2 Gy/fx</p>
    <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center gap-2">
      <span className="text-amber-400 font-bold">α/β = {ab} Gy</span>
      <span className="text-slate-600 text-[10px]">(Current setting)</span>
    </div>
  </div>
);

// ── Clinical interpretation ───────────────────────────────────────────────
function interpretEQD2(eqd2: number, ab: number): { text: string; level: 'pass' | 'warn' | 'fail' | 'info' } {
  if (ab >= 8) {
    // Tumour tissue
    if (eqd2 < 40)  return { text: 'Sub-therapeutic for most solid tumours', level: 'fail' };
    if (eqd2 < 60)  return { text: 'Palliative range — adequate for symptom control', level: 'warn' };
    if (eqd2 < 74)  return { text: 'Standard radical range (head & neck, lung)', level: 'pass' };
    if (eqd2 < 90)  return { text: 'High-dose radical — prostate / cervix boost range', level: 'pass' };
    return           { text: 'Escalated — SBRT/SRS or brachytherapy boost territory', level: 'info' };
  } else if (ab <= 2) {
    // CNS / prostate
    if (eqd2 < 60)  return { text: 'Below curative threshold for prostate cancer', level: 'fail' };
    if (eqd2 < 76)  return { text: 'Conventional-equivalent prostate dose', level: 'pass' };
    if (eqd2 < 90)  return { text: 'Dose-escalated prostate (≥76 Gy EQD2)', level: 'pass' };
    return           { text: 'High EQD2 — verify OAR constraints carefully', level: 'warn' };
  } else {
    // Late tissue (ab 3–4)
    if (eqd2 > 72)  return { text: 'Exceeds typical spinal cord tolerance (EQD2 > 50 Gy α/β3)', level: 'fail' };
    if (eqd2 > 50)  return { text: 'Late-tissue threshold range — check OAR constraints', level: 'warn' };
    return           { text: 'Within typical late-tissue tolerance', level: 'pass' };
  }
}

const LEVEL_STYLES = {
  pass: 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
  warn: 'bg-amber-900/30 text-amber-300 border-amber-800',
  fail: 'bg-red-900/30 text-red-300 border-red-800',
  info: 'bg-blue-900/30 text-blue-300 border-blue-800',
};

// ── Main page ─────────────────────────────────────────────────────────────
const EQD2Page: React.FC = () => {
  const [dosePerFx,  setDosePerFx]  = React.useState('2.0');
  const [fractions,  setFractions]  = React.useState('25');
  const [alphaBeta,  setAlphaBeta]  = React.useState('10');
  const { rx, logCalculation, setTumourSite } = useRxContext();
  const selectedTumour = rx.selectedTumour;
  const setSelectedTumour = (entry: RadiobiologyData | null) => setTumourSite(entry?.site ?? '', entry?.subsite ?? '', entry);
  const [aiText,     setAiText]     = React.useState('');
  const [aiLoading,  setAiLoading]  = React.useState(false);
  const [showFormula, setShowFormula] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // ── Persistence ───────────────────────────────────────────────────────
  React.useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.dosePerFx) setDosePerFx(String(p.dosePerFx));
        if (p.fractions)  setFractions(String(p.fractions));
        if (p.alphaBeta)  setAlphaBeta(String(p.alphaBeta));
      }
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dosePerFx, fractions, alphaBeta }));
  }, [dosePerFx, fractions, alphaBeta]);

  // ── Core calculations ────────────────────────────────────────────────
  const dpf = React.useMemo(() => parseFloat(dosePerFx) || 0, [dosePerFx]);
  const n   = React.useMemo(() => parseFloat(fractions)  || 0, [fractions]);
  const ab  = React.useMemo(() => parseFloat(alphaBeta)  || 0, [alphaBeta]);

  const totalDose = React.useMemo(() => dpf * n,                                       [dpf, n]);
  const bed       = React.useMemo(() => ab > 0 ? totalDose * (1 + dpf / ab) : 0,      [totalDose, dpf, ab]);
  const eqd2      = React.useMemo(() => ab > 0 ? bed / (1 + 2 / ab) : 0,              [bed, ab]);

  const interp    = React.useMemo(() => ab > 0 && eqd2 > 0 ? interpretEQD2(eqd2, ab) : null, [eqd2, ab]);

  // ── Sensitivity table (±0.2 Gy/fx steps) ────────────────────────────
  const sensitivityRows = React.useMemo(() => {
    if (ab === 0 || dpf === 0) return [];
    return [-0.4, -0.2, 0, 0.2, 0.4].map(delta => {
      const d = parseFloat((dpf + delta).toFixed(2));
      if (d <= 0) return null;
      const td = d * n;
      const b  = td * (1 + d / ab);
      const e  = b / (1 + 2 / ab);
      return { d, td, b, e, isBase: delta === 0 };
    }).filter(Boolean);
  }, [dpf, n, ab]);

  // ── α/β comparison table ─────────────────────────────────────────────
  const abCompRows = React.useMemo(() => {
    if (dpf === 0 || n === 0) return [];
    return [1.5, 2, 3, 4, 10, 15].map(a => {
      const b = totalDose * (1 + dpf / a);
      const e = b / (1 + 2 / a);
      return { a, b, e, isCurrent: Math.abs(a - ab) < 0.01 };
    });
  }, [dpf, n, ab, totalDose]);

  // ── AI explanation ───────────────────────────────────────────────────
  const fetchAI = async () => {
    if (aiLoading || ab === 0) return;
    
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setAiText('AI explanation requires API key configuration');
      return;
    }

    setAiLoading(true);
    setAiText('');
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '' });
      const prompt = `You are a radiation oncology educator. Explain the radiobiological significance of the following fractionation schedule concisely for a postgraduate trainee:
 
Schedule: ${n} fractions × ${dpf} Gy = ${totalDose.toFixed(1)} Gy total
α/β ratio: ${ab} Gy
BED${ab}: ${bed.toFixed(2)} Gy
EQD2${ab}: ${eqd2.toFixed(2)} Gy
 
Cover: (1) what tissue this α/β represents, (2) clinical context where this schedule is used, (3) key OAR consideration if relevant, (4) comparison with standard 2 Gy/fx fractionation. Be concise — 4–6 sentences max. No markdown headers.`;
 
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiText(resp.text ?? 'No response returned.');
      logCalculation(
        'EQD2 Calculator',
        `BED ${bed.toFixed(1)} Gy, EQD2 ${eqd2.toFixed(1)} Gy`,
        { dosePerFx: dpf, fractions: n, alphaBeta: ab, totalDose, bed, eqd2 }
      );
    } catch {
      setAiText('AI insight unavailable. Check API key or network.');
    } finally {
      setAiLoading(false);
    }
  };

  const valid = dpf > 0 && n > 0 && ab > 0;

  return (
    <div className="space-y-8 animate-slam">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
      >
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "The LQ model is the standard for iso-effect calculations, but caution is advised for doses {'>'}8-10 Gy per fraction where the model may over-predict cell kill."
          </p>
        </div>
      </KeyFactsSidebar>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal" />
            <p className="label-micro text-teal">Radiobiology Solver</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">BED & EQD2</h1>
          <p className="text-sm text-slate-500 font-serif italic">Linear-Quadratic model normalization · ICRU 83</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormula(f => !f)}
            className="btn-premium btn-outline py-2"
          >
            {showFormula ? 'Hide Formula' : 'View Formula'}
          </button>
          <button
            onClick={() => reactToPrintFn()}
            className="btn-premium btn-primary py-2 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {showFormula && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FormulaBlock ab={ab} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Inputs (Left) ────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Prescription Parameters</h2>
            <div className="card-premium p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-micro">Dose / Fx (Gy)</label>
                  <input
                    type="number" step="0.01" min="0.1" max="30"
                    value={dosePerFx}
                    onChange={e => setDosePerFx(e.target.value)}
                    className="input-premium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Fractions</label>
                  <input
                    type="number" step="1" min="1" max="100"
                    value={fractions}
                    onChange={e => setFractions(e.target.value)}
                    className="input-premium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-micro">Tumour Site & α/β</label>
                <TumourSelector
                  selectedEntry={selectedTumour}
                  onSelect={(entry) => {
                    setSelectedTumour(entry);
                    setAlphaBeta(entry.ab.toString());
                  }}
                  onClear={() => setSelectedTumour(null)}
                />
              </div>

              {!selectedTumour && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="label-micro">Manual α/β Ratio (Gy)</label>
                  <input
                    type="number" step="0.1" min="0.5" max="20"
                    value={alphaBeta}
                    onChange={e => {
                      setAlphaBeta(e.target.value);
                      setSelectedTumour(null);
                    }}
                    className="input-premium"
                  />
                </div>
              )}
            </div>
          </section>

          {/* α/β comparison */}
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">α/β Comparison</h2>
            <div className="card-premium overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 label-micro">α/β</th>
                    <th className="px-4 py-3 text-right label-micro">EQD2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {abCompRows.map(r => (
                    <tr key={r.a} className={r.isCurrent ? 'bg-teal/5' : ''}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-white">{r.a} Gy</p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {r.a === 1.5 ? 'Prostate' : r.a === 3 ? 'Late' : r.a === 10 ? 'Tumour' : 'Other'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={`text-sm font-mono font-bold ${r.isCurrent ? 'text-teal' : 'text-slate-400'}`}>
                          {r.e.toFixed(1)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Results (Right) ───────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          {valid ? (
            <>
              <section className="space-y-4">
                <h2 className="label-micro opacity-40">Calculated Iso-effects</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                    <p className="label-micro opacity-40 mb-2">Total Dose</p>
                    <p className="text-4xl font-black text-white font-mono leading-none">
                      <AnimatedNumber value={totalDose} />
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Gy (Physical)</p>
                  </div>
                  <div className="card-premium p-6 bg-teal/5 border-teal/20 flex flex-col items-center text-center">
                    <p className="label-micro text-teal/70 mb-2">BED<sub>{ab}</sub></p>
                    <p className="text-5xl font-black text-white font-mono leading-none">
                      <AnimatedNumber value={bed} />
                    </p>
                    <p className="text-xs text-teal/50 mt-2">Gy (Biological)</p>
                  </div>
                  <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                    <p className="label-micro opacity-40 mb-2">EQD2<sub>{ab}</sub></p>
                    <p className="text-4xl font-black text-white font-mono leading-none">
                      <AnimatedNumber value={eqd2} />
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Gy (Normalized)</p>
                  </div>
                </div>

                {interp && (
                  <div className={`card-premium p-4 flex items-start gap-3 border-l-4 ${
                    interp.level === 'pass' ? 'border-l-emerald-500 bg-emerald-500/5' :
                    interp.level === 'warn' ? 'border-l-amber-500 bg-amber-500/5' :
                    'border-l-red-500 bg-red-500/5'
                  }`}>
                    <div className="mt-0.5">
                      {interp.level === 'fail' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Activity className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <p className="label-micro opacity-60 mb-1">Clinical Interpretation</p>
                      <p className="text-sm font-bold text-white">{interp.text}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Sensitivity */}
              <section className="space-y-4">
                <h2 className="label-micro opacity-40">Dose/Fx Sensitivity (±0.4 Gy)</h2>
                <div className="card-premium overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 label-micro">Dose/Fx</th>
                        <th className="px-6 py-4 label-micro text-right">Total Dose</th>
                        <th className="px-6 py-4 label-micro text-right">BED</th>
                        <th className="px-6 py-4 label-micro text-right">EQD2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sensitivityRows.map((r: any) => (
                        <tr key={r.d} className={r.isBase ? 'bg-teal/5' : 'hover:bg-white/[0.01] transition-colors'}>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-mono font-bold ${r.isBase ? 'text-teal' : 'text-white'}`}>
                              {r.d.toFixed(2)} Gy
                            </span>
                            {r.isBase && <span className="ml-2 label-micro text-teal/50">(Base)</span>}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-slate-400">{r.td.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-slate-400">{r.b.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right text-sm font-mono font-bold text-white">{r.e.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* AI Insight */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="label-micro opacity-40">AI Clinical Insight</h2>
                  <button
                    onClick={fetchAI}
                    disabled={aiLoading}
                    className="btn-premium btn-primary py-1.5 px-4 text-[10px]"
                  >
                    {aiLoading ? 'Analyzing...' : 'Generate Analysis'}
                  </button>
                </div>
                <div className="card-premium p-6">
                  {aiText ? (
                    <p className="text-sm text-slate-300 leading-relaxed font-serif italic">{aiText}</p>
                  ) : (
                    <div className="text-center py-4">
                      <GraduationCap className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Generate a radiobiology explanation tailored to this schedule.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 card-premium border-dashed">
              <Calculator className="w-12 h-12 text-slate-800 mb-4" />
              <h3 className="text-xl font-bold text-slate-600">Awaiting Parameters</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Enter prescription details on the left to begin radiobiological analysis.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="pt-12 text-center">
        <p className="label-micro opacity-20 max-w-2xl mx-auto">
          Ref: Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy.
          Br J Radiol 1989. Hall & Giaccia, Radiobiology for the Radiologist, 8th ed.
        </p>
      </footer>

      <div className="hidden">
        <PrintReport
          ref={contentRef}
          title="BED & EQD2 Solver Report"
          parameters={[
            { label: 'Dose per Fraction', value: `${dosePerFx} Gy` },
            { label: 'Fractions', value: fractions },
            { label: 'α/β Ratio', value: ab.toString() },
          ]}
          results={[
            { label: 'Total Dose', value: totalDose.toFixed(1), unit: 'Gy' },
            { label: `BED (${ab})`, value: bed.toFixed(1), unit: 'Gy' },
            { label: `EQD2 (${ab})`, value: eqd2.toFixed(1), unit: 'Gy' },
          ]}
          clinicalInsight={aiText}
        />
      </div>
    </div>
  );
};

export default EQD2Page;
