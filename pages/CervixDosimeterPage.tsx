import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList,
  Target,
  ShieldAlert
} from 'lucide-react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

const STORAGE_KEY = 'radonco_cervix_dosimeter_v1';

interface BrachyInsertion {
  id: string;
  name: string;
  dose: number;
  fractions: number;
  ab: number;
}

const EMBRACE_CONSTRAINTS = [
  { name: 'HR-CTV D90', goal: '≥ 85 Gy', limit: '≥ 90 Gy (Optimal)', ab: 10, color: 'cyan' },
  { name: 'Bladder D2cc', goal: '< 80 Gy', limit: '< 90 Gy', ab: 3, color: 'rose' },
  { name: 'Rectum D2cc', goal: '< 65 Gy', limit: '< 75 Gy', ab: 3, color: 'rose' },
  { name: 'Sigmoid D2cc', goal: '< 70 Gy', limit: '< 75 Gy', ab: 3, color: 'rose' },
];

const CervixDosimeterPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ebrtDose, setEbrtDose] = useState<number>(45);
  const [ebrtFx, setEbrtFx] = useState<number>(25);
  const [insertions, setInsertions] = useState<BrachyInsertion[]>([
    { id: '1', name: 'Insertion 1', dose: 7, fractions: 4, ab: 10 }
  ]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEbrtDose(parsed.ebrtDose || 45);
        setEbrtFx(parsed.ebrtFx || 25);
        setInsertions(parsed.insertions || []);
      } catch (e) {
        console.error("Failed to load cervix dosimeter state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ebrtDose, ebrtFx, insertions }));
  }, [ebrtDose, ebrtFx, insertions]);

  const addInsertion = () => {
    setInsertions([
      ...insertions,
      { id: Date.now().toString(), name: `Insertion ${insertions.length + 1}`, dose: 7, fractions: 1, ab: 10 }
    ]);
  };

  const removeInsertion = (id: string) => {
    setInsertions(insertions.filter(i => i.id !== id));
  };

  const updateInsertion = (id: string, field: keyof BrachyInsertion, value: any) => {
    setInsertions(insertions.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const calcEQD2 = (dose: number, fx: number, ab: number) => {
    if (fx === 0 || ab === 0) return 0;
    const dpf = dose / fx;
    const bed = dose * (1 + dpf / ab);
    return bed / (1 + 2 / ab);
  };

  const results = useMemo(() => {
    return EMBRACE_CONSTRAINTS.map(constraint => {
      const ebrtEQD2 = calcEQD2(ebrtDose, ebrtFx, constraint.ab);
      
      let brachyEQD2 = 0;
      insertions.forEach(ins => {
        brachyEQD2 += calcEQD2(ins.dose * ins.fractions, ins.fractions, constraint.ab);
      });

      const total = ebrtEQD2 + brachyEQD2;
      return { ...constraint, total, ebrtEQD2, brachyEQD2 };
    });
  }, [ebrtDose, ebrtFx, insertions]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "EMBRACE II Goals",
      emoji: "🎯",
      accent: "#00d4ff",
      bg: "rgba(0, 212, 255, 0.05)",
      border: "rgba(0, 212, 255, 0.2)",
      rows: [
        { k: "HR-CTV D90", v: "> 85 Gy (90 Gy optimal)" },
        { k: "Bladder D2cc", v: "< 80 Gy" },
        { k: "Rectum D2cc", v: "< 65 Gy" },
        { k: "Sigmoid D2cc", v: "< 70 Gy" },
      ]
    },
    {
      title: "Radiobiology",
      emoji: "🧬",
      accent: "#f43f5e",
      bg: "rgba(244, 63, 94, 0.05)",
      border: "rgba(244, 63, 94, 0.2)",
      rows: [
        { k: "Tumour α/β", v: "10 Gy" },
        { k: "OAR α/β", v: "3 Gy" },
        { k: "Half-time", v: "1.5 hours" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 pb-20">
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Cervix Dosimeter</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Combined EBRT and Brachytherapy dose summation using the Linear-Quadratic model. 
            Aligned with GEC-ESTRO and EMBRACE II planning aims.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* EBRT Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">EBRT Component</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Dose (Gy)</label>
                  <input 
                    type="number" 
                    value={ebrtDose} 
                    onChange={e => setEbrtDose(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-mono focus:border-cyan-500/50 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fractions</label>
                  <input 
                    type="number" 
                    value={ebrtFx} 
                    onChange={e => setEbrtFx(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xl font-mono focus:border-cyan-500/50 outline-none transition"
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10 text-xs text-cyan-400/80">
                Typical: 45 Gy in 25 fractions or 46 Gy in 23 fractions.
              </div>
            </section>

            {/* Brachytherapy Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-semibold text-white">Brachytherapy Fractions</h2>
                </div>
                <button 
                  onClick={addInsertion}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Add Fraction
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {insertions.map((ins, idx) => (
                    <motion.div 
                      key={ins.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group"
                    >
                      <button 
                        onClick={() => removeInsertion(ins.id)}
                        className="absolute top-2 right-2 p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">Label</label>
                          <input 
                            type="text" 
                            value={ins.name}
                            onChange={e => updateInsertion(ins.id, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-slate-800 focus:border-cyan-500/50 outline-none py-1 text-sm text-slate-300"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">Dose (Gy)</label>
                          <input 
                            type="number" 
                            value={ins.dose}
                            onChange={e => updateInsertion(ins.id, 'dose', Number(e.target.value))}
                            className="w-full bg-transparent border-b border-slate-800 focus:border-cyan-500/50 outline-none py-1 text-sm font-mono text-white"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1 block">Fractions</label>
                          <input 
                            type="number" 
                            value={ins.fractions}
                            onChange={e => updateInsertion(ins.id, 'fractions', Number(e.target.value))}
                            className="w-full bg-transparent border-b border-slate-800 focus:border-cyan-500/50 outline-none py-1 text-sm font-mono text-white"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {insertions.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                    No brachytherapy fractions added.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5">
                <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-white">Combined EQD2 Summary</h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {results.map((res) => {
                    const isGoalMet = res.name.includes('HR-CTV') ? res.total >= 85 : res.total <= (res.name.includes('Bladder') ? 80 : 65);
                    const progress = Math.min(100, (res.total / 100) * 100);
                    
                    return (
                      <div key={res.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-300">{res.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">α/β={res.ab}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-mono font-bold ${res.color === 'cyan' ? 'text-cyan-400' : 'text-rose-400'}`}>
                              {res.total.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">Gy</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${res.color === 'cyan' ? 'bg-cyan-500' : 'bg-rose-500'}`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                          <span className="text-slate-600">Goal: {res.goal}</span>
                          <div className="flex items-center gap-1">
                            {isGoalMet ? (
                              <span className="text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Within Goal
                              </span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Review Plan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Info className="w-4 h-4 text-cyan-500" />
                    <span>Summation assumes full repair between fractions.</span>
                  </div>
                </div>
              </section>

              {/* Quick Reference Card */}
              <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Clinical Reminders
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-xs text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <span>D2cc limits are based on combined EBRT + Brachytherapy doses.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <span>HR-CTV D90 should be ≥ 85 Gy (EMBRACE I) or ≥ 90 Gy (EMBRACE II).</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                    <span>Ensure inter-fraction interval ≥ 6 hours for repair.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GraduationCap = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

export default CervixDosimeterPage;
