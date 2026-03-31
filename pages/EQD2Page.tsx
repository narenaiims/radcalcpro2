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
    category: 'Radiobiology Basics',
    items: [
      { label: 'BED Formula', value: 'D × [1 + d / (α/β)]' },
      { label: 'EQD2 Formula', value: 'BED / [1 + 2 / (α/β)]' },
      { label: 'α/β (Tumour)', value: 'Typically 10 Gy' },
      { label: 'α/β (Late OAR)', value: 'Typically 3 Gy' },
    ],
  },
  {
    category: 'Standard Benchmarks',
    items: [
      { label: 'Conventional', value: '2.0 Gy/fx' },
      { label: 'Hypofractionation', value: '2.5 - 4.0 Gy/fx' },
      { label: 'SBRT', value: '> 5.0 Gy/fx' },
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          Schedule Analyzer
        </h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Comprehensive radiobiological analysis of fractionation schedules. 
          Calculate BED and EQD2 to evaluate tumour control and normal tissue risk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Prescription Parameters</p>
              <Calculator className="w-4 h-4 text-slate-300" />
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Total Dose (Gy)</label>
                  <NumberInput 
                    value={totalDose} 
                    onChange={e => setTotalDose(e.target.value)}
                    step="0.5"
                    className="w-full p-4 rounded-xl border border-slate-200 text-xl font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Dose per Fraction (Gy)</label>
                  <NumberInput 
                    value={dosePerFx} 
                    onChange={e => setDosePerFx(e.target.value)}
                    step="0.1"
                    className="w-full p-4 rounded-xl border border-slate-200 text-xl font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-900">Total Fractions</span>
                  <span className="text-2xl font-black text-blue-700 font-mono">{nFx.toFixed(1)} <span className="text-xs font-normal opacity-60 uppercase">fx</span></span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Tumour Site & α/β Ratio</label>
                <TumourSelector 
                  selectedEntry={selectedTumour}
                  onSelect={(entry) => {
                    setSelectedTumour(entry);
                    setAb(entry.ab.toString());
                  }}
                  onClear={() => setSelectedTumour(null)}
                />
                
                {!selectedTumour && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Manual α/β Ratio (Gy)</label>
                    <NumberInput 
                      value={ab} 
                      onChange={e => setAb(e.target.value)}
                      step="0.5"
                      className="w-full p-3 rounded-xl border border-slate-200 text-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Clinical Context</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "EQD2 (Equivalent Dose in 2 Gy fractions) is the standard currency of radiobiology. 
              It allows clinicians to compare different fractionation schedules by normalizing them 
              to a standard 2 Gy per fraction baseline."
            </p>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {results ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Primary Result Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Biological Equivalent</p>
                      <h2 className="text-4xl font-black tracking-tight">EQD2 Result</h2>
                    </div>
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                      <TrendingUp className="w-7 h-7 text-blue-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">EQD2 Value</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-white num">{results.eqd2.toFixed(1)}</span>
                        <span className="text-2xl font-bold text-slate-600">Gy</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium italic">Normalized to 2.0 Gy/fx baseline</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">BED Value</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-emerald-400 num">{results.bed.toFixed(1)}</span>
                        <span className="text-2xl font-bold text-emerald-900/50">Gy<sub>{nAb}</sub></span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium italic">Total biological dose delivered</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${nDpf > 2.2 ? 'bg-amber-500' : nDpf < 1.8 ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {nDpf > 2.2 ? 'Hypofractionated' : nDpf < 1.8 ? 'Hyperfractionated' : 'Conventional'} Schedule
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">α/β Ratio</span>
                      <span className="text-sm font-black text-white font-mono">{nAb} Gy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Export Card */}
              {reportData && (
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
              )}

              {/* Sensitivity Analysis */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">α/β Sensitivity Analysis</p>
                  <ShieldAlert className="w-4 h-4 text-slate-300" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4 text-left">α/β Ratio</th>
                        <th className="px-6 py-4 text-right">BED</th>
                        <th className="px-6 py-4 text-right">EQD2</th>
                        <th className="px-6 py-4 text-right">Tissue Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sensitivityData.map((row) => (
                        <tr key={row.ab} className={`${row.isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${row.isCurrent ? 'text-blue-600' : 'text-slate-700'}`}>
                                {row.ab} Gy
                              </span>
                              {row.isCurrent && <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Current</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-600">{row.bed.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{row.eqd2.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {row.ab <= 3 ? 'Late OAR' : row.ab >= 10 ? 'Tumour / Early' : 'Intermediate'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Note: Lower α/β ratios (e.g., 3 Gy) represent late-responding normal tissues, 
                    which are more sensitive to changes in dose per fraction.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Awaiting Parameters</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs">
                Enter the prescription dose and fractionation to generate a detailed radiobiological analysis.
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
