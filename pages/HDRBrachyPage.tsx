import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from '@/src/components/PrintReport';
import { PDFReport } from '@/src/components/PDFReport';
import { generatePDFBlob, sharePDF, generateHTML2PDF } from '@/src/lib/pdfUtils';
import { BookOpen, ChevronRight, GraduationCap, Info, CheckCircle2, AlertTriangle, Share2, Download, FileText, Zap, Printer } from 'lucide-react';
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
      { name: 'Rectum',  metric: 'D2cc', limit: '<65 Gy EQD2₃', ab: 3, hard: true  },
      { name: 'Sigmoid', metric: 'D2cc', limit: '<75 Gy EQD2₃', ab: 3, hard: true  },
      { name: 'Bladder', metric: 'D2cc', limit: '<80 Gy (Goal) / <90 Gy (Limit)', ab: 3, hard: true  },
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
    targetEQD2: 116.7,
    protocol: 'Demanes 2011 · RTOG 0321 (single-fraction 15 Gy HDR boost)',
    oarConstraints: [
      { name: 'Urethra',    metric: 'D10%', limit: '<105 Gy',  ab: 5,   hard: true  },
      { name: 'Rectum',     metric: 'D2cc', limit: '<65 Gy',    ab: 3,   hard: true  },
      { name: 'Bladder',    metric: 'D2cc', limit: '<75 Gy',    ab: 5,   hard: false },
      { name: 'Penile bulb',metric: 'D90%', limit: '<50 Gy',    ab: 3,   hard: false },
    ],
    notes: [
      'Single-fraction HDR 15 Gy boost: RTOG 0321 showed 3-yr PSA control 97% (Demanes 2011). ASCENDE-RT used LDR, not HDR — do not conflate.',
      'Single HDR 15 Gy (α/β=1.5) → EQD2₁.₅ = 70.7 Gy. Combined with 46 Gy EBRT = ~116.7 Gy total EQD2₁.₅.',
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
      '7 Gy × 3 prescribed to vaginal mucosa (applicator surface). Depth dose at 5mm ≈ 60–70% = ~4.2–4.9 Gy. Confirm reference point with TPS. (GEC-ESTRO 2016; Nout et al.)',
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
    ],
    notes: [
      'BID fractionation: ≥6h inter-fraction interval mandatory.',
      '34 Gy / 10 fx BID: EQD2₄ = 34 × (3.4+4)/(2+4) = 41.9 Gy (breast α/β=4). ≡ EQD2₁₀ = 34 × (3.4+10)/(2+10) = 37.97 Gy',
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
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: 'RadOnc_HDR_Brachy_Report',
  });

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
  const [oarDoses,  setOarDoses]  = useState<Record<string, string>>({});

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
        if (p.oarDoses)   setOarDoses(p.oarDoses);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId, dpf, fx, ab, ebrtTotal, ebrtDpf, targetEQD2, oarDoses }));
  }, [presetId, dpf, fx, ab, ebrtTotal, ebrtDpf, targetEQD2, oarDoses]);

  const applyPreset = (p: SitePreset) => {
    setPresetId(p.id);
    setDpf(String(p.dpf));
    setFx(String(p.fx));
    setAb(String(p.ab));
    setEbrtTotal(String(p.ebrtTotal));
    setEbrtDpf(String(p.ebrtDpf));
    setTargetEQD2(String(p.targetEQD2));
    setOarDoses({});
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
    const ebrtEQD2_oar = c.ab > 0 && nEbrtDpf > 0
      ? calcEQD2(nEbrtTotal, nEbrtDpf, c.ab) : 0;
      
    const oarDpfStr = oarDoses[c.name];
    const oarDpf = oarDpfStr !== undefined ? parseFloat(oarDpfStr) || 0 : 0;
    const oarTotal = oarDpf * nFx;

    const brachyEQD2_oar = c.ab > 0 && oarDpf > 0
      ? calcEQD2(oarTotal, oarDpf, c.ab) : 0;
    const combinedEQD2_oar = ebrtEQD2_oar + brachyEQD2_oar;
    const status = oarStatus(combinedEQD2_oar, c.limit);
    
    return {
      ...c,
      ebrtEQD2: ebrtEQD2_oar,
      brachyEQD2: brachyEQD2_oar,
      total: combinedEQD2_oar,
      status,
      oarDpf: oarDpf,
      oarDpfStr: oarDpfStr !== undefined ? oarDpfStr : ''
    };
  }), [preset, nEbrtTotal, nEbrtDpf, nDpf, nFx, oarDoses]);

  const valid = nDpf > 0 && nFx > 0 && nAb > 0;

  return (
    <div className="space-y-4 fade-in pb-10 relative text-slate-200 px-4 pt-6">
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      >
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-500 leading-relaxed italic">
            "HDR brachytherapy provides an unparalleled biological advantage through extreme dose escalation and rapid fall-off. Always verify combined EQD2 with EBRT components."
          </p>
        </div>
      </KeyFactsSidebar>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">HDR Brachytherapy</h1>
        <p className="text-sm text-slate-400">GEC-ESTRO · ABS · IAEA integrated planning</p>
      </div>

      {/* ── Site presets ─────────────────────────────────────────────── */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Clinical Site Presets</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition leading-tight
                ${presetId === p.id
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}`}
            >
              <span className="block truncate">{p.name.split('(')[0].trim()}</span>
              <span className={`text-[10px] font-normal ${presetId === p.id ? 'text-cyan-300/70' : 'text-slate-600'}`}>
                α/β={p.ab} · {p.targetEQD2} Gy
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-3 italic flex items-center gap-1.5">
          <Info className="w-3 h-3" /> {preset.protocol}
        </p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-800 gap-0">
        {(['calc','oar','notes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition
              ${tab === t
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'calc' ? 'Calculator' : t === 'oar' ? 'OAR Check' : 'Protocol Notes'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: Calculator
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'calc' && (
        <div className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EBRT inputs */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">EBRT Component</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Dose (Gy)</label>
                  <input type="number" step="0.5" value={ebrtTotal}
                    onChange={e => setEbrtTotal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-mono text-white focus:border-cyan-500/50 outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Dose/Fx (Gy)</label>
                  <input type="number" step="0.1" value={ebrtDpf}
                    onChange={e => setEbrtDpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-mono text-white focus:border-cyan-500/50 outline-none transition" />
                </div>
              </div>
            </div>

            {/* HDR inputs */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">HDR Component</p>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">α/β = {ab} Gy</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Dose/Fx (Gy)</label>
                  <input type="number" step="0.1" value={dpf}
                    onChange={e => setDpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-mono text-white focus:border-cyan-500/50 outline-none transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Fractions</label>
                  <input type="number" step="1" value={fx}
                    onChange={e => setFx(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-mono text-white focus:border-cyan-500/50 outline-none transition" />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {valid && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between no-print">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Analysis Results</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => reactToPrintFn()}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition"
                      title="Print Report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>

                    <button
                      onClick={async () => {
                        if (contentRef.current) {
                          await generateHTML2PDF(contentRef.current, `RadOnc_HDR_Brachy_Report_HTML_${new Date().getTime()}.pdf`);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition"
                      title="Export PDF from HTML (Alternative)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF (HTML)
                    </button>
                  </div>
                </div>

                <div ref={contentRef} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Combined EQD2</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-white num">{totalEQD2.toFixed(1)}</span>
                          <span className="text-lg font-bold text-slate-600">Gy</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2
                          ${targetMet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {targetMet ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {targetMet ? 'Target Met' : 'Below Target'}
                        </div>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">EBRT Contribution</p>
                          <p className="text-2xl font-black text-slate-300 num">{ebrtEQD2.toFixed(1)} <span className="text-xs font-normal text-slate-600">Gy</span></p>
                          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-slate-500 h-full" style={{ width: `${(ebrtEQD2 / totalEQD2) * 100}%` }} />
                          </div>
                        </div>
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Brachy Contribution</p>
                          <p className="text-2xl font-black text-cyan-400 num">{brachyEQD2.toFixed(1)} <span className="text-xs font-normal text-slate-600">Gy</span></p>
                          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-cyan-500 h-full" style={{ width: `${(brachyEQD2 / totalEQD2) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sensitivity Table */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Brachy Dose Sensitivity ({nFx} fx · α/β={nAb})
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3 text-left">HDR d (Gy)</th>
                        <th className="px-4 py-3 text-right">Brachy EQD2</th>
                        <th className="px-4 py-3 text-right">Total EQD2</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
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
                          <tr key={d} className={isBase ? 'bg-cyan-500/5 font-bold' : 'text-slate-400'}>
                            <td className="px-4 py-3 num text-slate-300">{d.toFixed(1)}{isBase && ' (Current)'}</td>
                            <td className="px-4 py-3 text-right num">{bEQD2.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right num text-white">{tEQD2.toFixed(1)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                ${met ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
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

              {/* Premium Export Card */}
              <div className="p-6 bg-gradient-to-br from-cyan-600 to-indigo-700 rounded-2xl shadow-lg border border-cyan-400/30 text-white relative overflow-hidden group mb-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Premium Export</h3>
                      <p className="text-[10px] text-cyan-100">High-quality clinical reports & instant sharing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                      onClick={async () => {
                        const doc = (
                          <PDFReport 
                            title="HDR Brachytherapy Report"
                            parameters={[
                              { label: 'Site', value: preset.name },
                              { label: 'EBRT Dose', value: `${ebrtTotal} Gy` },
                              { label: 'EBRT Dpf', value: `${ebrtDpf} Gy` },
                              { label: 'HDR Dose', value: `${nDpf * nFx} Gy` },
                              { label: 'HDR Dpf', value: `${nDpf} Gy` },
                              { label: 'α/β Ratio', value: `${nAb} Gy` },
                            ]}
                            results={[
                              { label: 'Total EQD2', value: totalEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'EBRT EQD2', value: ebrtEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'Brachy EQD2', value: brachyEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'Target EQD2', value: nTarget.toString(), unit: 'Gy' },
                            ]}
                            clinicalInsight={`Combined EQD2 is ${totalEQD2.toFixed(1)} Gy. Target was ${nTarget} Gy. ${totalEQD2 >= nTarget ? 'Prescription goal met.' : 'Goal not met.'}`}
                          />
                        );
                        const blob = await generatePDFBlob(doc);
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `RadOnc_HDR_Brachy_Report_${new Date().getTime()}.pdf`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-cyan-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-50 transition shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF (HQ)
                    </button>
                    <button 
                      onClick={async () => {
                        const doc = (
                          <PDFReport 
                            title="HDR Brachytherapy Report"
                            parameters={[
                              { label: 'Site', value: preset.name },
                              { label: 'EBRT Dose', value: `${ebrtTotal} Gy` },
                              { label: 'EBRT Dpf', value: `${ebrtDpf} Gy` },
                              { label: 'HDR Dose', value: `${nDpf * nFx} Gy` },
                              { label: 'HDR Dpf', value: `${nDpf} Gy` },
                              { label: 'α/β Ratio', value: `${nAb} Gy` },
                            ]}
                            results={[
                              { label: 'Total EQD2', value: totalEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'EBRT EQD2', value: ebrtEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'Brachy EQD2', value: brachyEQD2.toFixed(1), unit: 'Gy' },
                              { label: 'Target EQD2', value: nTarget.toString(), unit: 'Gy' },
                            ]}
                            clinicalInsight={`Combined EQD2 is ${totalEQD2.toFixed(1)} Gy. Target was ${nTarget} Gy. ${totalEQD2 >= nTarget ? 'Prescription goal met.' : 'Goal not met.'}`}
                          />
                        );
                        const blob = await generatePDFBlob(doc);
                        await sharePDF(blob, `RadOnc_HDR_Brachy_Report.pdf`, `Clinical Report: HDR Brachytherapy analysis for ${preset.name}.`);
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: OAR Check
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'oar' && (
        <div className="space-y-4">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <p className="text-xs text-cyan-300/80 leading-relaxed">
              OAR constraints use tissue-specific α/β (typically α/β=3 for late bowel/rectum). 
              Enter the measured D2cc or Dmax dose-per-fraction from your plan below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {oarRows.map(r => (
              <div key={r.name} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{r.name}</h3>
                      {r.hard && <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase border border-rose-500/20">Hard Limit</span>}
                    </div>
                    <p className="text-xs text-slate-500">{r.metric} · α/β={r.ab} Gy</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                    ${r.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      r.status === 'warn' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    {STATUS_LABEL[r.status]}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Brachy {r.metric}/fx (Gy)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={r.oarDpfStr}
                      placeholder="Enter Gy/fx"
                      onChange={e => setOarDoses(prev => ({ ...prev, [r.name]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-mono text-white focus:border-cyan-500/50 outline-none transition"
                    />
                  </div>

                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Limit</p>
                      <p className="text-lg font-black text-slate-400 num">{r.limit.split(' ')[0]}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Combined</p>
                      <p className={`text-lg font-black num ${r.total === 0 ? 'text-slate-700' : 'text-white'}`}>
                        {r.total === 0 ? '—' : r.total.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (r.total / (parseFloat(r.limit.replace(/[^0-9.]/g,'')) || 100)) * 100)}%` }}
                    className={`h-full rounded-full transition-all ${
                      r.status === 'pass' ? 'bg-emerald-500' :
                      r.status === 'warn' ? 'bg-amber-400' : 'bg-rose-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Protocol Notes
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {preset.name} — Clinical Guidance
              </p>
            </div>
            <div className="p-2">
              {preset.notes.map((note, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-4 hover:bg-slate-800/20 rounded-xl transition">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-black text-cyan-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Export Card */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-6 shadow-xl border border-cyan-400/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg tracking-tight uppercase">Premium Export</h3>
                <p className="text-[10px] text-cyan-100">High-quality clinical reports & instant sharing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => reactToPrintFn()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition backdrop-blur-sm border border-white/10 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
              <button 
                onClick={async () => {
                  const doc = (
                    <PDFReport 
                      title="HDR Brachytherapy Report"
                      parameters={[
                        { label: 'Site', value: preset.name },
                        { label: 'EBRT Total Dose', value: `${ebrtTotal} Gy` },
                        { label: 'EBRT Dose/Fx', value: `${ebrtDpf} Gy` },
                        { label: 'HDR Dose/Fx', value: `${nDpf} Gy` },
                        { label: 'HDR Fractions', value: `${nFx}` },
                        { label: 'α/β Ratio', value: `${nAb} Gy` },
                      ]}
                      results={[
                        { label: 'Combined EQD2', value: totalEQD2.toFixed(1), unit: 'Gy' },
                        { label: 'EBRT EQD2', value: ebrtEQD2.toFixed(1), unit: 'Gy' },
                        { label: 'Brachy EQD2', value: brachyEQD2.toFixed(1), unit: 'Gy' },
                      ]}
                      clinicalInsight={`HDR Brachytherapy combined with EBRT. Total EQD2: ${totalEQD2.toFixed(1)} Gy. Goal: ${nTarget} Gy. Status: ${totalEQD2 >= nTarget ? 'Met' : 'Not Met'}.`}
                    />
                  );
                  const blob = await generatePDFBlob(doc);
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `RadOnc_HDR_Brachy_Report_${new Date().getTime()}.pdf`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-cyan-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-50 transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF (HQ)
              </button>
              <button 
                onClick={async () => {
                  if (contentRef.current) {
                    await generateHTML2PDF(contentRef.current, `RadOnc_HDR_Brachy_Report_${new Date().getTime()}.pdf`);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-700 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                PDF (HTML)
              </button>
              <button 
                onClick={async () => {
                  const doc = (
                    <PDFReport 
                      title="HDR Brachytherapy Report"
                      parameters={[
                        { label: 'Site', value: preset.name },
                        { label: 'EBRT Total Dose', value: `${ebrtTotal} Gy` },
                        { label: 'EBRT Dose/Fx', value: `${ebrtDpf} Gy` },
                        { label: 'HDR Dose/Fx', value: `${nDpf} Gy` },
                        { label: 'HDR Fractions', value: `${nFx}` },
                        { label: 'α/β Ratio', value: `${nAb} Gy` },
                      ]}
                      results={[
                        { label: 'Combined EQD2', value: totalEQD2.toFixed(1), unit: 'Gy' },
                        { label: 'EBRT EQD2', value: ebrtEQD2.toFixed(1), unit: 'Gy' },
                        { label: 'Brachy EQD2', value: brachyEQD2.toFixed(1), unit: 'Gy' },
                      ]}
                      clinicalInsight={`HDR Brachytherapy combined with EBRT. Total EQD2: ${totalEQD2.toFixed(1)} Gy. Goal: ${nTarget} Gy. Status: ${totalEQD2 >= nTarget ? 'Met' : 'Not Met'}.`}
                    />
                  );
                  const blob = await generatePDFBlob(doc);
                  await sharePDF(blob, `RadOnc_HDR_Brachy_Report.pdf`, `Clinical Report: HDR Brachytherapy analysis.`);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
          Ref: EMBRACE I/II · GEC-ESTRO · ABS · ICRU 89
        </p>
      </div>

      <PrintReport ref={contentRef}>
        <div className="space-y-8">
          <div className="border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">HDR Brachytherapy Report</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Clinical Radiobiology Analysis</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Prescription Parameters</h2>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <p className="text-slate-500">Site:</p>
                <p className="font-bold text-slate-900">{preset.name}</p>
                <p className="text-slate-500">EBRT Total Dose:</p>
                <p className="font-bold text-slate-900">{ebrtTotal} Gy</p>
                <p className="text-slate-500">EBRT Dose/Fx:</p>
                <p className="font-bold text-slate-900">{ebrtDpf} Gy</p>
                <p className="text-slate-500">HDR Dose/Fx:</p>
                <p className="font-bold text-slate-900">{nDpf} Gy</p>
                <p className="text-slate-500">HDR Fractions:</p>
                <p className="font-bold text-slate-900">{nFx}</p>
                <p className="text-slate-500">α/β Ratio:</p>
                <p className="font-bold text-slate-900">{nAb} Gy</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1">Radiobiological Results</h2>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <p className="text-slate-500">Combined EQD2:</p>
                <p className="text-xl font-black text-slate-900">{totalEQD2.toFixed(1)} Gy</p>
                <p className="text-slate-500">EBRT EQD2:</p>
                <p className="font-bold text-slate-900">{ebrtEQD2.toFixed(1)} Gy</p>
                <p className="text-slate-500">Brachy EQD2:</p>
                <p className="font-bold text-slate-900">{brachyEQD2.toFixed(1)} Gy</p>
                <p className="text-slate-500">Target EQD2:</p>
                <p className="font-bold text-slate-900">{nTarget} Gy</p>
                <p className="text-slate-500">Goal Status:</p>
                <p className={`font-bold ${totalEQD2 >= nTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalEQD2 >= nTarget ? 'Prescription Goal Met' : 'Goal Not Met'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Protocol Notes</h3>
            <ul className="space-y-2">
              {preset.notes.map((note, i) => (
                <li key={i} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                  <span className="font-bold text-slate-400">{i + 1}.</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-tight">
              <p>Generated on {new Date().toLocaleDateString()}</p>
              <p>RadOnc Radiobiology Toolkit v2.0</p>
            </div>
            <div className="w-32 h-12 border-b border-slate-300 flex items-end justify-center pb-1">
              <span className="text-[8px] text-slate-300 uppercase font-bold">Clinician Signature</span>
            </div>
          </div>
        </div>
      </PrintReport>
    </div>
  );
};


export default HDRBrachyPage;