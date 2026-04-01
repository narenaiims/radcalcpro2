import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Info, 
  Target, 
  ChevronRight, 
  BookOpen, 
  Activity,
  Shield,
  Layers,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────

const BRAGG_PEAK_DATA = [
  { depth: 0, photon: 100, proton: 30 },
  { depth: 1, photon: 95, proton: 31 },
  { depth: 2, photon: 90, proton: 32 },
  { depth: 3, photon: 85, proton: 33 },
  { depth: 4, photon: 80, proton: 34 },
  { depth: 5, photon: 75, proton: 35 },
  { depth: 6, photon: 70, proton: 37 },
  { depth: 7, photon: 66, proton: 40 },
  { depth: 8, photon: 62, proton: 45 },
  { depth: 9, photon: 58, proton: 55 },
  { depth: 10, photon: 55, proton: 100 }, // Bragg Peak
  { depth: 10.2, photon: 54, proton: 10 },
  { depth: 10.5, photon: 53, proton: 2 },
  { depth: 11, photon: 52, proton: 0 },
  { depth: 12, photon: 50, proton: 0 },
  { depth: 13, photon: 48, proton: 0 },
  { depth: 14, photon: 46, proton: 0 },
  { depth: 15, photon: 44, proton: 0 },
];

const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: "Proton Physics",
    emoji: "⚛️",
    accent: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.1)",
    border: "rgba(56, 189, 248, 0.2)",
    rows: [
      { k: "Mass", v: "1.67 × 10⁻²⁷ kg", mono: true },
      { k: "Rest Energy", v: "938.3 MeV", mono: true },
      { k: "Charge", v: "+1.6 × 10⁻¹⁹ C", mono: true },
      { k: "Interaction", v: "Coulomb (Inelastic)", mono: false },
      { k: "Bragg Peak", v: "End-of-range peak", mono: false },
      { k: "SOBP", v: "Summed Bragg Peaks", mono: false },
      { k: "Range", v: "∝ Energy¹·⁷⁸", mono: true },
      { k: "Scattering", v: "Multiple Coulomb (MCS)", mono: false },
    ]
  },
  {
    title: "Radiobiology",
    emoji: "🧬",
    accent: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.1)",
    border: "rgba(244, 63, 94, 0.2)",
    rows: [
      { k: "RBE", v: "1.1 (Clinical standard)", mono: true },
      { k: "LET", v: "0.5–2.0 keV/μm (avg)", mono: true },
      { k: "Distal LET", v: "Up to 10+ keV/μm", mono: true },
      { k: "OER", v: "2.5–3.0 (Low LET)", mono: true },
      { k: "Cell Cycle", v: "Sensitive in G2/M", mono: false },
      { k: "Repair", v: "Sublethal damage repair", mono: false },
    ]
  },
  {
    title: "Clinical Delivery",
    emoji: "🏥",
    accent: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
    rows: [
      { k: "PBS", v: "Pencil Beam Scanning", mono: false },
      { k: "DS", v: "Double Scattering", mono: false },
      { k: "Aperture", v: "Brass (for DS)", mono: false },
      { k: "Compensator", v: "Lucite/Wax (for DS)", mono: false },
      { k: "Snout", v: "Holds apertures/shifters", mono: false },
      { k: "Spot Size", v: "3–10 mm (sigma)", mono: true },
    ]
  }
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProtonTherapyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 font-sans selection:bg-sky-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-sky-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Proton Therapy
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Reference Guide
                </span>
              </h1>
              <p className="text-slate-400 text-sm">
                Understanding the physics and radiobiology of heavy charged particle therapy.
              </p>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Key Concepts */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-6 flex items-center gap-2">
                <Layers size={14} /> Core Principles
              </h2>
              
              <div className="space-y-4">
                {[
                  { title: "Bragg Peak", desc: "The phenomenon where protons deposit most of their energy at a specific depth, followed by a sharp drop-off." },
                  { title: "SOBP", desc: "Spread-Out Bragg Peak: Superimposing multiple Bragg peaks of different energies to cover a target volume." },
                  { title: "RBE of 1.1", desc: "Protons are roughly 10% more biologically effective than megavoltage photons." },
                  { title: "Range Uncertainty", desc: "Sensitivity to tissue density variations (CT Hounsfield units) and patient motion." }
                ].map((item, i) => (
                  <div key={i} className="group p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-sky-500/50 transition-all">
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Shield size={12} /> Clinical Advantages
              </h3>
              <ul className="space-y-3">
                {[
                  "Reduced integral dose to normal tissues",
                  "No exit dose beyond the target",
                  "Ideal for pediatric malignancies",
                  "Superior for base of skull & CNS lesions"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <ChevronRight size={14} className="text-sky-500 mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right Column: Visualizations */}
          <div className="lg:col-span-8 space-y-6">
            {/* Depth Dose Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Depth Dose Distribution</h3>
                  <p className="text-[11px] text-slate-500">Comparison between Photons (6MV) and Protons.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-sky-400" /> Proton
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-slate-600" /> Photon
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={BRAGG_PEAK_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorProton" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="depth" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickFormatter={(v) => `${v} cm`}
                      label={{ value: 'Depth (cm)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#475569' }}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      domain={[0, 110]}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: 'Relative Dose', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#475569' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ fontSize: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="proton" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorProton)" 
                      animationDuration={1500}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="photon" 
                      stroke="#475569" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      fill="transparent"
                      animationDuration={1500}
                    />
                    <ReferenceLine x={10} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Bragg Peak', position: 'top', fill: '#f43f5e', fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                    <Activity className="text-sky-400" size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Physical Selectivity</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Protons have a finite range. Beyond the Bragg peak, the dose drops to near zero, sparing critical structures located deep to the target.
                </p>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <TrendingUp className="text-rose-400" size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Biological Effect</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The LET increases as protons slow down, reaching a maximum at the distal edge of the SOBP. This leads to a slight increase in RBE at the end of the range.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl p-4 flex gap-4">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold text-amber-200 mb-1">Clinical Note: Range Uncertainty</h4>
                <p className="text-[11px] text-amber-200/70 leading-relaxed">
                  Range uncertainty (typically 3.5% + 1mm) is a critical factor in proton planning. Beams are rarely pointed directly at critical OARs to avoid "overshoot" due to density variations.
                </p>
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
      <footer className="max-w-6xl mx-auto px-6 pb-12">
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <BookOpen size={12} />
            Reference: Paganetti H. Proton Therapy Physics.
          </div>
          <div className="text-[10px] text-slate-600">
            © 2026 Radiobiology Toolkit · Educational Module
          </div>
        </div>
      </footer>
    </div>
  );
}
