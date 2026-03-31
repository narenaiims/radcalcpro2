import { NumberInput } from '../src/components/NumberInput';
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 

  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, Clock, Zap, Database, 
  ArrowRightLeft, Beaker, BookOpen
} from 'lucide-react';

// ─── Constants & Formulas ───────────────
const LN2 = Math.log(2);

interface LDRPreset {
  name: string;
  type: 'temporary' | 'permanent';
  dose: number;
  doseRate: number;
  alphaBeta: number;
  tHalfRepair: number;
  tHalfPhysical?: number; // for permanent
  description: string;
  clinicalContext?: string;
}

const PRESETS: LDRPreset[] = [
  {
    name: 'Cervix LDR (Tumour)',
    type: 'temporary',
    dose: 50,
    doseRate: 0.6,
    alphaBeta: 10,
    tHalfRepair: 1.5,
    description: 'Classic LDR tandem + ovoids (Dale 1985)',
    clinicalContext: 'Standard LDR brachytherapy for cervix cancer. The high dose rate relative to permanent implants requires careful consideration of repair kinetics. Tumour α/β is typically 10.'
  },
  {
    name: 'Cervix LDR (OAR)',
    type: 'temporary',
    dose: 50,
    doseRate: 0.6,
    alphaBeta: 3,
    tHalfRepair: 4.0,
    description: 'Late-responding tissue (rectum/bladder)',
    clinicalContext: 'Late-responding normal tissues have a lower α/β (typically 3) and longer repair half-times (up to 4h), making them more sensitive to dose rate effects.'
  },
  {
    name: 'Prostate I-125 (Tumour)',
    type: 'permanent',
    dose: 145,
    doseRate: 0.07,
    alphaBeta: 1.5,
    tHalfRepair: 1.5,
    tHalfPhysical: 60 * 24, // 60 days in hours
    description: 'I-125 Permanent Seed Implant',
    clinicalContext: 'I-125 has a low initial dose rate (0.07 Gy/h) but delivers dose over months. The low α/β (1.5) of prostate cancer makes it highly sensitive to fraction size, but the continuous low dose rate spares late-responding normal tissues.'
  },
  {
    name: 'Prostate I-125 (OAR Late)',
    type: 'permanent',
    dose: 145,
    doseRate: 0.07,
    alphaBeta: 3.0,
    tHalfRepair: 4.0,
    tHalfPhysical: 60 * 24,
    description: 'Late-responding prostate tissue',
    clinicalContext: 'Late-responding normal tissues around the prostate (rectum, urethra) have longer repair half-times (e.g., 4h), affecting their BED from continuous low dose rate exposure.'
  },
  {
    name: 'Prostate Pd-103 (Permanent)',
    type: 'permanent',
    dose: 125,
    doseRate: 0.20,
    alphaBeta: 1.5,
    tHalfRepair: 1.5,
    tHalfPhysical: 17 * 24, // 17 days in hours
    description: 'Pd-103 Permanent Seed Implant',
    clinicalContext: 'Pd-103 has a shorter physical half-life (17 days) and higher initial dose rate than I-125, delivering the dose more quickly. Often preferred for faster-growing tumours.'
  }
];

const LDRBrachyPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mode, setMode] = useState<'temporary' | 'permanent'>('temporary');
  const [dose, setDose] = useState<string>('50');
  const [doseRate, setDoseRate] = useState<string>('0.6');
  const [alphaBeta, setAlphaBeta] = useState<string>('10');
  const [tHalfRepair, setTHalfRepair] = useState<string>('1.5');
  const [tHalfPhysical, setTHalfPhysical] = useState<string>('1440'); // 60 days default
  const [repairModel, setRepairModel] = useState<'standard' | 'advanced'>('standard');
  const [fastFraction, setFastFraction] = useState<string>('0.8');
  const [tHalfSlow, setTHalfSlow] = useState<string>('4.0');
  const [selectedPreset, setSelectedPreset] = useState<LDRPreset | null>(null);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'LDR Brachytherapy',
      emoji: '☢️',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.4)',
      rows: [
        { k: 'Formula', v: 'BED = D * (1 + (2*R/(μ*(α/β))) * (1 - (1-exp(-μ*T))/(μ*T)))' },
        { k: 'T1/2 Repair', v: 'Typically 1.5h for normal tissues' },
        { k: 'Permanent Implant', v: 'T = infinity, BED = D * (1 + R0 / ((μ + λ)*(α/β)))' }
      ]
    }
  ];

  // ─── Calculations ───────────────
  const results = useMemo(() => {
    const D = parseFloat(dose) || 0;
    const R = parseFloat(doseRate) || 0;
    const ab = parseFloat(alphaBeta) || 1;
    const thr = parseFloat(tHalfRepair) || 1.5;
    const tph = parseFloat(tHalfPhysical) || 1440;
    
    const A = parseFloat(fastFraction) || 0.8;
    const ths = parseFloat(tHalfSlow) || 4.0;

    const mu = LN2 / thr;
    const mu2 = LN2 / ths;
    const lambda = mode === 'permanent' ? LN2 / tph : 0;

    let bed = 0;
    let bedAcute = 0;
    let gT = 0;
    let gT1 = 0;
    let gT2 = 0;
    let duration = 0;

    if (mode === 'temporary') {
      duration = D / R;
      // g(T) = (2/muT) * [1 - (1-e^(-muT))/(muT)]
      const muT = mu * duration;
      gT = (2 / muT) * (1 - (1 - Math.exp(-muT)) / muT);
      
      if (repairModel === 'advanced') {
        const muT2 = mu2 * duration;
        gT1 = gT;
        gT2 = (2 / muT2) * (1 - (1 - Math.exp(-muT2)) / muT2);
        // BED = D * [1 + (2R / (alpha/beta)) * (A * g(T1) / mu1 + (1-A) * g(T2) / mu2)]
        bed = D * (1 + (2 * R / ab) * (A * gT1 / mu + (1 - A) * gT2 / mu2));
      } else {
        // BED = D * [1 + (2R / (mu * (alpha/beta))) * g(T)]
        bed = D * (1 + (2 * R * gT) / (mu * ab));
      }
    } else {
      // Permanent Implant
      if (repairModel === 'advanced') {
        // BED = D * [1 + (R0 / (alpha/beta)) * (A / (lambda + mu1) + (1-A) / (lambda + mu2))]
        bed = D * (1 + (R / ab) * (A / (lambda + mu) + (1 - A) / (lambda + mu2)));
      } else {
        // BED = D * [1 + (R0 / ((lambda + mu) * ab))]
        bed = D * (1 + R / ((lambda + mu) * ab));
      }
      // Acute BED (for comparison): BED = D * (1 + D / ab)
      bedAcute = D * (1 + D / ab);
    }

    const eqd2 = bed / (1 + 2 / ab);

    return { bed, bedAcute, eqd2, mu, mu2, lambda, gT, gT1, gT2, duration };
  }, [mode, dose, doseRate, alphaBeta, tHalfRepair, tHalfPhysical, repairModel, fastFraction, tHalfSlow]);

  // ─── Comparison Table Data ───────────────
  const comparisonData = useMemo(() => {
    const D = parseFloat(dose) || 50;
    const ab = parseFloat(alphaBeta) || 10;
    const thr = parseFloat(tHalfRepair) || 1.5;
    const mu = LN2 / thr;

    const rates = [
      { label: 'LDR', rate: 0.6 },
      { label: 'MDR', rate: 5.0 },
      { label: 'HDR', rate: 50.0 }
    ];

    return rates.map(r => {
      const T = D / r.rate;
      const muT = mu * T;
      const gT = (2 / muT) * (1 - (1 - Math.exp(-muT)) / muT);
      const bed = D * (1 + (2 * r.rate * gT) / (mu * ab));
      return { ...r, bed };
    });
  }, [dose, alphaBeta, tHalfRepair]);

  const applyPreset = (p: LDRPreset) => {
    setMode(p.type);
    setDose(p.dose.toString());
    setDoseRate(p.doseRate.toString());
    setAlphaBeta(p.alphaBeta.toString());
    setTHalfRepair(p.tHalfRepair.toString());
    if (p.tHalfPhysical) setTHalfPhysical(p.tHalfPhysical.toString());
    setSelectedPreset(p);
  };

  return (
    <div className="space-y-8 animate-slam pb-20">
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <p className="label-micro text-yellow-400">Brachytherapy Physics</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">LDR Dose Rate Correction</h1>
          <p className="text-sm text-slate-500 font-serif italic">Dale (1985) Incomplete Repair Model</p>
        </div>
      </header>

      {/* Mode Selector */}
      <div className="flex p-1 bg-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setMode('temporary')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'temporary' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Temporary (LDR/MDR)
        </button>
        <button 
          onClick={() => setMode('permanent')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'permanent' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Permanent (Seeds)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Treatment Parameters</h2>
            <div className="card-premium p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-micro">Total Dose (Gy)</label>
                  <NumberInput 
                     inputMode="decimal"
                    value={dose} onChange={(e) => setDose(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro">{mode === 'temporary' ? 'Dose Rate (Gy/h)' : 'Initial Rate (Gy/h)'}</label>
                  <NumberInput 
                     inputMode="decimal" step="0.01"
                    value={doseRate} onChange={(e) => setDoseRate(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-micro">α/β Ratio (Gy)</label>
                  <NumberInput 
                     inputMode="decimal" step="0.1"
                    value={alphaBeta} onChange={(e) => setAlphaBeta(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Repair Half-Time (T½, hours)</label>
                  <NumberInput 
                     inputMode="decimal" step="0.1"
                    value={tHalfRepair} onChange={(e) => setTHalfRepair(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {mode === 'permanent' && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="label-micro">Physical T½ (h)</label>
                  <div className="flex gap-2">
                    <NumberInput 
                       inputMode="decimal"
                      value={tHalfPhysical} onChange={(e) => setTHalfPhysical(e.target.value)}
                      className="input-premium flex-grow"
                    />
                    <div className="flex items-center px-3 bg-white/5 rounded-lg text-[10px] text-slate-400 uppercase font-bold">
                      {(parseFloat(tHalfPhysical) / 24).toFixed(1)} Days
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Repair Model Tab */}
            <div className="card-premium overflow-hidden">
              <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setRepairModel('standard')}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${repairModel === 'standard' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Standard Repair
                </button>
                <button 
                  onClick={() => setRepairModel('advanced')}
                  className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${repairModel === 'advanced' ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Two-Component Repair
                </button>
              </div>
              
              {repairModel === 'advanced' && (
                <div className="p-6 space-y-4 bg-white/[0.02]">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 mb-4">
                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Models incomplete repair using both fast and slow repair components.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="label-micro">Fast Fraction (A)</label>
                      <NumberInput 
                         inputMode="decimal" step="0.1" min="0" max="1"
                        value={fastFraction} onChange={(e) => setFastFraction(e.target.value)}
                        className="input-premium w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label-micro">Slow T½ (h)</label>
                      <NumberInput 
                         inputMode="decimal" step="0.1"
                        value={tHalfSlow} onChange={(e) => setTHalfSlow(e.target.value)}
                        className="input-premium w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Clinical Presets</h2>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.filter(p => p.type === mode).map((p, i) => (
                <button 
                  key={i}
                  onClick={() => applyPreset(p)}
                  className={`card-premium p-4 text-left transition-colors group ${selectedPreset?.name === p.name ? 'bg-white/10 border-white/20' : 'hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-bold transition-colors ${selectedPreset?.name === p.name ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'}`}>{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-1">{p.description}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-colors ${selectedPreset?.name === p.name ? 'text-yellow-400' : 'text-slate-600 group-hover:text-white'}`} />
                  </div>
                </button>
              ))}
            </div>
            
            {selectedPreset?.clinicalContext && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mt-4"
              >
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Clinical Context</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedPreset.clinicalContext}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Biological Effect</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-premium p-8 bg-yellow-400/5 border-yellow-400/20 flex flex-col items-center text-center">
                <p className="label-micro text-yellow-400 mb-2">Chronic BED_{alphaBeta}</p>
                <p className="text-6xl font-black font-mono text-white leading-none tracking-tighter">
                  {results.bed.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500 mt-4 uppercase font-bold tracking-widest">Gy_{alphaBeta}</p>
              </div>
              <div className="card-premium p-8 bg-white/[0.02] flex flex-col items-center text-center">
                <p className="label-micro opacity-40 mb-2">{mode === 'permanent' ? 'Acute BED' : 'EQD2'}</p>
                <p className="text-6xl font-black font-mono text-white leading-none tracking-tighter">
                  {mode === 'permanent' ? results.bedAcute.toFixed(1) : results.eqd2.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500 mt-4 uppercase font-bold tracking-widest">
                  {mode === 'permanent' ? `Gy_${alphaBeta}` : `Gy (α/β=${alphaBeta})`}
                </p>
              </div>
            </div>
          </section>

          {mode === 'temporary' ? (
            <section className="space-y-4">
              <h2 className="label-micro opacity-40">Dose Rate Comparison</h2>
              <div className="card-premium overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 label-micro">Regime</th>
                      <th className="p-4 label-micro">Rate (Gy/h)</th>
                      <th className="p-4 label-micro">BED_{alphaBeta}</th>
                      <th className="p-4 label-micro">Rel. Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm font-bold text-white">{row.label}</td>
                        <td className="p-4 text-sm font-mono text-slate-400">{row.rate.toFixed(1)}</td>
                        <td className="p-4 text-sm font-mono font-bold text-yellow-400">{row.bed.toFixed(1)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-white/10 rounded-full flex-grow overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400" 
                                style={{ width: `${(row.bed / comparisonData[2].bed) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {((row.bed / comparisonData[0].bed) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 bg-white/[0.02] border-t border-white/5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-yellow-400 font-bold">Interpretation:</span> BED_HDR &gt; BED_LDR because at low dose rates, repair is complete between dose increments → less quadratic (β) cell kill. At very low dose rates, the quadratic term β approaches 0.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="label-micro opacity-40">Decay Parameters</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="card-premium p-4 bg-white/[0.02]">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Decay Const (λ)</p>
                  <p className="text-lg font-mono text-white">{results.lambda.toExponential(3)} h⁻¹</p>
                </div>
                <div className="card-premium p-4 bg-white/[0.02]">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Repair Const (μ)</p>
                  <p className="text-lg font-mono text-white">{results.mu.toFixed(4)} h⁻¹</p>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  For permanent implants, the dose rate decays exponentially. The BED calculation accounts for the competition between continuous sublethal damage production and repair over the entire life of the source.
                </p>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Physics Reference</h2>
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white mb-2">Dale (1985) Model</h4>
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300 space-y-2 overflow-x-auto">
                    <p className="text-yellow-400 font-bold">Temporary Implant:</p>
                    <p>BED = D × [1 + (2R / (μ × (α/β))) × g(T)]</p>
                    <p>g(T) = (2/μT) × [1 - (1 - e^-μT)/(μT)]</p>
                    <div className="h-px bg-white/10 my-2" />
                    <p className="text-yellow-400 font-bold">Permanent Implant:</p>
                    <p>BED = D × [1 + (R₀ / ((λ + μ) × (α/β)))]</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Validation Section */}
      <section className="mt-12 pt-8 border-t border-white/5">
        <details className="group">
          <summary className="flex items-center gap-2 mb-6 cursor-pointer list-none">
            <Beaker className="w-5 h-5 text-emerald-400" />
            <h2 className="label-micro text-emerald-400">Validation Benchmarks (Show Working)</h2>
            <ChevronRight className="w-4 h-4 text-emerald-400/50 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="card-premium p-6 bg-emerald-500/5 border-emerald-500/10">
              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3">LDR Cervix Test</h4>
              <ul className="text-[11px] text-slate-400 space-y-2 font-mono">
                <li>Input: 50 Gy @ 0.6 Gy/h, t½=1.5h, α/β=10</li>
                <li>Expected: μ=0.462, g(T)≈0.0236, BED≈50.16</li>
                <li className="text-emerald-300/70">Current: BED={results.bed.toFixed(2)} (Mode: Temporary)</li>
                <li className="pt-2 border-t border-emerald-500/10">
                  <span className="text-emerald-400">Working:</span><br/>
                  μ = ln(2) / 1.5 = 0.462 h⁻¹<br/>
                  T = 50 / 0.6 = 83.33 h<br/>
                  μT = 0.462 * 83.33 = 38.5<br/>
                  g(T) = (2/38.5) * [1 - (1 - e^-38.5)/38.5] ≈ 0.0236<br/>
                  BED = 50 * [1 + (2*0.6 / (0.462*10)) * 0.0236] ≈ 50.16
                </li>
              </ul>
            </div>
            <div className="card-premium p-6 bg-emerald-500/5 border-emerald-500/10">
              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3">I-125 Prostate Test</h4>
              <ul className="text-[11px] text-slate-400 space-y-2 font-mono">
                <li>Input: 145 Gy, R₀=0.07 Gy/h, T½_phys=60d, T½_rep=1.5h, α/β=1.5</li>
                <li>Expected: BED₁.₅≈166.6, EQD2₁.₅≈71.4</li>
                <li className="text-emerald-300/70">Current: BED={results.bed.toFixed(1)}, EQD2={results.eqd2.toFixed(1)} (Mode: Permanent)</li>
                <li className="pt-2 border-t border-emerald-500/10">
                  <span className="text-emerald-400">Working:</span><br/>
                  λ = ln(2) / (60*24) = 0.000481 h⁻¹<br/>
                  μ = ln(2) / 1.5 = 0.462 h⁻¹<br/>
                  BED = 145 * [1 + 0.07 / ((0.000481 + 0.462) * 1.5)]<br/>
                  BED = 145 * [1 + 0.07 / (0.462481 * 1.5)]<br/>
                  BED = 145 * [1 + 0.07 / 0.6937] ≈ 166.6
                </li>
              </ul>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
};

export default LDRBrachyPage;
