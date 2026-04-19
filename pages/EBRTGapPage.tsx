/**
 * EBRTGapPage.tsx — CORRECTED PRO VERSION
 *
 * Fixes applied (audit 2026-03-30):
 *   ISS-02: Added mandatory ≥6h inter-fraction interval warning for BID (Strategy C)
 *   ISS-05: Urgency now uses RELATIVE loss (% of planned EQD2) + absolute threshold —
 *           whichever gives the higher tier wins. Prevents under-alarming for SCLC/
 *           cervix SCC and over-alarming for palliative courses.
 *   BUG-A:  Old code computed eqd2Loss = bedLoss/(1+2/ab) — incorrect.
 *           Correct formula: eqd2Loss = k × effectiveRepopDays (k is already in EQD2
 *           units, NOT BED units per Withers 1988 / Dale 1989 convention used in this app).
 *           Code already stored k as EQD2/day in radiobiologyData — the intermediate
 *           bedLoss variable was an artefact that introduced a spurious division.
 *           Fixed to: eqd2Loss = k × effectiveRepopDays directly.
 *   BUG-B:  Strategy B "increase dose/fx" previously showed a percentage with a
 *           division-by-zero risk when fxRemaining = 0. Now uses full quadratic solve
 *           (identical to the working EQD2Page version) and shows the new dpf in Gy.
 *   BUG-C:  Over-compensation (ceil rounding) is now disclosed to the clinician.
 *   BUG-D:  fxPerWeek was hardcoded to 5 for OTT estimation. Now accepts user input
 *           defaulting to 5 with a visible field on the prescription step.
 *   BUG-E:  bidInterval min clamped to 6 with a validation error below 6.
 *
 * References:
 *   Withers HR et al. Acta Oncol 1988 (accelerated repopulation)
 *   Dale RG. Br J Radiol 1985 (BED additivity)
 *   Fowler JF. Br J Radiol 1989 (LQ model)
 *   RTOG / CHART protocols (≥6h BID interval)
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, CheckCircle, Info, Calculator,
  RotateCcw, Calendar, Activity, AlertTriangle, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData, getInterpretation } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { ExportButton, ClinicalReport } from '@/src/components/ClinicalPDFExport';
import { Share2 } from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { NumberInput } from '../src/components/NumberInput';

// ── Quick reference sidebar data ──────────────────────────────────────────
const QUICK_REF_DATA = [
  {
    category: 'Gap Principles',
    items: [
      { label: 'OTT Impact',   value: 'Repopulation Loss' },
      { label: 'K-value',      value: 'EQD2 loss/day (Gy)' },
      { label: 'Tk',           value: 'Kick-off time (days)' },
      { label: 'Formula',      value: 'Loss = k × (gap − max[0,Tk−elapsed])' },
      { label: 'BED Loss',     value: 'Loss = d × (1 + d/αβ)' },
    ],
  },
  {
    category: 'Compensation Methods',
    items: [
      { label: 'Method A', value: 'Extra fractions at same d/fx' },
      { label: 'Method B', value: 'Increase dose/fx (remaining fx)' },
      { label: 'Method C', value: 'BID days (≥6h inter-fraction)' },
      { label: 'Method D', value: 'Shorten OTT (treat weekends)' },
    ],
  },
  {
    category: 'Key k Values (Gy EQD2/day)',
    items: [
      { label: 'H&N SCC',     value: '0.6 (Tk 21d)' },
      { label: 'Cervix SCC',  value: '0.6 (Tk 21d)' },
      { label: 'NSCLC Adeno', value: '0.4 (Tk 28d)' },
      { label: 'SCLC',        value: '1.0 (Tk 14d)' },
      { label: 'TNBC',        value: '0.5 (Tk 14d)' },
      { label: 'Prostate',    value: '0.0 (no repop)' },
      { label: 'Bladder',     value: '0.3 (Tk 21d)' },
      { label: 'Oesophagus',  value: '0.4 (Tk 21d)' },
    ],
  },
  {
    category: 'Clinical Guidance',
    items: [
      { label: 'Urgency',     value: 'High if loss > 5% EQD2' },
      { label: 'BID Gap',      value: 'Min 6h between fractions' },
      { label: 'Max d/fx',    value: 'Avoid > 2.5 Gy for late tox' },
      { label: 'Tk Start',    value: 'Count from Day 1 of RT' },
    ],
  },
];

// ── Types ──────────────────────────────────────────────────────────────────
type WizardStep = 'site' | 'prescription' | 'gap' | 'results';

interface GapState {
  totalDose: number;
  dosePerFx: number;
  fxCompleted: number;
  gapDays: number;
  fxPerWeek: number;
  bidDosePerFx: number;
  bidInterval: number;
}

const INITIAL_STATE: GapState = {
  totalDose: 60,
  dosePerFx: 2.0,
  fxCompleted: 15,
  gapDays: 0,
  fxPerWeek: 5,
  bidDosePerFx: 1.5,
  bidInterval: 6,
};

// ── Pure calculation helpers ───────────────────────────────────────────────
const calcEQD2 = (dose: number, dpf: number, ab: number): number =>
  ab > 0 && dpf > 0 ? (dose * (dpf + ab)) / (2 + ab) : 0;

const calcBED = (dose: number, dpf: number, ab: number): number =>
  ab > 0 && dpf > 0 ? dose * (1 + dpf / ab) : 0;

// ── CORRECTED urgency: uses both absolute AND relative loss ────────────────
// ISS-05 fix: a 7 Gy EQD2 loss out of 54 Gy planned (13%) is CRITICAL even
// though 7 < 10 Gy absolute threshold.
function getUrgency(eqd2Loss: number, eqd2Total: number) {
  // Relative loss fraction
  const relFrac = eqd2Total > 0 ? eqd2Loss / eqd2Total : 0;

  // Absolute tier (Gy)
  let absTier = 0;
  if (eqd2Loss <= 0)  absTier = 0;
  else if (eqd2Loss < 2)  absTier = 1;
  else if (eqd2Loss < 5)  absTier = 2;
  else if (eqd2Loss < 10) absTier = 3;
  else                    absTier = 4;

  // Relative tier (% of planned EQD2)
  let relTier = 0;
  if (relFrac <= 0)        relTier = 0;
  else if (relFrac < 0.03) relTier = 1;
  else if (relFrac < 0.07) relTier = 2;
  else if (relFrac < 0.12) relTier = 3;
  else                     relTier = 4;

  const tier = Math.max(absTier, relTier);

  const tiers = [
    { label: 'No Effect', color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200', icon: '✓' },
    { label: 'Low',       color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', icon: '●' },
    { label: 'Moderate',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: '▲' },
    { label: 'High',      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',icon: '⚠' },
    { label: 'CRITICAL',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',   icon: '✕' },
  ];
  return { ...tiers[tier], relPct: (relFrac * 100).toFixed(1), tier };
}

function getUrgencyMessage(
  eqd2Loss: number, eqd2Total: number, extraFx: number, dpf: number
): string {
  const relPct = eqd2Total > 0 ? ((eqd2Loss / eqd2Total) * 100).toFixed(1) : '?';
  if (eqd2Loss <= 0)
    return 'No repopulation effect — gap occurred before kick-off time (Tk). No compensation required.';
  const loss = eqd2Loss.toFixed(1);
  const tier = Math.max(
    eqd2Loss < 2 ? 1 : eqd2Loss < 5 ? 2 : eqd2Loss < 10 ? 3 : 4,
    eqd2Total > 0 ? (eqd2Loss / eqd2Total < 0.03 ? 1 : eqd2Loss / eqd2Total < 0.07 ? 2 : eqd2Loss / eqd2Total < 0.12 ? 3 : 4) : 0
  );
  if (tier === 1) return `Minor gap effect (${loss} Gy EQD2, ${relPct}% of planned). Likely no clinical impact. Document and continue.`;
  if (tier === 2) return `Significant gap (${loss} Gy EQD2, ${relPct}% of planned). Compensation recommended: add ${extraFx} fraction(s) of ${dpf} Gy. Discuss with team.`;
  if (tier === 3) return `Major gap (${loss} Gy EQD2, ${relPct}% of planned). Urgent compensation required. Add ${extraFx} fractions or use BID schedule. Physics peer review recommended.`;
  return `⚠ CRITICAL gap (${loss} Gy EQD2, ${relPct}% of planned). Major dose deficit — physics peer review MANDATORY before resuming. Consider escalated compensation.`;
}

// ── Component ──────────────────────────────────────────────────────────────
const EBRTGapPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [compensationTab, setCompensationTab] = useState<'A' | 'B' | 'C'>('A');

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title:  sec.category || 'Reference',
    emoji:  '📌',
    accent: '#00d4ff',
    bg:     'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.3)',
    rows:   sec.items.map(item => ({ k: item.label, v: item.value })),
  }));

  const [step, setStep]                   = useState<WizardStep>('site');
  const [data, setData]                   = useState<GapState>(INITIAL_STATE);
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);

  const STORAGE_KEY = 'radonco_ebrt_gap_v1';

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  // Save with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 500);
    return () => clearTimeout(handler);
  }, [data]);

  // Safe α/β accessor
  const getAB = (t: RadiobiologyData | null): number =>
    t ? (t.ab ?? t.alphaBeta ?? 10) : 10;

  // Derived totals
  const totalFx       = data.dosePerFx > 0 ? Math.round(data.totalDose / data.dosePerFx) : 0;
  const doseDelivered = data.fxCompleted * data.dosePerFx;

  // ── Core calculations ──────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!selectedTumour) return null;

    const ab  = getAB(selectedTumour);
    const k   = selectedTumour.k  ?? 0.6;
    const tk  = selectedTumour.tk ?? 28;
    const dpf = data.dosePerFx;

    if (ab <= 0 || dpf <= 0) return null;

    // Planned EQD2 / BED
    const eqd2Total     = calcEQD2(data.totalDose, dpf, ab);
    const bedTotal      = calcBED(data.totalDose,  dpf, ab);
    const eqd2Delivered = calcEQD2(doseDelivered,  dpf, ab);

    // Overall treatment time (uses fxPerWeek input — not hardcoded 5)
    const fxPerWeek          = Math.max(1, Math.min(14, data.fxPerWeek || 5));
    const estimatedOverallTime = totalFx <= fxPerWeek
      ? totalFx
      : Math.round((totalFx / fxPerWeek) * 7);

    // Days elapsed at gap start
    const daysElapsedAtGapStart = totalFx > 0
      ? Math.round((data.fxCompleted / totalFx) * estimatedOverallTime)
      : 0;

    // Effective repopulation days (only after Tk)
    const tkRemainingAtGapStart = Math.max(0, tk - daysElapsedAtGapStart);
    const effectiveRepopDays    = Math.max(0, data.gapDays - tkRemainingAtGapStart);

    // ── CORRECTED EQD2 loss ──────────────────────────────────────────
    // k is stored in units of Gy EQD2/day (Withers 1988 convention).
    // eqd2Loss = k × effectiveRepopDays  (direct — no further conversion)
    const eqd2Loss = k * effectiveRepopDays;

    const tkReachedBeforeGap = daysElapsedAtGapStart >= tk;

    // ── Conversion: EQD2 → physical dose at current dpf ─────────────
    // physicalDoseLoss used only for Strategy A (same dpf extra fractions)
    const conversionFactor = (1 + 2 / ab) / (1 + dpf / ab);
    const physicalDoseLoss = eqd2Loss * conversionFactor;

    // ── Strategy A: extra fractions at same dpf ──────────────────────
    const extraFxExact   = dpf > 0 ? physicalDoseLoss / dpf : 0;
    const extraFxA       = Math.ceil(extraFxExact);
    const newTotalDoseA  = data.totalDose + extraFxA * dpf;
    const newTotalFxA    = totalFx + extraFxA;
    // Actual EQD2 delivered by the rounded extra fractions
    const actualStratAComp   = calcEQD2(extraFxA * dpf, dpf, ab);
    const overCompensationGy = Math.max(0, actualStratAComp - eqd2Loss);

    // ── Strategy B: increase dpf for remaining fractions (quadratic) ─
    // Solve: fxRemaining × newDpf × (1 + newDpf/ab) = BED_remaining + BED_loss
    const fxRemaining  = Math.max(0, totalFx - data.fxCompleted);
    let stratB_newDpf  = dpf;
    let stratB_addPerFx = 0;
    if (fxRemaining > 0 && eqd2Loss > 0) {
      const bedLossTarget  = eqd2Loss * (1 + 2 / ab);          // EQD2 → BED
      const remainingBED   = calcBED(data.totalDose - doseDelivered, dpf, ab);
      const bedPerFxNeeded = (remainingBED + bedLossTarget) / fxRemaining;
      const disc           = ab * ab + 4 * ab * bedPerFxNeeded;
      if (disc >= 0) {
        stratB_newDpf   = (-ab + Math.sqrt(disc)) / 2;
        stratB_addPerFx = Math.max(0, stratB_newDpf - dpf);
      }
    }
    const stratB_newTotalDose = doseDelivered + fxRemaining * stratB_newDpf;

    // OAR EQD2 check for Strategy B (cord α/β=2)
    const stratB_cordEQD2old = calcEQD2(data.totalDose, dpf, 2);
    const stratB_cordEQD2new = calcEQD2(doseDelivered, dpf, 2) + calcEQD2(fxRemaining * stratB_newDpf, stratB_newDpf, 2);
    const stratB_cordExceeds = stratB_cordEQD2new > 45; // 45 Gy EQD2₂ warning threshold

    // ── Strategy C: BID days at same dpf ────────────────────────────
    const eqd2PerFraction = calcEQD2(dpf, dpf, ab);
    const eqd2PerBIDday   = 2 * eqd2PerFraction;
    const bidDaysNeeded   = eqd2PerBIDday > 0 ? Math.ceil(eqd2Loss / eqd2PerBIDday) : 0;
    const bidExtraFx      = bidDaysNeeded * 2;
    const bidNewTotalDose = data.totalDose + bidExtraFx * dpf;

    // BID interval validation
    const bidIntervalOk   = data.bidInterval >= 6;

    const interpretation = getInterpretation(k);
    const urgency        = getUrgency(eqd2Loss, eqd2Total);

    // ── Chart Data for Step-and-Shoot Accumulation ────────────────────────
    const chartData = [];
    let currentEqd2Ideal = 0;
    let currentEqd2Actual = 0;
    let fxCountIdeal = 0;
    let fxCountActual = 0;
    
    const totalDaysIdeal = estimatedOverallTime;
    const gapStartDay = daysElapsedAtGapStart;
    const gapEndDay = gapStartDay + data.gapDays;
    const totalDaysActual = totalDaysIdeal + data.gapDays;
    
    const eqd2PerFx = calcEQD2(dpf, dpf, ab);

    for (let day = 0; day <= Math.max(totalDaysIdeal, totalDaysActual + 5); day++) {
      // Ideal schedule
      if (day > 0 && fxCountIdeal < totalFx) {
        const dayOfWeek = day % 7;
        if (dayOfWeek > 0 && dayOfWeek <= fxPerWeek) {
          currentEqd2Ideal += eqd2PerFx;
          fxCountIdeal++;
        }
      }
      
      // Actual schedule
      if (day > 0 && fxCountActual < totalFx) {
        const isGap = day > gapStartDay && day <= gapEndDay;
        if (!isGap) {
          const dayOfWeek = day % 7;
          if (dayOfWeek > 0 && dayOfWeek <= fxPerWeek) {
            currentEqd2Actual += eqd2PerFx;
            fxCountActual++;
          }
        }
      }
      
      // Apply repopulation loss
      let repopLossIdeal = 0;
      if (day > tk) {
        repopLossIdeal = (day - tk) * k;
      }
      
      let repopLossActual = 0;
      if (day > tk) {
        repopLossActual = (day - tk) * k;
      }
      
      chartData.push({
        day,
        ideal: Math.max(0, currentEqd2Ideal - repopLossIdeal),
        actual: Math.max(0, currentEqd2Actual - repopLossActual),
      });
    }

    return {
      ab, k, tk,
      eqd2Total, bedTotal,
      eqd2Delivered,
      eqd2Loss,
      physicalDoseLoss,
      // Strategy A
      extraFxExact, extraFxA, newTotalDoseA, newTotalFxA,
      actualStratAComp, overCompensationGy,
      // Strategy B
      stratB_newDpf, stratB_addPerFx, stratB_newTotalDose, fxRemaining,
      stratB_cordEQD2old, stratB_cordEQD2new, stratB_cordExceeds,
      // Strategy C
      bidDaysNeeded, bidExtraFx, bidNewTotalDose, bidIntervalOk,
      interpretation,
      urgency,
      effectiveRepopDays,
      daysElapsedAtGapStart,
      tkReachedBeforeGap,
      estimatedOverallTime,
      fxPerWeek,
      chartData,
    };
  }, [data, selectedTumour, doseDelivered, totalFx]);

  const nextStep = (target: WizardStep) => setStep(target);
  const prevStep = (target: WizardStep) => setStep(target);
  const updateData = (field: keyof GapState, value: number) =>
    setData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-xl mx-auto pb-20">

      {/* ── Header (Command Center Style) ────────────────────────────────── */}
      <div className="mb-10 relative">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-mono">Gap Compensation Terminal</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
            <Calendar className="w-7 h-7 text-indigo-400" />
          </div>
          EBRT Chrono-Sync
        </h1>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>Withers LQ-Model</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Repopulation Analysis</span>
          </div>
        </div>
      </div>

      {/* ── Progress Bar (Futuristic Stepper) ─────────────────────────── */}
      <div className="flex items-center justify-between mb-12 relative px-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 -z-10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(((['site', 'prescription', 'gap', 'results'] as WizardStep[]).indexOf(step)) / 3) * 100}%` }}
            className="h-full bg-blue-600"
          />
        </div>
        {(['site', 'prescription', 'gap', 'results'] as WizardStep[]).map((s, i) => {
          const isActive = s === step;
          const isPast   = (['site', 'prescription', 'gap', 'results'] as WizardStep[]).indexOf(step) > i;
          return (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 transition-all duration-500
                ${isActive ? 'bg-slate-950 border-blue-500 text-white scale-125 shadow-[0_0_20px_rgba(59,130,246,0.5)]' :
                  isPast   ? 'bg-blue-600 border-blue-600 text-white' :
                             'bg-white border-slate-200 text-slate-300'}`}>
                {isPast ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] hidden sm:block transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {s}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Wizard Content ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden min-h-[500px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />

        {/* STEP 1: SITE SELECTION */}
        {step === 'site' && (
          <div className="p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Biological Target</h2>
                <p className="text-sm text-slate-400 font-medium">Define the tissue repopulation kinetics</p>
              </div>
            </div>

            <TumourSelector
              selectedEntry={selectedTumour}
              onSelect={(entry) => setSelectedTumour(entry)}
              onClear={() => setSelectedTumour(null)}
            />

            {selectedTumour && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 p-8 bg-slate-900 rounded-[2rem] border border-white/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.03] mesh-grid pointer-events-none" />
                <div className="relative z-10 flex flex-wrap gap-10 items-center justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">Tissue Parameters</p>
                    <div className="flex gap-10">
                      <div>
                        <p className="text-3xl font-black text-white font-mono">{(selectedTumour.k ?? 0).toFixed(2)}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">k (EQD2/d)</p>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-white font-mono">{selectedTumour.tk ?? 0}d</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Tk Point</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                     <p className={`text-lg font-black tracking-widest uppercase ${getInterpretation(selectedTumour.k ?? 0).color}`}>
                      {getInterpretation(selectedTumour.k ?? 0).level}
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Clinical Sensitivity</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mt-12 flex justify-end">
              <button
                disabled={!selectedTumour}
                onClick={() => nextStep('prescription')}
                className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 disabled:opacity-50"
              >
                Continue Telemetry <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PRESCRIPTION */}
        {step === 'prescription' && (
          <div className="p-10 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Prescription Index</h2>
                <p className="text-sm text-slate-400 font-medium">Standard fractionation schedule</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Total Dose Aim (Gy)</label>
                  <NumberInput
                     step="0.5" value={isNaN(data.totalDose) ? '' : data.totalDose}
                    onChange={e => updateData('totalDose', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-2xl font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dose / Fraction (Gy)</label>
                  <NumberInput
                     step="0.1" value={isNaN(data.dosePerFx) ? '' : data.dosePerFx}
                    onChange={e => updateData('dosePerFx', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-2xl font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Temporal Density <span>fx / week</span>
                </label>
                <NumberInput
                   step="1" min="1" max="14" value={isNaN(data.fxPerWeek) ? '' : data.fxPerWeek}
                  onChange={e => updateData('fxPerWeek', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xl font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">Planned Accumulation</p>
                   <p className="text-xs text-slate-500 font-medium tracking-tight">Standard biological equivalent yield</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white font-mono">{totalFx} <span className="text-sm text-slate-600">FX</span></p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => prevStep('site')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
              <button onClick={() => nextStep('gap')} className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition shadow-xl shadow-indigo-500/20">
                Synchronize Gap <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GAP DETAILS */}
        {step === 'gap' && (
          <div className="p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Timeline Fracture</h2>
                <p className="text-sm text-slate-400 font-medium">Define the interruption telemetry</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3 group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-amber-500 transition-colors">Fractions Delivered Prior to Gap</label>
                <div className="relative">
                  <NumberInput
                    value={isNaN(data.fxCompleted) ? '' : data.fxCompleted}
                    onChange={e => updateData('fxCompleted', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl text-4xl font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 font-mono">COMPLETED</div>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-1">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Pre-Gap Yield: {(data.fxCompleted * data.dosePerFx).toFixed(1)} Gy
                   </p>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-amber-500 transition-colors">Interruption Duration (Days)</label>
                <div className="relative">
                  <NumberInput
                    value={isNaN(data.gapDays) ? '' : data.gapDays}
                    onChange={e => updateData('gapDays', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl text-4xl font-mono font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                    placeholder="0"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 font-mono">CALENDAR DAYS</div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-between">
              <button onClick={() => prevStep('prescription')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Go Back
              </button>
              <button
                disabled={data.gapDays <= 0}
                onClick={() => nextStep('results')}
                className="flex items-center gap-3 bg-amber-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition shadow-xl shadow-amber-500/20 disabled:opacity-50"
              >
                Compute Variance <Calculator className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step === 'results' && results && (() => {
          const urgency = results.urgency;
          const reportData: ClinicalReport = {
            title: "EBRT Gap Correction Report",
            toolName: "EBRT Gap Correction",
            parameters: [
              { label: 'Tumour Site', value: selectedTumour?.subsite || 'N/A' },
              { label: 'Tumour', value: selectedTumour?.tumour || 'N/A' },
              { label: 'Total Dose', value: `${data.totalDose} Gy` },
              { label: 'Dose per Fx', value: `${data.dosePerFx} Gy` },
              { label: 'Fractions', value: `${totalFx} fx` },
              { label: 'α/β Ratio', value: `${results?.ab ?? '—'} Gy` },
              { label: 'k (repopulation)', value: `${results?.k?.toFixed(2) ?? '—'} Gy/day` },
              { label: 'Tk (kick-off)', value: `${results?.tk ?? '—'} days` },
              { label: 'Gap Duration', value: `${data.gapDays} days` },
              { label: 'Fractions at Gap', value: `${data.fxCompleted} completed` },
            ],
            results: [
              { label: 'EQD2 Loss', value: results?.eqd2Loss.toFixed(2) || '0', unit: 'Gy' },
              { label: 'Effective Repop Days', value: results?.effectiveRepopDays.toString() || '0', unit: 'days' },
              { label: 'Strategy A: Extra Fx', value: results?.extraFxA.toString() || '0', unit: 'fx' },
              { label: 'Strategy A: New Total', value: results?.newTotalDoseA.toFixed(1) || '0', unit: 'Gy' },
              { label: 'Strategy C: BID Days', value: results?.bidDaysNeeded.toString() || '0', unit: 'BID days' },
            ],
            interpretation: results
              ? `${urgency.label} impact. ${getUrgencyMessage(results.eqd2Loss, results.eqd2Total, results.extraFxA, data.dosePerFx)} ${selectedTumour?.repopNote ?? ''}`
              : '',
            urgencyLabel: urgency.label,
          };
          return (
            <div className="p-10 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Telemetry Result Visualizer */}
              <div className="relative group mb-10">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                
                <div className="relative bg-slate-950 rounded-[2.25rem] p-10 text-white shadow-2xl border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] mesh-grid pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-3 rounded-full ${urgency.tier >= 3 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 font-mono">Dose Deficit Analysis</p>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter italic uppercase">{urgency.label} BIOLOGICAL IMPACT</h2>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Repopulation Yield</p>
                        <div className="px-3 py-1 bg-white/[0.03] rounded-lg border border-white/10">
                           <span className="text-xs font-black font-mono text-emerald-400">-{results.eqd2Loss.toFixed(2)} Gy</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Effective Loss (%)</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-6xl font-black text-white tracking-tighter font-display">{urgency.relPct}</span>
                           <span className="text-xl font-black text-slate-700 font-display">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Repopulation</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-6xl font-black text-white tracking-tighter font-display">{results.effectiveRepopDays}</span>
                           <span className="text-xl font-black text-slate-700 font-display">D</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4 backdrop-blur-sm">
                       <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${urgency.tier >= 3 ? 'text-red-400' : 'text-blue-400'}`} />
                       <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                        {getUrgencyMessage(results.eqd2Loss, results.eqd2Total, results.extraFxA, data.dosePerFx)}
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between mb-10 group relative overflow-hidden transition-all hover:shadow-lg">
                <div className="relative z-10 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Clinical Export</h4>
                    <p className="text-[10px] text-slate-500 font-medium italic">High-precision bio-metric report</p>
                  </div>
                </div>
                <div className="relative z-10">
                   <ExportButton report={reportData} />
                </div>
              </div>

              {/* Urgency Banner */}
              <div className={`mb-4 p-3 rounded-xl border ${urgency.bg} ${urgency.border} flex items-start gap-3`}>
                <span className={`text-lg font-black ${urgency.color}`}>{urgency.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${urgency.color}`}>
                    {urgency.label} — {results.eqd2Loss.toFixed(2)} Gy EQD2 loss ({urgency.relPct}% of planned EQD2)
                  </p>
                  <p className={`text-[11px] mt-0.5 ${urgency.color} opacity-80`}>
                    {getUrgencyMessage(results.eqd2Loss, results.eqd2Total, results.extraFxA, data.dosePerFx)}
                  </p>
                </div>
              </div>

              {/* Parameter Transparency Panel */}
              <div className="mb-8 p-8 bg-slate-900 rounded-[2rem] border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono mb-6 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Source Configuration
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kick-off Tk</p>
                    <p className="text-xl font-black text-white font-mono">{results.tk} <span className="text-[10px] text-slate-600">D</span></p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Repop k</p>
                    <p className="text-xl font-black text-white font-mono">{results.k} <span className="text-[10px] text-slate-600">GY/d</span></p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Planned EQD2</p>
                    <p className="text-xl font-black text-white font-mono">{results.eqd2Total.toFixed(1)} <span className="text-[10px] text-slate-600">GY</span></p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Density</p>
                    <p className="text-xl font-black text-white font-mono">{results.fxPerWeek} <span className="text-[10px] text-slate-600">FX/W</span></p>
                  </div>
                </div>
              </div>

              {/* Repopulation Timing Visualizer */}
              <div className="mb-10 p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <RotateCcw className={`w-6 h-6 ${results.tkReachedBeforeGap ? 'text-amber-500' : 'text-blue-500'}`} />
                 </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Phase Timing Analysis</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    Gap initiated at <strong>Day {results.daysElapsedAtGapStart}</strong> of timeline. 
                    {results.tkReachedBeforeGap 
                      ? " Tk point already passed; full gap duration subject to biological repopulation."
                      : ` Gap starts before Tk (${results.tk}d). Repopulation yield triggered after day ${results.tk}.`}
                  </p>
                </div>
              </div>

              {/* Step-and-Shoot Accumulation Graph */}
              <div className="bg-slate-950 rounded-[2.5rem] border border-white/5 p-10 shadow-2xl mb-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                <div className="flex justify-between items-center mb-10 relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono">Dose Accumulation Telemetry</h3>
                    <p className="text-xs text-slate-500 font-medium">Longitudinal effective yield tracking</p>
                  </div>
                   <Activity className="w-5 h-5 text-slate-700" />
                </div>
                
                <div className="h-[300px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.chartData} margin={{ top: 5, right: 30, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                      <XAxis 
                        dataKey="day" 
                        fontSize={9} 
                        tick={{fill: '#475569', fontWeight: 700}} 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'TIMELINE (DAYS)', position: 'insideBottom', offset: -10, fontSize: 8, fill: '#475569', fontWeight: 900, letterSpacing: '0.1em' }}
                      />
                      <YAxis 
                        fontSize={9} 
                        tick={{fill: '#475569', fontWeight: 700}} 
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'EFFECTIVE EQD2 (GY)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 8, fill: '#475569', fontWeight: 900, letterSpacing: '0.1em' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#020617', 
                          borderRadius: '16px', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                          padding: '12px'
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(1)} Gy`, 
                          name === 'ideal' ? 'Nominal Plan' : 'Gap Uncompensated'
                        ]}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', paddingTop: '20px', color: '#475569' }} 
                      />
                      <ReferenceLine x={results.daysElapsedAtGapStart} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} label={{ value: 'GAP START', position: 'top', fill: '#f59e0b', fontSize: 8, fontWeight: 900 }} />
                      <ReferenceLine x={results.daysElapsedAtGapStart + data.gapDays} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} label={{ value: 'GAP END', position: 'top', fill: '#f59e0b', fontSize: 8, fontWeight: 900 }} />
                      <Line 
                        name="ideal"
                        type="stepAfter" 
                        dataKey="ideal" 
                        stroke="#334155" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={false}
                        animationDuration={2000}
                      />
                      <Line 
                        name="actual"
                        type="stepAfter" 
                        dataKey="actual" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={2500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compensation Strategy Terminal */}
              <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 opacity-[0.02] mesh-grid pointer-events-none" />
                <div className="flex bg-white/[0.03] p-1.5 gap-1.5 border-b border-white/5">
                  {(['A', 'B', 'C'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCompensationTab(t)}
                      className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl relative
                        ${compensationTab === t 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}`}
                    >
                      {t === 'A' ? 'Strategy A' : t === 'B' ? 'Strategy B' : 'Strategy C'}
                    </button>
                  ))}
                </div>

                <div className="p-10">
                  {/* Strategy A */}
                  {compensationTab === 'A' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 font-mono">Additive Compensation</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Extra Load</p>
                          <p className="text-5xl font-black text-white font-mono">+{results.extraFxA}</p>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{data.dosePerFx} GY / FX</p>
                        </div>
                        <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">New Payload</p>
                          <p className="text-5xl font-black text-white font-mono">{results.newTotalDoseA.toFixed(1)}</p>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">GY / {results.newTotalFxA} FX</p>
                        </div>
                      </div>
                      
                      {results.overCompensationGy > 0.01 && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Rounding Compensation Variance</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                              Full-fraction rounding adds +{results.overCompensationGy.toFixed(2)} Gy over target deficit.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Strategy B */}
                  {compensationTab === 'B' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                       <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono">Fraction Escalation</p>
                      </div>
                      {results.fxRemaining > 0 && results.eqd2Loss > 0 ? (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Escalated d/fx</p>
                              <p className="text-4xl font-black text-white font-mono">{results.stratB_newDpf.toFixed(3)}</p>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2">+{results.stratB_addPerFx.toFixed(3)} GY DELTA</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Budget</p>
                              <p className="text-4xl font-black text-white font-mono">{results.stratB_newTotalDose.toFixed(1)}</p>
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">GY / {totalFx} FX</p>
                            </div>
                          </div>
                          
                          <div className={`p-5 rounded-[2rem] border flex items-start gap-4 transition-colors ${
                            results.stratB_cordExceeds ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'
                          }`}>
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${results.stratB_cordExceeds ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                              {results.stratB_cordExceeds
                                ? <AlertTriangle className="w-5 h-5 text-red-500" />
                                : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                             </div>
                             <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${results.stratB_cordExceeds ? 'text-red-500' : 'text-emerald-500'}`}>
                                  Critical OAR Telemetry (α/β=2)
                                </p>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  Yield: {results.stratB_cordEQD2new.toFixed(1)} Gy 
                                  {results.stratB_cordExceeds ? " ⚠ CRITICAL RISK: Exceeds 45 Gy threshold." : " (Within tolerance)"}
                                </p>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">No remaining fractions or no repopulation deficit.</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Strategy C */}
                  {compensationTab === 'C' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                       <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-start gap-5">
                          <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Inter-fraction Protocol Constraint</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                              Mandatory 6-hour minimum gap required for sublethal DNA repair. 
                              Violation triggers extreme late-tissue toxicity risk.
                            </p>
                          </div>
                       </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Current Interval (H)
                          </label>
                          <NumberInput
                             step="0.5" min="6"
                            value={isNaN(data.bidInterval) ? '' : data.bidInterval}
                            onChange={e => updateData('bidInterval', e.target.value === '' ? NaN : parseFloat(e.target.value))}
                            className={`w-full bg-white/[0.02] border p-5 rounded-2xl text-2xl font-mono font-black outline-none transition-all ${
                              data.bidInterval < 6 ? 'border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 text-white'
                            }`}
                          />
                        </div>
                        
                        {results.bidIntervalOk ? (
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BID Days</span>
                               <span className="text-2xl font-black text-white font-mono">+{results.bidDaysNeeded}</span>
                            </div>
                            <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Extra Payload</span>
                               <span className="text-2xl font-black text-white font-mono">+{results.bidExtraFx} FX</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center p-6 border-2 border-dashed border-white/5 rounded-3xl">
                             <p className="text-[10px] font-black uppercase tracking-widest text-red-500/50">Interval Lock Engaged</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-12">
                <button onClick={() => prevStep('gap')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <button
                  onClick={() => { setData(INITIAL_STATE); setStep('site'); }}
                  className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition shadow-xl"
                >
                  <RotateCcw className="w-4 h-4" /> Hard Reset
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Reference Footer */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-400 max-w-md mx-auto">
          Ref: Withers HR et al. Acta Oncol 1988. Fowler JF. Br J Radiol 1989.
          Thames HD et al. Radiother Oncol 1982 (SLD repair kinetics). QUANTEC 2010.
        </p>
      </div>

      {/* Sidebar */}
      <KeyFactsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        data={SIDEBAR_DATA}
      />

    </div>
  );
};

export default EBRTGapPage;
