import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, Target
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

// ─── TCP Parameters (Typical values) ──────────────────────────────────────
interface TumourParams {
  site: string;
  tcd50: number; // Dose for 50% control (Gy)
  gamma50: number; // Slope at TCD50
  alpha: number; // alpha parameter (Gy^-1)
  beta: number;  // beta parameter (Gy^-2)
}

const TUMOUR_DATABASE: TumourParams[] = [
  { site: 'H&N (Early)', tcd50: 50, gamma50: 1.5, alpha: 0.3, beta: 0.03 },
  { site: 'H&N (Advanced)', tcd50: 70, gamma50: 1.2, alpha: 0.25, beta: 0.025 },
  { site: 'Breast', tcd50: 45, gamma50: 1.8, alpha: 0.3, beta: 0.03 },
  { site: 'Prostate', tcd50: 65, gamma50: 2.0, alpha: 0.15, beta: 0.015 },
  { site: 'Lung (NSCLC)', tcd50: 60, gamma50: 1.0, alpha: 0.2, beta: 0.02 },
  { site: 'Cervix', tcd50: 55, gamma50: 1.4, alpha: 0.25, beta: 0.025 },
];

const TCPPage: React.FC = () => {
  const [selectedTumour, setSelectedTumour] = useState<TumourParams>(TUMOUR_DATABASE[0]);
  const [dose, setDose] = useState<string>('60');
  const [fractions, setFractions] = useState<string>('30');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nDose = parseFloat(dose) || 0;
  const nFx = parseInt(fractions) || 1;
  const dpf = nFx > 0 ? nDose / nFx : 0;

  // TCP Calculation (Poisson Model)
  // TCP = (1/2)^exp[2*gamma50*(1 - D/TCD50)/ln 2]
  const results = useMemo(() => {
    if (nDose <= 0) return null;
    
    const { tcd50, gamma50 } = selectedTumour;
    
    const exponent = (2 * gamma50 * (1 - nDose / tcd50)) / Math.log(2);
    const tcp = Math.pow(0.5, Math.exp(exponent)) * 100;
    
    return {
      tcp
    };
  }, [nDose, selectedTumour]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'TCP Model',
      emoji: '🎯',
      accent: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.4)',
      rows: [
        { k: 'TCD50', v: 'Dose for 50% tumour control' },
        { k: 'γ50', v: 'Slope of TCP curve at TCD50' },
        { k: 'Poisson', v: 'Assumes control = 0 surviving clonogens' },
      ]
    },
    {
      title: 'Clonogen Number',
      emoji: '🧫',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'N0', v: 'Initial number of clonogenic cells' },
        { k: 'Survival', v: 'TCP = exp(-N0 * SF)' },
      ]
    }
  ];

  // Chart data: TCP vs Dose
  const chartData = useMemo(() => {
    const data = [];
    const step = selectedTumour.tcd50 / 20;
    for (let d = 0; d <= selectedTumour.tcd50 * 1.5; d += step) {
      const exponent = (2 * selectedTumour.gamma50 * (1 - d / selectedTumour.tcd50)) / Math.log(2);
      data.push({
        dose: d.toFixed(1),
        tcp: Math.pow(0.5, Math.exp(exponent)) * 100
      });
    }
    return data;
  }, [selectedTumour]);

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
          <p className="text-sm text-slate-500">Tumour Control Probability (Poisson Model)</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tumour Type</label>
            <select 
              value={selectedTumour.site}
              onChange={(e) => {
                const tumour = TUMOUR_DATABASE.find(t => t.site === e.target.value);
                if (tumour) setSelectedTumour(tumour);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-red-500 outline-none transition"
            >
              {TUMOUR_DATABASE.map(t => (
                <option key={t.site} value={t.site}>{t.site}</option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">TCD50</p>
                <p className="text-sm font-black text-slate-700">{selectedTumour.tcd50} Gy</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">γ50</p>
                <p className="text-sm font-black text-slate-700">{selectedTumour.gamma50}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Dose (Gy)</label>
              <input 
                type="number" 
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fractions</label>
              <input 
                type="number" 
                value={fractions}
                onChange={(e) => setFractions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition"
              />
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                Dose per fraction: <span className="text-slate-600">{dpf.toFixed(2)} Gy</span>
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-red-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold text-red-200/70 uppercase tracking-widest mb-1">Control Probability</p>
              <h2 className="text-5xl font-black mb-2">
                {results ? results.tcp.toFixed(2) : '0.00'}%
              </h2>
              <div className="flex items-center gap-2 text-sm text-red-200/50">
                <Target className="w-4 h-4" />
                <span>TCP for {selectedTumour.site}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tumour Control Curve</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="dose" 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
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
                  />
                  <ReferenceLine x={nDose.toString()} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="tcp" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Context */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900 mb-1">Clinical Interpretation</h4>
            <p className="text-xs text-red-800 leading-relaxed">
              The Poisson model assumes that tumour control is achieved when zero clonogenic cells survive. 
              The TCD50 and γ50 values vary significantly between tumour types and are influenced by 
              factors like hypoxia, repopulation, and intrinsic radiosensitivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCPPage;
