import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, Info, Activity, Zap, 
  CheckCircle2, AlertTriangle, TrendingUp, 
  BookOpen, GraduationCap, ShieldAlert,
  ChevronRight, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { RadiobiologyData, getInterpretation } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { ExportButton, ClinicalReport } from '@/src/components/ClinicalPDFExport';
import { NumberInput } from '../src/components/NumberInput';

const STORAGE_KEY = 'radonco_eqd2_analyzer_state_v1';

const QUICK_REF_DATA = [
  {
    category: 'Radiobiology Formulas',
    items: [
      { label: 'BED', value: 'D × [1 + d / (α/β)]' },
      { label: 'EQD2', value: 'BED / [1 + 2 / (α/β)]' },
      { label: 'EQDx', value: 'BED / [1 + x / (α/β)]' },
      { label: 'α/β (Tumour)', value: 'Typically 10 Gy' },
      { label: 'α/β (Late OAR)', value: 'Typically 3 Gy' },
    ],
  },
  {
    category: 'Standard Fractionation',
    items: [
      { label: 'Conventional', value: '1.8 - 2.0 Gy/fx' },
      { label: 'Hypofractionation', value: '2.5 - 4.0 Gy/fx' },
      { label: 'SBRT / SABR', value: '5.0 - 20.0 Gy/fx' },
      { label: 'Hyperfractionation', value: '1.1 - 1.2 Gy/fx (BID)' },
    ],
  },
  {
    category: 'Clinical α/β Ratios',
    items: [
      { label: 'H&N SCC', value: '10 Gy' },
      { label: 'Prostate', value: '1.5 Gy' },
      { label: 'Breast', value: '4.0 Gy' },
      { label: 'Melanoma', value: '0.6 - 2.5 Gy' },
      { label: 'Spinal Cord', value: '2.0 Gy' },
      { label: 'Brain (Late)', value: '2.0 Gy' },
    ],
  },
  {
    category: 'LQ Model Limits',
    items: [
      { label: 'Dose/fx Limit', value: '< 10-12 Gy (LQ valid)' },
      { label: 'Repair Time', value: 'Min 6h between fx' },
      { label: 'Repopulation', value: 'Tk ~21-28 days' },
    ],
  },
];

const EQD2CalculatorPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totalDose, setTotalDose] = useState('60');
  const [dosePerFx, setDosePerFx] = useState('2.0');
  const [ab, setAb] = useState('10');
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category,
    emoji: '📌',
    accent: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.3)',
    rows: sec.items.map(item => ({ k: item.label, v: item.value })),
  }));

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.totalDose) setTotalDose(parsed.totalDose);
        if (parsed.dosePerFx) setDosePerFx(parsed.dosePerFx);
        if (parsed.ab) setAb(parsed.ab);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalDose, dosePerFx, ab }));
  }, [totalDose, dosePerFx, ab]);

  const nTotal = parseFloat(totalDose) || 0;
  const nDpf = parseFloat(dosePerFx) || 0;
  const nAb = parseFloat(ab) || 10;
  const nFx = nDpf > 0 ? nTotal / nDpf : 0;

  const results = useMemo(() => {
    if (nTotal <= 0 || nDpf <= 0 || nAb <= 0) return null;
    const bed = nTotal * (1 + nDpf / nAb);
    const eqd2 = bed / (1 + 2 / nAb);
    const tdf = (nTotal * Math.pow(nDpf, 0.238) * Math.pow(nFx, -0.11)) * 0.001; // Simplified TDF for context

    return { bed, eqd2, tdf };
  }, [nTotal, nDpf, nAb, nFx]);

  const reportData: ClinicalReport | null = useMemo(() => {
    if (!results) return null;
    return {
      title: "Schedule Analysis Report",
      toolName: "EQD2 Analyzer",
      parameters: [
        { label: 'Tumour Site', value: selectedTumour?.subsite || 'Custom' },
        { label: 'Total Dose', value: `${nTotal} Gy` },
        { label: 'Dose per Fraction', value: `${nDpf} Gy` },
        { label: 'Fractions', value: `${nFx.toFixed(1)}` },
        { label: 'α/β Ratio', value: `${nAb} Gy` },
      ],
      results: [
        { label: 'BED', value: results.bed.toFixed(1), unit: `Gy${nAb}` },
        { label: 'EQD2', value: results.eqd2.toFixed(1), unit: 'Gy' },
      ],
      interpretation: `Analysis of ${nTotal} Gy in ${nFx.toFixed(1)} fractions (${nDpf} Gy/fx). 
      The biological effective dose (BED) is ${results.bed.toFixed(1)} Gy${nAb}, 
      equivalent to ${results.eqd2.toFixed(1)} Gy in 2 Gy fractions (EQD2).`
    };
  }, [results, nTotal, nDpf, nAb, nFx, selectedTumour]);

  const sensitivityData = useMemo(() => {
    if (nTotal <= 0 || nDpf <= 0) return [];
    return [1.5, 3, 5, 10, 15, 20].map(val => {
      const bed = nTotal * (1 + nDpf / val);
      const eqd2 = bed / (1 + 2 / val);
      return { ab: val, bed, eqd2, isCurrent: Math.abs(val - nAb) < 0.1 };
    });
  }, [nTotal, nDpf, nAb]);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 pt-6">
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
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono">Calculation Terminal</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-blue-400" />
          </div>
          Schedule Analyzer
        </h1>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>LQ-Model Precision</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>OAR Reliability Engine</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Input Column (The Controller) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="px-6 py-5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">Core Parameters</p>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
              </div>
            </div>
            
            <div className="p-8 space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1 group-focus-within:text-blue-400 transition-colors">Total Dose (Gy)</label>
                  <NumberInput 
                    value={totalDose} 
                    onChange={e => setTotalDose(e.target.value)}
                    step="0.5"
                    className="w-full bg-white/[0.02] border border-white/10 p-5 rounded-2xl text-2xl font-mono font-black text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1 group-focus-within:text-blue-400 transition-colors">Dose per Fraction (Gy)</label>
                  <NumberInput 
                    value={dosePerFx} 
                    onChange={e => setDosePerFx(e.target.value)}
                    step="0.1"
                    className="w-full bg-white/[0.02] border border-white/10 p-5 rounded-2xl text-2xl font-mono font-black text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex items-center justify-between group hover:bg-blue-500/10 transition-colors">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">Calculated Yield</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white font-mono block leading-none">{nFx.toFixed(1)}</span>
                    <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">Fractions</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-1">Tumour Profile & Radiobiology</label>
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
                      value={ab} 
                      onChange={e => setAb(e.target.value)}
                      step="0.5"
                      className="w-full bg-white/[0.02] border border-white/5 px-5 py-4 rounded-2xl text-xl font-mono font-black text-blue-400 focus:border-blue-500/50 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Legend */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">Standard Currency</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                EQD2 (Equivalent Dose in 2 Gy fractions) is the universal metric for comparing biological effectiveness across varying schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Results Column (The Telemetry) */}
        <div className="lg:col-span-7 space-y-8">
          {results ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Primary Visualisation */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                
                <div className="relative bg-slate-950 rounded-[2.2rem] p-10 text-white shadow-2xl border border-white/10 overflow-hidden">
                  {/* Subtle Mesh Grid Backdrop */}
                  <div className="absolute inset-0 opacity-[0.03] mesh-grid pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-blue-500 rounded-full" />
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 font-mono">Analytical Summary</p>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter">Iso-effective Output</h2>
                      </div>
                      <div className="w-16 h-16 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                      <div className="md:col-span-3 space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Biological Equivalent (Gy)</p>
                        <div className="flex items-baseline gap-4">
                          <motion.span 
                            key={results.eqd2}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-8xl font-black text-white tracking-tighter num leading-none font-display"
                          >
                            {results.eqd2.toFixed(1)}
                          </motion.span>
                          <span className="text-3xl font-black text-slate-700 font-display">EQD2</span>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${nDpf > 2.2 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {nDpf > 2.2 ? 'Hypofractionation' : 'Standard Dose'}
                          </div>
                          <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(results.eqd2, 100)}%` }}
                              className="h-full bg-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-center border-l border-white/5 pl-8 mt-6 md:mt-0">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Total BED</p>
                          <div className="flex items-baseline gap-2">
                             <motion.span 
                              key={results.bed}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-4xl font-black text-emerald-400 num font-display"
                            >
                              {results.bed.toFixed(1)}
                            </motion.span>
                            <span className="text-sm font-bold text-slate-600">Gy<sub>{nAb}</sub></span>
                          </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Alpha/Beta</p>
                          <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{nAb} <span className="text-xs font-bold text-slate-600">Gy</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              {reportData && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Clinical Export</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Generate PDF report for records</p>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <ExportButton report={reportData} />
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Sensitivity Grid */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] font-mono">Sensitivity Telemetry</h4>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-slate-300" />
                </div>
                <div className="p-2 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
                        <th className="px-6 py-4 text-left">α/β Index</th>
                        <th className="px-6 py-4 text-right">BED (Gy-raw)</th>
                        <th className="px-6 py-4 text-right">EQD2 (Gy-iso)</th>
                        <th className="px-6 py-4 text-right">Tissue Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sensitivityData.map((row) => (
                        <tr key={row.ab} className={`group transition-all duration-300 ${row.isCurrent ? 'bg-blue-600/5' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-6 rounded-full ${row.isCurrent ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'} transition-colors`} />
                              <span className={`font-mono text-sm font-black ${row.isCurrent ? 'text-blue-600' : 'text-slate-700'}`}>
                                {row.ab} <span className="text-[10px] opacity-60">Gy</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-slate-500 text-xs">{row.bed.toFixed(1)}</td>
                          <td className="px-6 py-5 text-right font-mono font-black text-slate-950">{row.eqd2.toFixed(1)}</td>
                          <td className="px-6 py-5 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${row.ab <= 3 ? 'bg-rose-500/10 text-rose-600' : 'bg-blue-500/10 text-blue-600'}`}>
                              {row.ab <= 3 ? 'LAT' : 'ERN'}
                            </span>
                          </td>
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
                <Calculator className="w-10 h-10 text-slate-300" />
              </motion.div>
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">Initialize Telemetry</h3>
              <p className="text-xs text-slate-400 mt-3 max-w-xs font-medium leading-relaxed">
                Connect primary prescription values to run the radiobiological engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">LQ Model</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Iso-BED</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          Ref: Fowler 1989 · Joiner & van der Kogel 2018
        </p>
      </div>
    </div>
  );
};

export default EQD2CalculatorPage;
