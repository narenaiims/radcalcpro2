import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { 
  Calculator, Info, Activity, AlertTriangle, 
  ChevronRight, BarChart3, BookOpen
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── LKB Parameters (Emami et al. 1991 / Burman et al. 1991) ───────────────
interface OARParams {
  organ: string;
  td50_1: number; // TD50 for whole organ (Gy)
  n: number;      // volume effect parameter
  m: number;      // slope parameter
  endpoint: string;
}

const OAR_DATABASE: OARParams[] = [
  { organ: 'Brain', td50_1: 60, n: 0.25, m: 0.15, endpoint: 'Necrosis/Infarction' },
  { organ: 'Brainstem', td50_1: 65, n: 0.16, m: 0.14, endpoint: 'Necrosis/Infarction' },
  { organ: 'Optic Nerve', td50_1: 65, n: 0.25, m: 0.14, endpoint: 'Blindness' },
  { organ: 'Spinal Cord', td50_1: 66.5, n: 0.05, m: 0.175, endpoint: 'Myelitis' },
  { organ: 'Parotid', td50_1: 46, n: 0.70, m: 0.18, endpoint: 'Xerostomia' },
  { organ: 'Larynx', td50_1: 80, n: 0.11, m: 0.07, endpoint: 'Edema/Necrosis' },
  { organ: 'Lung', td50_1: 24.5, n: 0.87, m: 0.18, endpoint: 'Pneumonitis' },
  { organ: 'Esophagus', td50_1: 68, n: 0.06, m: 0.11, endpoint: 'Stricture/Perforation' },
  { organ: 'Heart', td50_1: 48, n: 0.35, m: 0.10, endpoint: 'Pericarditis' },
  { organ: 'Liver', td50_1: 40, n: 0.32, m: 0.15, endpoint: 'Liver Failure' },
  { organ: 'Kidney', td50_1: 28, n: 0.70, m: 0.10, endpoint: 'Clinical Nephritis' },
  { organ: 'Bladder', td50_1: 80, n: 0.50, m: 0.11, endpoint: 'Symptomatic Contracture' },
  { organ: 'Rectum', td50_1: 80, n: 0.12, m: 0.15, endpoint: 'Severe Proctitis' },
];

// ─── Helper: Normal Distribution CDF (Approximation) ───────────────────────
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

const NTCPPage: React.FC = () => {
  const [selectedOrgan, setSelectedOrgan] = useState<OARParams>(OAR_DATABASE[6]); // Default: Lung
  const [dose, setDose] = useState<string>('20');
  const [volume, setVolume] = useState<string>('0.3'); // Fractional volume (0 to 1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nDose = parseFloat(dose) || 0;
  const nVol = parseFloat(volume) || 0;

  // LKB Calculation
  const results = useMemo(() => {
    if (nDose <= 0 || nVol <= 0) return null;
    
    const { td50_1, n, m } = selectedOrgan;
    
    // 1. Calculate TD50(v)
    const td50_v = td50_1 * Math.pow(nVol, -n);
    
    // 2. Calculate t
    const t = (nDose - td50_v) / (m * td50_v);
    
    // 3. Calculate NTCP
    const ntcp = normalCDF(t) * 100;
    
    return {
      td50_v,
      t,
      ntcp
    };
  }, [nDose, nVol, selectedOrgan]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: 'LKB Model',
      emoji: '📊',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.4)',
      rows: [
        { k: 'n', v: 'Volume effect (0=serial, 1=parallel)' },
        { k: 'm', v: 'Slope of dose-response curve' },
        { k: 'TD50', v: 'Dose for 50% complication probability' },
      ]
    },
    {
      title: 'Organ Architecture',
      emoji: '🫁',
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.4)',
      rows: [
        { k: 'Serial', v: 'Small n (e.g., Spinal Cord n=0.05)' },
        { k: 'Parallel', v: 'Large n (e.g., Lung n=0.87)' },
      ]
    }
  ];

  // Chart data: NTCP vs Dose for current volume
  const chartData = useMemo(() => {
    const data = [];
    const step = selectedOrgan.td50_1 / 10;
    for (let d = 0; d <= selectedOrgan.td50_1 * 2; d += step) {
      const td50_v = selectedOrgan.td50_1 * Math.pow(nVol || 0.5, -selectedOrgan.n);
      const t = (d - td50_v) / (selectedOrgan.m * td50_v);
      data.push({
        dose: d.toFixed(1),
        ntcp: normalCDF(t) * 100
      });
    }
    return data;
  }, [selectedOrgan, nVol]);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">NTCP Calculator</h1>
          <p className="text-sm text-slate-500">Lyman-Kutcher-Burman (LKB) Model</p>
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Organ Selection</label>
            <select 
              value={selectedOrgan.organ}
              onChange={(e) => {
                const organ = OAR_DATABASE.find(o => o.organ === e.target.value);
                if (organ) setSelectedOrgan(organ);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              {OAR_DATABASE.map(o => (
                <option key={o.organ} value={o.organ}>{o.organ} ({o.endpoint})</option>
              ))}
            </select>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">TD50(1)</p>
                <p className="text-sm font-black text-slate-700">{selectedOrgan.td50_1} Gy</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">n</p>
                <p className="text-sm font-black text-slate-700">{selectedOrgan.n}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">m</p>
                <p className="text-sm font-black text-slate-700">{selectedOrgan.m}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Uniform Dose (Gy)</label>
              <input 
                type="number" 
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partial Volume (V/Vref)</label>
                <span className="text-xs font-black text-blue-600">{(nVol * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.01" 
                max="1" 
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Complication Probability</p>
              <h2 className="text-5xl font-black mb-2">
                {results ? results.ntcp.toFixed(2) : '0.00'}%
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Activity className="w-4 h-4" />
                <span>NTCP for {selectedOrgan.organ}</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BarChart3 className="w-24 h-24" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dose-Response Curve</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="ntcp" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Math.abs(parseFloat(entry.dose) - nDose) < (selectedOrgan.td50_1 / 10) ? '#3b82f6' : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center italic">
              Curve shows NTCP vs Dose for V = {(nVol * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Context */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">Clinical Interpretation</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              The LKB model assumes a uniform dose to a partial volume. For non-uniform dose distributions, 
              the Equivalent Uniform Dose (EUD) should be calculated first. The parameters used here are 
              from the classic Emami/Burman dataset (1991), which may be conservative compared to modern 
              QUANTEC data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NTCPPage;
