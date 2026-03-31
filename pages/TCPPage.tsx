import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, Target, Layers
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { Link } from 'react-router-dom';

import { NumberInput } from '../src/components/NumberInput';

// ─── TCP Parameters (LQ-Poisson Model) ──────────────────────────────────────
interface TumourParams {
  site: string;
  alpha: number; // alpha parameter (Gy^-1)
  beta: number;  // beta parameter (Gy^-2)
  n0_default: number; // Initial clonogen number
  citation: string;
}

const TUMOUR_DATABASE: TumourParams[] = [
  { site: 'H&N SCC (early T1/T2)', alpha: 0.3, beta: 0.03, n0_default: 1e7, citation: 'Suit HD et al. IJROBP 1992 (TCD50 ≈ 50-55 Gy)' },
  { site: 'H&N SCC (advanced)', alpha: 0.25, beta: 0.025, n0_default: 1e9, citation: 'Webb S & Nahum AE. Phys Med Biol 1993 (TCD50 ≈ 70-75 Gy)' },
  { site: 'Prostate', alpha: 0.15, beta: 0.10, n0_default: 1e6, citation: 'Brenner & Hall IJROBP 1999 (TCD50 ≈ 65-70 Gy)' },
  { site: 'Lung NSCLC', alpha: 0.3, beta: 0.03, n0_default: 1e7, citation: 'Martel 1994 (TCD50 ≈ 84 Gy BED10)' },
  { site: 'Breast', alpha: 0.3, beta: 0.075, n0_default: 1e5, citation: 'Post-lumpectomy EQD2 (TCD50 ≈ 45 Gy)' },
];

const TCPPage: React.FC = () => {
  const [selectedTumour, setSelectedTumour] = useState<TumourParams>(TUMOUR_DATABASE[0]);
  const [dose, setDose] = useState<string>('60');
  const [fractions, setFractions] = useState<string>('30');
  const [logN0, setLogN0] = useState<number>(Math.log10(TUMOUR_DATABASE[0].n0_default));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nDose = parseFloat(dose) || 0;
  const nFx = parseInt(fractions) || 1;
  const dpf = nFx > 0 ? nDose / nFx : 0;
  const n0 = Math.pow(10, logN0);

  // TCP Calculation (LQ-Poisson Model)
  const calculateTCP = (D: number, d: number, alpha: number, beta: number, N0: number) => {
    if (D <= 0 || d <= 0) return 0;
    const sf_per_fx = Math.exp(-alpha * d - beta * d * d);
    const n = D / d;
    const sf_total = Math.pow(sf_per_fx, n);
    return Math.exp(-N0 * sf_total) * 100;
  };

  const results = useMemo(() => {
    if (nDose <= 0 || dpf <= 0) return null;
    
    const { alpha, beta } = selectedTumour;
    
    const tcp = calculateTCP(nDose, dpf, alpha, beta, n0);
    const tcpConv = calculateTCP(nDose, 2, alpha, beta, n0);
    const tcpSBRT = calculateTCP(nDose, 18, alpha, beta, n0);
    
    const sf_per_fx = Math.exp(-alpha * dpf - beta * dpf * dpf);
    const sf_total = Math.pow(sf_per_fx, nFx);
    
    return {
      tcp,
      tcpConv,
      tcpSBRT,
      sf_per_fx,
      sf_total
    };
  }, [nDose, dpf, nFx, selectedTumour, n0]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'LQ-Poisson Model',
      emoji: '🎯',
      accent: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.4)',
      rows: [
        { k: 'SF/fx', v: 'exp(-α·d - β·d²)' },
        { k: 'SF total', v: '(SF/fx)^n' },
        { k: 'TCP', v: 'exp(-N₀ · SF_total)' },
      ]
    },
    {
      title: 'Clonogen Number',
      emoji: '🧫',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'N₀', v: 'Initial clonogenic cells' },
        { k: '1cm³ Tumour', v: '≈ 10⁸ cells' },
        { k: 'Clonogens', v: '≈ 1% (N₀ ≈ 10⁶)' },
      ]
    }
  ];

  // Chart data: TCP vs Dose for 3 schedules
  const chartData = useMemo(() => {
    const data = [];
    const { alpha, beta } = selectedTumour;
    // Plot up to 100 Gy
    for (let D = 0; D <= 100; D += 2) {
      data.push({
        dose: D,
        tcpConv: calculateTCP(D, 2, alpha, beta, n0),
        tcpHypo: calculateTCP(D, 3, alpha, beta, n0),
        tcpCustom: calculateTCP(D, dpf, alpha, beta, n0)
      });
    }
    return data;
  }, [selectedTumour, n0, dpf]);

  const handleTumourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tumour = TUMOUR_DATABASE.find(t => t.site === e.target.value);
    if (tumour) {
      setSelectedTumour(tumour);
      setLogN0(Math.log10(tumour.n0_default));
    }
  };

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TCP Calculator</h1>
          <p className="text-sm text-slate-500">LQ-Poisson Fractionation-Sensitive Model</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tumour Type</label>
            <select 
              value={selectedTumour.site}
              onChange={handleTumourChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-red-500 outline-none transition"
            >
              {TUMOUR_DATABASE.map(t => (
                <option key={t.site} value={t.site}>{t.site}</option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">α (Gy⁻¹)</p>
                <p className="text-sm font-black text-slate-700">{selectedTumour.alpha}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">β (Gy⁻²)</p>
                <p className="text-sm font-black text-slate-700">{selectedTumour.beta}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center italic">{selectedTumour.citation}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Clonogens (N₀)</label>
                <span className="text-xs font-bold text-red-500">10^{logN0.toFixed(1)}</span>
              </div>
              <input 
                type="range" 
                min="5" max="10" step="0.1"
                value={logN0}
                onChange={(e) => setLogN0(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                <span className="font-bold text-slate-500">Clinical teaching:</span> A 1cm³ tumour ≈ 10⁸ cells; ~1% are clonogens → N₀ ≈ 10⁶. Increasing N₀ shifts the TCP sigmoid RIGHT (higher dose needed).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Dose (Gy)</label>
                <NumberInput 
                   
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fractions</label>
                <NumberInput 
                   
                  value={fractions}
                  onChange={(e) => setFractions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dose per fraction</p>
              <p className="text-lg font-black text-slate-700">{dpf.toFixed(2)} Gy</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-red-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold text-red-200/70 uppercase tracking-widest mb-1">Control Probability</p>
              <h2 className="text-6xl font-black mb-2 tracking-tighter">
                {results ? results.tcp.toFixed(1) : '0.0'}%
              </h2>
              <div className="flex items-center gap-2 text-sm text-red-200/50">
                <Target className="w-4 h-4" />
                <span>TCP for {selectedTumour.site} at {dpf.toFixed(2)} Gy/fx</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
          </div>

          {/* Fractionation Comparison Row */}
          {results && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conventional (2 Gy/fx)</p>
                <p className="text-2xl font-black text-slate-700">{results.tcpConv.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Same total dose ({nDose} Gy)</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">SBRT (18 Gy/fx)</p>
                <p className="text-2xl font-black text-slate-700">{results.tcpSBRT.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Same total dose ({nDose} Gy)</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fractionation Comparison</h3>
              <Link to="/ntcp" className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md transition-colors">
                <Layers className="w-3 h-3" />
                Open TCP/NTCP Overlay
              </Link>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="dose" 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Total Dose (Gy)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`, 
                      name === 'tcpConv' ? '2 Gy/fx' : name === 'tcpHypo' ? '3 Gy/fx' : `${dpf.toFixed(1)} Gy/fx (Current)`
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <ReferenceLine x={nDose.toString()} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line 
                    name="2 Gy/fx"
                    type="monotone" 
                    dataKey="tcpConv" 
                    stroke="#94a3b8" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Line 
                    name="3 Gy/fx"
                    type="monotone" 
                    dataKey="tcpHypo" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Line 
                    name={`${dpf.toFixed(1)} Gy/fx`}
                    type="monotone" 
                    dataKey="tcpCustom" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center">
              Fractionation matters most when β is large (low α/β tissues like prostate). 
              Notice how the curves diverge.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Section */}
      {results && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="w-full">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Calculation Validation (Show Working)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <p><span className="font-bold text-slate-400">Input:</span> {nDose} Gy, {nFx} fx, {dpf.toFixed(2)} Gy/fx</p>
                  <p><span className="font-bold text-slate-400">Params:</span> α={selectedTumour.alpha}, β={selectedTumour.beta}, N₀=10^{logN0.toFixed(1)}</p>
                  <p><span className="font-bold text-slate-400">SF_per_fx:</span> exp(-{selectedTumour.alpha}×{dpf.toFixed(2)} - {selectedTumour.beta}×{dpf.toFixed(2)}²) = {results.sf_per_fx.toExponential(3)}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-bold text-slate-400">SF_total:</span> ({results.sf_per_fx.toExponential(3)})^{nFx} = {results.sf_total.toExponential(3)}</p>
                  <p><span className="font-bold text-slate-400">TCP:</span> exp(-10^{logN0.toFixed(1)} × {results.sf_total.toExponential(3)})</p>
                  <p><span className="font-bold text-emerald-600">Result:</span> {results.tcp.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCPPage;
