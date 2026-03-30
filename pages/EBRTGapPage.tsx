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
import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, CheckCircle, Info, Calculator,
  RotateCcw, Calendar, Activity, AlertTriangle, Printer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData, getInterpretation } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { PDFReport } from '@/src/components/PDFReport';
import { generatePDFBlob, sharePDF } from '@/src/lib/pdfUtils';
import { Share2 } from 'lucide-react';

// ── Quick reference sidebar data ──────────────────────────────────────────
const QUICK_REF_DATA = [
  {
    category: 'Gap Principles',
    items: [
      { label: 'OTT Impact',   value: 'Repopulation Loss' },
      { label: 'K-value',      value: 'EQD2 loss/day (Gy)' },
      { label: 'Tk',           value: 'Kick-off time (days)' },
      { label: 'Formula',      value: 'Loss = k × (gap − max[0,Tk−elapsed])' },
    ],
  },
  {
    category: 'Compensation Methods',
    items: [
      { label: 'Method A', value: 'Extra fractions at same d/fx' },
      { label: 'Method B', value: 'Increase dose/fx (remaining fx)' },
      { label: 'Method C', value: 'BID days (≥6h inter-fraction)' },
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
    };
  }, [data, selectedTumour, doseDelivered, totalFx]);

  const nextStep = (target: WizardStep) => setStep(target);
  const prevStep = (target: WizardStep) => setStep(target);
  const updateData = (field: keyof GapState, value: number) =>
    setData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-xl mx-auto pb-20">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Gap Correction
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Compensate for missed treatment days using the LQ repopulation model (Withers 1988).
        </p>
      </div>

      {/* ── Progress Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full" />
        {(['site', 'prescription', 'gap', 'results'] as WizardStep[]).map((s, i) => {
          const isActive = s === step;
          const isPast   = (['site', 'prescription', 'gap', 'results'] as WizardStep[]).indexOf(step) > i;
          return (
            <div key={s} className={`flex flex-col items-center gap-1 bg-slate-100 px-2 rounded-full ${isActive ? 'scale-110 transition-transform' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${isActive ? 'bg-blue-600 border-blue-600 text-white' :
                  isPast   ? 'bg-green-500 border-green-500 text-white' :
                             'bg-white border-slate-300 text-slate-400'}`}>
                {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 hidden sm:block">{s}</span>
            </div>
          );
        })}
      </div>

      {/* ── Wizard Content ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] relative">

        {/* STEP 1: SITE SELECTION */}
        {step === 'site' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Select Tumour Site</h2>
            <p className="text-xs text-slate-400 mb-4">
              The tumour site determines the repopulation rate (k) and kick-off time (Tk) used in gap calculations.
            </p>

            <TumourSelector
              selectedEntry={selectedTumour}
              onSelect={(entry) => setSelectedTumour(entry)}
              onClear={() => setSelectedTumour(null)}
            />

            {selectedTumour && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Repopulation Parameters</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-black text-blue-800 font-mono">
                      {(selectedTumour.k ?? 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-blue-600">k (Gy EQD2/day)</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-blue-800 font-mono">
                      {selectedTumour.tk ?? 0}d
                    </p>
                    <p className="text-[10px] text-blue-600">Tk kick-off</p>
                  </div>
                  <div>
                    <p className={`text-sm font-black ${getInterpretation(selectedTumour.k ?? 0).color}`}>
                      {getInterpretation(selectedTumour.k ?? 0).level}
                    </p>
                    <p className="text-[10px] text-blue-600">Sensitivity</p>
                  </div>
                </div>
                {selectedTumour.repopNote && (
                  <p className="text-[10px] text-blue-700 italic leading-relaxed">
                    {selectedTumour.repopNote}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                disabled={!selectedTumour}
                onClick={() => nextStep('prescription')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PRESCRIPTION */}
        {step === 'prescription' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Prescription Details</h2>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Total Prescribed Dose (Gy)</label>
                <input
                  type="number" step="0.5" value={data.totalDose}
                  onChange={e => updateData('totalDose', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Dose per Fraction (Gy)</label>
                <input
                  type="number" step="0.1" value={data.dosePerFx}
                  onChange={e => updateData('dosePerFx', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {/* ISS BUG-D: fxPerWeek input (was hardcoded to 5) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Fractions per Week
                  <span className="ml-1 font-normal text-slate-400">(typically 5; enter 6 for CHART/6-day schedule)</span>
                </label>
                <input
                  type="number" step="1" min="1" max="14" value={data.fxPerWeek}
                  onChange={e => updateData('fxPerWeek', parseFloat(e.target.value) || 5)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Total Fractions Planned</span>
                <span className="text-xl font-bold text-blue-700 font-mono">{totalFx} fx</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep('site')} className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => nextStep('gap')} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GAP DETAILS */}
        {step === 'gap' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Gap Information</h2>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Fractions Completed Before Gap</label>
                <input
                  type="number" value={data.fxCompleted}
                  onChange={e => updateData('fxCompleted', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dose delivered: {(data.fxCompleted * data.dosePerFx).toFixed(1)} Gy
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Gap Duration (Calendar Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number" value={data.gapDays}
                    onChange={e => updateData('gapDays', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 5"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Include weekends and holidays.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep('prescription')} className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                disabled={data.gapDays <= 0}
                onClick={() => nextStep('results')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calculate <Calculator className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step === 'results' && results && (() => {
          const urgency = results.urgency;
          return (
            <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Analysis Results</h2>
                <button
                  onClick={async () => {
                    const doc = (
                      <PDFReport 
                        title="EBRT Gap Correction Report"
                        parameters={[
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
                        ]}
                        results={[
                          { label: 'EQD2 Loss', value: results?.eqd2Loss.toFixed(2) || '0', unit: 'Gy' },
                          { label: 'Effective Repop Days', value: results?.effectiveRepopDays.toString() || '0', unit: 'days' },
                          { label: 'Strategy A: Extra Fx', value: results?.extraFxA.toString() || '0', unit: 'fx' },
                          { label: 'Strategy A: New Total', value: results?.newTotalDoseA.toFixed(1) || '0', unit: 'Gy' },
                          { label: 'Strategy C: BID Days', value: results?.bidDaysNeeded.toString() || '0', unit: 'BID days' },
                        ]}
                        clinicalInsight={
                          results
                            ? `${urgency.label} impact. ${getUrgencyMessage(results.eqd2Loss, results.eqd2Total, results.extraFxA, data.dosePerFx)} ${selectedTumour?.repopNote ?? ''}`
                            : ''
                        }
                      />
                    );
                    const blob = await generatePDFBlob(doc);
                    await sharePDF(blob, `RadOnc_Gap_Report.pdf`, `Clinical Report: ${selectedTumour?.subsite} Gap Correction Analysis.`);
                  }}
                  className="no-print flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
                  title="Share Report via WhatsApp"
                >
                  <Share2 className="w-4 h-4" /> Share to WhatsApp
                </button>
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
              <div className="mb-4 p-3 bg-slate-800 rounded-xl text-white">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">Radiobiological Parameters Used</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <p className="text-slate-400">Tumour:</p>
                  <p className="font-medium">{selectedTumour?.subsite} {selectedTumour?.tumour}</p>
                  <p className="text-slate-400">α/β ratio:</p>
                  <p className="font-medium font-mono">{results.ab} Gy</p>
                  <p className="text-slate-400">Kick-off time Tk:</p>
                  <p className="font-medium font-mono">{results.tk} days</p>
                  <p className="text-slate-400">Repop rate k:</p>
                  <p className="font-medium font-mono">{results.k} Gy EQD2/day</p>
                  <p className="text-slate-400">Planned EQD2:</p>
                  <p className="font-medium font-mono">{results.eqd2Total.toFixed(2)} Gy</p>
                  <p className="text-slate-400">Fx/week used:</p>
                  <p className="font-medium font-mono">{results.fxPerWeek}</p>
                </div>
                {selectedTumour?.repopNote && (
                  <p className="text-[10px] text-slate-400 italic mt-2 leading-relaxed">{selectedTumour.repopNote}</p>
                )}
              </div>

              {/* Repopulation Timing */}
              <div className="mb-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <Activity className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-900">
                    {results.tkReachedBeforeGap ? 'Tk reached before gap started' : 'Gap started before Tk'}
                  </p>
                  <p className="text-[11px] text-blue-700 leading-tight mt-0.5">
                    Gap started at ~day {results.daysElapsedAtGapStart} (Tk = {results.tk}d).
                    {results.effectiveRepopDays < data.gapDays
                      ? ` Only ${results.effectiveRepopDays} of ${data.gapDays} gap days count toward repopulation.`
                      : ` All ${data.gapDays} gap days are subject to repopulation.`}
                  </p>
                  {!results.tkReachedBeforeGap && (
                    <p className="text-[10px] text-blue-500 mt-1 italic">
                      Gap overlaps with pre-Tk period — repopulation begins only when Tk is reached.
                    </p>
                  )}
                </div>
              </div>

              {/* Compensation Strategy Tabs */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
                <div className="flex border-b border-slate-200">
                  {(['A', 'B', 'C'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCompensationTab(t)}
                      className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                        compensationTab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'A' ? 'A: Extra Fractions' : t === 'B' ? 'B: Increase d/fx' : 'C: BID Days'}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* Strategy A */}
                  {compensationTab === 'A' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">Add extra fractions at the same dose/fraction ({data.dosePerFx} Gy/fx).</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Extra Fractions</p>
                          <p className="text-3xl font-black text-blue-800 font-mono">+{results.extraFxA}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            exact: {results.extraFxExact.toFixed(2)} → ⌈{results.extraFxA}⌉
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">New Total</p>
                          <p className="text-3xl font-black text-blue-800 font-mono">{results.newTotalDoseA.toFixed(1)}</p>
                          <p className="text-[10px] text-slate-400">Gy in {results.newTotalFxA} fx</p>
                        </div>
                      </div>
                      {/* ISS BUG-C: Over-compensation disclosure */}
                      {results.overCompensationGy > 0.01 && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-amber-800">
                            <strong>Rounding note:</strong> {results.extraFxA} fraction(s) delivers {results.actualStratAComp.toFixed(2)} Gy EQD2 
                            (target {results.eqd2Loss.toFixed(2)} Gy — over-compensates by +{results.overCompensationGy.toFixed(2)} Gy). 
                            Clinically acceptable in most cases; document in records.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strategy B */}
                  {compensationTab === 'B' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">
                        Increase dose/fraction for the {results.fxRemaining} remaining fractions to compensate the biological deficit.
                      </p>
                      {results.fxRemaining > 0 && results.eqd2Loss > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">New d/fx</p>
                              <p className="text-3xl font-black text-blue-800 font-mono">{results.stratB_newDpf.toFixed(3)}</p>
                              <p className="text-[10px] text-slate-400">Gy (+{results.stratB_addPerFx.toFixed(3)} Gy/fx)</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">New Total</p>
                              <p className="text-3xl font-black text-blue-800 font-mono">{results.stratB_newTotalDose.toFixed(1)}</p>
                              <p className="text-[10px] text-slate-400">Gy in {totalFx} fx</p>
                            </div>
                          </div>
                          {/* OAR EQD2 cord check */}
                          <div className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                            results.stratB_cordExceeds ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                          }`}>
                            {results.stratB_cordExceeds
                              ? <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                              : <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />}
                            <p className={`text-[10px] ${results.stratB_cordExceeds ? 'text-red-800' : 'text-green-800'}`}>
                              <strong>OAR cord check (α/β=2):</strong> New EQD2₂ = {results.stratB_cordEQD2new.toFixed(1)} Gy
                              {results.stratB_cordExceeds
                                ? ` ⚠ EXCEEDS 45 Gy warning threshold (was ${results.stratB_cordEQD2old.toFixed(1)} Gy). Physics review required.`
                                : ` (was ${results.stratB_cordEQD2old.toFixed(1)} Gy) — within tolerance.`}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">
                            Verify all OARs at the new d/fx with your treatment planning system.
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          {results.fxRemaining === 0
                            ? 'No remaining fractions — cannot increase d/fx. Use Strategy A (extra fractions).'
                            : 'No repopulation loss — no compensation required.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Strategy C — ISS-02 FIXED: mandatory ≥6h warning */}
                  {compensationTab === 'C' && (
                    <div className="space-y-3">
                      {/* MANDATORY BID WARNING — ISS-02 */}
                      <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-red-800">
                            ⚠ Mandatory: minimum 6-hour inter-fraction interval
                          </p>
                          <p className="text-[10px] text-red-700 mt-0.5 leading-relaxed">
                            Sublethal DNA damage (SLD) repair requires ≥6h between BID fractions. Delivery below this interval 
                            causes excess irreversible late toxicity (Withers 1982; Thames 1985; CHART protocol). 
                            This is a safety requirement, not a guideline. Confirm schedule with physics team before delivery.
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">Add twice-daily (BID) treatment days at {data.dosePerFx} Gy/fraction.</p>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Inter-fraction interval (hours)
                          <span className="text-red-600 ml-1">— minimum 6h required</span>
                        </label>
                        <input
                          type="number" step="0.5" min="6"
                          value={data.bidInterval}
                          onChange={e => updateData('bidInterval', parseFloat(e.target.value) || 6)}
                          className={`w-full p-2.5 rounded-lg border text-sm font-mono font-medium focus:ring-2 outline-none ${
                            data.bidInterval < 6
                              ? 'border-red-400 bg-red-50 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                        {data.bidInterval < 6 && (
                          <p className="text-[10px] text-red-700 font-bold">
                            ✕ Interval must be ≥6 hours for safe SLD repair. Increase before proceeding.
                          </p>
                        )}
                      </div>

                      {results.bidIntervalOk && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">BID Days Needed</p>
                            <p className="text-3xl font-black text-blue-800 font-mono">+{results.bidDaysNeeded}</p>
                            <p className="text-[10px] text-slate-400">({results.bidExtraFx} extra fractions)</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">New Total</p>
                            <p className="text-3xl font-black text-blue-800 font-mono">{results.bidNewTotalDose.toFixed(1)}</p>
                            <p className="text-[10px] text-slate-400">Gy in {totalFx + results.bidExtraFx} fx</p>
                          </div>
                        </div>
                      )}

                      {!results.bidIntervalOk && (
                        <p className="text-xs text-red-700 font-bold text-center">
                          Set interval ≥6h to see BID schedule
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Evidence Context */}
              {selectedTumour?.clinicalContext && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-800 mb-1">Clinical Context</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{selectedTumour.clinicalContext}</p>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <button onClick={() => prevStep('gap')} className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => { setData(INITIAL_STATE); setStep('site'); }}
                  className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Start Over
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
