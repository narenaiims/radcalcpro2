import { NumberInput } from '../src/components/NumberInput';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, Clock, Zap,
  Settings2, Database, ExternalLink, ArrowRight,
  ShieldCheck, TrendingUp
} from 'lucide-react';
import { 

  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, Legend
} from 'recharts';

interface TissueParams {
  name: string;
  tHalfSingle: number;
  tHalf1?: number;
  tHalf2?: number;
  fastFraction?: number;
  source: string;
  doi?: string;
}

const TISSUE_LIBRARY: Record<string, TissueParams> = {
  'spinal-cord': {
    name: 'Spinal Cord',
    tHalfSingle: 1.5,
    tHalf1: 0.9,
    tHalf2: 4.5,
    fastFraction: 0.7,
    source: 'Thames 1985',
    doi: 'https://doi.org/10.1016/0360-3016(85)90211-1'
  },
  'skin-acute': {
    name: 'Skin (Acute)',
    tHalfSingle: 1.0,
    tHalf1: 0.5,
    tHalf2: 3.0,
    fastFraction: 0.85,
    source: 'Joiner 1994',
    doi: 'https://doi.org/10.1080/09553009414550811'
  },
  'lung-late': {
    name: 'Lung (Late)',
    tHalfSingle: 2.0,
    tHalf1: 1.5,
    tHalf2: 6.0,
    fastFraction: 0.7,
    source: 'Thames 1987',
    doi: 'https://doi.org/10.1016/0360-3016(87)90123-1'
  },
  'cns-brain': {
    name: 'CNS / Brain',
    tHalfSingle: 1.5,
    tHalf1: 1.0,
    tHalf2: 6.0,
    fastFraction: 0.65,
    source: 'Fowler 1990',
    doi: 'https://doi.org/10.1016/0360-3016(90)90306-G'
  },
  'kidney': {
    name: 'Kidney',
    tHalfSingle: 2.0,
    tHalf1: 1.5,
    tHalf2: 8.0,
    fastFraction: 0.6,
    source: 'Bentzen 1993',
    doi: 'https://doi.org/10.1016/0360-3016(93)90243-O'
  },
  'tumour': {
    name: 'Tumour (General)',
    tHalfSingle: 1.5,
    source: 'Withers 1988',
    doi: 'https://doi.org/10.3109/02841868809090334'
  }
};

const RepairKineticsPage: React.FC = () => {
  const [selectedTissueKey, setSelectedTissueKey] = useState<string>('spinal-cord');
  const [isTwoComponent, setIsTwoComponent] = useState<boolean>(true);
  const [dosePerFraction, setDosePerFraction] = useState<string>('2.0');
  const [alphaBeta, setAlphaBeta] = useState<string>('2.0');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const tissue = TISSUE_LIBRARY[selectedTissueKey];
  const dFrac = parseFloat(dosePerFraction) || 2.0;
  const ab = parseFloat(alphaBeta) || 2.0;

  // Single component params
  const muSingle = Math.log(2) / tissue.tHalfSingle;

  // Two component params
  const hasTwoComp = !!(tissue.tHalf1 && tissue.tHalf2 && tissue.fastFraction !== undefined);
  const mu1 = hasTwoComp ? Math.log(2) / (tissue.tHalf1!) : 0;
  const mu2 = hasTwoComp ? Math.log(2) / (tissue.tHalf2!) : 0;
  const A = tissue.fastFraction || 1;

  const getDamageFraction = (t: number, twoComp: boolean) => {
    if (twoComp && hasTwoComp) {
      return A * Math.exp(-mu1 * t) + (1 - A) * Math.exp(-mu2 * t);
    }
    return Math.exp(-muSingle * t);
  };

  // Chart Data: Damage vs Time
  const chartData = useMemo(() => {
    const data = [];
    for (let t = 0; t <= 24; t += 0.25) {
      const damageSingle = Math.exp(-muSingle * t);
      const damageTwo = hasTwoComp ? (A * Math.exp(-mu1 * t) + (1 - A) * Math.exp(-mu2 * t)) : damageSingle;
      
      data.push({
        time: t,
        single: damageSingle * 100,
        two: damageTwo * 100,
        // For Area chart shading between curves
        upper: Math.max(damageSingle, damageTwo) * 100,
        lower: Math.min(damageSingle, damageTwo) * 100
      });
    }
    return data;
  }, [muSingle, mu1, mu2, A, hasTwoComp]);

  // BID Calculator Data
  const bidIntervals = [4, 5, 6, 8, 12, 24];
  const bidResults = useMemo(() => {
    return bidIntervals.map(t => {
      const h = getDamageFraction(t, isTwoComponent);
      // BED correction factor for incomplete repair (Lea-Catcheside g-factor simplified for inter-fraction)
      // For two fractions with interval t: BED = n*d*(1 + d/(a/b) * (1 + h))
      // The "correction factor" relative to complete repair is (1 + h)
      return {
        interval: t,
        residual: h * 100,
        bedFactor: 1 + h
      };
    });
  }, [isTwoComponent, hasTwoComp, muSingle, mu1, mu2, A]);

  // Safe minimum interval calculation (95% slow component repair)
  const safeInterval = useMemo(() => {
    if (!hasTwoComp) {
      // For single component: exp(-mu*t) = 0.05 => -mu*t = ln(0.05) => t = -ln(0.05)/mu
      return -Math.log(0.05) / muSingle;
    }
    // For two component, we look at the slow component (1-A)*exp(-mu2*t) < 0.05 * (1-A)
    // Effectively exp(-mu2*t) < 0.05
    return -Math.log(0.05) / mu2;
  }, [muSingle, mu2, hasTwoComp]);

  // Dose-rate BED Correction Data
  // BED_ratio = (1 + (2*R/(mu*(a/b))) * (1 - (1-exp(-mu*T))/(mu*T))) / (1 + d/(a/b))
  // Simplified: we'll show g(T) factor vs dose rate for a fixed dose of 2Gy
  const doseRateData = useMemo(() => {
    const data = [];
    const dose = 2.0;
    const rates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    
    for (const R of rates) {
      const T = dose / R; // Irradiation time
      
      const gFactor = (mu: number) => (2 / (mu * T)) * (1 - (1 - Math.exp(-mu * T)) / (mu * T));
      
      const gSingle = gFactor(muSingle);
      const gTwo = hasTwoComp ? (A * gFactor(mu1) + (1 - A) * gFactor(mu2)) : gSingle;
      
      data.push({
        rate: R,
        gSingle: gSingle,
        gTwo: gTwo
      });
    }
    return data;
  }, [muSingle, mu1, mu2, A, hasTwoComp]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'Repair Kinetics',
      emoji: '⏱️',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.4)',
      rows: [
        { k: 'Single Component', v: 'Assumes one uniform repair rate (μ)' },
        { k: 'Two Component', v: 'Fast (T1/2 < 1h) and Slow (T1/2 > 4h) repair phases' },
        { k: 'Clinical Impact', v: 'Slow component dictates safe BID intervals' },
      ]
    },
    {
      title: 'Lea-Catcheside G-Factor',
      emoji: '🧬',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'g(T)', v: 'Correction for repair during irradiation' },
        { k: 'LDR', v: 'Low dose rate (<0.6 Gy/h) allows significant repair' },
        { k: 'MDR', v: 'Medium dose rate (2-12 Gy/h) requires careful correction' },
      ]
    }
  ];

  return (
    <div className="space-y-6 fade-in pb-10">
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Repair Kinetics</h1>
          <p className="text-sm text-slate-500">Sublethal Damage Repair Visualiser</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* 1. MODEL SELECTION & TISSUE PRESETS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Model Configuration</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select Tissue & Repair Model</p>
              </div>
            </div>
            
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setIsTwoComponent(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isTwoComponent ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Single Component
              </button>
              <button 
                onClick={() => setIsTwoComponent(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isTwoComponent ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Two Component
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tissue Preset</label>
              <select 
                value={selectedTissueKey}
                onChange={(e) => setSelectedTissueKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none"
              >
                {Object.entries(TISSUE_LIBRARY).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parameters</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">T½ Single:</span>
                    <span className="font-bold text-slate-700">{tissue.tHalfSingle}h</span>
                  </div>
                  {hasTwoComp && (
                    <>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">T½ Fast (A={tissue.fastFraction}):</span>
                        <span className="font-bold text-slate-700">{tissue.tHalf1}h</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">T½ Slow (1-A):</span>
                        <span className="font-bold text-slate-700">{tissue.tHalf2}h</span>
                      </div>
                    </>
                  )}
                  <div className="pt-1.5 mt-1.5 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="text-slate-500 italic">Source:</span>
                    <span className="font-bold text-blue-600">{tissue.source}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      fontSize={10} 
                      tick={{fill: '#64748b'}} 
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Time (Hours)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      fontSize={10} 
                      tick={{fill: '#64748b'}} 
                      axisLine={false} 
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                      labelFormatter={(label) => label + ' Hours'}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    
                    {/* Uncertainty Shading */}
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="transparent" 
                      fill="url(#colorUncertainty)" 
                      name="Uncertainty Region (1 vs 2 Comp)"
                      animationDuration={1000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="transparent" 
                      fill="#fff" 
                      animationDuration={1000}
                    />

                    <Line 
                      type="monotone" 
                      dataKey="single" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={false}
                      name="Single Component"
                      strokeDasharray={isTwoComponent ? "5 5" : "0"}
                      opacity={isTwoComponent ? 0.5 : 1}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="two" 
                      stroke="#ef4444" 
                      strokeWidth={3} 
                      dot={false}
                      name="Two Component"
                      hide={!isTwoComponent || !hasTwoComp}
                    />
                    <ReferenceLine x={6} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '6h', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isTwoComponent && hasTwoComp ? "Two-component model captures the slow repair tail" : "Single-component exponential repair"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTER-FRACTION INTERVAL CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-sm">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">BID Interval Calculator</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Residual Damage & BED Correction</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dose / Frac (Gy)</label>
              <NumberInput 
                 
                step="0.1"
                value={dosePerFraction}
                onChange={(e) => setDosePerFraction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-lg font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">α/β Ratio (Gy)</label>
              <NumberInput 
                 
                step="0.1"
                value={alphaBeta}
                onChange={(e) => setAlphaBeta(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-lg font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Interval</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Residual Damage</th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">BED Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bidResults.map((res) => (
                  <tr key={res.interval} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-sm font-bold text-slate-700">{res.interval}h</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${res.residual > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${res.residual}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black ${res.residual > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {res.residual.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        ×{res.bedFactor.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Clinical Rule Output</h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-xs text-slate-400 mb-1">Tissue Target:</p>
              <p className="text-lg font-black text-white">{tissue.name}</p>
              {hasTwoComp && <p className="text-[10px] font-bold text-blue-300 uppercase">T½_slow = {tissue.tHalf2}h</p>}
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Warning</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Standard 6h BID interval leaves <span className="text-white font-bold">{getDamageFraction(6, isTwoComponent).toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 1})}</span> unrepaired damage. 
                This increases the effective BED by <span className="text-white font-bold">{((getDamageFraction(6, isTwoComponent)) * 100).toFixed(1)}%</span> relative to complete repair.
              </p>
            </div>

            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Safe Interval</span>
              </div>
              <p className="text-sm font-black text-white mb-1">
                {safeInterval.toFixed(1)} Hours
              </p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">
                Minimum interval for 95% repair
              </p>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              * Based on {isTwoComponent ? "Two-component" : "Single-component"} kinetics for {tissue.name}.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DOSE-RATE BED CORRECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Dose-Rate BED Correction</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Incomplete Repair during LDR/MDR</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>LDR: &lt;0.6 Gy/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>MDR: 2-12 Gy/h</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={doseRateData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="rate" 
                  scale="log" 
                  domain={[0.1, 100]} 
                  fontSize={10} 
                  tick={{fill: '#64748b'}}
                  label={{ value: 'Dose Rate (Gy/h)', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <YAxis 
                  fontSize={10} 
                  tick={{fill: '#64748b'}}
                  label={{ value: 'g(T) Factor', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                  labelFormatter={(label) => label + ' Gy/h'}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Line 
                  type="monotone" 
                  dataKey="gSingle" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 3 }} 
                  name="Single Component g(T)" 
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="gTwo" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  name="Two Component g(T)" 
                  hide={!hasTwoComp}
                />
                <ReferenceLine x={0.6} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'LDR Limit', position: 'top', fontSize: 8, fill: '#10b981' }} />
                <ReferenceLine x={2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'MDR Start', position: 'top', fontSize: 8, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Sensitivity Analysis</h4>
              <p className="text-xs text-purple-900 leading-relaxed">
                At <span className="font-bold">0.6 Gy/h (LDR)</span>, single vs two-component models typically differ by <span className="font-bold text-emerald-600">&lt;5%</span>.
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-900 leading-relaxed">
                  At <span className="font-bold">2–5 Gy/h (MDR)</span>, the difference becomes clinically significant as the fast component repair is incomplete.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LDR Link</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">Use these factors in the Brachytherapy calculator for precise BED.</p>
              <button className="w-full py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition flex items-center justify-center gap-2">
                Open LDR Calc <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TISSUE LIBRARY WITH REPAIR PARAMETERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Tissue Repair Library</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Reference Parameters & Citations</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tissue</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">T½ (Single)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">T½₁ / T½₂ (Two)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(TISSUE_LIBRARY).map(([key, t]) => (
                <tr key={key} className={`hover:bg-slate-50 transition-colors ${selectedTissueKey === key ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{t.name}</span>
                      {selectedTissueKey === key && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono text-slate-500">{t.tHalfSingle}h</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono text-slate-500">
                      {t.tHalf1 ? `${t.tHalf1}h / ${t.tHalf2}h` : '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">{t.source}</span>
                      {t.doi && (
                        <a 
                          href={t.doi} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded transition"
                          title="View Source"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Clinical Caution:</span> Two-component repair parameters are derived from experimental data and vary significantly between studies. The values provided here are representative clinical estimates. Always use the most conservative (longest) repair half-life when calculating safe inter-fraction intervals for critical structures like the spinal cord.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RepairKineticsPage;

