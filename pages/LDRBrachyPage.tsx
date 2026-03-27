import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

const LDRBrachyPage: React.FC = () => {
  const [dose, setDose] = useState<string>('40'); // Total dose (Gy)
  const [time, setTime] = useState<string>('48'); // Treatment time (hours)
  const [alphaBeta, setAlphaBeta] = useState<string>('10'); // alpha/beta ratio (Gy)
  const [repairHalfLife, setRepairHalfLife] = useState<string>('1.5'); // Repair half-life (hours)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nDose = parseFloat(dose) || 0;
  const nTime = parseFloat(time) || 0;
  const nAB = parseFloat(alphaBeta) || 10;
  const nHL = parseFloat(repairHalfLife) || 1.5;

  // Dose rate R = Dose / Time
  const doseRate = nTime > 0 ? nDose / nTime : 0;

  // Repair constant mu = ln(2) / T_1/2
  const mu = nHL > 0 ? Math.log(2) / nHL : 0;

  // G-factor for continuous irradiation:
  // G = (2 / (mu * T)) * (1 - (1 - exp(-mu * T)) / (mu * T))
  const gFactor = useMemo(() => {
    if (mu === 0 || nTime === 0) return 0;
    const mut = mu * nTime;
    return (2 / mut) * (1 - (1 - Math.exp(-mut)) / mut);
  }, [mu, nTime]);

  // BED = D * [1 + (G * D) / (alpha/beta)]
  // Or BED = D * [1 + (2 * R / (mu * (alpha/beta))) * (1 - (1 - exp(-mu * T)) / (mu * T))]
  const bed = useMemo(() => {
    if (nDose <= 0 || nAB <= 0) return 0;
    return nDose * (1 + (gFactor * nDose) / nAB);
  }, [nDose, gFactor, nAB]);

  const eqd2 = bed / (1 + 2 / nAB);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'LDR Radiobiology',
      emoji: '☢️',
      accent: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.08)',
      border: 'rgba(139, 92, 246, 0.4)',
      rows: [
        { k: 'Dose Rate Effect', v: 'Lower rate = more time for repair' },
        { k: 'Repair Constant (μ)', v: 'Represents sublethal damage repair' },
        { k: 'G-factor', v: 'Reduction factor for continuous dose' },
      ]
    },
    {
      title: 'Typical Values',
      emoji: '⏱️',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'Repair T1/2', v: 'Typically 0.5 - 1.5 hours' },
        { k: 'LDR Rate', v: '0.4 - 2.0 Gy/hour' },
      ]
    }
  ];

  // Chart data: BED vs Treatment Time for same total dose
  const chartData = useMemo(() => {
    const data = [];
    for (let t = 1; t <= 120; t += 2) {
      const mut = mu * t;
      const g = (2 / mut) * (1 - (1 - Math.exp(-mut)) / mut);
      const b = nDose * (1 + (g * nDose) / nAB);
      data.push({
        time: t,
        bed: b
      });
    }
    return data;
  }, [nDose, mu, nAB]);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LDR Brachytherapy</h1>
          <p className="text-sm text-slate-500">Dose Rate Effect & Repair Kinetics</p>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Dose (Gy)</label>
                <input 
                  type="number" 
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Time (Hours)</label>
                <input 
                  type="number" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-widest">Dose Rate</span>
              <span className="text-lg font-black text-purple-900">{doseRate.toFixed(3)} Gy/hr</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">α/β Ratio (Gy)</label>
                <input 
                  type="number" 
                  value={alphaBeta}
                  onChange={(e) => setAlphaBeta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Repair T1/2 (hr)</label>
                <input 
                  type="number" 
                  value={repairHalfLife}
                  onChange={(e) => setRepairHalfLife(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold text-purple-200/70 uppercase tracking-widest mb-1">Biological Effective Dose</p>
              <h2 className="text-5xl font-black mb-2">
                {bed.toFixed(2)} <span className="text-xl font-normal opacity-50">Gy{nAB}</span>
              </h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-purple-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-purple-200/50">EQD2</p>
                  <p className="text-lg font-black">{eqd2.toFixed(2)} Gy</p>
                </div>
                <div className="bg-purple-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-purple-200/50">G-Factor</p>
                  <p className="text-lg font-black">{gFactor.toFixed(4)}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">BED vs Treatment Time</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Time (hr)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                    unit=" Gy"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <ReferenceLine x={nTime} stroke="#8b5cf6" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="bed" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">
              Curve shows BED for constant total dose ({nDose} Gy) as time varies
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Context */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-purple-900 mb-1">Clinical Interpretation</h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              In LDR brachytherapy, the dose is delivered over a long period, allowing for significant 
              sublethal damage repair during irradiation. The G-factor accounts for this reduction in 
              biological effectiveness compared to an instantaneous dose. As treatment time increases 
              (and dose rate decreases), the BED falls for the same physical dose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LDRBrachyPage;
