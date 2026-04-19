import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData } from '@/src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { BookOpen, ChevronRight, GraduationCap, Printer, Zap, Share2, Activity, TrendingUp } from 'lucide-react';
import { AnimatedNumber } from "@/src/components/AnimatedNumber";
import { ExportButton, ClinicalReport } from '@/src/components/ClinicalPDFExport';
import { PDFReport } from '@/src/components/PDFReport';
import { generatePDFBlob, sharePDF } from '@/src/lib/pdfUtils';

import { NumberInput } from '../src/components/NumberInput';

const STORAGE_KEY = 'radonco_bed_eqd2_state_v2';

// ── Quick Reference Data ──────────────────────────────────────────────────
const QUICK_REF_DATA = {
  abRatios: [
    { label: 'Tumour (Early)', value: '10 Gy' },
    { label: 'Late Tissues', value: '3 Gy' },
    { label: 'Prostate', value: '1.5 Gy' },
    { label: 'Breast', value: '4 Gy' },
    { label: 'CNS / Cord', value: '2 Gy' },
  ],
  formulas: [
    { label: 'BED', value: 'D × (1 + d / α/β)' },
    { label: 'EQD2', value: 'BED / (1 + 2 / α/β)' },
    { label: 'TDF', value: 'n × d^1.538 × X^-0.169' },
  ],
  thresholds: [
    { label: 'Lung SBRT BED₁₀', value: '≥ 100 Gy' },
    { label: 'Cord EQD2₃', value: '< 50 Gy' },
    { label: 'Rectum EQD2₃', value: '< 75 Gy' },
  ]
};

// ── Common clinical BED/EQD2 reference values ─────────────────────────────
interface ClinicalReference {
  label: string;
  note: string;
  bed10?: number;
  eqd2_10?: number;
  bed4?: number;
  eqd2_4?: number;
  bed_p?: number;
  eqd2_p?: number;
  bed2?: number;
  eqd2_2?: number;
  eqd2_3?: number | null;
}

const CLINICAL_REF: ClinicalReference[] = [
  { label: 'WBRT palliative (30/10)',     bed10: 39.0,  eqd2_10: 32.5,  eqd2_3: null,  note: 'Standard palliation' },
  { label: 'H&N radical (70/35)',         bed10: 84.0,  eqd2_10: 70.0,  eqd2_3: null,  note: 'Standard fractionation' },
  { label: 'Breast (50/25)',              bed4:  75.0,  eqd2_4:  50.0,  eqd2_3: null,  note: 'Conventional' },
  { label: 'Breast START-B (40/15)',      bed4:  66.7,  eqd2_4:  44.5,  eqd2_3: null,  note: 'START-B (2.67 Gy/fx)' },
  { label: 'Breast FAST-Forward (26/5)',  bed4:  59.8,  eqd2_4:  39.9,  eqd2_3: null,  note: 'FAST-Forward (5.2 Gy/fx)' },
  { label: 'Prostate (78/39)',            bed_p: 182.0, eqd2_p:  78.0,  eqd2_3: null,  note: 'α/β=1.5 (Standard)' },
  { label: 'Prostate CHHiP (60/20)',      bed_p: 180.0, eqd2_p:  77.1,  eqd2_3: null,  note: 'CHHiP (3 Gy/fx)' },
  { label: 'Lung SBRT (54/3)',            bed10: 151.2, eqd2_10: 126.0, eqd2_3: null,  note: 'RTOG 0236 (Rx at 80% isodose, Dmax=67.5Gy)' },
  { label: 'Lung SABR (48/4)',            bed10: 105.6, eqd2_10: 88.0,  eqd2_3: null,  note: 'Common peripheral SBRT' },
  { label: 'Lung SABR (60/5)',            bed10: 132.0, eqd2_10: 110.0, eqd2_3: null,  note: 'Stereotactic (12 Gy/fx)' },
  { label: 'Bone palliation (8/1)',       bed10: 14.4,  eqd2_10: 12.0,  eqd2_3: null,  note: 'Single fraction' },
  { label: 'Spinal cord limit (45/25)',   bed2:  85.5,  eqd2_2:  42.75, eqd2_3: null,  note: 'TD5/5 Conventional' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const bedToEQD2 = (bed: number, ab: number) => ab > 0 ? bed / (1 + 2 / ab) : 0;
const eqd2ToBED = (eqd2: number, ab: number) => ab > 0 ? eqd2 * (1 + 2 / ab) : 0;

// ── Main component ────────────────────────────────────────────────────────
const BEDtoEQD2Page: React.FC = () => {
  const [ab,    setAb]    = useState('10');
  const [input, setInput] = useState('100');
  const [mode,  setMode]  = useState<'BED_TO_EQD2'|'EQD2_TO_BED'>('BED_TO_EQD2');
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
  }));


  // Persistence
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.ab)    setAb(String(p.ab));
        if (p.input) setInput(String(p.input));
        if (p.mode)  setMode(p.mode);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ab, input, mode }));
  }, [ab, input, mode]);

  const nAb    = parseFloat(ab)    || 0;
  const nInput = parseFloat(input) || 0;

  const result = useMemo(() =>
    nAb > 0 && nInput > 0
      ? mode === 'BED_TO_EQD2'
        ? bedToEQD2(nInput, nAb)
        : eqd2ToBED(nInput, nAb)
      : 0,
  [mode, nInput, nAb]);

  // Cross-ab comparison table
  const crossAbRows = useMemo(() => {
    if (nInput <= 0) return [];
    return [1.5, 2, 3, 4, 5, 8, 10, 15, 20].map(a => ({
      ab: a,
      result: mode === 'BED_TO_EQD2' ? bedToEQD2(nInput, a) : eqd2ToBED(nInput, a),
      isCur: Math.abs(a - nAb) < 0.01,
    }));
  }, [nInput, nAb, mode]);

  const isBtoE = mode === 'BED_TO_EQD2';
  const valid  = nAb > 0 && nInput > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* Header (Command Center Style) */}
      <div className="mb-10 relative">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono">Bio-Metric Converter</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
          </div>
          BED ↔ EQD2 Engine
        </h1>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>LQ-Model Normalisation</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Protocol Synchronizer</span>
          </div>
        </div>
      </div>

      {/* ── Mode toggle (Console Switch) ──────────────────────────────── */}
      <div className="p-1.5 bg-slate-950 rounded-2xl border border-white/5 shadow-2xl flex gap-1.5 mb-8">
        {(['BED_TO_EQD2','EQD2_TO_BED'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl relative overflow-hidden group
              ${mode === m
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            {mode === m && (
              <motion.div 
                layoutId="active-mode-bg"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              />
            )}
            <span className="relative z-10">{m === 'BED_TO_EQD2' ? 'BED → EQD2' : 'EQD2 → BED'}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Inputs (The Controller) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="px-6 py-5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">Source Telemetry</p>
               <div className="w-8 h-1 bg-blue-500/20 rounded-full" />
            </div>
            
            <div className="p-8 space-y-8">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1 group-focus-within:text-blue-400 transition-colors">
                  {isBtoE ? 'BED Value (Gy)' : 'EQD2 Value (Gy)'}
                </label>
                <div className="relative">
                  <NumberInput  
                    step="0.5" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 p-5 rounded-2xl text-3xl font-mono font-black text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700 uppercase tracking-widest">Input</div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-1">Tumour / Tissue Biology</label>
                  <TumourSelector
                    selectedEntry={selectedTumour}
                    onSelect={(entry) => {
                      setSelectedTumour(entry);
                      setAb(entry.ab.toString());
                    }}
                    onClear={() => setSelectedTumour(null)}
                  />
                </div>
                
                {!selectedTumour && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Manual α/β Constant (Gy)</label>
                    <NumberInput  
                      step="0.5" 
                      value={ab}
                      onChange={e => {
                        setAb(e.target.value);
                        setSelectedTumour(null);
                      }} 
                      className="w-full bg-white/[0.02] border border-white/5 px-5 py-4 rounded-2xl text-xl font-mono font-black text-blue-400 focus:border-blue-500/50 outline-none transition-all" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Radiobiology Law</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {isBtoE 
                  ? "EQD2 normalises multi-dose-rate BED to a standard 2.0 Gy per fraction clinical baseline."
                  : "BED quantifies log-kill and repair capacity, regardless of the fractionation schedule used."}
              </p>
            </div>
          </div>
        </div>

        {/* Results (The Output) */}
        <div className="lg:col-span-7 space-y-8">
          {valid ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="space-y-8"
            >
              {/* Result Visualizer */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                
                <div className="relative bg-slate-950 rounded-[2.2rem] p-10 text-white shadow-2xl border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] mesh-grid pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 font-mono">Conversion Complete</p>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter italic">Iso-Effective Yield</h2>
                      </div>
                      <div className="w-16 h-16 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <Zap className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Resulting {isBtoE ? 'EQD2' : 'BED'} (Gy)</p>
                      <div className="flex items-baseline gap-4">
                        <motion.span 
                          key={result}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-8xl font-black text-white tracking-tighter leading-none font-display"
                        >
                          {result.toFixed(2)}
                        </motion.span>
                        <span className="text-3xl font-black text-slate-700 font-display">Gy</span>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">α/β Index: {nAb} Gy</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Factor: {(1 + 2/nAb).toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                         {isBtoE ? 'Divisional Normal' : 'Multiplicative Accum'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Telemetry Export</h4>
                    <p className="text-[10px] text-slate-500 font-medium italic">High-precision PDF clinical report</p>
                  </div>
                </div>
                <div className="relative z-10">
                   <ExportButton report={{
                    title: "BED-EQD2 Conversion Report",
                    toolName: "BED-EQD2",
                    patientRef: "BED-EQD2-CONV",
                    interpretation: `${isBtoE ? 'BED to EQD2' : 'EQD2 to BED'} Conversion. Radiobiological calculations are estimates based on the LQ model. Clinical judgment is required.`,
                    parameters: [
                      { label: "Input Dose", value: `${nInput} Gy` },
                      { label: "α/β Ratio", value: `${nAb} Gy` },
                      { label: "Mode", value: isBtoE ? "BED to EQD2" : "EQD2 to BED" }
                    ],
                    results: [
                      { label: isBtoE ? "Resulting EQD2" : "Resulting BED", value: `${result.toFixed(2)} Gy`, highlight: true },
                      { label: "Conversion Factor", value: (1 + 2/nAb).toFixed(3) }
                    ]
                  }} />
                </div>
              </div>

              {/* Comparison Matrix */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] font-mono">Sensitivity Telemetry</h4>
                  </div>
                  <Activity className="w-4 h-4 text-slate-300" />
                </div>
                <div className="p-2 overflow-x-auto">
                   <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
                        <th className="px-6 py-4 text-left">α/β Index</th>
                        <th className="px-6 py-4 text-left">Biology</th>
                        <th className="px-6 py-4 text-right">Factor</th>
                        <th className="px-6 py-4 text-right">Yield (Gy)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {crossAbRows.map(r => (
                        <tr key={r.ab} className={`group transition-all duration-300 ${r.isCur ? 'bg-blue-600/5' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-5">
                            <span className={`font-mono text-sm font-black ${r.isCur ? 'text-blue-600' : 'text-slate-700'}`}>
                              {r.ab.toFixed(1)} <span className="text-[10px] opacity-60">Gy</span>
                            </span>
                          </td>
                          <td className="px-6 py-5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {r.ab === 1.5 ? 'Prostate' : r.ab === 3 ? 'LAT OAR' : r.ab === 10 ? 'TU / ERN' : 'INTERMED'}
                             </span>
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-slate-400 text-xs">{(1 + 2/r.ab).toFixed(3)}</td>
                          <td className="px-6 py-5 text-right font-mono font-black text-slate-950">{r.result.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100"
              >
                <Activity className="w-10 h-10 text-slate-300" />
              </motion.div>
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">Awaiting Input</h3>
              <p className="text-xs text-slate-400 mt-3 max-w-xs font-medium leading-relaxed">
                Connect the source biological dose and α/β ratio to start the normalisation engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Clinical reference table ──────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Common Schedule BED/EQD2 Reference (click to load BED)
          </p>
        </div>
        <div className="scroll-x">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                <th className="px-3 py-2 text-left">Schedule</th>
                <th className="px-3 py-2 text-right">BED (Gy)</th>
                <th className="px-3 py-2 text-right">EQD2 (Gy)</th>
                <th className="px-3 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CLINICAL_REF.map((r, i) => {
                // Pick best available BED value and its alpha-beta
                const bedVal  = r.bed10  ?? r.bed4   ?? r.bed_p  ?? r.bed2   ?? 0;
                const eqd2Val = r.eqd2_10 ?? r.eqd2_4 ?? r.eqd2_p ?? r.eqd2_2 ?? 0;
                const abKey   = r.bed10 ? '10' : r.bed4 ? '4' : r.bed_p ? '1.5' : '2';
                return (
                  <tr key={i}
                    className="text-slate-700 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setMode('BED_TO_EQD2');
                      setAb(abKey);
                      setInput(String(bedVal));
                    }}>
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2 text-right num font-bold text-blue-800" title={`Calculated using α/β = ${abKey} Gy`}>
                      {bedVal.toFixed(1)}<sub className="cursor-help">{abKey}</sub>
                    </td>
                    <td className="px-3 py-2 text-right num text-emerald-800">
                      {eqd2Val ? eqd2Val.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-slate-400 italic">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Clinical notes ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Key Relationships</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            {
              title: 'BED vs EQD2 — not interchangeable',
              body: 'BED represents total log cell kill including repair. EQD2 normalises to 2 Gy/fx for clinical comparison. BED > EQD2 always (since 1+2/α/β > 1). Never mix them in cumulative calculations without converting.',
            },
            {
              title: 'When to use BED vs EQD2',
              body: 'Use BED when combining modalities with different dose rates (e.g. LDR brachytherapy). Use EQD2 for comparing EBRT schedules and for QUANTEC/GEC-ESTRO OAR constraints which are specified in EQD2.',
            },
            {
              title: 'α/β dominates the conversion',
              body: 'At α/β=10: factor = 1.2 (BED and EQD2 are similar). At α/β=1.5: factor = 2.33 (BED is more than double EQD2). This is why SBRT BED₁₀ values (>100 Gy) correspond to moderate EQD2 values.',
            },
            {
              title: 'SBRT lung BED₁₀ ≥ 100 Gy threshold',
              body: 'TROG 09.02 (Ball 2019) and RTOG 0236 demonstrated that lung SBRT with BED₁₀ ≥100 Gy achieves local control >90%. This threshold = EQD2₁₀ ≈ 60 Gy and corresponds to e.g. 54 Gy/3fx or 60 Gy/5fx. Note: BED₁₀ = 151.2 Gy for RTOG 0236 assumes 54 Gy is the prescription point (Rx at 80% isodose). If using UK convention (100%/95% isodose to PTV), the same protocol does not equal the same BED.',
            },
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
        Ref: Fowler JF. Br J Radiol 1989. Hall &amp; Giaccia, Radiobiology for the Radiologist 8th ed.
        Ball DL et al. TROG 09.02. Lancet Oncol 2019. Timmerman R et al. RTOG 0236. JAMA 2010.
      </p>
    </div>
  );
};

export default BEDtoEQD2Page;