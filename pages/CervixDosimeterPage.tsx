import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  ShieldAlert,
  GraduationCap,
  Activity
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadialGauge } from '../src/components/RadialGauge';

import { NumberInput } from '../src/components/NumberInput';

const STORAGE_KEY = 'radonco_cervix_dosimeter_v2';

interface BrachyFraction {
  id: string;
  hrCtvD90: number;
  bladderD2cc: number;
  rectumD2cc: number;
  sigmoidD2cc: number;
  vaginaD2cc: number;
}

const STRUCTURES = [
  { name: 'HR-CTV D90', ab: 10, goal: 85, limit: 90, color: 'cyan' },
  { name: 'Bladder D2cc', ab: 3, goal: 80, limit: 90, color: 'rose' },
  { name: 'Rectum D2cc', ab: 3, goal: 65, limit: 75, color: 'rose' },
  { name: 'Sigmoid D2cc', ab: 3, goal: 70, limit: 75, color: 'rose' },
  { name: 'Vagina D2cc', ab: 3, goal: 90, limit: 100, color: 'rose' },
];

const CervixDosimeterPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ebrtDose, setEbrtDose] = useState<number>(45);
  const [ebrtFx, setEbrtFx] = useState<number>(25);
  const [ebrtDosePerFx, setEbrtDosePerFx] = useState<number>(1.8);
  const [fractions, setFractions] = useState<BrachyFraction[]>(Array.from({ length: 6 }, (_, i) => ({
    id: i.toString(), hrCtvD90: 7.5, bladderD2cc: 7.0, rectumD2cc: 5.0, sigmoidD2cc: 5.0, vaginaD2cc: 6.0
  })));
  
  const [irCtvD98, setIrCtvD98] = useState<number>(60);
  const [pointADose, setPointADose] = useState<number>(0);
  const [trak, setTrak] = useState<number>(0);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEbrtDose(parsed.ebrtDose || 45);
        setEbrtFx(parsed.ebrtFx || 25);
        setEbrtDosePerFx(parsed.ebrtDosePerFx || 1.8);
        setFractions(parsed.fractions || []);
        setIrCtvD98(parsed.irCtvD98 || 60);
        setPointADose(parsed.pointADose || 0);
        setTrak(parsed.trak || 0);
      } catch (e) {
        console.error("Failed to load cervix dosimeter state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ebrtDose, ebrtFx, ebrtDosePerFx, fractions, irCtvD98, pointADose, trak }));
  }, [ebrtDose, ebrtFx, ebrtDosePerFx, fractions, irCtvD98, pointADose, trak]);

  const calcEQD2 = (dose: number, ab: number) => {
    return dose * (dose + ab) / (2 + ab);
  };

  const STRUCTURE_KEY_MAP: Record<string, keyof BrachyFraction> = {
    'HR-CTV D90':   'hrCtvD90',
    'Bladder D2cc': 'bladderD2cc',
    'Rectum D2cc':  'rectumD2cc',
    'Sigmoid D2cc': 'sigmoidD2cc',
    'Vagina D2cc':  'vaginaD2cc',
  };

  const results = useMemo(() => {
    return STRUCTURES.map(structure => {
      const ebrtEQD2 = ebrtFx * calcEQD2(ebrtDosePerFx, structure.ab);
      
      let brachyEQD2 = 0;
      let hasMappingError = false;
      
      fractions.forEach(fx => {
        const key = STRUCTURE_KEY_MAP[structure.name];
        const dose = fx[key];
        
        if (dose === undefined) {
          console.error(`Data mapping error for structure: ${structure.name}`);
          hasMappingError = true;
        } else {
          brachyEQD2 += calcEQD2(Number(dose) || 0, structure.ab);
        }
      });

      const total = ebrtEQD2 + brachyEQD2;
      return { ...structure, total, ebrtEQD2, brachyEQD2, hasMappingError };
    });
  }, [ebrtDosePerFx, ebrtFx, fractions]);

  const updateFraction = (id: string, field: keyof BrachyFraction, value: number) => {
    setFractions(fractions.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const adaptiveResults = useMemo(() => {
    const remainingFractions = fractions.filter(f => !f.hrCtvD90 || f.hrCtvD90 === 0).length;
    if (remainingFractions === 0) return { remainingFractions: 0, maxD90: 0, maxBladder: 0 };

    const hrCtvStructure = STRUCTURES.find(s => s.name === 'HR-CTV D90')!;
    const bladderStructure = STRUCTURES.find(s => s.name === 'Bladder D2cc')!;

    const currentHrCtvEQD2 = results.find(r => r.name === 'HR-CTV D90')!.brachyEQD2;
    const currentBladderEQD2 = results.find(r => r.name === 'Bladder D2cc')!.brachyEQD2;

    const targetHrCtvEQD2 = 85 - (ebrtFx * calcEQD2(ebrtDosePerFx, hrCtvStructure.ab));
    const limitBladderEQD2 = bladderStructure.limit - (ebrtFx * calcEQD2(ebrtDosePerFx, bladderStructure.ab));

    const remainingHrCtvEQD2 = Math.max(0, targetHrCtvEQD2 - currentHrCtvEQD2);
    const remainingBladderEQD2 = Math.max(0, limitBladderEQD2 - currentBladderEQD2);

    const solveDose = (eqd2: number, ab: number) => {
      if (eqd2 <= 0) return 0;
      return (-ab + Math.sqrt(Math.pow(ab, 2) + 4 * eqd2 * (2 + ab))) / 2;
    };

    const maxD90 = solveDose(remainingHrCtvEQD2 / remainingFractions, hrCtvStructure.ab);
    const maxBladder = solveDose(remainingBladderEQD2 / remainingFractions, bladderStructure.ab);

    return { remainingFractions, maxD90, maxBladder };
  }, [ebrtDosePerFx, ebrtFx, fractions, results]);

  const radarData = useMemo(() => {
    return results.map(res => ({
      subject: res.name.replace(' D2cc', '').replace(' D90', ''),
      EQD2: Number(res.total.toFixed(1)),
      Goal: res.goal,
      Limit: res.limit,
      fullMark: Math.max(res.limit + 10, res.total + 5),
    }));
  }, [results]);

  const barData = useMemo(() => {
    return results.map(res => {
      const structure = STRUCTURES.find(s => s.name === res.name)!;
      const ebrtEQD2Value = ebrtFx * calcEQD2(ebrtDosePerFx, structure.ab);
      const dataPoint: any = { 
        name: res.name.replace(' D2cc', '').replace(' D90', ''),
        EBRT: Number(ebrtEQD2Value.toFixed(1)),
      };
      fractions.forEach((fx, i) => {
        const key = STRUCTURE_KEY_MAP[structure.name];
        const dose = Number(fx[key]) || 0;
        dataPoint[`Fx${i + 1}`] = Number(calcEQD2(dose, structure.ab).toFixed(1));
      });
      return dataPoint;
    });
  }, [results, ebrtFx, ebrtDosePerFx, fractions]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "EMBRACE II Goals",
      emoji: "🎯",
      accent: "#00d4ff",
      bg: "rgba(0, 212, 255, 0.05)",
      border: "rgba(0, 212, 255, 0.2)",
      rows: [
        ...STRUCTURES.map(s => ({ k: s.name, v: `${s.goal} Gy` })),
        { k: "IR-CTV D98", v: "≥ 60 Gy" },
        { k: "Point A", v: "Historical reference" },
      ]
    },
    {
      title: "OAR Constraints (D2cc)",
      emoji: "🛡️",
      accent: "#f43f5e",
      bg: "rgba(244, 63, 94, 0.05)",
      border: "rgba(244, 63, 94, 0.2)",
      rows: [
        { k: "Bladder", v: "< 80 Gy (Goal < 70)" },
        { k: "Rectum", v: "< 65 Gy (Goal < 60)" },
        { k: "Sigmoid", v: "< 70 Gy" },
        { k: "Vagina", v: "< 65 Gy (at 2cm²)" },
      ]
    },
    {
      title: "Radiobiology",
      emoji: "🧬",
      accent: "#10b981",
      bg: "rgba(16, 185, 129, 0.05)",
      border: "rgba(16, 185, 129, 0.2)",
      rows: [
        { k: "α/β (Tumor)", v: "10 Gy" },
        { k: "α/β (OARs)", v: "3 Gy" },
        { k: "Repair T½", v: "1.5 hours" },
        { k: "EQD2 Formula", v: "D × ([d+α/β] / [2+α/β])" },
      ]
    },
    {
      title: "Clinical Pearls",
      emoji: "💡",
      accent: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.05)",
      border: "rgba(251, 191, 36, 0.2)",
      rows: [
        { k: "Overall Time", v: "< 56 days (8 weeks)" },
        { k: "TRAK", v: "Total Reference Air Kerma" },
        { k: "ICRU 89", v: "Volume-based reporting" },
        { k: "HR-CTV", v: "High-Risk CTV" },
        { k: "IR-CTV", v: "Intermediate-Risk CTV" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 selection:bg-blue-500/30">
      <KeyFactsSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} data={SIDEBAR_DATA} />
      
      {/* ── Atmospheric Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 mesh-grid opacity-[0.03] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12 relative z-10">
        {/* ── Command Center Header ───────────────────────────────────── */}
        <header className="mb-16 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">
                    GEC-ESTRO EMBRACE II System
                  </span>
                </div>
                <div className="px-3 py-1 bg-slate-800 border border-white/5 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
                    V2.4.0-STABLE
                  </span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
                Cervix Brachy <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                  Accumulator
                </span>
              </h1>
              <p className="max-w-xl text-slate-400 text-sm font-medium leading-relaxed italic border-l-2 border-slate-800 pl-4">
                Advanced cross-modality radiobiological integration protocol. 
                Synchronizing EBRT datasets with longitudinal brachytherapy telemetry.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="px-8 py-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Session Telemetry</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-black text-white font-mono">
                    {(ebrtDose + fractions.reduce((acc, f) => acc + (f.hrCtvD90 || 0), 0)).toFixed(1)}
                   </span>
                   <span className="text-xs font-black text-slate-700 font-mono">Gy Total</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          {/* ── Input Module ────────────────────────────── */}
          <div className="xl:col-span-12 space-y-12 mb-12">
            
            {/* 01: EBRT Station */}
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center justify-center text-white">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">01: EBRT COMPONENT</h3>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">External beam baseline validation</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Physical Dose (Gy)</label>
                    <NumberInput 
                      value={ebrtDose} 
                      onChange={e => setEbrtDose(Number(e.target.value))} 
                      className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-3xl font-black font-mono text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-800" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Fractionation Count</label>
                    <NumberInput 
                      value={ebrtFx} 
                      onChange={e => setEbrtFx(Number(e.target.value))} 
                      className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-3xl font-black font-mono text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-800" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Dose per Fraction (Gy)</label>
                    <NumberInput 
                      value={ebrtDosePerFx} 
                      onChange={e => setEbrtDosePerFx(Number(e.target.value))} 
                      className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-3xl font-black font-mono text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-800" 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 02: Brachytherapy Fractions */}
            <section className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
               <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                 
                 <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">02: BT FRACTION INPUTS</h3>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Individual insert dosimetry records</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Session Count</p>
                    <div className="flex gap-1 h-10 p-1 bg-black/40 rounded-xl border border-white/5">
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            const newCount = n;
                            if (newCount > fractions.length) {
                              const newFractions = [...fractions];
                              for (let i = fractions.length; i < newCount; i++) {
                                newFractions.push({ id: Date.now().toString() + i, hrCtvD90: 0, bladderD2cc: 0, rectumD2cc: 0, sigmoidD2cc: 0, vaginaD2cc: 0 });
                              }
                              setFractions(newFractions);
                            } else if (newCount < fractions.length) {
                              setFractions(fractions.slice(0, newCount));
                            }
                          }}
                          className={`w-10 rounded-lg text-xs font-black font-mono transition-all ${
                            fractions.length === n 
                              ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                              : 'text-slate-600 hover:text-slate-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2 sm:p-6 overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-2">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600">FX</th>
                        {STRUCTURES.map(s => (
                           <th key={s.name} className="px-4 py-3">
                             <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.name.split(' ')[0]}</span>
                               <span className="text-[9px] font-black text-slate-600 opacity-60 uppercase tracking-[0.2em]">{s.name.split(' ')[1]}</span>
                             </div>
                           </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fractions.map((fx, i) => (
                        <tr key={fx.id} className="group/row">
                          <td className="px-4 py-3">
                            <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-[10px] font-black font-mono text-emerald-500 group-hover/row:border-emerald-500/30 transition-colors">
                              {i + 1}
                            </div>
                          </td>
                          {['hrCtvD90', 'bladderD2cc', 'rectumD2cc', 'sigmoidD2cc', 'vaginaD2cc'].map(field => (
                            <td key={field} className="min-w-[120px]">
                              <NumberInput 
                                value={fx[field as keyof BrachyFraction] || ''} 
                                onChange={e => updateFraction(fx.id, field as keyof BrachyFraction, e.target.value === '' ? 0 : Number(e.target.value))} 
                                className="w-full bg-slate-950/30 border border-white/5 p-4 rounded-xl text-lg font-black font-mono text-white focus:bg-slate-950/80 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-800" 
                                step="0.1"
                                min="0"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

             {/* 03: ICRU Station */}
             <section className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-fuchsia-600/10 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                  
                  <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600 shadow-xl shadow-purple-500/20 flex items-center justify-center text-white">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">03: ICRU 89 METRICS</h3>
                        <p className="text-[10px] text-slate-500 font-medium tracking-tight">Legacy and historical benchmarking</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 lg:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
                       <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">IR-CTV D98 (Gy)</label>
                        <NumberInput 
                          value={irCtvD98} 
                          onChange={e => setIrCtvD98(Number(e.target.value))} 
                          className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-2xl font-black font-mono text-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Historical Point A (Gy)</label>
                        <NumberInput 
                          value={pointADose} 
                          onChange={e => setPointADose(Number(e.target.value))} 
                          className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-2xl font-black font-mono text-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" 
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">TRAK (cGy·m²)</label>
                        <NumberInput 
                          value={trak} 
                          onChange={e => setTrak(Number(e.target.value))} 
                          className="w-full bg-slate-950/50 border border-white/10 p-6 rounded-2xl text-2xl font-black font-mono text-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] border flex items-center gap-5 transition-all duration-500 ${
                      irCtvD98 >= 60 
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]' 
                        : 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)]'
                    }`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                         irCtvD98 >= 60 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {irCtvD98 >= 60 ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${irCtvD98 >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          IR-CTV D98 ACCUMULATION STATUS
                        </p>
                        <p className="text-xl font-black text-white tracking-tight italic">
                          {irCtvD98 >= 60 
                            ? 'PROTOCOL COMPLIANT (Target ≥ 60 Gy)' 
                            : 'SUB-OPTIMAL YIELD (Below Recommendation)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
             </section>
          </div>

          {/* ── Results Panel ───────────────────── */}
          <div className="xl:col-span-12 space-y-12">
            
            {/* Combined EQD2 Telemetry */}
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-slate-950 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-[0.03] mesh-grid pointer-events-none" />
                
                <div className="p-8 lg:p-12">
                   <div className="flex items-center justify-between mb-12">
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 font-mono">DOSE ACCUMULATION TELEMETRY</p>
                        </div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">COMBINED EQD2 YIELD</h2>
                     </div>
                     <Activity className="w-8 h-8 text-slate-800" />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                      {results.map(res => (
                        <motion.div 
                          key={res.name}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className="relative p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden group/card"
                        >
                           <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-0 group-hover/card:opacity-20 transition-opacity duration-1000 ${res.total >= res.goal ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                           
                           <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{res.name}</p>
                                <p className="text-[10px] font-black italic text-slate-700">TARGET {res.goal} GY</p>
                              </div>

                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className={`text-4xl font-black font-mono tracking-tighter leading-none ${res.total >= res.goal ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {res.total.toFixed(1)}
                                    </p>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">EQD2 TOTAL</p>
                                 </div>
                                 <RadialGauge
                                    value={res.total}
                                    max={res.limit}
                                    size={48}
                                    strokeWidth={5}
                                    showPercentage={true}
                                  />
                              </div>

                              <div className="pt-4 border-t border-white/5 flex gap-4">
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase">EBRT</p>
                                   <p className="text-xs font-black text-slate-300 font-mono">{res.ebrtEQD2.toFixed(1)}</p>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase">BT</p>
                                   <p className="text-xs font-black text-slate-300 font-mono">{res.brachyEQD2.toFixed(1)}</p>
                                </div>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            {/* Visualizations Module */}
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">04: VISUAL ANALYTICS</h3>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Geometric and volumetric distribution</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 lg:p-12 space-y-16">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Radar Chart */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Balance Profile (EQD2)</p>
                      </div>
                      <div className="h-80 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                            <Radar name="Current Yield" dataKey="EQD2" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                            <Radar name="Target Goal" dataKey="Goal" stroke="#10b981" fill="none" strokeDasharray="4 4" />
                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '11px', borderRadius: '12px', padding: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', letterSpacing: '0.1em', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stacked Bar Chart */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fractional Contribution Matrix</p>
                      </div>
                      <div className="h-80 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '11px', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', letterSpacing: '0.1em', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }} />
                            <Bar dataKey="EBRT" stackId="a" fill="#334155" radius={[0, 0, 0, 0]} />
                            {fractions.map((_, i) => (
                              <Bar 
                                key={`Fx${i+1}`} 
                                dataKey={`Fx${i+1}`} 
                                stackId="a" 
                                fill={i % 2 === 0 ? '#10b981' : '#059669'} 
                                fillOpacity={0.4 + (i * 0.1)}
                                radius={i === fractions.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Adaptive Projection Station */}
            <section className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-sky-600/10 to-indigo-600/10 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
               <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                 
                 <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-600 shadow-xl shadow-sky-500/20 flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">05: ADAPTIVE PROJECTION</h3>
                        <p className="text-[10px] text-slate-500 font-medium tracking-tight">Real-time compensation adjustments</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 lg:p-12">
                    {adaptiveResults.remainingFractions > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="p-8 bg-slate-950/50 border border-white/10 rounded-[2rem] flex flex-col justify-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Remaining Fractions</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-6xl font-black text-white font-mono">{adaptiveResults.remainingFractions}</span>
                             <span className="text-sm font-black text-slate-700 uppercase tracking-widest italic">Pending</span>
                           </div>
                        </div>
                        
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Required HR-CTV D90 / Fx</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black font-mono text-white">{adaptiveResults.maxD90.toFixed(1)}</span>
                                <span className="text-xs font-black text-blue-500/50 uppercase tracking-widest">Gy</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium italic">Adjusted target for protocol compliance</p>
                           </div>
                           
                           <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] space-y-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Max Bladder D2cc / Fx</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black font-mono text-white">{adaptiveResults.maxBladder.toFixed(1)}</span>
                                <span className="text-xs font-black text-rose-500/50 uppercase tracking-widest">Gy</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium italic">Calculated limit for OAR preservation</p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-2xl font-black text-white tracking-widest uppercase italic">All Iterations Synchronized</p>
                           <p className="text-sm text-slate-500 max-w-md mx-auto italic">Final dose accumulation data is ready for archival and clinical verification. Protocol complete.</p>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </section>

            {/* Clinical Logic Protocol */}
            <section className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-slate-600/10 to-slate-400/10 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
               <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 shadow-xl flex items-center justify-center text-white">
                        <Info className="w-6 h-6" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Clinical Logic Protocol</h3>
                    </div>
                  </div>
                  
                  <div className="p-8 lg:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-[11px] leading-relaxed tracking-wide uppercase font-black">
                      <div className="space-y-4 p-6 bg-slate-950/30 rounded-[2rem] border border-white/5">
                        <ShieldAlert className="w-6 h-6 text-amber-500" />
                        <h4 className="text-slate-200">EQD2 Accumulation</h4>
                        <p className="text-slate-500 normal-case font-medium italic">EBRT and Brachytherapy doses are converted using the LQ model (α/β=10 Gy tumor, 3 Gy OARs).</p>
                      </div>
                      
                      <div className="space-y-4 p-6 bg-slate-950/30 rounded-[2rem] border border-white/5">
                        <Target className="w-6 h-6 text-sky-500" />
                        <h4 className="text-slate-200">Planning Thresholds</h4>
                        <p className="text-slate-500 normal-case font-medium italic">Primary HR-CTV target ≥85 Gy. Critical OAR limits: Bladder &lt;80 Gy, Rectum &lt;65 Gy.</p>
                      </div>
                      
                      <div className="space-y-4 p-6 bg-slate-950/30 rounded-[2rem] border border-white/5">
                        <GraduationCap className="w-6 h-6 text-purple-500" />
                        <h4 className="text-slate-200">Adaptive Planning</h4>
                        <p className="text-slate-500 normal-case font-medium italic">Real-time derivation of required intensity for remaining fractions to achieve protocol success.</p>
                      </div>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CervixDosimeterPage;
