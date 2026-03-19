import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData } from '../src/data/radiobiologyData';

const STORAGE_KEY = 'radonco_brachy_state_v3';

const QUICK_REF_DATA = [
  {
    category: "HDR α/β Ratios",
    items: [
      { label: "Tumour (General)", value: "10 Gy" },
      { label: "Cervix (HR-CTV)", value: "10 Gy" },
      { label: "Prostate", value: "1.5 - 3 Gy" },
      { label: "Late OARs", value: "3 Gy" },
    ]
  },
  {
    category: "Cervix Constraints (EMBRACE)",
    items: [
      { label: "HR-CTV D90", value: "> 85 Gy EQD2" },
      { label: "Bladder D2cc", value: "< 80-90 Gy EQD2" },
      { label: "Rectum D2cc", value: "< 65-75 Gy EQD2" },
      { label: "Sigmoid D2cc", value: "< 70-75 Gy EQD2" },
    ]
  },
  {
    category: "Key Formulas",
    items: [
      { label: "EQD2", value: "D × [(d + α/β) / (2 + α/β)]" },
      { label: "BED", value: "D × [1 + d / (α/β)]" },
    ]
  }
];

// ── Site presets ──────────────────────────────────────────────────────────
interface SitePreset {
  id: string;
  name: string;
  ab: number;
  dpf: number;
  fx: number;
  ebrtTotal: number;
  ebrtDpf: number;
  targetEQD2: number;
  protocol: string;
  oarConstraints: { name: string; metric: string; limit: string; ab: number; hard: boolean }[];
  notes: string[];
}

const PRESETS: SitePreset[] = [
  {
    id: 'cervix',
    name: 'Cervix (GEC-ESTRO)',
    ab: 10, dpf: 7.0, fx: 4,
    ebrtTotal: 45.0, ebrtDpf: 1.8,
    targetEQD2: 85,
    protocol: 'GEC-ESTRO EMBRACE I/II · ICRU 89',
    oarConstraints: [
      { name: 'Rectum',  metric: 'D2cc', limit: '<70 Gy', ab: 3, hard: true  },
      { name: 'Sigmoid', metric: 'D2cc', limit: '<70 Gy', ab: 3, hard: true  },
      { name: 'Bladder', metric: 'D2cc', limit: '<90 Gy', ab: 3, hard: true  },
      { name: 'Vagina',  metric: 'D2cc', limit: '<65 Gy', ab: 3, hard: false },
      { name: 'Bowel',   metric: 'D2cc', limit: '<70 Gy', ab: 3, hard: false },
    ],
    notes: [
      'HR-CTV D90 ≥85 Gy EQD2₁₀ (EMBRACE floor). Optimal ≥90 Gy.',
      'IR-CTV D98 ≥60 Gy EQD2₁₀.',
      'OAR EQD2₃ = combined EBRT + brachy D2cc.',
      'MRI-based planning mandatory (GEC-ESTRO class 1 recommendation).',
      'Typ. 4 insertions weekly. Paris method or ring/tandem applicator.',
    ],
  },
  {
    id: 'prostate',
    name: 'Prostate Boost (HDR)',
    ab: 1.5, dpf: 15.0, fx: 1,
    ebrtTotal: 46.0, ebrtDpf: 2.0,
    targetEQD2: 115,
    protocol: 'ASCENDE-RT · William Beaumont single-fraction',
    oarConstraints: [
      { name: 'Urethra',    metric: 'D10%', limit: '<120% Rx',  ab: 5,   hard: true  },
      { name: 'Rectum',     metric: 'D2cc', limit: '<65 Gy',    ab: 3,   hard: true  },
      { name: 'Bladder',    metric: 'D2cc', limit: '<75 Gy',    ab: 5,   hard: false },
      { name: 'Penile bulb',metric: 'D90%', limit: '<50% Rx',   ab: 3,   hard: false },
    ],
    notes: [
      'ASCENDE-RT: LDR boost superior to EBRT alone for bPFS (Rodda 2017, Lancet Oncol).',
      'Single HDR 15 Gy (α/β=1.5) → EQD2₁.₅ ≈ 165 Gy (extreme hypo).',
      'Urethra sparing critical — use urethral catheter + optimisation.',
      'Post-implant CT/MRI dosimetry recommended within 24h.',
    ],
  },
  {
    id: 'vault',
    name: 'Vaginal Vault (Post-op)',
    ab: 10, dpf: 7.0, fx: 3,
    ebrtTotal: 0, ebrtDpf: 0,
    targetEQD2: 65,
    protocol: 'PORTEC-1/2 · NCCN endometrial',
    oarConstraints: [
      { name: 'Rectum',  metric: 'D2cc', limit: '<70 Gy', ab: 3, hard: true  },
      { name: 'Bladder', metric: 'D2cc', limit: '<80 Gy', ab: 3, hard: true  },
      { name: 'Sigmoid', metric: 'D2cc', limit: '<70 Gy', ab: 3, hard: false },
    ],
    notes: [
      'PORTEC-2: VBT non-inferior to EBRT for vaginal recurrence (Nout 2010, Lancet).',
      'Typically 7 Gy × 3 to 5mm depth from applicator surface.',
      'Alternatively: 5.5 Gy × 4 or 6 Gy × 5 (institutional variation).',
      'Cylinder size: maximise contact — typically 30–40mm diameter.',
    ],
  },
  {
    id: 'breast',
    name: 'Breast APBI (BID)',
    ab: 4, dpf: 3.4, fx: 10,
    ebrtTotal: 0, ebrtDpf: 0,
    targetEQD2: 48,
    protocol: 'NSABP B-39 / RTOG 0413 · GEC-ESTRO APBI',
    oarConstraints: [
      { name: 'Skin',       metric: 'D1cc', limit: '<32 Gy',  ab: 10, hard: true  },
      { name: 'Rib/chest',  metric: 'D1cc', limit: '<40 Gy',  ab: 3,  hard: false },
      { name: 'Lung (ipsi)',metric: 'V20',  limit: '<10%',    ab: 3,  hard: false },
    ],
    notes: [
      'BID fractionation: ≥6h inter-fraction interval mandatory.',
      '34 Gy / 10 fx BID ≡ EQD2₄ ≈ 38.3 Gy (breast tissue).',
      'Eligibility: T1-2 (≤3cm), N0, ≥50y, unicentric, clear margins.',
      'GEC-ESTRO favours multicatheter over single-entry balloon.',
    ],
  },
  {
    id: 'esophagus',
    name: 'Oesophagus (Intraluminal)',
    ab: 10, dpf: 5.0, fx: 3,
    ebrtTotal: 50.0, ebrtDpf: 2.0,
    targetEQD2: 60,
    protocol: 'IAEA-TECDOC-1079 · Hishikawa protocol',
    oarConstraints: [
      { name: 'Spinal cord', metric: 'Dmax', limit: '<45 Gy EQD2₂', ab: 2, hard: true },
      { name: 'Aorta',       metric: 'Dmax', limit: '<60 Gy',        ab: 3, hard: true },
    ],
    notes: [
      'Intraluminal HDR used as boost (5 Gy × 3) after 50 Gy EBRT.',
      'Source to oesophageal mucosa: 1 cm reference point.',
      'Risk of fistula with >15 Gy HDR boost — monitor dysphagia.',
      'Palliative alone: 7 Gy × 3 achieves rapid symptom relief.',
    ],
  },
  {
    id: 'skin',
    name: 'Skin (NMSC Surface)',
    ab: 10, dpf: 6.0, fx: 6,
    ebrtTotal: 0, ebrtDpf: 0,
    targetEQD2: 45,
    protocol: 'ABS / GEC-ESTRO skin BT guidelines 2015',
    oarConstraints: [
      { name: 'Cartilage', metric: 'Dmax', limit: '<50 Gy', ab: 3,  hard: true  },
      { name: 'Bone',      metric: 'Dmax', limit: '<55 Gy', ab: 1.5,hard: false },
    ],
    notes: [
      '36 Gy / 6 fx BID OR 40 Gy / 8 fx BID commonly used.',
      'Surface mould or Leipzig/Valencia applicators for small lesions.',
      'Local control >90% for BCC/SCC ≤4 cm (ABS 2015).',
      'Avoid cartilage (ear, nose): 5mm build-up minimises necrosis risk.',
    ],
  },
  {
    id: 'bronchus',
    name: 'Endobronchial (Palliation)',
    ab: 10, dpf: 7.5, fx: 2,
    ebrtTotal: 30.0, ebrtDpf: 3.0,
    targetEQD2: 50,
    protocol: 'IAEA-TECDOC-1308 · Huber protocol',
    oarConstraints: [
      { name: 'Spinal cord', metric: 'Dmax', limit: '<45 Gy EQD2₂', ab: 2, hard: true },
      { name: 'Trachea/wall',metric: 'Dmax', limit: '<65 Gy',       ab: 3, hard: true },
    ],
    notes: [
      '7.5 Gy × 2 at 1 cm — standard palliative protocol (haemoptysis, obstruction).',
      'Avoid if tracheobronchial fistula present.',
      'Combined 30 Gy EBRT + 2× HDR — combined EQD2 ≈ 46 Gy.',
      'Fatal haemoptysis risk higher with central tumours >2 cm from carina.',
    ],
  },
];

// ── OAR status helper ─────────────────────────────────────────────────────
function oarStatus(total: number, limitStr: string): 'pass' | 'warn' | 'fail' {
  const m = limitStr.match(/([<>])\s*([\d.]+)/);
  if (!m) return 'pass';
  const op = m[1]; const lim = parseFloat(m[2]);
  if (op === '<') {
    if (total < lim * 0.9) return 'pass';
    if (total < lim)       return 'warn';
    return 'fail';
  }
  return total >= lim ? 'pass' : 'fail';
}

const STATUS_BADGE: Record<string, string> = {
  pass: 'result-badge pass',
  warn: 'result-badge warn',
  fail: 'result-badge fail',
};
const STATUS_LABEL = { pass: 'OK', warn: 'Near limit', fail: 'EXCEEDED' };

// ── EQD2 helper ───────────────────────────────────────────────────────────
function calcEQD2(total: number, dpf: number, ab: number): number {
  if (ab === 0 || dpf === 0) return 0;
  const bed = total * (1 + dpf / ab);
  return bed / (1 + 2 / ab);
}

// ── Main component ────────────────────────────────────────────────────────
const HDRBrachyPage: React.FC = () => {
  const [presetId,  setPresetId]  = useState('cervix');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category,
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));
  const [dpf,       setDpf]       = useState('7.0');
  const [fx,        setFx]        = useState('4');
  const [ab,        setAb]        = useState('10');
  const [ebrtTotal, setEbrtTotal] = useState('45.0');
  const [ebrtDpf,   setEbrtDpf]   = useState('1.8');
  const [targetEQD2,setTargetEQD2]= useState('85');
  const [tab,       setTab]       = useState<'calc'|'oar'|'notes'>('calc');

  const preset = useMemo(() => PRESETS.find(p => p.id === presetId) ?? PRESETS[0], [presetId]);

  // ── Persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.presetId)   setPresetId(p.presetId);
        if (p.dpf)        setDpf(String(p.dpf));
        if (p.fx)         setFx(String(p.fx));
        if (p.ab)         setAb(String(p.ab));
        if (p.ebrtTotal)  setEbrtTotal(String(p.ebrtTotal));
        if (p.ebrtDpf)    setEbrtDpf(String(p.ebrtDpf));
        if (p.targetEQD2) setTargetEQD2(String(p.targetEQD2));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId, dpf, fx, ab, ebrtTotal, ebrtDpf, targetEQD2 }));
  }, [presetId, dpf, fx, ab, ebrtTotal, ebrtDpf, targetEQD2]);

  const applyPreset = (p: SitePreset) => {
    setPresetId(p.id);
    setDpf(String(p.dpf));
    setFx(String(p.fx));
    setAb(String(p.ab));
    setEbrtTotal(String(p.ebrtTotal));
    setEbrtDpf(String(p.ebrtDpf));
    setTargetEQD2(String(p.targetEQD2));
  };

  // ── Numeric values ────────────────────────────────────────────────────
  const nDpf       = parseFloat(dpf)       || 0;
  const nFx        = parseFloat(fx)        || 0;
  const nAb        = parseFloat(ab)        || 0;
  const nEbrtTotal = parseFloat(ebrtTotal) || 0;
  const nEbrtDpf   = parseFloat(ebrtDpf)  || 0;
  const nTarget    = parseFloat(targetEQD2)|| 0;

  // ── Brachy component ─────────────────────────────────────────────────
  const brachyTotal  = nDpf * nFx;
  const brachyBED    = nAb > 0 ? brachyTotal * (1 + nDpf / nAb) : 0;
  const brachyEQD2   = nAb > 0 ? brachyBED / (1 + 2 / nAb) : 0;

  // ── EBRT component ───────────────────────────────────────────────────
  const ebrtBED      = nAb > 0 && nEbrtDpf > 0 ? nEbrtTotal * (1 + nEbrtDpf / nAb) : 0;
  const ebrtEQD2     = nAb > 0 && nEbrtDpf > 0 ? ebrtBED / (1 + 2 / nAb) : 0;

  // ── Combined ─────────────────────────────────────────────────────────
  const totalEQD2  = brachyEQD2 + ebrtEQD2;
  const targetMet  = totalEQD2 >= nTarget;
  const deficit    = Math.max(0, nTarget - totalEQD2);

  // ── OAR calculations (α/β=3 for late tissues) ────────────────────────
  const oarRows = useMemo(() => preset.oarConstraints.map(c => {
    // Calculate D2cc EQD2 for each OAR using its own ab
    // Approx: EBRT contributes ebrtDpf at OAR, brachy contributes typical OAR fraction
    // For simplicity: use same schedule but ab=c.ab
    const ebrtEQD2_oar = c.ab > 0 && nEbrtDpf > 0
      ? calcEQD2(nEbrtTotal, nEbrtDpf, c.ab) : 0;
    const brachyEQD2_oar = c.ab > 0 && nDpf > 0
      ? calcEQD2(brachyTotal, nDpf, c.ab) : 0;
    const combinedEQD2_oar = ebrtEQD2_oar + brachyEQD2_oar;
    const status = oarStatus(combinedEQD2_oar, c.limit);
    return { ...c, ebrtEQD2: ebrtEQD2_oar, brachyEQD2: brachyEQD2_oar, total: combinedEQD2_oar, status };
  }), [preset, nEbrtTotal, nEbrtDpf, nDpf, brachyTotal]);

  const valid = nDpf > 0 && nFx > 0 && nAb > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      >
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-500 leading-relaxed italic">
            "HDR brachytherapy provides an unparalleled biological advantage through extreme dose escalation and rapid fall-off. Always verify combined EQD2 with EBRT components."
          </p>
        </div>
      </KeyFactsSidebar>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">HDR Brachytherapy Solver</h1>
        <p className="text-sm text-slate-500">GEC-ESTRO · ABS · IAEA integrated planning</p>
      </div>

      {/* ── Site presets ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Clinical Site</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`text-left px-2.5 py-2 rounded-lg border text-sm font-semibold transition leading-tight
                ${presetId === p.id
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <span className="block truncate">{p.name.split('(')[0].trim()}</span>
              <span className={`text-[11px] font-normal ${presetId === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                α/β={p.ab} · Target {p.targetEQD2} Gy
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 italic">{preset.protocol}</p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-0">
        {(['calc','oar','notes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t === 'calc' ? 'Calculator' : t === 'oar' ? 'OAR Check' : 'Protocol Notes'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: Calculator
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'calc' && (
        <div className="space-y-3">

          {/* EBRT inputs */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">EBRT Component</p>
            </div>
            <div className="px-3 py-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Total EBRT (Gy)</label>
                <input type="number" step="0.5" value={ebrtTotal}
                  onChange={e => setEbrtTotal(e.target.value)}
                  className="input-clinical num" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">EBRT Dose/Fx (Gy)</label>
                <input type="number" step="0.1" value={ebrtDpf}
                  onChange={e => setEbrtDpf(e.target.value)}
                  className="input-clinical num" />
              </div>
            </div>
          </div>

          {/* HDR inputs */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">HDR Component</p>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">α/β = {ab} Gy</span>
            </div>
            <div className="px-3 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Dose/Fx (Gy)</label>
                  <input type="number" step="0.1" value={dpf}
                    onChange={e => setDpf(e.target.value)}
                    className="input-clinical num" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Fractions</label>
                  <input type="number" step="1" value={fx}
                    onChange={e => setFx(e.target.value)}
                    className="input-clinical num" />
                </div>
              </div>

              {/* Tumour Alpha/Beta Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Tumour α/β Ratio (Gy)
                </label>
                <input
                  type="number" step="0.5" value={ab}
                  onChange={e => setAb(e.target.value)}
                  className="input-clinical num"
                />
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Target EQD2 (Gy)</p>
            </div>
            <div className="px-3 py-3">
              <input type="number" step="1" value={targetEQD2}
                onChange={e => setTargetEQD2(e.target.value)}
                className="input-clinical num w-40" />
              <p className="text-[11px] text-slate-400 mt-1">
                {preset.name}: recommended ≥{preset.targetEQD2} Gy EQD2 ({preset.protocol})
              </p>
            </div>
          </div>

          {/* Results */}
          {valid && (
            <div className="bg-[#1e3a5f] rounded-lg text-white px-4 py-3 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-200/70">Combined Plan Summary</p>

              {/* Component breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center border-b border-blue-800/40 pb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-blue-200/60">EBRT EQD2</p>
                  <p className="text-lg font-black num">{ebrtEQD2.toFixed(1)}</p>
                  <p className="text-[11px] text-blue-200/40">Gy</p>
                </div>
                <div className="border-x border-blue-800/40">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200/60">Brachy EQD2</p>
                  <p className="text-lg font-black num text-emerald-300">{brachyEQD2.toFixed(1)}</p>
                  <p className="text-[11px] text-blue-200/40">Gy</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-blue-200/60">Total EQD2</p>
                  <p className="text-2xl font-black num text-white">{totalEQD2.toFixed(1)}</p>
                  <p className="text-[11px] text-blue-200/40">Gy</p>
                </div>
              </div>

              {/* Brachy BED */}
              <div className="flex justify-between text-xs">
                <span className="text-blue-200/60">Brachy BED{nAb}</span>
                <span className="num font-bold">{brachyBED.toFixed(1)} Gy</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-200/60">Brachy total dose</span>
                <span className="num font-bold">{brachyTotal.toFixed(1)} Gy ({nFx} × {nDpf} Gy)</span>
              </div>

              {/* Target assessment */}
              <div className={`rounded px-3 py-2 mt-1 flex items-center justify-between
                ${targetMet
                  ? 'bg-green-900/40 border border-green-700/40'
                  : 'bg-amber-900/40 border border-amber-600/40'}`}>
                <div>
                  <p className="text-sm font-bold">{targetMet ? '✓ Target achieved' : '✗ Below target'}</p>
                  <p className="text-[11px] text-blue-200/60">
                    Goal: ≥{nTarget} Gy EQD2
                    {!targetMet && ` · Deficit: ${deficit.toFixed(1)} Gy`}
                  </p>
                </div>
                <span className={`text-lg font-black num ${targetMet ? 'text-green-400' : 'text-amber-400'}`}>
                  {((totalEQD2 / nTarget) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Dose escalation table */}
          {valid && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Brachy Dose/Fx Sensitivity ({nFx} fx · α/β={nAb})
                </p>
              </div>
              <div className="scroll-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-100">
                      <th className="px-3 py-2 text-left">HDR d (Gy)</th>
                      <th className="px-3 py-2 text-right">Brachy EQD2</th>
                      <th className="px-3 py-2 text-right">Total EQD2</th>
                      <th className="px-3 py-2 text-right">vs Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[-1.0, -0.5, 0, 0.5, 1.0].map(delta => {
                      const d = parseFloat((nDpf + delta).toFixed(1));
                      if (d <= 0) return null;
                      const bTotal = d * nFx;
                      const bBED   = bTotal * (1 + d / nAb);
                      const bEQD2  = bBED / (1 + 2 / nAb);
                      const tEQD2  = bEQD2 + ebrtEQD2;
                      const met    = tEQD2 >= nTarget;
                      const isBase = delta === 0;
                      return (
                        <tr key={d} className={isBase ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700'}>
                          <td className="px-3 py-2 num">{d.toFixed(1)}{isBase && ' ←'}</td>
                          <td className="px-3 py-2 text-right num">{bEQD2.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right num">{tEQD2.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`result-badge ${met ? 'pass' : 'fail'}`}>
                              {met ? '✓' : `−${(nTarget - tEQD2).toFixed(1)}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: OAR Check
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'oar' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
            <strong>Note:</strong> OAR EQD2 shown uses tumour α/β ({ab} Gy) for combined dose — in clinical practice
            OAR constraints use tissue-specific α/β (e.g. α/β=3 for late bowel/rectum).
            Values below use each OAR's specified α/β.
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {preset.name} — OAR Constraints
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {oarRows.map(r => (
                <div key={r.name} className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{r.name}</span>
                      <span className="text-[11px] text-slate-400">{r.metric} · α/β={r.ab}</span>
                      {r.hard && <span className="text-[11px] font-black text-red-600 uppercase">Hard</span>}
                    </div>
                    <span className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">Limit: <span className="font-bold num text-slate-700">{r.limit}</span></span>
                    <span className="text-slate-500">Calc: <span className="font-bold num text-slate-900">{r.total.toFixed(1)} Gy</span></span>
                    <span className="text-slate-400">EBRT {r.ebrtEQD2.toFixed(1)} + Brachy {r.brachyEQD2.toFixed(1)}</span>
                  </div>
                  {/* Progress bar */}
                  {(() => {
                    const lim = parseFloat(r.limit.replace(/[^0-9.]/g,'')) || 100;
                    const pct = Math.min(100, (r.total / lim) * 100);
                    return (
                      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            r.status === 'pass' ? 'bg-green-500' :
                            r.status === 'warn' ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* GEC-ESTRO reference (Cervix) */}
          {presetId === 'cervix' && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  GEC-ESTRO EMBRACE — Dose–Response (EQD2₃)
                </p>
              </div>
              <div className="px-3 py-3 space-y-1.5 text-[11px]">
                {[
                  { oar: 'Rectum D2cc',  d50: '~65 Gy', td55: '>75 Gy', note: 'G3+ bleeding' },
                  { oar: 'Sigmoid D2cc', d50: '~70 Gy', td55: '>75 Gy', note: 'G3+ obstruction' },
                  { oar: 'Bladder D2cc', d50: '~85 Gy', td55: '>90 Gy', note: 'G3+ haematuria' },
                ].map(r => (
                  <div key={r.oar} className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 w-28 flex-shrink-0">{r.oar}</span>
                    <span className="text-slate-500">D₅₀: <span className="num font-bold">{r.d50}</span></span>
                    <span className="text-red-700">Hard: <span className="num font-bold">{r.td55}</span></span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">{r.note}</span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 pt-1">Source: Tanderup et al., Radiother Oncol 2016 (EMBRACE I)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Protocol Notes
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'notes' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {preset.name} — Protocol Notes
              </p>
            </div>
            <ul className="divide-y divide-slate-50">
              {preset.notes.map((note, i) => (
                <li key={i} className="px-3 py-2.5 flex items-start gap-2.5">
                  <span className="text-[10px] font-black text-blue-600 mt-0.5 flex-shrink-0">{i + 1}</span>
                  <p className="text-[12px] text-slate-700 leading-relaxed">{note}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Radiobiology principles */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radiobiology Principles</p>
            </div>
            <div className="px-3 py-3 space-y-3 text-[12px] text-slate-700 leading-relaxed">
              <div>
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-0.5">Inverse Square Law Advantage</p>
                <p>HDR enables steep dose gradients — D(r) ∝ 1/r². Moving source 1mm from target halves dose to adjacent OAR — impossible with EBRT.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-0.5">High Dose/Fraction Effect</p>
                <p>Large HDR fractions (≥5 Gy) exploit the quadratic component of LQ: effect = α·d + β·d². Late-responding tissues (low α/β) are disproportionately damaged — mandating strict OAR tracking.</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-0.5">BED Additivity</p>
                <p>Combined EBRT + brachy BED (and EQD2) is additive only when fractions are well-separated (&gt;6h). Same α/β must be used throughout. Reference: Dale RG, Br J Radiol 1985.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reference ────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 px-1">
        Ref: Pötter R et al. EMBRACE I. Radiother Oncol 2021. Tanderup K et al. Radiother Oncol 2016.
        Dale RG. Br J Radiol 1985. ABS/GEC-ESTRO brachytherapy guidelines.
      </p>
    </div>
  );
};

export default HDRBrachyPage;