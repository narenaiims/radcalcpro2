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

  const results = useMemo(() => {
    return STRUCTURES.map(structure => {
      const ebrtEQD2 = ebrtFx * calcEQD2(ebrtDosePerFx, structure.ab);
      
      let brachyEQD2 = 0;
      fractions.forEach(fx => {
        const dose = fx[structure.name.toLowerCase().replace(/ /g, '').replace('d90', 'hrCtvD90').replace('d2cc', 'D2cc') as keyof BrachyFraction] as number;
        brachyEQD2 += calcEQD2(dose, structure.ab);
      });

      const total = ebrtEQD2 + brachyEQD2;
      return { ...structure, total, ebrtEQD2, brachyEQD2 };
    });
  }, [ebrtDosePerFx, ebrtFx, fractions]);

  const updateFraction = (id: string, field: keyof BrachyFraction, value: number) => {
    setFractions(fractions.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const adaptiveResults = useMemo(() => {
    const remainingFractions = 6 - fractions.filter(f => f.hrCtvD90 > 0).length;
    if (remainingFractions === 0) return { remainingFractions: 0, maxD90: 0, maxBladder: 0 };

    const hrCtvStructure = STRUCTURES.find(s => s.name === 'HR-CTV D90')!;
    const bladderStructure = STRUCTURES.find(s => s.name === 'Bladder D2cc')!;

    const currentHrCtvEQD2 = results.find(r => r.name === 'HR-CTV D90')!.brachyEQD2;
    const currentBladderEQD2 = results.find(r => r.name === 'Bladder D2cc')!.brachyEQD2;

    const targetHrCtvEQD2 = hrCtvStructure.goal - (ebrtFx * calcEQD2(ebrtDosePerFx, hrCtvStructure.ab));
    const limitBladderEQD2 = bladderStructure.limit - (ebrtFx * calcEQD2(ebrtDosePerFx, bladderStructure.ab));

    const remainingHrCtvEQD2 = Math.max(0, targetHrCtvEQD2 - currentHrCtvEQD2);
    const remainingBladderEQD2 = Math.max(0, limitBladderEQD2 - currentBladderEQD2);

    // Solve for d_brachy: EQD2 = d * (d + ab) / (2 + ab)
    // d^2 + ab*d - EQD2*(2+ab) = 0
    // d = (-ab + sqrt(ab^2 + 4*EQD2*(2+ab))) / 2
    const solveDose = (eqd2: number, ab: number) => {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Cervix Brachytherapy Accumulator</h1>
          <p className="text-slate-400">Combined EBRT + Brachytherapy EQD2 accumulation for GEC-ESTRO EMBRACE II.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">EBRT Component</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Total Dose (Gy)</label>
                  <input type="number" value={ebrtDose} onChange={e => setEbrtDose(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Fractions</label>
                  <input type="number" value={ebrtFx} onChange={e => setEbrtFx(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Dose/Fx (Gy)</label>
                  <input type="number" value={ebrtDosePerFx} onChange={e => setEbrtDosePerFx(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
              </div>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Brachytherapy Fractions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="pb-2 text-left">Fx</th>
                      <th className="pb-2">HR-CTV D90</th>
                      <th className="pb-2">Bladder D2cc</th>
                      <th className="pb-2">Rectum D2cc</th>
                      <th className="pb-2">Sigmoid D2cc</th>
                      <th className="pb-2">Vagina D2cc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fractions.map((fx, i) => (
                      <tr key={fx.id} className="border-b border-slate-800/50">
                        <td className="py-2">{i + 1}</td>
                        {['hrCtvD90', 'bladderD2cc', 'rectumD2cc', 'sigmoidD2cc', 'vaginaD2cc'].map(field => (
                          <td key={field} className="py-2">
                            <input type="number" value={fx[field as keyof BrachyFraction]} onChange={e => updateFraction(fx.id, field as keyof BrachyFraction, Number(e.target.value))} className="w-20 bg-slate-950 border border-slate-800 rounded p-1 text-center" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">ICRU 89 & Legacy</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">IR-CTV D98 (Gy)</label>
                  <input type="number" value={irCtvD98} onChange={e => setIrCtvD98(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Point A (Gy)</label>
                  <input type="number" value={pointADose} onChange={e => setPointADose(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">TRAK (cGy·m²)</label>
                  <input type="number" value={trak} onChange={e => setTrak(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2" />
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg border ${irCtvD98 >= 60 ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                {irCtvD98 >= 60 ? 'IR-CTV D98 compliant (≥ 60 Gy)' : 'IR-CTV D98 NOT compliant (< 60 Gy)'}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Combined EQD2</h2>
              <div className="space-y-4">
                {results.map(res => (
                  <div key={res.name} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg">
                    <span className="text-sm text-slate-300">{res.name}</span>
                    <span className={`font-mono font-bold ${res.total >= res.goal ? 'text-emerald-400' : 'text-amber-400'}`}>{res.total.toFixed(1)} Gy</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Adaptive Planning</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg">
                  <span className="text-sm text-slate-300">Remaining Fractions</span>
                  <span className="font-mono font-bold text-white">{adaptiveResults.remainingFractions}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg">
                  <span className="text-sm text-slate-300">Max D90/fx</span>
                  <span className="font-mono font-bold text-cyan-400">{adaptiveResults.maxD90.toFixed(1)} Gy</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg">
                  <span className="text-sm text-slate-300">Max Bladder/fx</span>
                  <span className="font-mono font-bold text-rose-400">{adaptiveResults.maxBladder.toFixed(1)} Gy</span>
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
