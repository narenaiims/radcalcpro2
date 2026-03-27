import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen, Clock, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';

const RepairKineticsPage: React.FC = () => {
  const [repairHalfLife, setRepairHalfLife] = useState<string>('1.5'); // Repair half-life (hours)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nHL = parseFloat(repairHalfLife) || 1.5;
  const mu = Math.log(2) / nHL; // Repair constant

  // Repair Curve: Remaining damage vs Time
  // Damage(t) = exp(-mu * t)
  const chartData = useMemo(() => {
    const data = [];
    for (let t = 0; t <= 12; t += 0.2) {
      const damage = Math.exp(-mu * t);
      data.push({
        time: t,
        damage: damage * 100,
        repair: (1 - damage) * 100
      });
    }
    return data;
  }, [mu]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'Repair Kinetics',
      emoji: '⏱️',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.4)',
      rows: [
        { k: 'T1/2', v: 'Time for half of the damage to be repaired' },
        { k: 'Sublethal Damage', v: 'Damage that can be repaired if time allows' },
        { k: 'Repair Constant (μ)', v: 'Rate of repair (ln 2 / T1/2)' },
      ]
    },
    {
      title: 'Clinical Relevance',
      emoji: '🏥',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'Inter-fraction Interval', v: 'Typically 6+ hours for BID' },
        { k: 'Dose Rate Effect', v: 'Continuous dose allows simultaneous repair' },
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

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Repair Half-Life (Hours)</label>
            <input 
              type="number" 
              step="0.1"
              value={repairHalfLife}
              onChange={(e) => setRepairHalfLife(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
              Repair constant (μ) = <span className="text-slate-600">{mu.toFixed(4)} hr⁻¹</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">6h Repair</span>
              </div>
              <p className="text-2xl font-black text-blue-900">{(Math.exp(-mu * 6) * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase">Damage Remaining</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">6h Repaired</span>
              </div>
              <p className="text-2xl font-black text-emerald-900">{((1 - Math.exp(-mu * 6)) * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Damage Repaired</p>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorDamage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRepair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                fontSize={12} 
                tick={{fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
                label={{ value: 'Time (Hours)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
              />
              <YAxis 
                fontSize={12} 
                tick={{fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                unit="%"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                labelFormatter={(label) => label + ' Hours'}
              />
              <ReferenceLine x={6} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '6h Interval', position: 'top', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
              <Area 
                type="monotone" 
                dataKey="damage" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDamage)" 
                name="Remaining Damage"
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="repair" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRepair)" 
                name="Repaired Damage"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              This visualiser shows the repair of sublethal damage over time. The "Remaining Damage" curve 
              represents the fraction of damage that has not yet been repaired. In clinical practice, 
              an interval of at least 6 hours is typically required between fractions (BID) to allow 
              for near-complete repair of sublethal damage in late-responding tissues.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Repair Half-Life (T1/2)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            The time required for half of the repairable damage to be repaired. For most mammalian 
            cells, this is between 0.5 and 2 hours. Late-responding tissues often have slower repair 
            kinetics (longer T1/2) than early-responding tissues or tumours.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Clinical Application</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            When delivering multiple fractions per day, the interval must be long enough to spare 
            late-responding tissues. If the interval is too short, the biological effect is 
            increased (incomplete repair), leading to higher toxicity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RepairKineticsPage;
