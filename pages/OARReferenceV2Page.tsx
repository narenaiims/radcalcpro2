import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Activity, 
  Search, 
  Info, 
  AlertTriangle, 
  BookOpen, 
  ChevronRight, 
  Zap, 
  Target,
  Layers,
  CheckCircle2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { 
  OAR_DATABASE, 
  Region, 
  Constraint, 
  OARData,
  FractionationRegime
} from '../src/services/oarDataService';

// --- Types & Constants ---
const REGIONS: { id: Region | 'All'; label: string }[] = [
  { id: 'All',         label: 'All Regions' },
  { id: 'CNS',         label: 'CNS' },
  { id: 'HeadAndNeck', label: 'H&N' },
  { id: 'Thorax',      label: 'Thorax' },
  { id: 'Abdomen',     label: 'Abdomen' },
  { id: 'Pelvis',      label: 'Pelvis' },
  { id: 'Spine_SBRT',  label: 'Spine SBRT' },
];

const FRACTIONATION_PRESETS: Record<string, { dFx: number; nFx: number }> = {
  'Standard (2Gy)': { dFx: 2.0, nFx: 30 },
  'Hypo (3Gy)':     { dFx: 3.0, nFx: 15 },
  'SBRT (10Gy)':    { dFx: 10.0, nFx: 5 },
  'SRS (20Gy)':     { dFx: 20.0, nFx: 1 },
};

const EVIDENCE_COLORS: Record<string, string> = {
  'Level_1A': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  'Level_1B': 'text-teal-400 border-teal-400/20 bg-teal-400/5',
  'Level_2A': 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  'Level_2B': 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5',
  'Level_3':  'text-amber-400 border-amber-400/20 bg-amber-400/5',
  'Expert':   'text-slate-400 border-slate-400/20 bg-slate-400/5',
};

// --- Helper Functions ---
function calculateEQD2(dose: number, n: number, ab: number): number {
  const d = dose / n;
  return dose * ((d + ab) / (2 + ab));
}

function getScaledLimit(limit: number, ab: number, dNew: number): number {
  // EQD2_old = EQD2_new
  // limit * ((2 + ab) / (2 + ab)) = newLimit * ((dNew + ab) / (2 + ab))
  // newLimit = limit * (2 + ab) / (dNew + ab)
  return limit * (2 + ab) / (dNew + ab);
}

// --- Components ---

const OARReferenceV2Page: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'All'>('All');
  const [selectedOarId, setSelectedOarId] = useState<string | null>(null);
  const [dFx, setDFx] = useState(2.0);
  const [nFx, setNFx] = useState(30);
  const [showScaled, setShowScaled] = useState(true);

  // Derived Data
  const filteredOars = useMemo(() => {
    return OAR_DATABASE.filter(oar => {
      const matchesSearch = oar.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'All' || oar.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const selectedOar = useMemo(() => {
    return OAR_DATABASE.find(o => o.id === selectedOarId) || filteredOars[0];
  }, [selectedOarId, filteredOars]);

  // Auto-select first OAR on filter change
  useEffect(() => {
    if (filteredOars.length > 0 && (!selectedOarId || !filteredOars.find(o => o.id === selectedOarId))) {
      setSelectedOarId(filteredOars[0].id);
    }
  }, [filteredOars, selectedOarId]);

  if (!selectedOar) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 min-h-screen relative text-slate-300 font-sans">
      <div className="atmosphere-bg" />
      <div className="mesh-grid" />

      {/* --- Top Command Bar --- */}
      <header className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search OAR (e.g. Brainstem, Heart)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 xl:pb-0">
            {REGIONS.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  selectedRegion === r.id 
                    ? 'bg-teal text-white border-teal shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px xl:h-8 w-full xl:w-px bg-white/10" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fractionation</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={dFx}
              onChange={(e) => setDFx(Number(e.target.value))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-center text-sm font-mono focus:outline-none focus:border-teal/50"
            />
            <span className="text-xs text-slate-600">Gy ×</span>
            <input 
              type="number" 
              value={nFx}
              onChange={(e) => setNFx(Number(e.target.value))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-center text-sm font-mono focus:outline-none focus:border-teal/50"
            />
            <span className="text-xs text-slate-600">fx</span>
          </div>
          <button 
            onClick={() => setShowScaled(!showScaled)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              showScaled 
                ? 'bg-teal/10 border-teal/50 text-teal' 
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            {showScaled ? 'EQD2 Active' : 'Ref 2Gy'}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- Left Sidebar: OAR List --- */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2">
            <h3 className="label-micro opacity-50">Organs ({filteredOars.length})</h3>
            <Layers className="w-3 h-3 text-slate-600" />
          </div>
          <div className="space-y-2">
            {filteredOars.map(oar => (
              <button
                key={oar.id}
                onClick={() => setSelectedOarId(oar.id)}
                className={`w-full group text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  selectedOarId === oar.id
                    ? 'bg-white/10 border-teal/50 shadow-xl'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                {selectedOarId === oar.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                  />
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold transition-colors ${selectedOarId === oar.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {oar.name}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-all ${selectedOarId === oar.id ? 'text-teal translate-x-0' : 'text-slate-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">
                    {oar.region}
                  </span>
                  <span className={`w-1 h-1 rounded-full ${oar.type === 'Serial' ? 'bg-red-500' : oar.type === 'Parallel' ? 'bg-teal' : 'bg-amber-500'}`} />
                  <span className="text-[9px] text-slate-500 italic">{oar.type}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* --- Main Dashboard --- */}
        <div className="lg:col-span-9 space-y-6">
          {/* Hero Section */}
          <section className="card-premium p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-48 h-48 text-white" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-teal/10 text-teal text-[10px] font-black uppercase tracking-widest border border-teal/20">
                      {selectedOar.type} Organ
                    </span>
                    <span className="text-slate-500 text-xs font-mono">ID: {selectedOar.id}</span>
                  </div>
                  <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">
                    {selectedOar.name}
                  </h2>
                  <p className="text-lg text-slate-400 font-serif italic max-w-2xl">
                    {selectedOar.organFunction}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-right">
                    <p className="label-micro opacity-40">PRV Expansion</p>
                    <p className="text-xl font-black text-white">{selectedOar.prvExpansion || 'None'}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                    <p className="label-micro opacity-40">Region</p>
                    <p className="text-xl font-black text-teal">{selectedOar.region}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-teal">
                    <Target className="w-4 h-4" />
                    <h4 className="label-micro">Clinical Significance</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedOar.whyItMatters}
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="label-micro">Critical Pearls</h4>
                  </div>
                  <ul className="space-y-2">
                    {selectedOar.clinicalPearls.map((pearl, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        {pearl}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Info className="w-4 h-4" />
                    <h4 className="label-micro">Imaging & Contouring</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    {selectedOar.imagingTips || "Standard CT/MRI fusion recommended for precise delineation."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid: Constraints & Data */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Primary Constraint Card */}
            <div className="xl:col-span-2 card-premium overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal" />
                  <h3 className="label-micro">Dose Constraints Matrix</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase">Ref: 2Gy/fx</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="px-6 py-4 label-micro opacity-40">Endpoint</th>
                      <th className="px-6 py-4 label-micro opacity-40">Metric</th>
                      <th className="px-6 py-4 label-micro opacity-40 text-right">Limit</th>
                      <th className="px-6 py-4 label-micro opacity-40 text-right">Scaled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedOar.constraints.map((c, i) => {
                      const scaled = showScaled ? getScaledLimit(c.limit, c.alphaBeta, dFx) : c.limit;
                      const isScalable = c.metricType === 'Dmax' || c.metricType === 'Dmean' || c.metricType === 'D2cc';
                      
                      return (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${c.priority === 'Absolute' ? 'bg-red-500' : 'bg-slate-500'}`} />
                              <span className="text-sm font-bold text-white">{c.toxicityEndpoint || 'General Tolerance'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.regime.map(r => (
                                <span key={r} className="text-[8px] px-1 bg-white/5 rounded text-slate-500 uppercase">{r.replace('_', ' ')}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-400 font-mono">{c.metric}</span>
                            <div className="mt-1">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${EVIDENCE_COLORS[c.evidenceLevel]}`}>
                                {c.evidenceLevel}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-black text-white font-mono">{c.limit}</span>
                            <span className="text-[10px] text-slate-600 ml-1">{c.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-lg font-black font-mono ${showScaled && isScalable ? 'text-teal' : 'text-slate-700'}`}>
                                {(showScaled && isScalable) ? scaled.toFixed(1) : '—'}
                              </span>
                              {isScalable && <span className="text-[9px] text-slate-600">α/β: {c.alphaBeta}</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Bento Cards */}
            <div className="space-y-6">
              {/* Toxicity Card */}
              <div className="card-premium p-6 bg-red-500/[0.02] border-red-500/10 space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="label-micro">Toxicity Profile</h3>
                </div>
                <div className="space-y-4">
                  {selectedOar.constraints.filter(c => c.toxicityEndpoint).slice(0, 2).map((c, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{c.toxicityEndpoint}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-bold">{c.toxicityGrade || 'Grade 3+'}</span>
                        <span className="text-[10px] text-slate-500">Risk: {c.ntcpAtLimit ? `${c.ntcpAtLimit}%` : '< 5%'}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-red-500/50" style={{ width: c.ntcpAtLimit ? `${c.ntcpAtLimit}%` : '5%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Card */}
              <div className="card-premium p-6 bg-blue-500/[0.02] border-blue-500/10 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="label-micro">Evidence & Sources</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedOar.constraints.flatMap(c => c.source || []))).map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5 group cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400">{s}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-600 group-hover:text-blue-400" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic leading-relaxed">
                  Data synthesized from QUANTEC (2010), HyTEC (2021), and AAPM Task Group reports.
                </p>
              </div>

              {/* Quick Action Card */}
              <div className="card-premium p-6 bg-teal/[0.02] border-teal/10 space-y-4">
                <div className="flex items-center gap-2 text-teal">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="label-micro">Plan Check</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Enter your plan dose to check against {selectedOar.name} constraints.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Enter Plan Dose (Gy)..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal/50"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal rounded-lg text-white">
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-12 pb-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <span>© 2026 RadCalcPro2</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Clinical Reference v2.0</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-teal transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-teal transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-teal transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
};

export default OARReferenceV2Page;
