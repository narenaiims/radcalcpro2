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
  GraduationCap
} from 'lucide-react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

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

    // Solve for d_brachy: EQD2 = d * (d + ab) / (2 + ab)
    // d^2 + ab*d - EQD2*(2+ab) = 0
    // d = (-ab + sqrt(ab^2 + 4*EQD2*(2+ab))) / 2
    const solveDose = (eqd2: number, ab: number) => {
      if (eqd2 <= 0) return 0;
      return (-ab + Math.sqrt(Math.pow(ab, 2) + 4 * eqd2 * (2 + ab))) / 2;
    };

    const maxD90 = solveDose(remainingHrCtvEQD2 / remainingFractions, hrCtvStructure.ab);
    const maxBladder = solveDose(remainingBladderEQD2 / remainingFractions, bladderStructure.ab);

    return { remainingFractions, maxD90, maxBladder };
  }, [ebrtDosePerFx, ebrtFx, fractions, results]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "EMBRACE II Goals",
      emoji: "🎯",
      accent: "#00d4ff",
      bg: "rgba(0, 212, 255, 0.05)",
      border: "rgba(0, 212, 255, 0.2)",
      rows: STRUCTURES.map(s => ({ k: s.name, v: `${s.goal} Gy` }))
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 pb-20">
      <KeyFactsSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpen={() => setIsSidebarOpen(true)} data={SIDEBAR_DATA} />
      
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <header className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-sky-400" />
            <p className="label-micro text-sky-400">GEC-ESTRO EMBRACE II</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Cervix Brachytherapy Accumulator</h1>
          <p className="text-slate-500 font-serif italic">Combined EBRT + Brachytherapy EQD2 accumulation</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            {/* EBRT Station */}
            <div className="station">
              <div className="station-head">
                <div className="stn-num">01</div>
                <div className="stn-name">EBRT Component</div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="label-micro opacity-60">Total Dose (Gy)</label>
                  <NumberInput 
                    value={ebrtDose} 
                    onChange={e => setEbrtDose(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro opacity-60">Fractions</label>
                  <NumberInput 
                    value={ebrtFx} 
                    onChange={e => setEbrtFx(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro opacity-60">Dose/Fx (Gy)</label>
                  <NumberInput 
                    value={ebrtDosePerFx} 
                    onChange={e => setEbrtDosePerFx(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
              </div>
            </div>

            {/* Brachytherapy Station */}
            <div className="station">
              <div className="station-head">
                <div className="stn-num">02</div>
                <div className="stn-name">Brachytherapy Fractions</div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Planned:</span>
                  <select 
                    value={fractions.length}
                    onChange={(e) => {
                      const newCount = Number(e.target.value);
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
                    className="bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n} className="bg-slate-900">{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="p-4 label-micro opacity-40">Fx</th>
                      <th className="p-4 label-micro opacity-40">HR-CTV D90</th>
                      <th className="p-4 label-micro opacity-40">Bladder D2cc</th>
                      <th className="p-4 label-micro opacity-40">Rectum D2cc</th>
                      <th className="p-4 label-micro opacity-40">Sigmoid D2cc</th>
                      <th className="p-4 label-micro opacity-40">Vagina D2cc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {fractions.map((fx, i) => (
                      <tr key={fx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-sm text-slate-500">{i + 1}</td>
                        {['hrCtvD90', 'bladderD2cc', 'rectumD2cc', 'sigmoidD2cc', 'vaginaD2cc'].map(field => (
                          <td key={field} className="p-2">
                            <NumberInput 
                              value={fx[field as keyof BrachyFraction] || ''} 
                              onChange={e => updateFraction(fx.id, field as keyof BrachyFraction, e.target.value === '' ? 0 : Number(e.target.value))} 
                              className="input-premium w-full !px-4 !min-h-[36px]" 
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

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-6">
                {fractions.map((fx, i) => (
                  <div key={fx.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-black text-sky-400 uppercase tracking-widest">Fraction {i + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono text-slate-500">{i + 1}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'HR-CTV D90', field: 'hrCtvD90' },
                        { label: 'Bladder D2cc', field: 'bladderD2cc' },
                        { label: 'Rectum D2cc', field: 'rectumD2cc' },
                        { label: 'Sigmoid D2cc', field: 'sigmoidD2cc' },
                        { label: 'Vagina D2cc', field: 'vaginaD2cc' }
                      ].map(item => (
                        <div key={item.field} className="space-y-1.5">
                          <label className="label-micro opacity-40">{item.label}</label>
                          <NumberInput 
                            value={fx[item.field as keyof BrachyFraction] || ''} 
                            onChange={e => updateFraction(fx.id, item.field as keyof BrachyFraction, e.target.value === '' ? 0 : Number(e.target.value))} 
                            className="input-premium w-full" 
                            step="0.1"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ICRU Station */}
            <div className="station">
              <div className="station-head">
                <div className="stn-num">03</div>
                <div className="stn-name">ICRU 89 & Legacy Parameters</div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="label-micro opacity-60">IR-CTV D98 (Gy)</label>
                  <NumberInput 
                    value={irCtvD98} 
                    onChange={e => setIrCtvD98(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro opacity-60">Point A (Gy)</label>
                  <NumberInput 
                    value={pointADose} 
                    onChange={e => setPointADose(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro opacity-60">TRAK (cGy·m²)</label>
                  <NumberInput 
                    value={trak} 
                    onChange={e => setTrak(Number(e.target.value))} 
                    className="input-premium w-full" 
                  />
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${irCtvD98 >= 60 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {irCtvD98 >= 60 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {irCtvD98 >= 60 ? 'IR-CTV D98 compliant (≥ 60 Gy)' : 'IR-CTV D98 NOT compliant (< 60 Gy)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
            {/* Results Station */}
            <div className="station !bg-slate-900">
              <div className="station-head border-b border-white/5">
                <div className="stn-num !bg-sky-500">∑</div>
                <div className="stn-name text-white">Combined EQD2</div>
              </div>
              <div className="p-6 space-y-4">
                {results.map(res => (
                  <div key={res.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="label-micro opacity-40">{res.name}</p>
                        <p className="text-xs text-slate-500 italic">Target: {res.goal} Gy</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black font-mono leading-none ${res.total >= res.goal ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {res.total.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Gy EQD2</p>
                      </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (res.total / res.limit) * 100)}%` }}
                        className={`h-full ${res.total >= res.limit ? 'bg-rose-500' : res.total >= res.goal ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                    </div>

                    {res.hasMappingError && (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" />
                        Data mapping error
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Adaptive Planning Station */}
            <div className="station !bg-sky-500/5 border-sky-500/20">
              <div className="station-head border-b border-sky-500/10">
                <div className="stn-num !bg-sky-400">A</div>
                <div className="stn-name !text-sky-400">Adaptive Planning</div>
              </div>
              <div className="p-6 space-y-6">
                {adaptiveResults.remainingFractions > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <p className="label-micro opacity-60">Remaining Fractions</p>
                      <p className="text-2xl font-black font-mono text-white">{adaptiveResults.remainingFractions}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                        <p className="label-micro opacity-40">Required HR-CTV D90 / Fx</p>
                        <p className="text-3xl font-black font-mono text-sky-400">{adaptiveResults.maxD90.toFixed(1)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Gy per remaining fraction</p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                        <p className="label-micro opacity-40">Max Bladder D2cc / Fx</p>
                        <p className="text-3xl font-black font-mono text-rose-400">{adaptiveResults.maxBladder.toFixed(1)}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Gy per remaining fraction</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold text-white uppercase tracking-widest">All Fractions Complete</p>
                    <p className="text-xs text-slate-500 mt-1">Final evaluation ready</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clinical Principles */}
            <div className="station">
              <div className="station-head border-b border-white/5">
                <div className="stn-num !bg-slate-700">?</div>
                <div className="stn-name">Clinical Principles</div>
              </div>
              <div className="p-6 space-y-4 text-xs text-slate-400 leading-relaxed">
                <div className="flex gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <p><strong className="text-slate-200">EQD2 Accumulation:</strong> EBRT and Brachytherapy doses are converted to EQD2 using the LQ model. α/β = 10 Gy for tumour and 3 Gy for OARs (except Vagina, α/β = 3 Gy per EMBRACE II).</p>
                </div>
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-sky-500 shrink-0" />
                  <p><strong className="text-slate-200">Planning Goals:</strong> Target HR-CTV D90 ≥ 85 Gy. Bladder D2cc &lt; 80 Gy, Rectum/Sigmoid D2cc &lt; 65 Gy (hard limit 75 Gy).</p>
                </div>
                <div className="flex gap-3">
                  <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                  <p><strong className="text-slate-200">Adaptive Planning:</strong> The tool calculates the required dose for remaining fractions based on the current accumulation to reach EMBRACE II targets.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CervixDosimeterPage;
