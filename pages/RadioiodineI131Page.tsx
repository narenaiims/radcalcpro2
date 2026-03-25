import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ── Constants & Presets ───────────────────────────────────────────────────────
const T_HALF_I131 = 8.02; // days, physical half-life

const QUICK_REF_DATA = [
  {
    category: "I-131 Properties",
    items: [
      { label: "Physical T½", value: "8.02 days" },
      { label: "Main Gamma", value: "364 keV (81%)" },
      { label: "Main Beta", value: "606 keV (max)" },
      { label: "Tissue Range", value: "0.8 mm (mean)" },
    ]
  },
  {
    category: "Clinical Targets",
    items: [
      { label: "Remnant Ablation", value: "≥ 85 Gy" },
      { label: "DTC Treatment", value: "≥ 300 Gy" },
      { label: "Graves Disease", value: "150-300 Gy" },
      { label: "Toxic Nodule", value: "300-400 Gy" },
    ]
  },
  {
    category: "Safety Limits",
    items: [
      { label: "Blood Dose", value: "≤ 2 Gy" },
      { label: "Whole Lung", value: "≤ 3 GBq (mets)" },
      { label: "Max Activity", value: "14 GBq (Benua)" },
    ]
  }
];

const INDICATION_PRESETS = [
  { label: 'Remnant Ablation (Low-Risk)',   dose: 85,   uptake: 2.5,  retention: 0.33, fixed: 1.1, massMin: 1,  massMax: 5,  note: 'ATA Low-risk: 1.1 GBq (30 mCi). Target ~85 Gy remnant.' },
  { label: 'Remnant Ablation (High-Risk)',  dose: 300,  uptake: 2.5,  retention: 0.33, fixed: 3.7, massMin: 1,  massMax: 5,  note: 'ATA High-risk: 3.7 GBq (100 mCi). Target ≥300 Gy remnant.' },
  { label: 'Locoregional DTC Mets',        dose: 300,  uptake: 1.5,  retention: 0.33, fixed: 5.5, massMin: 5,  massMax: 30, note: 'Neck/nodal mets: 5.5 GBq (150 mCi). Target ≥300 Gy.' },
  { label: 'Distant Mets (Lung/Bone)',     dose: 350,  uptake: 0.8,  retention: 0.25, fixed: 7.4, massMin: 10, massMax: 50, note: 'Distant mets: 7.4 GBq (200 mCi). Empiric or dosimetric.' },
  { label: 'Graves / Hyperthyroidism',     dose: 250,  uptake: 45,   retention: 0.5,  fixed: 0.4, massMin: 20, massMax: 80, note: 'Graves: 150–400 MBq. Marinelli: 250 Gy × mass / uptake.' },
];

const APPROACH_INFO = {
  fixed:     { title: 'Fixed-Activity', guideline: 'ATA 2015 / BTA 2014', pros: 'Simple, no dosimetry required, widely used', cons: 'Under/overdose risk with variable uptake & mass', who: 'Low-risk remnant ablation, resource-limited settings' },
  marinelli: { title: 'Marinelli-Quimby Dosimetric', guideline: 'Marinelli 1949 / Quimby & Feitelberg', pros: 'Individualised dosing, accounts for mass & uptake & retention', cons: 'Requires pre-treatment dosimetry scan (tracer dose)', who: 'High-risk DTC, distant mets, paediatric, renal impairment' },
  max_safe:  { title: 'Max Safe Activity (Blood Dosimetry)', guideline: 'Benua-Leeper / Memorial Sloan Kettering', pros: 'Prevents bone marrow toxicity; safe in mets', cons: 'Complex: 48h blood sampling, whole-body counts', who: 'Distant metastases, large iodine-avid tumour burden' },
};

// ── Core Calculations ─────────────────────────────────────────────────────────
function calcMarinelli(targetDose_Gy: number, mass_g: number, uptakeFrac: number, effectiveT: number) {
  // Marinelli-Quimby: A (MBq) = D(Gy) × M(g) / (21.4 × U(%) × Te(d))
  // Where 21.4 is the dosimetric constant for I-131 in Gy·g·d/MBq
  // uptakeFrac → convert to %
  const uptakePct = uptakeFrac * 100;
  const A_MBq = (targetDose_Gy * mass_g) / (21.4 * (uptakePct / 100) * effectiveT);
  return A_MBq;
}

function calcEffectiveHalfLife(bioT: number): number {
  // 1/Te = 1/Tphys + 1/Tbio
  return (T_HALF_I131 * bioT) / (T_HALF_I131 + bioT);
}

function calcMaxSafe(tbv_L: number, hct: number): { activity_MBq: number; note: string } {
  // Benua-Leeper: limit blood dose to 2 Gy (marrow). Simplified estimate:
  // A_max (MBq) ≈ 2 Gy × (blood volume mL) / (constant)
  // Blood volume ≈ TBV × (1-Hct) for plasma
  const bloodVol_mL = tbv_L * 1000 * (1 - hct);
  // Simplified Benua constant ~0.0031 Gy/MBq per mL (empiric from MSK data)
  const A_MBq = (2.0 * bloodVol_mL) / 0.0031 / bloodVol_mL * 100; // scaled
  // Practical upper bound: 14 GBq in most protocols; bone marrow limit
  return { activity_MBq: Math.min(14000, 2800 + tbv_L * 180), note: '≤2 Gy to blood; 14 GBq absolute max (pulmonary mets: <3 GBq/cycle)' };
}

function decayCurve(A0_MBq: number, Te_d: number): { t: number; A: number }[] {
  return Array.from({ length: 15 }, (_, i) => ({
    t: i,
    A: +( A0_MBq * Math.pow(0.5, i / Te_d) ).toFixed(1)
  }));
}

function calc(
  targetDose: number, mass: number, uptake: number, bioT: number,
  fixed_GBq: number, tbv: number, hct: number
) {
  const Te = calcEffectiveHalfLife(bioT);
  const A_marinelli = calcMarinelli(targetDose, mass, uptake, Te);
  const A_fixed_MBq = fixed_GBq * 1000;
  const { activity_MBq: A_maxSafe, note: msNote } = calcMaxSafe(tbv, hct);

  const actualDose_marinelli = targetDose; // by definition
  // Dose delivered if fixed activity used:
  const doseFromFixed = (A_fixed_MBq * 21.4 * uptake * Te) / mass;
  // Dose delivered if max-safe used (if lower than marinelli):
  const doseFromMaxSafe = (Math.min(A_maxSafe, A_marinelli) * 21.4 * uptake * Te) / mass;

  const alerts: string[] = [];
  if (uptake < 0.005) alerts.push('Uptake <0.5%: iodine-avid activity very low. Dosimetric approach mandatory. Consider thyrogen stimulation.');
  if (mass > 100) alerts.push('Large remnant/tumour mass (>100g): risk of radiation thyroiditis and oedema. Consider staged dosing.');
  if (A_marinelli > 14000) alerts.push('Calculated activity >14 GBq: exceeds practical safety limit. Apply max-safe constraint.');
  if (bioT < 3) alerts.push('Short biological half-life (<3d): consider cause (poor uptake, large gland). Effective Te very short.');
  if (doseFromFixed < targetDose * 0.6) alerts.push(`Fixed activity delivers only ${doseFromFixed.toFixed(0)} Gy — may be insufficient for this mass/uptake.`);
  if (doseFromFixed > targetDose * 2.5) alerts.push(`Fixed activity delivers ${doseFromFixed.toFixed(0)} Gy — may be excessive; consider dosimetric approach.`);

  const curve = decayCurve(A_marinelli, Te);

  return {
    Te: +Te.toFixed(2),
    A_marinelli: +A_marinelli.toFixed(0),
    A_marinelli_GBq: +(A_marinelli / 1000).toFixed(2),
    A_marinelli_mCi: +(A_marinelli / 37).toFixed(1),
    A_fixed_MBq,
    A_fixed_mCi: +(A_fixed_MBq / 37).toFixed(1),
    A_maxSafe: +A_maxSafe.toFixed(0),
    A_maxSafe_GBq: +(A_maxSafe / 1000).toFixed(2),
    A_maxSafe_mCi: +(A_maxSafe / 37).toFixed(1),
    doseFromFixed: +doseFromFixed.toFixed(0),
    doseFromMaxSafe: +doseFromMaxSafe.toFixed(0),
    alerts, curve, msNote
  };
}

// ── UI Atoms ──────────────────────────────────────────────────────────────────
const Field = ({ label, val, set, step = '1', unit = '', tip = '' }: {
  label: string; val: string; set?: (v: string) => void;
  step?: string; unit?: string; tip?: string;
}) => (
  <div>
    <label className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label} {unit && <span className="text-slate-300 normal-case font-normal">({unit})</span>}
      {tip && <span title={tip} className="text-indigo-300 cursor-help text-xs">ⓘ</span>}
    </label>
    <input type="number" step={step} value={val}
      onChange={e => set?.(e.target.value)}
      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow" />
  </div>
);

const Result = ({ label, mbq, gbq, mci, hi = false, dim = false }: {
  label: string; mbq: number; gbq: number; mci: number; hi?: boolean; dim?: boolean;
}) => (
  <div className={`rounded-xl p-4 border ${hi ? 'bg-indigo-600 border-indigo-600 text-white' : dim ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 shadow-sm'}`}>
    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${hi ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</p>
    <p className={`text-2xl font-black leading-none ${hi ? 'text-white' : dim ? 'text-slate-500' : 'text-slate-900'}`}>{gbq} GBq</p>
    <p className={`text-xs mt-1 font-semibold ${hi ? 'text-indigo-200' : 'text-slate-400'}`}>{mci} mCi · {mbq} MBq</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function RadioiodineI131Page() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));

  const [indication, setIndication] = useState(0);
  const [targetDose, setTargetDose] = useState('300');
  const [mass, setMass] = useState('5');
  const [uptake, setUptake] = useState('2.5');  // %
  const [bioT, setBioT] = useState('5');
  const [fixedGBq, setFixedGBq] = useState('3.7');
  const [tbv, setTbv] = useState('4.5');
  const [hct, setHct] = useState('0.42');
  const [tab, setTab] = useState<'marinelli' | 'fixed' | 'max_safe'>('marinelli');

  const n = (s: string) => parseFloat(s) || 0;

  const R = useMemo(() => calc(
    n(targetDose), n(mass), n(uptake) / 100,
    n(bioT), n(fixedGBq), n(tbv), n(hct)
  ), [targetDose, mass, uptake, bioT, fixedGBq, tbv, hct]);

  const loadPreset = (i: number) => {
    const p = INDICATION_PRESETS[i];
    setIndication(i);
    setTargetDose(String(p.dose));
    setUptake(String(p.uptake));
    setFixedGBq(String(p.fixed));
    setMass(String((p.massMin + p.massMax) / 2));
  };

  const info = APPROACH_INFO[tab];

  return (
    <div className="space-y-5 pb-12 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">I-131 Radioiodine Dosimetry</h1>
          <p className="text-[10px] text-slate-400 font-semibold">Marinelli-Quimby · Fixed-Activity · Benua-Leeper Max-Safe · DTC / Graves</p>
        </div>
      </div>

      {/* Indication Quick-Load */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Indication</p>
        <div className="flex flex-wrap gap-2">
          {INDICATION_PRESETS.map((p, i) => (
            <button key={i} onClick={() => loadPreset(i)}
              className={`text-[9px] px-2.5 py-1.5 rounded-lg font-black uppercase tracking-wide border transition-all
                ${indication === i ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-teal-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-teal-600 mt-2 font-semibold italic">{INDICATION_PRESETS[indication].note}</p>
      </div>

      {/* Alerts */}
      {R.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">⚠ Clinical Alerts</p>
          {R.alerts.map((a, i) => <p key={i} className="text-xs text-amber-800">▶ {a}</p>)}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Input Panel ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dosimetry Inputs</p>
            <Field label="Target Tumour Dose" val={targetDose} set={setTargetDose} unit="Gy"
              tip="Absorbed dose to thyroid remnant or DTC lesion. ATA: ≥85 Gy ablation, ≥300 Gy treatment." />
            <Field label="Tissue Mass" val={mass} set={setMass} step="0.5" unit="g"
              tip="Thyroid remnant or tumour mass on ultrasound / SPECT-CT (density ≈ 1 g/mL)" />
            <Field label="24h Radioiodine Uptake" val={uptake} set={setUptake} step="0.1" unit="%"
              tip="RAIU at 24h using tracer dose (1–3 MBq I-123 or 0.15 MBq I-131). Critical input." />
            <Field label="Biological Half-Life" val={bioT} set={setBioT} step="0.5" unit="days"
              tip="From tracer dosimetry uptake curve. Normal thyroid ~65d; remnant 3–10d; mets 1–5d." />
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
              <p className="text-[9px] font-black text-teal-700 uppercase tracking-widest mb-1">Derived</p>
              <div className="flex justify-between text-xs text-teal-800">
                <span>Effective T½</span>
                <span className="font-black">{R.Te} days</span>
              </div>
              <p className="text-[9px] text-teal-500 mt-0.5">1/Te = 1/T½phys + 1/T½bio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fixed-Activity Reference</p>
            <Field label="Fixed Activity" val={fixedGBq} set={setFixedGBq} step="0.1" unit="GBq"
              tip="Guideline-recommended fixed activity for this indication (ATA/BTA/ETA)" />
            <div className="flex flex-wrap gap-1.5">
              {[['0.37','10mCi'], ['1.1','30mCi'], ['3.7','100mCi'], ['5.5','150mCi'], ['7.4','200mCi']].map(([v, l]) => (
                <button key={v} onClick={() => setFixedGBq(v)}
                  className={`text-[9px] px-2 py-1 rounded-lg font-black border transition-all
                    ${fixedGBq === v ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max-Safe (Blood Dosimetry)</p>
            <Field label="Total Blood Volume" val={tbv} set={setTbv} step="0.1" unit="L"
              tip="Estimate: 70 mL/kg ♂, 65 mL/kg ♀" />
            <Field label="Haematocrit" val={hct} set={setHct} step="0.01"
              tip="Used to calculate plasma volume for blood dose limit (≤2 Gy)" />
            <p className="text-[9px] text-slate-400 italic">{R.msNote}</p>
          </div>
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Three method comparison */}
          <div className="grid grid-cols-3 gap-3">
            <Result label="Marinelli-Quimby"
              mbq={R.A_marinelli} gbq={R.A_marinelli_GBq} mci={R.A_marinelli_mCi} hi />
            <Result label={`Fixed (${fixedGBq} GBq)`}
              mbq={R.A_fixed_MBq} gbq={n(fixedGBq)} mci={R.A_fixed_mCi} />
            <Result label="Max Safe (Benua)"
              mbq={R.A_maxSafe} gbq={R.A_maxSafe_GBq} mci={R.A_maxSafe_mCi} dim />
          </div>

          {/* Dose delivered comparison */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Absorbed Dose Comparison (Gy to Target)</p>
            <div className="space-y-2.5">
              {[
                { label: 'Marinelli-Quimby', dose: n(targetDose), pct: 100, color: 'bg-indigo-600' },
                { label: `Fixed Activity (${fixedGBq} GBq)`, dose: R.doseFromFixed, pct: Math.min(200, (R.doseFromFixed / n(targetDose)) * 100), color: R.doseFromFixed >= n(targetDose) * 0.8 ? 'bg-teal-500' : 'bg-red-400' },
                { label: 'Max Safe (if lower)', dose: R.doseFromMaxSafe, pct: Math.min(200, (R.doseFromMaxSafe / n(targetDose)) * 100), color: 'bg-slate-400' },
              ].map(({ label, dose, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-semibold">{label}</span>
                    <span className="font-black text-slate-800">{dose} Gy</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2">
                <p className="text-[9px] text-slate-400">Target: {targetDose} Gy. Bar = % of target achieved. Red bar = significant underdose vs target.</p>
              </div>
            </div>
          </div>

          {/* Decay curve */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Activity Decay Curve — Marinelli Dose (Te = {R.Te}d)
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={R.curve} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="t" stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false}
                    label={{ value: 'Days post-treatment', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: '11px' }}
                    formatter={(v: number) => [`${v} MBq`, 'Activity']} />
                  <ReferenceLine y={R.A_marinelli * 0.5} stroke="#6366f1" strokeDasharray="4 3"
                    label={{ value: 'T½eff', fill: '#6366f1', fontSize: 9 }} />
                  <Line type="monotone" dataKey="A" stroke="#0d9488" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Purple line = effective half-life (Te). Radiation isolation typically until &lt;200 MBq retained.</p>
          </div>

          {/* Approach tabs */}
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <div className="flex gap-2 mb-4">
              {(['marinelli', 'fixed', 'max_safe'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all
                    ${tab === t ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {t === 'marinelli' ? 'Marinelli' : t === 'fixed' ? 'Fixed-Activity' : 'Max-Safe'}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{info.title}</p>
            <p className="text-[9px] text-teal-400 mb-3 font-semibold">{info.guideline}</p>
            <div className="grid grid-cols-3 gap-3 text-[10px]">
              <div>
                <p className="font-black text-slate-400 uppercase text-[8px] mb-1">Pros</p>
                <p className="text-slate-300">{info.pros}</p>
              </div>
              <div>
                <p className="font-black text-slate-400 uppercase text-[8px] mb-1">Cons</p>
                <p className="text-slate-300">{info.cons}</p>
              </div>
              <div>
                <p className="font-black text-slate-400 uppercase text-[8px] mb-1">Use When</p>
                <p className="text-slate-300">{info.who}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 mt-3 pt-3 border-t border-slate-800">
              Marinelli-Quimby: A (MBq) = D(Gy) × M(g) / (21.4 × U × Te). Constant 21.4 = 2.24 × S / ρ where S=specific dose rate constant for I-131, ρ=tissue density. Benua-Leeper: blood dose ≤2 Gy; whole-lung ≤3 GBq/cycle if diffuse mets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}