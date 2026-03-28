import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  AlertTriangle, 
  Info, 
  User, 
  Baby, 
  Ruler, 
  Activity,
  ChevronRight,
  BookOpen,
  Calculator,
  ArrowRight
} from 'lucide-react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────

interface ScalingResult {
  method: string;
  formula: string;
  dose: number;
  description: string;
  color: string;
}

const SAFETY_NOTE = "Paediatric radiation therapy requires specialist planning review. All doses must be verified by a paediatric radiation oncologist (COG institutional membership or equivalent). These calculations are reference guides only.";

const COG_CONSTRAINTS = {
  spine: [
    { maxAge: 1.5, maxDose: 20, desc: "< 18 months: 20 Gy" },
    { maxAge: 6, maxDose: 30, desc: "18m–6y: 25–30 Gy" },
    { maxAge: 12, maxDose: 35, desc: "6–12y: 35 Gy" },
  ],
  lung: [
    { maxAge: 3, maxDose: 15, desc: "< 3y: 12–15 Gy" },
    { maxAge: 10, maxDose: 18, desc: "3–10y: 15–18 Gy" },
  ],
  brain: [
    { maxAge: 3, maxDose: 20, desc: "< 3y: 18–20 Gy" },
    { maxAge: 5, maxDose: 24, desc: "3–5y: 24 Gy" },
    { maxAge: 100, maxDose: 36, desc: "> 5y: 30–36 Gy" },
  ]
};

const ADULT_REF_WEIGHT = 70; // kg
const ADULT_REF_BSA = 1.73;   // m²

// Typical growth data for reference (simplified)
const GROWTH_REFERENCE = [
  { age: 0, weight: 3.5, height: 50, bsa: 0.22 },
  { age: 1, weight: 10, height: 75, bsa: 0.45 },
  { age: 3, weight: 14, height: 95, bsa: 0.61 },
  { age: 5, weight: 18, height: 110, bsa: 0.74 },
  { age: 8, weight: 25, height: 128, bsa: 0.94 },
  { age: 12, weight: 40, height: 150, bsa: 1.30 },
  { age: 15, weight: 55, height: 165, bsa: 1.58 },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const InputField = ({ label, value, onChange, icon: Icon, unit, min = 0, max = 300, step = 0.1 }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-slate-400" />}
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
      />
      {unit && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const ScalingCard = ({ result, adultDose }: { result: ScalingResult; adultDose: number }) => (
  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-widest ${result.color} mb-1`}>
          {result.method}
        </h3>
        <p className="text-[10px] font-mono text-slate-500">
          {result.formula}
        </p>
      </div>
      <div className={`w-8 h-8 rounded-full ${result.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
        <Activity size={14} className={result.color} />
      </div>
    </div>
    
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-3xl font-black text-white tracking-tight">
        {result.dose.toFixed(2)}
      </span>
      <span className="text-sm font-bold text-slate-400">Gy</span>
    </div>

    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((result.dose / (adultDose || 1)) * 100, 100)}%` }}
        className={`h-full ${result.color.replace('text-', 'bg-')}`}
      />
    </div>

    <p className="text-[11px] text-slate-400 leading-relaxed italic">
      "{result.description}"
    </p>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PediatricScalingPage() {
  const [adultDose, setAdultDose] = useState<number>(50);
  const [age, setAge] = useState<number>(8);
  const [weight, setWeight] = useState<number>(25);
  const [height, setHeight] = useState<number>(128);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('ped_scaling_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAdultDose(parsed.adultDose);
      setAge(parsed.age);
      setWeight(parsed.weight);
      setHeight(parsed.height);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ped_scaling_state', JSON.stringify({ adultDose, age, weight, height }));
  }, [adultDose, age, weight, height]);

  // Calculations
  const bsa = useMemo(() => {
    if (weight <= 0 || height <= 0) return 0;
    // Mosteller formula: sqrt(H*W/3600)
    return Math.sqrt((height * weight) / 3600);
  }, [weight, height]);

  const scalingResults = useMemo((): ScalingResult[] => {
    if (adultDose <= 0) return [];

    const results: ScalingResult[] = [
      {
        method: "BSA-Based (Mosteller)",
        formula: "Dose × (BSA / 1.73)",
        dose: bsa > 0 ? adultDose * (bsa / ADULT_REF_BSA) : 0,
        description: "Standard clinical method. Accounts for metabolic rate and physiological maturity better than weight alone.",
        color: "text-cyan-400"
      },
      {
        method: "Weight-Based (Clark)",
        formula: "Dose × (Weight / 70)",
        dose: weight > 0 ? adultDose * (weight / ADULT_REF_WEIGHT) : 0,
        description: "Simple approximation. May underestimate dose in infants and overestimate in obese children.",
        color: "text-emerald-400"
      },
      {
        method: "Age-Based (Young's Rule)",
        formula: "Dose × [Age / (Age + 12)]",
        dose: age > 0 ? adultDose * (age / (age + 12)) : 0,
        description: "Traditional rule for children aged 1–12. Less accurate for modern radiotherapy but useful for historical context.",
        color: "text-amber-400"
      },
      {
        method: "Cowling's Rule",
        formula: "Dose × [(Age + 1) / 24]",
        dose: age > 0 ? adultDose * ((age + 1) / 24) : 0,
        description: "Alternative age-based scaling. Often used as a cross-check for pediatric medication.",
        color: "text-indigo-400"
      }
    ];

    return results;
  }, [adultDose, weight, bsa, age]);

  const SIDEBAR_DATA: KeyFactSection[] = [
    {
      title: "Scaling Principles",
      emoji: "📐",
      accent: "#22d3ee",
      bg: "rgba(34, 211, 238, 0.08)",
      border: "rgba(34, 211, 238, 0.4)",
      rows: [
        { k: "BSA Preferred", v: "Reflects metabolic rate", mono: false },
        { k: "Adult BSA Ref", v: "1.73 m²", mono: true },
        { k: "Adult Weight Ref", v: "70 kg", mono: true },
        { k: "Growth Plates", v: "High radiosensitivity", mono: false },
      ]
    },
    {
      title: "Clinical Caveats",
      emoji: "⚠️",
      accent: "#f43f5e",
      bg: "rgba(244, 63, 94, 0.08)",
      border: "rgba(244, 63, 94, 0.4)",
      rows: [
        { k: "Infants (<1y)", v: "Extreme sensitivity", mono: false },
        { k: "Organ Maturity", v: "Age-dependent tolerance", mono: false },
        { k: "Secondary Cancer", v: "Higher lifetime risk", mono: false },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-cyan-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        {/* Safety Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-12 flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-rose-500" size={20} />
          </div>
          <p className="text-sm text-rose-200 leading-relaxed">
            {SAFETY_NOTE}
          </p>
        </motion.div>

        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Scale className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Pediatric Dose Scaling
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Clinical Tool
                </span>
              </h1>
              <p className="text-slate-400 text-sm">
                Multi-parametric scaling for pediatric radiotherapy dose estimation.
              </p>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                <Calculator size={14} /> Patient Parameters
              </h2>
              
              <div className="space-y-5">
                <InputField 
                  label="Adult Reference Dose" 
                  value={adultDose} 
                  onChange={setAdultDose} 
                  icon={Activity} 
                  unit="Gy" 
                />
                <div className="h-px bg-slate-800 my-2" />
                <InputField 
                  label="Patient Age" 
                  value={age} 
                  onChange={setAge} 
                  icon={Baby} 
                  unit="Years" 
                  max={18}
                />
                <InputField 
                  label="Patient Weight" 
                  value={weight} 
                  onChange={setWeight} 
                  icon={User} 
                  unit="kg" 
                />
                <InputField 
                  label="Patient Height" 
                  value={height} 
                  onChange={setHeight} 
                  icon={Ruler} 
                  unit="cm" 
                />

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calculated BSA</span>
                    <span className="text-lg font-black text-cyan-400 font-mono">{bsa.toFixed(2)} m²</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Mosteller Formula: √[(Height × Weight) / 3600]
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                <BookOpen size={14} /> COG Age Constraints
              </h2>
              <div className="space-y-4">
                {Object.entries(COG_CONSTRAINTS).map(([organ, constraints]) => (
                  <div key={organ}>
                    <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2">{organ}</h3>
                    <div className="space-y-1">
                      {constraints.map((c, i) => (
                        <div key={i} className={`text-[11px] p-2 rounded ${age <= c.maxAge ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400'}`}>
                          {c.desc}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Growth Reference Mini-Table */}
            <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Typical Growth Reference
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-4 text-[9px] font-bold text-slate-600 uppercase tracking-tighter pb-1 border-b border-slate-800">
                  <span>Age</span>
                  <span>Wt (kg)</span>
                  <span>Ht (cm)</span>
                  <span>BSA</span>
                </div>
                {GROWTH_REFERENCE.map((ref, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setAge(ref.age);
                      setWeight(ref.weight);
                      setHeight(ref.height);
                    }}
                    className="grid grid-cols-4 w-full text-left text-[10px] py-1.5 hover:bg-slate-800/50 rounded px-1 transition-colors group"
                  >
                    <span className="text-slate-400 group-hover:text-cyan-400">{ref.age}y</span>
                    <span className="text-slate-500">{ref.weight}</span>
                    <span className="text-slate-500">{ref.height}</span>
                    <span className="text-slate-500 font-mono">{ref.bsa.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {scalingResults.map((res, idx) => (
                  <motion.div
                    key={res.method}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ScalingCard result={res} adultDose={adultDose} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Clinical Warning */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-500 mb-1">Clinical Safety Notice</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dose scaling is an estimation tool. Pediatric radiotherapy requires consideration of organ maturity, growth plate locations, and long-term toxicity risks. **BSA-based scaling is generally preferred** over weight or age alone. Always consult disease-specific protocols (COG, SIOP) for definitive pediatric dosing.
                </p>
              </div>
            </motion.div>

            {/* Comparison Chart Placeholder / Visual */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Dose Scaling Comparison</h3>
                  <p className="text-[11px] text-slate-500">Relative dose comparison across different scaling methods.</p>
                </div>
                <Activity className="text-slate-700" size={20} />
              </div>
              
              <div className="space-y-6">
                {scalingResults.map(res => (
                  <div key={res.method} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400">{res.method}</span>
                      <span className={res.color}>{((res.dose / (adultDose || 1)) * 100).toFixed(1)}% of Adult Dose</span>
                    </div>
                    <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((res.dose / (adultDose || 1)) * 100, 100)}%` }}
                        className={`h-full ${res.color.replace('text-', 'bg-')} shadow-[0_0_15px_rgba(34,211,238,0.2)]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <KeyFactsSidebar 
        data={SIDEBAR_DATA} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
      />

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 pb-12">
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <BookOpen size={12} />
            References: Mosteller (1987), Clark (1909), Young (1813), SIOP Guidelines.
          </div>
          <div className="text-[10px] text-slate-600">
            © 2026 Radiobiology Toolkit · Pediatric Oncology Module
          </div>
        </div>
      </footer>
    </div>
  );
}
