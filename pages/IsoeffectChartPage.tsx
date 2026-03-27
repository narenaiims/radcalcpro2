import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

const IsoeffectChartPage: React.FC = () => {
  const [targetBED, setTargetBED] = useState<string>('100');
  const [alphaBeta, setAlphaBeta] = useState<string>('10');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nBED = parseFloat(targetBED) || 0;
  const nAB = parseFloat(alphaBeta) || 10;

  // Isoeffect Curve: Total Dose D vs Dose per fraction d
  // D = BED / (1 + d / (alpha/beta))
  const chartData = useMemo(() => {
    const data = [];
    for (let d = 0.5; d <= 20; d += 0.5) {
      const D = nBED / (1 + d / nAB);
      data.push({
        dpf: d,
        totalDose: D,
        fractions: D / d
      });
    }
    return data;
  }, [nBED, nAB]);

  // Common clinical points for the scatter plot
  const clinicalPoints = useMemo(() => [
    { name: 'Conventional (2Gy)', dpf: 2, totalDose: nBED / (1 + 2 / nAB) },
    { name: 'Hypofractionated (3Gy)', dpf: 3, totalDose: nBED / (1 + 3 / nAB) },
    { name: 'SBRT (10Gy)', dpf: 10, totalDose: nBED / (1 + 10 / nAB) },
    { name: 'SBRT (18Gy)', dpf: 18, totalDose: nBED / (1 + 18 / nAB) },
  ], [nBED, nAB]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'Isoeffect Principles',
      emoji: '📈',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'Iso-BED', v: 'Schedules with same biological effect' },
        { k: 'Dose/Fx Effect', v: 'Higher d/fx = Lower total dose for same BED' },
        { k: 'α/β Sensitivity', v: 'Lower α/β = More sensitive to d/fx' },
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Isoeffect Chart</h1>
          <p className="text-sm text-slate-500">Interactive Fractionation Visualiser</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target BED (Gy{nAB})</label>
            <input 
              type="number" 
              value={targetBED}
              onChange={(e) => setTargetBED(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">α/β Ratio (Gy)</label>
            <input 
              type="number" 
              value={alphaBeta}
              onChange={(e) => setAlphaBeta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="dpf" 
                fontSize={12} 
                tick={{fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
                label={{ value: 'Dose per Fraction (Gy)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
              />
              <YAxis 
                fontSize={12} 
                tick={{fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
                label={{ value: 'Total Dose (Gy)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                formatter={(value: number) => [value.toFixed(1) + ' Gy', 'Total Dose']}
                labelFormatter={(label) => label + ' Gy/fx'}
              />
              <Line 
                type="monotone" 
                dataKey="totalDose" 
                stroke="#10b981" 
                strokeWidth={4} 
                dot={false}
                animationDuration={1500}
              />
              {clinicalPoints.map((point, i) => (
                <ReferenceLine 
                  key={i}
                  x={point.dpf} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  label={{ value: point.name, position: 'top', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              This chart visualises the relationship between dose per fraction and total dose for a constant 
              biological effect (BED = {nBED} Gy). As the dose per fraction increases, the total dose 
              required to achieve the same effect decreases. This is the radiobiological basis for 
              hypofractionation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Low α/β (1.5 - 3 Gy)</h4>
          <p className="text-xs text-slate-600">
            Late-responding tissues and some tumours (prostate). Highly sensitive to dose per fraction. 
            Curve is steep.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Medium α/β (4 - 6 Gy)</h4>
          <p className="text-xs text-slate-600">
            Breast cancer, some sarcomas. Moderate sensitivity to fractionation.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">High α/β (10+ Gy)</h4>
          <p className="text-xs text-slate-600">
            Early-responding tissues and most tumours. Less sensitive to dose per fraction. 
            Curve is flatter.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IsoeffectChartPage;
