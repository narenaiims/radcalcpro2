import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronRight, GraduationCap, Calculator, Activity, AlertTriangle, Printer, Info, ShieldAlert, Share2, Plus, X, Layers } from 'lucide-react';
import { RadiobiologyData } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { AnimatedNumber } from "@/src/components/AnimatedNumber";
import { useReactToPrint } from 'react-to-print';
import { ClinicalReport } from '@/src/components/ClinicalReport';
import { useRxContext } from '@/src/context/RadiobiologyContext';
import { saveHistory, saveSession, getSession } from '../src/lib/db';
import { ClinicalAlert, checkClinicalAlerts } from '@/src/services/clinicalAlerts';
const APP_VERSION = '0.0.0';
const CALCULATOR_ID = 'eqd2';
const CALCULATOR_NAME = 'BED & EQD2 Solver';
import { AlertStack } from '@/src/components/AlertStack';
import { getClinicalSummary } from '../src/services/clinicalReasoning';
import { saveCalculation } from '../src/services/auditService';

const STORAGE_KEY = 'radonco_eqd2_state_v2';

// ── Landmark Trials Database ─────────────────────────────────────────────────
const LANDMARK_TRIALS = [
  { name: 'CHHiP', fx: 20, dose: 60, ab: 1.5, eqd2: 77.1, endpoint: 'Prostate (Non-inferiority)', outcome: '5yr bPFS 90.6%', ref: 'Dearnaley et al. Lancet 2016' },
  { name: 'FAST-Forward', fx: 5, dose: 26, ab: 4, eqd2: 39.9, endpoint: 'Breast (Non-inferiority)', outcome: '5yr local relapse 2.1%', ref: 'Brunt et al. Lancet 2020' },
  { name: 'START-B', fx: 15, dose: 40, ab: 4, eqd2: 44.5, endpoint: 'Breast (Non-inferiority)', outcome: '10yr local relapse 4.3%', ref: 'Haviland et al. Lancet 2013' },
  { name: 'RTOG 0236', fx: 3, dose: 54, ab: 10, eqd2: 126, endpoint: 'Lung SBRT (Efficacy)', outcome: '3yr primary control 97.6%', ref: 'Timmerman et al. JAMA 2010' },
  { name: 'PACE-B', fx: 5, dose: 36.25, ab: 1.5, eqd2: 84.6, endpoint: 'Prostate SBRT', outcome: '5yr bPFS 95.8%', ref: 'Tree et al. NEJM 2024' },
  { name: 'PROFIT', fx: 7, dose: 42.7, ab: 1.5, eqd2: 86.8, endpoint: 'Prostate Hypofrac', outcome: '5yr bPFS 85%', ref: 'Catton et al. JCO 2017' },
  { name: 'HYPO-RT-PC', fx: 7, dose: 42.7, ab: 1.5, eqd2: 86.8, endpoint: 'Prostate Hypofrac', outcome: '5yr FFF 84%', ref: 'Widmark et al. Lancet 2019' },
  { name: 'SABR-COMET', fx: 5, dose: 30, ab: 10, eqd2: 45, endpoint: 'Oligomets (OS)', outcome: '5yr OS 42.3%', ref: 'Palma et al. JCO 2020' },
  { name: 'RTOG 0617', fx: 30, dose: 60, ab: 10, eqd2: 60, endpoint: 'Lung NSCLC (OS)', outcome: 'Standard dose superior to 74Gy', ref: 'Bradley et al. Lancet Oncol 2015' }
];

// ── Visual Components ────────────────────────────────────────────────────────

const CompareScheduleCard: React.FC<{
  title: string;
  color: string;
  dpf: number;
  n: number;
  ab: number;
  isCurrent?: boolean;
  onUpdate?: (dpf: string, n: string) => void;
}> = ({ title, color, dpf, n, ab, isCurrent, onUpdate }) => {
  const td = dpf * n;
  const b = ab > 0 ? td * (1 + dpf / ab) : 0;
  const e = ab > 0 ? b / (1 + 2 / ab) : 0;

  return (
    <div className={`card-premium p-4 border-t-4 ${color}`}>
      <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
      {!isCurrent && onUpdate ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-[10px] text-slate-500">Dose/fx</label>
            <input 
              type="number" step="0.1" 
              value={dpf || ''} 
              onChange={ev => onUpdate(ev.target.value, String(n))} 
              className="input-premium text-sm py-1 px-2" 
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Fractions</label>
            <input 
              type="number" step="1" inputMode="numeric"
              value={n || ''} 
              onChange={ev => {
                const val = ev.target.value;
                onUpdate(String(dpf), val ? String(Math.round(Number(val))) : '');
              }} 
              className="input-premium text-sm py-1 px-2" 
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-[10px] text-slate-500">Dose/fx</p>
            <p className="text-sm font-mono text-white">{dpf.toFixed(1)} Gy</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Fractions</p>
            <p className="text-sm font-mono text-white">{n}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Total Dose</span>
          <span className="text-sm font-mono font-bold text-white">{td.toFixed(1)} Gy</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">BED</span>
          <span className="text-sm font-mono font-bold text-white">{b.toFixed(2)} Gy</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">EQD2</span>
          <span className="text-sm font-mono font-bold text-white">{e.toFixed(2)} Gy</span>
        </div>
      </div>
    </div>
  );
};

const BioGauge: React.FC<{ value: number; threshold: number; label: string; unit: string }> = ({ value, threshold, label, unit }) => {
  const pct = Math.min(100, Math.max(0, (value / threshold) * 100));
  const radius = 40;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  
  let color = '#ef4444'; 
  if (pct >= 95) color = '#10b981'; 
  else if (pct >= 80) color = '#f59e0b'; 

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 55" className="w-full max-w-[160px] overflow-visible">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke={color} 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <text x="50" y="42" textAnchor="middle" className="text-xl font-black fill-white">{pct.toFixed(0)}%</text>
        <text x="50" y="54" textAnchor="middle" className="text-[8px] fill-slate-400 uppercase tracking-widest">{label}</text>
      </svg>
      <div className="text-[10px] text-slate-500 mt-1 text-center">
        Target: {threshold} {unit}
      </div>
    </div>
  );
};

const RepopChart: React.FC<{ T: number; Tk: number; Tp: number }> = ({ T, Tk, Tp }) => {
  const maxT = Math.max(T + 14, Tk + 14);
  const points = [];
  for (let t = 0; t <= maxT; t += 2) {
    const n = t > Tk ? Math.pow(2, (t - Tk) / Tp) : 1;
    points.push({ t, n });
  }
  
  const maxN = Math.max(2, points[points.length - 1].n);
  const width = 200;
  const height = 60;
  
  const getX = (t: number) => (t / maxT) * width;
  const getY = (n: number) => height - (n / maxN) * height;
  
  const pathD = `M ${points.map(p => `${getX(p.t)},${getY(p.n)}`).join(' L ')}`;
  const currentN = T > Tk ? Math.pow(2, (T - Tk) / Tp) : 1;
  
  return (
    <div className="mt-4">
      <div className="flex justify-between text-[9px] text-slate-500 mb-1">
        <span>Day 0</span>
        <span>Tk (Day {Tk})</span>
        <span>Day {maxT}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[60px] overflow-visible border-b border-l border-slate-700">
        <line x1={getX(Tk)} y1={0} x2={getX(Tk)} y2={height} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
        <line x1={getX(T)} y1={0} x2={getX(T)} y2={height} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
        <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2" />
        <circle cx={getX(T)} cy={getY(currentN)} r="3" fill="#38bdf8" />
      </svg>
      <div className="flex justify-between text-[9px] text-slate-500 mt-1">
        <span>Clonogens: 1x</span>
        <span className="text-amber-400">At end of RT: {currentN.toFixed(1)}x</span>
      </div>
    </div>
  );
};

// ── Sidebar Data ─────────────────────────────────────────────────────────────
const SIDEBAR_DATA: KeyFactSection[] = [
  {
    title: 'Common α/β Ratios',
    emoji: '🧬',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.4)',
    rows: [
      { k: 'Prostate', v: '1.5 Gy', mono: true },
      { k: 'CNS / Brain', v: '2.0 Gy', mono: true },
      { k: 'Late Tissue', v: '3.0 Gy', mono: true },
      { k: 'Breast', v: '4.0 Gy', mono: true },
      { k: 'Tumour / Early', v: '10.0 Gy', mono: true },
    ]
  },
  {
    title: 'Key Formulas',
    emoji: '📐',
    accent: '#38bdf8',
    bg: 'rgba(56,189,232,0.08)',
    border: 'rgba(56,189,232,0.4)',
    rows: [
      { k: 'BED', v: 'D × (1 + d / α/β)', mono: true },
      { k: 'EQD2', v: 'BED / (1 + 2 / α/β)', mono: true },
      { k: 'n (fractions)', v: 'D / d', mono: true },
    ]
  },
  {
    title: 'Clinical Thresholds',
    emoji: '🎯',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.4)',
    rows: [
      { k: 'Cervix (Radical)', v: '≥85 Gy EQD2₁₀', mono: false },
      { k: 'Prostate (Radical)', v: '≥74 Gy EQD2₁.₅', mono: false },
      { k: 'Spinal Cord (Max)', v: '≤50 Gy EQD2₂', mono: false },
    ]
  }
];

// ── LQ formula text ───────────────────────────────────────────────────────
const FormulaBlock: React.FC<{ ab: number }> = ({ ab }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-300 space-y-1.5 leading-relaxed">
    <div className="flex items-center gap-2 mb-2">
      <Calculator className="w-3.5 h-3.5 text-cyan-400" />
      <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-slate-400">LQ Model</p>
    </div>
    <p><span className="text-blue-400">BED</span> = D · (1 + d / α/β)</p>
    <p className="text-slate-500 pl-2 text-[10px]">where D = total dose, d = dose/fraction</p>
    <p><span className="text-emerald-400">EQD2</span> = BED / (1 + 2 / α/β)</p>
    <p className="text-slate-500 pl-2 text-[10px]">≡ n·d normalised to 2 Gy/fx</p>
    <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center gap-2">
      <span className="text-amber-400 font-bold">α/β = {ab} Gy</span>
      <span className="text-slate-600 text-[10px]">(Current setting)</span>
    </div>
  </div>
);

// ── Clinical interpretation ───────────────────────────────────────────────
function interpretEQD2(eqd2: number, ab: number): { text: string; level: 'pass' | 'warn' | 'fail' | 'info' } {
  if (ab >= 8) {
    // Tumour (H&N, lung, GI) — α/β ≥8 Gy
    if (eqd2 < 40)  return { text: 'Sub-therapeutic for most solid tumours', level: 'fail' };
    if (eqd2 < 60)  return { text: 'Palliative range — adequate for symptom control', level: 'warn' };
    if (eqd2 < 74)  return { text: 'Standard radical range (H&N, lung)', level: 'pass' };
    if (eqd2 < 90)  return { text: 'High-dose radical — prostate/cervix boost territory', level: 'pass' };
    return           { text: 'Escalated dose — SBRT/SRS or brachytherapy boost', level: 'info' };
  }
  if (ab >= 4 && ab < 8) {
    // Breast, sarcoma, non-prostate tumours
    if (eqd2 < 40)  return { text: 'Below curative/adjuvant threshold for most indications', level: 'fail' };
    if (eqd2 < 50)  return { text: 'Standard adjuvant breast/sarcoma range', level: 'pass' };
    if (eqd2 < 66)  return { text: 'High adjuvant dose — hypofractionated or boost', level: 'pass' };
    return           { text: 'Very high dose — verify OAR constraints', level: 'warn' };
  }
  if (ab > 2 && ab < 4) {
    // Late-reacting tissue (bowel, bladder, lung late)
    if (eqd2 > 50)  return { text: 'Approaching late-tissue tolerance limit — check OAR constraints', level: 'warn' };
    if (eqd2 > 60)  return { text: 'Exceeds standard late-tissue tolerance (α/β≈3)', level: 'fail' };
    return           { text: 'Within typical late-tissue tolerance range', level: 'pass' };
  }
  if (ab <= 2) {
    // CNS, spinal cord, prostate (low α/β)
    if (eqd2 < 74)  return { text: 'Below curative threshold for prostate cancer', level: 'fail' };
    if (eqd2 < 78)  return { text: 'Conventional-equivalent prostate dose (≥74 Gy EQD2₁.₅)', level: 'pass' };
    if (eqd2 < 90)  return { text: 'Dose-escalated prostate — trial-supported', level: 'pass' };
    return           { text: 'Very high EQD2 — verify late OAR constraints carefully', level: 'warn' };
  }
  return { text: 'Enter valid α/β ratio', level: 'info' };
}

const LEVEL_STYLES = {
  pass: 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
  warn: 'bg-amber-900/30 text-amber-300 border-amber-800',
  fail: 'bg-red-900/30 text-red-300 border-red-800',
  info: 'bg-blue-900/30 text-blue-300 border-blue-800',
};

// ── Main page ─────────────────────────────────────────────────────────────
const EQD2Page: React.FC = () => {
  const { rx, setTumourSite, setTumourAB, setRepop } = useRxContext();
  const [alphaBeta,  setAlphaBeta]  = React.useState(String(rx.tumourAB ?? 10));
  const [dosePerFx,  setDosePerFx]  = React.useState('2.0');
  const [fractions,  setFractions]  = React.useState('25');
  const selectedTumour = rx.selectedTumour;
  const setSelectedTumour = (entry: RadiobiologyData | null) => setTumourSite(entry?.site ?? '', entry?.subsite ?? '', entry);
  const [aiText, setAiText] = React.useState<any>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [alerts, setAlerts] = React.useState<ClinicalAlert[]>([]);
  const [showFormula, setShowFormula] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sessionRestored, setSessionRestored] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // ── Persistence ───────────────────────────────────────────────────────
  React.useEffect(() => {
    if (Object.keys({}).length === 0) {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
          const p = JSON.parse(s);
          if (p.dosePerFx) setDosePerFx(String(p.dosePerFx));
          if (p.fractions)  setFractions(String(p.fractions));
          if (p.alphaBeta)  setAlphaBeta(String(p.alphaBeta));
        }
      } catch { /* ignore */ }
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dosePerFx, fractions, alphaBeta }));
  }, [dosePerFx, fractions, alphaBeta]);

  // ── Core calculations ────────────────────────────────────────────────
  const dpf = React.useMemo(() => parseFloat(dosePerFx) || 0, [dosePerFx]);
  const n   = React.useMemo(() => parseFloat(fractions)  || 0, [fractions]);
  const ab  = React.useMemo(() => parseFloat(alphaBeta)  || 0, [alphaBeta]);

  const [useRepop, setUseRepop] = React.useState(false);
  const [tk, setTk] = React.useState(selectedTumour?.tk ?? 28);
  const [tp, setTp] = React.useState(selectedTumour?.k ?? 3.5);

  const [compareMode, setCompareMode] = React.useState(false);
  const [schedB, setSchedB] = React.useState({ dosePerFx: '2.67', fractions: '15' });
  const [schedC, setSchedC] = React.useState({ dosePerFx: '5.2', fractions: '5' });

  React.useEffect(() => {
    if (selectedTumour) {
      setTk(selectedTumour.tk ?? 28);
      setTp(selectedTumour.k ?? 3.5);
    }
  }, [selectedTumour]);

  const totalDose = React.useMemo(() => dpf * n,                                       [dpf, n]);
  const bed       = React.useMemo(() => ab > 0 ? totalDose * (1 + dpf / ab) : 0,      [totalDose, dpf, ab]);
  const eqd2      = React.useMemo(() => ab > 0 ? bed / (1 + 2 / ab) : 0,              [bed, ab]);

  const eqd2Bounds = React.useMemo(() => {
    if (!selectedTumour || !selectedTumour.abLow || !selectedTumour.abHigh || !bed) return null;
    const eqd2Low = bed / (1 + 2 / selectedTumour.abLow);
    const eqd2High = bed / (1 + 2 / selectedTumour.abHigh);
    return {
      low: Math.min(eqd2Low, eqd2High),
      high: Math.max(eqd2Low, eqd2High),
      abLow: selectedTumour.abLow,
      abHigh: selectedTumour.abHigh
    };
  }, [selectedTumour, bed]);

  const T = n * (7/5);
  const bedRep = useRepop && T > tk ? bed - (Math.log(2) / tp) * (T - tk) : bed;

  const interp    = React.useMemo(() => ab > 0 && eqd2 > 0 ? interpretEQD2(eqd2, ab) : null, [eqd2, ab]);

  const valid = dpf > 0 && n > 0 && ab > 0;

  React.useEffect(() => {
    if (valid && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [totalDose, bed, eqd2, valid]);

  // ── Advanced Features Logic ────────────────────────────────────────────
  const matchedTrial = React.useMemo(() => {
    if (ab === 0 || eqd2 === 0) return null;
    let closest = null;
    let minDiff = Infinity;
    
    for (const trial of LANDMARK_TRIALS) {
      const isLowAb = ab <= 4;
      const trialIsLowAb = trial.ab <= 4;
      if (isLowAb !== trialIsLowAb) continue;
      
      const diff = Math.abs(trial.eqd2 - eqd2);
      if (diff < 5 && diff < minDiff) {
        minDiff = diff;
        closest = trial;
      }
    }
    return closest;
  }, [eqd2, ab]);

  const lateBED = React.useMemo(() => dpf > 3 ? totalDose * (1 + dpf / 3) : 0, [totalDose, dpf]);
  const therapeuticRatio = React.useMemo(() => lateBED > 0 && bed > 0 ? bed / lateBED : 0, [bed, lateBED]);

  const gaugeConfig = React.useMemo(() => {
    if (ab <= 2) return { threshold: 74, label: 'Prostate Radical', unit: 'Gy EQD2', isBed: false };
    if (ab >= 8 && selectedTumour?.site.toLowerCase().includes('head')) return { threshold: 66, label: 'H&N Radical', unit: 'Gy EQD2', isBed: false };
    if (ab >= 8 && selectedTumour?.site.toLowerCase().includes('cervix')) return { threshold: 85, label: 'Cervix Combined', unit: 'Gy EQD2', isBed: false };
    if (ab >= 8 && dpf >= 10) return { threshold: 100, label: 'Lung SBRT', unit: 'Gy BED', isBed: true };
    return null;
  }, [ab, selectedTumour, dpf]);

  const oarGuardian = React.useMemo(() => {
    if (!selectedTumour || totalDose === 0) return null;
    const site = selectedTumour.site.toLowerCase();
    const subsite = selectedTumour.subsite?.toLowerCase() || '';
    const isHN = site.includes('head') || site.includes('neck');
    const isPelvis = site.includes('pelvis') || site.includes('prostate') || site.includes('cervix') || site.includes('gynaecolog') || subsite.includes('cervix');
    
    if (!isHN && !isPelvis) return null;

    const eqd2_3 = totalDose * (1 + dpf / 3) / (1 + 2 / 3);

    let limits = [];
    if (isHN) {
      limits = [
        { organ: 'Spinal Cord (Max)', limit: 50, value: eqd2_3 },
        { organ: 'Brainstem (Max)', limit: 54, value: eqd2_3 },
        { organ: 'Parotid (Mean)', limit: 26, value: eqd2_3 },
      ];
    } else if (isPelvis) {
      limits = [
        { organ: 'Rectum (Late)', limit: 70, value: eqd2_3 },
        { organ: 'Bladder (Late)', limit: 80, value: eqd2_3 },
        { organ: 'Bowel (Max)', limit: 50, value: eqd2_3 },
      ];
    }

    return {
      site: isHN ? 'Head & Neck' : 'Pelvis',
      eqd2_3,
      limits: limits.map(l => ({
        ...l,
        status: l.value > l.limit ? 'fail' : l.value > l.limit * 0.9 ? 'warn' : 'pass'
      }))
    };
  }, [selectedTumour, totalDose, dpf]);

  // ── Sensitivity table (±0.2 Gy/fx steps) ────────────────────────────
  const sensitivityRows = React.useMemo(() => {
    if (ab === 0 || dpf === 0) return [];
    return [-0.4, -0.2, 0, 0.2, 0.4].map(delta => {
      const d = parseFloat((dpf + delta).toFixed(2));
      if (d <= 0) return null;
      const td = d * n;
      const b  = td * (1 + d / ab);
      const e  = b / (1 + 2 / ab);
      return { d, td, b, e, isBase: delta === 0 };
    }).filter(Boolean);
  }, [dpf, n, ab]);

  // ── α/β comparison table ─────────────────────────────────────────────
  const abCompRows = React.useMemo(() => {
    if (dpf === 0 || n === 0) return [];
    return [1.5, 2, 3, 4, 10, 15].map(a => {
      const b = totalDose * (1 + dpf / a);
      const e = b / (1 + 2 / a);
      return { a, b, e, isCurrent: Math.abs(a - ab) < 0.01 };
    });
  }, [dpf, n, ab, totalDose]);

  // ── Heatmap Data ─────────────────────────────────────────────────────
  const heatmapData = React.useMemo(() => {
    if (ab === 0) return null;
    const dRange = [1.5, 1.8, 2.0, 2.5, 3.0, 5.0, 8.0, 10.0];
    const nRange = [1, 3, 5, 10, 15, 20, 25, 30, 35, 40];
    
    const data = nRange.map(f => {
      const row: any = { fractions: f };
      dRange.forEach(d => {
        row[`d_${d}`] = (f * d * (1 + d / ab)) / (1 + 2 / ab);
      });
      return row;
    });
    return { dRange, nRange, data };
  }, [ab]);

  // ── Session Restore ──────────────────────────────────────────────────
  React.useEffect(() => {
    const restore = async () => {
      const session = await getSession(CALCULATOR_ID);
      if (session && session.inputs) {
        if (session.inputs.dosePerFx) setDosePerFx(String(session.inputs.dosePerFx));
        if (session.inputs.fractions) setFractions(String(session.inputs.fractions));
        if (session.inputs.alphaBeta) setAlphaBeta(String(session.inputs.alphaBeta));
        setSessionRestored(true);
        setTimeout(() => setSessionRestored(false), 3000);
      }
    };
    restore();
  }, []);

  // ── Session Auto-save (Debounced) ──────────────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (valid) {
        saveSession(CALCULATOR_ID, { dosePerFx: dpf, fractions: n, alphaBeta: ab });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dpf, n, ab, valid]);

  // ── History Auto-save ──────────────────────────────────────────────────
  const lastSavedRef = React.useRef<string>('');
  React.useEffect(() => {
    if (valid && eqd2 > 0) {
      const currentHash = `${dpf}-${n}-${ab}`;
      if (lastSavedRef.current !== currentHash) {
        lastSavedRef.current = currentHash;
        saveHistory({
          calculatorId: CALCULATOR_ID,
          calculatorName: CALCULATOR_NAME,
          inputs: { dosePerFx: dpf, fractions: n, alphaBeta: ab },
          outputs: { totalDose, bed, eqd2 },
          flags: interp?.level === 'fail' ? ['fail'] : [],
          version: APP_VERSION,
          timestamp: Date.now()
        });
      }
    }
  }, [dpf, n, ab, totalDose, bed, eqd2, valid, interp]);
  React.useEffect(() => {
    if (valid) {
      setAlerts(checkClinicalAlerts({ 
        dosePerFx: dpf, 
        fractions: n, 
        alphaBeta: ab, 
        totalDose,
        eqd2, 
        bed,
        site: selectedTumour?.site,
        subsite: selectedTumour?.subsite,
        tumour: selectedTumour?.tumour,
        isSBRT: dpf >= 5 && n <= 10
      }));
    } else {
      setAlerts([]);
    }
  }, [dpf, n, ab, eqd2, bed, valid, selectedTumour]);

  // ── AI explanation ───────────────────────────────────────────────────
  const fetchAI = async () => {
    if (aiLoading || ab === 0) return;
    
    setAiLoading(true);
    setAiText(null);
    try {
      const summary = await getClinicalSummary(`Analyze this schedule: ${n} fx x ${dpf} Gy = ${totalDose.toFixed(1)} Gy total. Alpha/Beta: ${ab}. BED: ${bed.toFixed(2)}. EQD2: ${eqd2.toFixed(2)}.`);
      setAiText(summary);
      await saveCalculation({
        module: 'EQD2 Calculator',
        inputs: { dosePerFx: dpf, fractions: n, alphaBeta: ab },
        outputs: { totalDose, bed, eqd2 },
        flag: summary.flag
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = `Schedule: ${n} fractions × ${dpf} Gy = ${totalDose.toFixed(1)} Gy total\nα/β ratio: ${ab} Gy\nBED: ${bed.toFixed(2)} Gy\nEQD2: ${eqd2.toFixed(2)} Gy\n\nInterpretation: ${aiText ? `${aiText.tissue_category}. ${aiText.clinical_context} ${aiText.comparison_standard} ${aiText.oar_note}` : ''}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-slam">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <KeyFactsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        data={SIDEBAR_DATA}
      >
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "The LQ model is the standard for iso-effect calculations, but caution is advised for doses {'>'}8-10 Gy per fraction where the model may over-predict cell kill."
          </p>
        </div>
      </KeyFactsSidebar>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal" />
            <p className="label-micro text-teal">Radiobiology Solver</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">BED & EQD2</h1>
          <p className="text-sm text-slate-500 font-serif italic">Linear-Quadratic model normalization · ICRU 83</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompareMode(m => !m)}
            className={`btn-premium py-2 flex items-center gap-2 ${compareMode ? 'btn-primary' : 'btn-outline'}`}
          >
            <Layers className="w-4 h-4" />
            Compare
          </button>
          <button
            onClick={() => setShowFormula(f => !f)}
            className="btn-premium btn-outline py-2"
          >
            {showFormula ? 'Hide Formula' : 'View Formula'}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'RadCalcPro EQD2 Calculation',
                  text: `Check out this EQD2 calculation: ${totalDose.toFixed(1)} Gy in ${n} fx (EQD2: ${eqd2.toFixed(2)} Gy)`,
                });
              } else {
                alert('Share functionality not supported.');
              }
            }}
            className="btn-premium btn-outline py-2 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => reactToPrintFn()}
            className="btn-premium btn-primary py-2 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {showFormula && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FormulaBlock ab={ab} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Inputs (Left) ────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Prescription Parameters</h2>
            <div className="card-premium p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label-micro">Dose / Fx (Gy)</label>
                  <input
                    type="number" step="0.01" min="0.1" max="30" inputMode="decimal"
                    value={dosePerFx}
                    onChange={e => setDosePerFx(e.target.value)}
                    className="input-premium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Fractions</label>
                  <input
                    type="number" step="1" min="1" max="100" inputMode="numeric"
                    value={fractions}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) setFractions('');
                      else setFractions(String(Math.round(Number(val))));
                    }}
                    className="input-premium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-micro">Tumour Site & α/β</label>
                <TumourSelector
                  selectedEntry={selectedTumour}
                  onSelect={(entry) => {
                    setSelectedTumour(entry);
                    setAlphaBeta(entry.ab.toString());
                    setTumourAB(entry.ab);
                    setRepop(entry.tk, entry.k);
                  }}
                  onClear={() => setSelectedTumour(null)}
                />
              </div>

              {!selectedTumour && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="label-micro">Manual α/β Ratio (Gy)</label>
                  <input
                    type="number" step="0.1" min="0.5" max="20" inputMode="decimal"
                    value={alphaBeta}
                    onChange={e => {
                      const value = e.target.value;
                      setAlphaBeta(value);
                      setTumourAB(parseFloat(value) || 10);
                      setSelectedTumour(null);
                    }}
                    className="input-premium"
                  />
                </div>
              )}
            </div>
          </section>

          {/* α/β comparison */}
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">α/β Comparison</h2>
            <div className="card-premium overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 label-micro">α/β</th>
                    <th className="px-4 py-3 text-right label-micro">EQD2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {abCompRows.map(r => (
                    <tr key={r.a} className={r.isCurrent ? 'bg-teal/5' : ''}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-white">{r.a} Gy</p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {r.a === 1.5 ? 'Prostate' : r.a === 3 ? 'Late' : r.a === 10 ? 'Tumour' : 'Other'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className={`text-sm font-mono font-bold ${r.isCurrent ? 'text-teal' : 'text-slate-400'}`}>
                          {r.e.toFixed(2)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Results (Right) ───────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          <AlertStack alerts={alerts} />
          
          <AnimatePresence>
            {sessionRestored && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-lg text-center"
              >
                Restored from last session
              </motion.div>
            )}
          </AnimatePresence>

          {valid ? (
            <>
              <section className="space-y-4">
                <h2 className="label-micro opacity-40">Calculated Iso-effects</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                    <p className="label-micro opacity-40 mb-2">Total Dose</p>
                    <p className="text-4xl font-black text-white font-mono leading-none">
                      <AnimatedNumber value={totalDose} />
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Gy (Physical)</p>
                  </div>
                  <div className="card-premium p-6 bg-teal/5 border-teal/20 flex flex-col items-center text-center">
                    <p className="label-micro text-teal/70 mb-2">BED<sub>{ab}</sub></p>
                    <p className="text-5xl font-black text-white font-mono leading-none">
                      <AnimatedNumber value={bed} decimals={2} />
                    </p>
                    <p className="text-xs text-teal/50 mt-2">Gy (Biological)</p>
                  </div>
                  <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                    <p className="label-micro opacity-40 mb-2">EQD2<sub>{ab}</sub></p>
                    <p className="text-4xl font-black text-white font-mono leading-none mb-4">
                      <AnimatedNumber value={eqd2} decimals={2} />
                    </p>
                    {gaugeConfig ? (
                      <BioGauge value={gaugeConfig.isBed ? bed : eqd2} threshold={gaugeConfig.threshold} label={gaugeConfig.label} unit={gaugeConfig.unit} />
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">Gy (Normalized)</p>
                    )}
                    {eqd2Bounds && (
                      <div className="mt-4 text-[10px] text-slate-400">
                        <p>Uncertainty Range (α/β {eqd2Bounds.abLow}-{eqd2Bounds.abHigh})</p>
                        <p className="font-mono text-white">{eqd2Bounds.low.toFixed(2)} - {eqd2Bounds.high.toFixed(2)} Gy</p>
                      </div>
                    )}
                  </div>
                </div>

                {compareMode && (
                  <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h2 className="label-micro opacity-40">Multi-Schedule Comparison</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CompareScheduleCard 
                        title="Schedule A (Current)" color="border-t-teal" 
                        dpf={dpf} n={n} ab={ab} isCurrent 
                      />
                      <CompareScheduleCard 
                        title="Schedule B" color="border-t-blue-500" 
                        dpf={parseFloat(schedB.dosePerFx) || 0} n={parseFloat(schedB.fractions) || 0} ab={ab} 
                        onUpdate={(d, f) => setSchedB({ dosePerFx: d, fractions: f })}
                      />
                      <CompareScheduleCard 
                        title="Schedule C" color="border-t-purple-500" 
                        dpf={parseFloat(schedC.dosePerFx) || 0} n={parseFloat(schedC.fractions) || 0} ab={ab} 
                        onUpdate={(d, f) => setSchedC({ dosePerFx: d, fractions: f })}
                      />
                    </div>
                  </section>
                )}

                {/* Hypofractionation Safety Checker */}
                {dpf > 3 && (
                  <div className="card-premium p-4 border-l-4 border-l-amber-500 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-white">Hypofractionation Safety Check</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Late Tissue BED₃</p>
                        <p className="text-lg font-mono font-bold text-amber-400">{lateBED.toFixed(2)} Gy</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Therapeutic Ratio</p>
                        <p className={`text-lg font-mono font-bold ${therapeuticRatio < 1.2 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {therapeuticRatio.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {therapeuticRatio < 1.2 && (
                      <p className="text-xs text-red-400">
                        ⚠️ Therapeutic ratio (Tumour BED / Late BED) is below 1.2. High risk of late toxicity relative to tumour control.
                      </p>
                    )}
                    {dpf > 8 && (
                      <p className="text-xs text-amber-400/80 mt-2 border-t border-amber-500/20 pt-2">
                        <strong>Note:</strong> At {dpf} Gy/fx, the standard LQ model may overestimate cell kill. Consider using the Universal Survival Curve (USC) or modified LQ-L model for SBRT doses {'>'}8 Gy.
                      </p>
                    )}
                  </div>
                )}

                {/* OAR Guardian */}
                {oarGuardian && (
                  <div className="card-premium p-4 border-l-4 border-l-blue-500 bg-blue-500/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-white">OAR Guardian ({oarGuardian.site})</h3>
                      <span className="ml-auto text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Late Tissue EQD2 (α/β=3): {oarGuardian.eqd2_3.toFixed(2)} Gy</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {oarGuardian.limits.map((l, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${
                          l.status === 'fail' ? 'bg-red-900/20 border-red-800/50' :
                          l.status === 'warn' ? 'bg-amber-900/20 border-amber-800/50' :
                          'bg-emerald-900/20 border-emerald-800/50'
                        }`}>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            {l.organ}
                            <span className={`ml-1 font-bold ${
                              l.status === 'fail' ? 'text-red-400' :
                              l.status === 'warn' ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              ({l.status === 'fail' ? 'FAIL' : l.status === 'warn' ? 'WARN' : 'PASS'})
                            </span>
                          </p>
                          <div className="flex justify-between items-end">
                            <p className={`text-lg font-mono font-bold ${
                              l.status === 'fail' ? 'text-red-400' :
                              l.status === 'warn' ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>{l.value.toFixed(2)} Gy</p>
                            <p className="text-[10px] text-slate-500">Limit: {l.limit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repopulation correction */}
                <div className="card-premium p-4 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useRepop} onChange={e => setUseRepop(e.target.checked)} className="accent-teal" />
                    <span className="label-micro">Repopulation correction (BEDrep)</span>
                  </label>
                  {useRepop && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="label-micro">Tk (days)</label>
                        <input type="number" inputMode="decimal" value={tk} onChange={e => setTk(parseFloat(e.target.value))} className="input-premium" />
                      </div>
                      <div className="space-y-1">
                        <label className="label-micro">Tp (days)</label>
                        <input type="number" inputMode="decimal" value={tp} onChange={e => setTp(parseFloat(e.target.value))} className="input-premium" />
                      </div>
                    </div>
                  )}
                  {useRepop && (
                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="label-micro opacity-60">BED<sub>rep</sub></p>
                        <p className={`text-xl font-bold ${T < tk ? 'text-amber-500' : 'text-white'}`}>
                          {bedRep.toFixed(2)} Gy
                          {T < tk && <span className="ml-2 text-xs">⚠️ Repopulation not yet active</span>}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Formula: BED<sub>rep</sub> = BED - (ln(2)/Tp) × (T - Tk)<br/>
                        <span className="text-amber-500/80">Note: T = {T.toFixed(1)} days (calculated as n × 7/5, assuming exactly 5 fx/week). For 6 fx/week or non-standard gaps, T must be actual calendar days.</span>
                      </p>
                      <RepopChart T={T} Tk={tk} Tp={tp} />
                    </div>
                  )}
                </div>

                {interp && (
                  <div className={`card-premium p-4 flex items-start gap-3 border-l-4 ${
                    interp.level === 'pass' ? 'border-l-emerald-500 bg-emerald-500/5' :
                    interp.level === 'warn' ? 'border-l-amber-500 bg-amber-500/5' :
                    interp.level === 'info' ? 'border-l-blue-500 bg-blue-500/5' :
                    'border-l-red-500 bg-red-500/5'
                  }`}>
                    <div className="mt-0.5">
                      {interp.level === 'fail' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : 
                       interp.level === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                       interp.level === 'info' ? <Info className="w-4 h-4 text-blue-500" /> :
                       <Activity className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <p className="label-micro opacity-60 mb-1">
                        Clinical Interpretation 
                        <span className={`ml-2 uppercase font-bold ${
                          interp.level === 'pass' ? 'text-emerald-500' :
                          interp.level === 'warn' ? 'text-amber-500' :
                          interp.level === 'info' ? 'text-blue-500' :
                          'text-red-500'
                        }`}>
                          ({interp.level === 'pass' ? 'Safe' : interp.level === 'warn' ? 'Warning' : interp.level === 'info' ? 'Info' : 'Danger'})
                        </span>
                      </p>
                      <p className="text-sm font-bold text-white">{interp.text}</p>
                    </div>
                  </div>
                )}

                {/* Clinical Trial Comparison Panel */}
                {matchedTrial && (
                  <div className="card-premium p-4 border-l-4 border-l-teal bg-teal/5 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-teal" />
                      <h3 className="text-sm font-bold text-white">Nearest Landmark Trial</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Trial</p>
                        <p className="text-sm font-bold text-white">{matchedTrial.name}</p>
                        <p className="text-xs text-slate-400">{matchedTrial.dose} Gy / {matchedTrial.fx} fx (EQD2: {matchedTrial.eqd2} Gy)</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Endpoint</p>
                        <p className="text-sm text-white">{matchedTrial.endpoint}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Outcome</p>
                        <p className="text-sm text-white">{matchedTrial.outcome}</p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{matchedTrial.ref}</p>
                      </div>
                    </div>
                  </div>
                )}

              </section>

              {/* Sensitivity */}
              <section className="space-y-4">
                <h2 className="label-micro opacity-40">Dose/Fx Sensitivity (±0.4 Gy)</h2>
                <div className="card-premium overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 label-micro">Dose/Fx</th>
                        <th className="px-6 py-4 label-micro text-right">Total Dose</th>
                        <th className="px-6 py-4 label-micro text-right">BED</th>
                        <th className="px-6 py-4 label-micro text-right">EQD2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sensitivityRows.map((r: any) => (
                        <tr key={r.d} className={r.isBase ? 'bg-teal/5' : 'hover:bg-white/[0.01] transition-colors'}>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-mono font-bold ${r.isBase ? 'text-teal' : 'text-white'}`}>
                              {r.d.toFixed(2)} Gy
                            </span>
                            {r.isBase && <span className="ml-2 label-micro text-teal/50">(Base)</span>}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-slate-400">{r.td.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right text-sm font-mono text-slate-400">{r.b.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-sm font-mono font-bold text-white">{r.e.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Heatmap */}
              {heatmapData && (
                <section className="space-y-4">
                  <h2 className="label-micro opacity-40">Fractionation Sensitivity Heatmap (EQD2)</h2>
                  <div className="card-premium overflow-x-auto p-4">
                    <table className="w-full text-center border-collapse min-w-[500px]">
                      <thead>
                        <tr>
                          <th className="p-2 text-[10px] text-slate-500 border-b border-r border-slate-800">Fx \ d/fx</th>
                          {heatmapData.dRange.map(d => <th key={d} className="p-2 text-xs font-mono text-slate-400 border-b border-slate-800">{d} Gy</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.data.map((row: any) => (
                          <tr key={row.fractions}>
                            <td className="p-2 text-xs font-mono text-slate-400 border-r border-slate-800">{row.fractions}</td>
                            {heatmapData.dRange.map(d => {
                              const eqd2Val = row[`d_${d}`];
                              let color = 'bg-slate-800/50 text-slate-300';
                              if (eqd2Val < 40) color = 'bg-blue-900/30 text-blue-300';
                              else if (eqd2Val < 60) color = 'bg-emerald-900/30 text-emerald-300';
                              else if (eqd2Val < 80) color = 'bg-amber-900/30 text-amber-300';
                              else color = 'bg-red-900/30 text-red-300';
                              
                              const isCurrent = Math.abs(d - dpf) < 0.01 && Math.abs(row.fractions - n) < 0.01;
                              
                              return (
                                <td key={d} title={`Dose/fx: ${d} Gy\nFractions: ${row.fractions}\nTotal: ${(d * row.fractions).toFixed(1)} Gy\nEQD2: ${eqd2Val.toFixed(2)} Gy`} className={`p-2 text-xs font-mono border border-slate-800/50 ${color} ${isCurrent ? 'ring-2 ring-white ring-inset font-bold' : ''}`}>
                                  {eqd2Val.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-900/30 border border-slate-800"></div> &lt;40 Gy</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-900/30 border border-slate-800"></div> 40-60 Gy</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-900/30 border border-slate-800"></div> 60-80 Gy</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-900/30 border border-slate-800"></div> &gt;80 Gy</div>
                    </div>
                  </div>
                </section>
              )}

              {/* AI Insight */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="label-micro opacity-40">AI Clinical Insight</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={fetchAI}
                      disabled={aiLoading}
                      className="btn-premium btn-primary py-1.5 px-4 text-[10px]"
                    >
                      {aiLoading ? 'Analyzing...' : 'Generate Analysis'}
                    </button>
                    {aiText && (
                      <button
                        onClick={copyToClipboard}
                        className="btn-premium btn-outline py-1.5 px-4 text-[10px]"
                      >
                        Copy Result
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-premium p-6">
                  {aiText ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Tissue Category</span>
                        <p className="text-sm text-slate-300 font-serif">{aiText.tissue_category}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Clinical Context</span>
                        <p className="text-sm text-slate-300 font-serif">{aiText.clinical_context}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Standard Comparison</span>
                        <p className="text-sm text-slate-300 font-serif">{aiText.comparison_standard}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">OAR Note</span>
                        <p className="text-sm text-slate-300 font-serif">{aiText.oar_note}</p>
                      </div>
                      {aiText.references && aiText.references.length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">References</span>
                          <ul className="list-disc pl-4 text-xs text-slate-400">
                            {aiText.references.map((ref: string, idx: number) => <li key={idx}>{ref}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <GraduationCap className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Generate a radiobiology explanation tailored to this schedule.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 card-premium border-dashed">
              <Calculator className="w-12 h-12 text-slate-800 mb-4" />
              <h3 className="text-xl font-bold text-slate-600">Awaiting Parameters</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Enter prescription details on the left to begin radiobiological analysis.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="pt-12 text-center">
        <p className="label-micro opacity-20 max-w-2xl mx-auto">
          Ref: Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy.
          Br J Radiol 1989. Hall & Giaccia, Radiobiology for the Radiologist, 8th ed.
        </p>
      </footer>

      <div className="sr-only">
        <div ref={contentRef}>
          <ClinicalReport
            title="BED & EQD2 Solver Report"
            inputs={[
              { label: 'Dose per Fraction', value: dosePerFx, unit: 'Gy' },
              { label: 'Fractions', value: fractions },
              { label: 'α/β Ratio', value: ab.toString(), unit: 'Gy' },
              { label: 'Tumour Site', value: selectedTumour?.site || 'Manual' },
            ]}
            outputs={[
              { label: 'Total Dose', value: totalDose.toFixed(1), unit: 'Gy' },
              { label: `BED (${ab})`, value: bed.toFixed(2), unit: 'Gy' },
              { label: `EQD2 (${ab})`, value: eqd2.toFixed(2), unit: 'Gy' },
            ]}
            interpretation={aiText ? `${aiText.tissue_category}. ${aiText.clinical_context} ${aiText.comparison_standard} ${aiText.oar_note}` : interp?.text || 'No interpretation generated.'}
            citations={aiText?.references || [
              'Fowler JF. The linear-quadratic formula and progress in fractionated radiotherapy. Br J Radiol 1989.',
              'Hall & Giaccia, Radiobiology for the Radiologist, 8th ed.'
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default EQD2Page;
