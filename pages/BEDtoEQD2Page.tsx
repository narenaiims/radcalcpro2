import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData } from '@/src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { BookOpen, ChevronRight, GraduationCap, Printer } from 'lucide-react';
import { AnimatedNumber } from "@/src/components/AnimatedNumber";
import { Share2 } from 'lucide-react';
import { PDFReport } from '@/src/components/PDFReport';
import { generatePDFBlob, sharePDF } from '@/src/lib/pdfUtils';

const STORAGE_KEY = 'radonco_bed_eqd2_state_v2';

// ── Quick Reference Data ──────────────────────────────────────────────────
const QUICK_REF_DATA = {
  abRatios: [
    { label: 'Tumour (Early)', value: '10 Gy' },
    { label: 'Late Tissues', value: '3 Gy' },
    { label: 'Prostate', value: '1.5 Gy' },
    { label: 'Breast', value: '4 Gy' },
    { label: 'CNS / Cord', value: '2 Gy' },
  ],
  formulas: [
    { label: 'BED', value: 'D × (1 + d / α/β)' },
    { label: 'EQD2', value: 'BED / (1 + 2 / α/β)' },
    { label: 'TDF', value: 'n × d^1.538 × X^-0.169' },
  ],
  thresholds: [
    { label: 'Lung SBRT BED₁₀', value: '≥ 100 Gy' },
    { label: 'Cord EQD2₃', value: '< 50 Gy' },
    { label: 'Rectum EQD2₃', value: '< 75 Gy' },
  ]
};

// ── Common clinical BED/EQD2 reference values ─────────────────────────────
interface ClinicalReference {
  label: string;
  note: string;
  bed10?: number;
  eqd2_10?: number;
  bed4?: number;
  eqd2_4?: number;
  bed_p?: number;
  eqd2_p?: number;
  bed2?: number;
  eqd2_2?: number;
  eqd2_3?: number | null;
}

const CLINICAL_REF: ClinicalReference[] = [
  { label: 'WBRT palliative (30/10)',     bed10: 39.0,  eqd2_10: 32.5,  eqd2_3: null,  note: 'Standard palliation' },
  { label: 'H&N radical (70/35)',         bed10: 84.0,  eqd2_10: 70.0,  eqd2_3: null,  note: 'Standard fractionation' },
  { label: 'Breast (50/25)',              bed4:  75.0,  eqd2_4:  50.0,  eqd2_3: null,  note: 'Conventional' },
  { label: 'Breast START-B (40/15)',      bed4:  66.7,  eqd2_4:  44.5,  eqd2_3: null,  note: 'START-B (2.67 Gy/fx)' },
  { label: 'Breast FAST-Forward (26/5)',  bed4:  59.8,  eqd2_4:  39.9,  eqd2_3: null,  note: 'FAST-Forward (5.2 Gy/fx)' },
  { label: 'Prostate (78/39)',            bed_p: 182.0, eqd2_p:  78.0,  eqd2_3: null,  note: 'α/β=1.5 (Standard)' },
  { label: 'Prostate CHHiP (60/20)',      bed_p: 180.0, eqd2_p:  77.1,  eqd2_3: null,  note: 'CHHiP (3 Gy/fx)' },
  { label: 'Lung SBRT (54/3)',            bed10: 151.2, eqd2_10: 126.0, eqd2_3: null,  note: 'RTOG 0236 (Rx at 80% isodose, Dmax=67.5Gy)' },
  { label: 'Lung SABR (48/4)',            bed10: 105.6, eqd2_10: 88.0,  eqd2_3: null,  note: 'Common peripheral SBRT' },
  { label: 'Lung SABR (60/5)',            bed10: 132.0, eqd2_10: 110.0, eqd2_3: null,  note: 'Stereotactic (12 Gy/fx)' },
  { label: 'Bone palliation (8/1)',       bed10: 14.4,  eqd2_10: 12.0,  eqd2_3: null,  note: 'Single fraction' },
  { label: 'Spinal cord limit (45/25)',   bed2:  85.5,  eqd2_2:  42.75, eqd2_3: null,  note: 'TD5/5 Conventional' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const bedToEQD2 = (bed: number, ab: number) => ab > 0 ? bed / (1 + 2 / ab) : 0;
const eqd2ToBED = (eqd2: number, ab: number) => ab > 0 ? eqd2 * (1 + 2 / ab) : 0;

// ── Main component ────────────────────────────────────────────────────────
const BEDtoEQD2Page: React.FC = () => {
  const [ab,    setAb]    = useState('10');
  const [input, setInput] = useState('100');
  const [mode,  setMode]  = useState<'BED_TO_EQD2'|'EQD2_TO_BED'>('BED_TO_EQD2');
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (items as {label: string, value: string}[]).map(item => ({ k: item.label, v: item.value }))
  }));


  // Persistence
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const p = JSON.parse(s);
        if (p.ab)    setAb(String(p.ab));
        if (p.input) setInput(String(p.input));
        if (p.mode)  setMode(p.mode);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ab, input, mode }));
  }, [ab, input, mode]);

  const nAb    = parseFloat(ab)    || 0;
  const nInput = parseFloat(input) || 0;

  const result = useMemo(() =>
    nAb > 0 && nInput > 0
      ? mode === 'BED_TO_EQD2'
        ? bedToEQD2(nInput, nAb)
        : eqd2ToBED(nInput, nAb)
      : 0,
  [mode, nInput, nAb]);

  // Cross-ab comparison table
  const crossAbRows = useMemo(() => {
    if (nInput <= 0) return [];
    return [1.5, 2, 3, 4, 5, 8, 10, 15, 20].map(a => ({
      ab: a,
      result: mode === 'BED_TO_EQD2' ? bedToEQD2(nInput, a) : eqd2ToBED(nInput, a),
      isCur: Math.abs(a - nAb) < 0.01,
    }));
  }, [nInput, nAb, mode]);

  const isBtoE = mode === 'BED_TO_EQD2';
  const valid  = nAb > 0 && nInput > 0;

  return (
    <div className="space-y-4 fade-in pb-2 relative">
      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">BED ↔ EQD2 Converter</h1>
        <p className="text-sm text-slate-500">Direct biological normalisation · LQ model</p>
      </div>

      {/* ── Mode toggle ──────────────────────────────────────────────── */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
        {(['BED_TO_EQD2','EQD2_TO_BED'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition
              ${mode === m
                ? 'bg-[#1e3a5f] text-white'
                : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {m === 'BED_TO_EQD2' ? 'BED → EQD2' : 'EQD2 → BED'}
          </button>
        ))}
      </div>

      {/* ── Formula strip ────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-300">
        {isBtoE
          ? <><span className="text-emerald-300">EQD2</span> = BED / (1 + 2 / α/β)</>
          : <><span className="text-blue-300">BED</span> = EQD2 × (1 + 2 / α/β)</>
        }
        <span className="text-slate-500 ml-3 text-[10px]">
          · factor = {nAb > 0 ? (1 + 2 / nAb).toFixed(3) : '—'} at α/β={nAb}
        </span>
      </div>

      {/* ── Inputs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parameters</p>
        </div>
        <div className="px-3 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isBtoE ? 'BED input (Gy)' : 'EQD2 input (Gy)'}
              </label>
              <input type="number" step="0.5" value={input}
                onChange={e => setInput(e.target.value)}
                className="input-clinical num" />
            </div>
          </div>
          
          {/* Tumour Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Tumour Site & α/β
            </label>
            <TumourSelector
              selectedEntry={selectedTumour}
              onSelect={(entry) => {
                setSelectedTumour(entry);
                setAb(entry.ab.toString());
              }}
              onClear={() => setSelectedTumour(null)}
            />
            
            {/* Fallback if no tumour selected */}
            {!selectedTumour && (
              <div className="mt-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or manually set α/β Ratio (Gy)
                </label>
                <input type="number" step="0.5" value={ab}
                  onChange={e => {
                    setAb(e.target.value);
                    setSelectedTumour(null);
                  }} className="input-clinical num" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Result ───────────────────────────────────────────────────── */}
      {valid && (
        <div className="bg-[#1e3a5f] rounded-lg text-white px-4 py-4 text-center">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase tracking-widest text-blue-200/60">
              {isBtoE ? 'EQD2' : 'BED'}<sub>{nAb}</sub> Result
            </p>
          </div>
          <p className="text-4xl font-black num"><AnimatedNumber value={result} decimals={2} /></p>
          <p className="text-sm text-blue-200/60 mt-1">Gy</p>
          <div className="mt-3 pt-3 border-t border-blue-800/40 text-[11px] font-mono text-blue-200/50">
            {isBtoE
              ? `${nInput.toFixed(1)} / (1 + 2/${nAb}) = ${nInput.toFixed(1)} / ${(1 + 2/nAb).toFixed(3)} = ${result.toFixed(2)} Gy`
              : `${nInput.toFixed(1)} × (1 + 2/${nAb}) = ${nInput.toFixed(1)} × ${(1 + 2/nAb).toFixed(3)} = ${result.toFixed(2)} Gy`
            }
          </div>
        </div>
      )}

      {/* ── Cross α/β comparison ─────────────────────────────────────── */}
      {valid && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isBtoE ? 'EQD2' : 'BED'} across α/β ratios — input {nInput} Gy
            </p>
          </div>
          <div className="scroll-x">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                  <th className="px-3 py-2 text-left">α/β (Gy)</th>
                  <th className="px-3 py-2 text-left">Tissue type</th>
                  <th className="px-3 py-2 text-right">Factor (1+2/α/β)</th>
                  <th className="px-3 py-2 text-right">{isBtoE ? 'EQD2' : 'BED'} (Gy)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {crossAbRows.map(r => (
                  <tr key={r.ab}
                    className={r.isCur
                      ? 'bg-blue-50 font-bold text-blue-800'
                      : 'text-slate-700 hover:bg-slate-50'}>
                    <td className="px-3 py-2 num">{r.ab}{r.isCur && ' ←'}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-500">
                      {r.ab === 1.5 ? 'Prostate' :
                       r.ab === 2   ? 'CNS/brain' :
                       r.ab === 3   ? 'Late (cord/bowel)' :
                       r.ab === 4   ? 'Breast' :
                       r.ab === 5   ? 'Cervix (late)' :
                       r.ab === 8   ? 'Skin (acute)' :
                       r.ab === 10  ? 'Tumour/early' :
                       r.ab === 15  ? 'High α/β tumour' : 'Very high'}
                    </td>
                    <td className="px-3 py-2 text-right num">{(1 + 2/r.ab).toFixed(3)}</td>
                    <td className="px-3 py-2 text-right num font-semibold">{r.result.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Clinical reference table ──────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Common Schedule BED/EQD2 Reference (click to load BED)
          </p>
        </div>
        <div className="scroll-x">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                <th className="px-3 py-2 text-left">Schedule</th>
                <th className="px-3 py-2 text-right">BED (Gy)</th>
                <th className="px-3 py-2 text-right">EQD2 (Gy)</th>
                <th className="px-3 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CLINICAL_REF.map((r, i) => {
                // Pick best available BED value and its alpha-beta
                const bedVal  = r.bed10  ?? r.bed4   ?? r.bed_p  ?? r.bed2   ?? 0;
                const eqd2Val = r.eqd2_10 ?? r.eqd2_4 ?? r.eqd2_p ?? r.eqd2_2 ?? 0;
                const abKey   = r.bed10 ? '10' : r.bed4 ? '4' : r.bed_p ? '1.5' : '2';
                return (
                  <tr key={i}
                    className="text-slate-700 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setMode('BED_TO_EQD2');
                      setAb(abKey);
                      setInput(String(bedVal));
                    }}>
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    <td className="px-3 py-2 text-right num font-bold text-blue-800" title={`Calculated using α/β = ${abKey} Gy`}>
                      {bedVal.toFixed(1)}<sub className="cursor-help">{abKey}</sub>
                    </td>
                    <td className="px-3 py-2 text-right num text-emerald-800">
                      {eqd2Val ? eqd2Val.toFixed(1) : '—'}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-slate-400 italic">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Clinical notes ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Key Relationships</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            {
              title: 'BED vs EQD2 — not interchangeable',
              body: 'BED represents total log cell kill including repair. EQD2 normalises to 2 Gy/fx for clinical comparison. BED > EQD2 always (since 1+2/α/β > 1). Never mix them in cumulative calculations without converting.',
            },
            {
              title: 'When to use BED vs EQD2',
              body: 'Use BED when combining modalities with different dose rates (e.g. LDR brachytherapy). Use EQD2 for comparing EBRT schedules and for QUANTEC/GEC-ESTRO OAR constraints which are specified in EQD2.',
            },
            {
              title: 'α/β dominates the conversion',
              body: 'At α/β=10: factor = 1.2 (BED and EQD2 are similar). At α/β=1.5: factor = 2.33 (BED is more than double EQD2). This is why SBRT BED₁₀ values (>100 Gy) correspond to moderate EQD2 values.',
            },
            {
              title: 'SBRT lung BED₁₀ ≥ 100 Gy threshold',
              body: 'TROG 09.02 (Ball 2019) and RTOG 0236 demonstrated that lung SBRT with BED₁₀ ≥100 Gy achieves local control >90%. This threshold = EQD2₁₀ ≈ 60 Gy and corresponds to e.g. 54 Gy/3fx or 60 Gy/5fx. Note: BED₁₀ = 151.2 Gy for RTOG 0236 assumes 54 Gy is the prescription point (Rx at 80% isodose). If using UK convention (100%/95% isodose to PTV), the same protocol does not equal the same BED.',
            },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5">
              <p className="text-[11px] font-bold text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reference ────────────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-400 px-1">
        Ref: Fowler JF. Br J Radiol 1989. Hall &amp; Giaccia, Radiobiology for the Radiologist 8th ed.
        Ball DL et al. TROG 09.02. Lancet Oncol 2019. Timmerman R et al. RTOG 0236. JAMA 2010.
      </p>
    </div>
  );
};

export default BEDtoEQD2Page;