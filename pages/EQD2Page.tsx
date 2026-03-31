import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Info, Calculator, RotateCcw, Calendar, Activity, BookOpen, GraduationCap, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '../components/KeyFactsSidebar';
import { RadiobiologyData, getInterpretation } from '../src/data/radiobiologyData';
import TumourSelector from '@/components/TumourSelector';
import { PDFReport } from '@/src/components/PDFReport';
import { generatePDFBlob, sharePDF } from '@/src/lib/pdfUtils';
import { Share2 } from 'lucide-react';

import { NumberInput } from '../src/components/NumberInput';

const QUICK_REF_DATA = [
  {
    category: 'Gap Principles',
    items: [
      { label: 'OTT Impact', value: 'Repopulation Loss' },
      { label: 'K-value', value: 'EQD2 loss/day (Gy)' },
      { label: 'Tk', value: 'Kick-off time (days)' },
      { label: 'Formula', value: 'Loss = k × (gap − max[0, Tk−elapsed])' },
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
    category: 'Key k Values (Gy/day)',
    items: [
      { label: 'H&N SCC', value: '0.6 (Tk 21d)' },
      { label: 'Cervix SCC', value: '0.6 (Tk 21d)' },
      { label: 'NSCLC Adeno', value: '0.4 (Tk 28d)' },
      { label: 'SCLC', value: '1.0 (Tk 14d)' },
      { label: 'TNBC', value: '0.5 (Tk 14d)' },
      { label: 'Prostate', value: '0.0 (no repop)' },
    ],
  },
];

// ── Types ─────────────────────────────────────────────────────────────────
type WizardStep = 'site' | 'prescription' | 'gap' | 'results';

interface GapState {
  totalDose: number;
  dosePerFx: number;
  fxCompleted: number;
  gapDays: number;
  fxPerWeek: number;
}

const INITIAL_STATE: GapState = {
  totalDose: 60,
  dosePerFx: 2.0,
  fxCompleted: 15,
  gapDays: 0,
  fxPerWeek: 5,
};

// ── Helpers ───────────────────────────────────────────────────────────────
const calcEQD2 = (dose: number, dpf: number, ab: number): number =>
  ab > 0 && dpf > 0 ? (dose * (dpf + ab)) / (2 + ab) : 0;

const calcBED = (dose: number, dpf: number, ab: number): number =>
  ab > 0 && dpf > 0 ? dose * (1 + dpf / ab) : 0;

// Urgency classification based on EQD2 loss
const getUrgency = (eqd2Loss: number): { label: string; color: string; bg: string; border: string; icon: string } => {
  if (eqd2Loss <= 0)   return { label: 'No Effect',  color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200', icon: '✓' };
  if (eqd2Loss < 2)    return { label: 'Low',        color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200', icon: '●' };
  if (eqd2Loss < 5)    return { label: 'Moderate',   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: '▲' };
  if (eqd2Loss < 10)   return { label: 'High',       color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: '⚠' };
  return                      { label: 'CRITICAL',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',   icon: '✕' };
};

const getUrgencyMessage = (eqd2Loss: number, extraFx: number, dpf: number): string => {
  if (eqd2Loss <= 0)   return 'No repopulation effect — gap occurred before kick-off time (Tk). No compensation required.';
  if (eqd2Loss < 2)    return `Minor gap effect (${eqd2Loss.toFixed(1)} Gy EQD2 loss). Likely no clinical impact. Document and continue as planned.`;
  if (eqd2Loss < 5)    return `Significant gap (${eqd2Loss.toFixed(1)} Gy EQD2 loss). Compensation recommended: add ${extraFx} fraction(s) of ${dpf} Gy. Discuss with team.`;
  if (eqd2Loss < 10)   return `Major gap (${eqd2Loss.toFixed(1)} Gy EQD2 loss). Urgent compensation required. Add ${extraFx} fractions or use BID schedule. Physics peer review recommended.`;
  return `⚠ Critical gap (${eqd2Loss.toFixed(1)} Gy EQD2 loss). Major dose deficit. Physics peer review MANDATORY before resuming. Consider escalated compensation.`;
};

// ── Component ─────────────────────────────────────────────────────────────
const EBRTGapPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [compensationTab, setCompensationTab] = useState<'A' | 'B' | 'C'>('A');

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || 'Reference',
    emoji: '📌',
    accent: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.1)',
    border: 'rgba(0, 212, 255, 0.3)',
    rows: sec.items.map(item => ({ k: item.label, v: item.value })),
  }));

  const [step, setStep] = useState<WizardStep>('site');
  const [data, setData] = useState<GapState>(INITIAL_STATE);
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);

  // Safe alpha-beta accessor — fixes the ab vs alphaBeta field aliasing bug
  const getAB = (t: RadiobiologyData | null): number =>
    t ? (t.ab ?? t.alphaBeta ?? 10) : 10;

  // Derived
  const totalFx = data.dosePerFx > 0 ? Math.round(data.totalDose / data.dosePerFx) : 0;
  const doseDelivered = data.fxCompleted * data.dosePerFx;

  // ── Core Calculation ───────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!selectedTumour) return null;

    // Safe field access — handles both ab and alphaBeta field names
    const ab  = getAB(selectedTumour);
    const k   = selectedTumour.k  ?? 0.6;
    const tk  = selectedTumour.tk ?? 28;
    const dpf = data.dosePerFx;

    if (ab <= 0 || dpf <= 0) return null;

    // ── EQD2 of planned treatment ──────────────────────────────────────
    const eqd2Total    = calcEQD2(data.totalDose, dpf, ab);
    const bedTotal     = calcBED(data.totalDose,  dpf, ab);
    const eqd2Delivered = calcEQD2(doseDelivered, dpf, ab);

    // ── Overall Treatment Time ─────────────────────────────────────────
    // Uses fxPerWeek input — not hardcoded 5-day assumption
    const fxPerWeek = Math.max(1, Math.min(14, data.fxPerWeek || 5));
    const estimatedOverallTime =
      totalFx <= fxPerWeek
        ? totalFx
        : Math.round((totalFx / fxPerWeek) * 7);

    // ── Days elapsed at start of gap ───────────────────────────────────
    const daysElapsedAtGapStart =
      totalFx > 0
        ? Math.round((data.fxCompleted / totalFx) * estimatedOverallTime)
        : 0;

    // ── Effective repopulation days ────────────────────────────────────
    // Repopulation only counts from Tk onwards
    // If Tk has not yet been reached when gap starts, only the gap days
    // AFTER Tk contributes to the loss
    const tkRemainingAtGapStart = Math.max(0, tk - daysElapsedAtGapStart);
    const effectiveRepopDays    = Math.max(0, data.gapDays - tkRemainingAtGapStart);
    const eqd2Loss              = k * effectiveRepopDays;
    const tkReachedBeforeGap    = daysElapsedAtGapStart >= tk;

    // ── Conversion factor: EQD2 → physical dose at current dpf ──────────
    // Physical dose = EQD2 × (1 + 2/ab) / (1 + dpf/ab)
    const conversionFactor = (1 + 2 / ab) / (1 + dpf / ab);
    const physicalDoseLoss  = eqd2Loss * conversionFactor;

    // ── Compensation Strategy A: Extra fractions at same dose/fx ────────
    const extraFxExact = dpf > 0 ? physicalDoseLoss / dpf : 0;
    const extraFxA     = Math.ceil(extraFxExact);
    const newTotalDoseA = data.totalDose + extraFxA * dpf;
    const newTotalFxA   = totalFx + extraFxA;

    // ── Compensation Strategy B: Increase dose/fx for remaining fractions ─
    // Solve for new dpf (quadratic from BED formula):
    //   BED_remaining_target = eqd2Loss × (1 + 2/ab) / 1 [convert EQD2 loss to BED]
    //   BED_remaining = fxRemaining × new_dpf × (1 + new_dpf/ab)
    //   → ab·new_dpf² + ab²·new_dpf − ab·BED_remaining/fxRemaining = 0
    const fxRemaining  = Math.max(0, totalFx - data.fxCompleted);
    let stratB_newDpf  = dpf;
    let stratB_addPerFx = 0;
    if (fxRemaining > 0 && eqd2Loss > 0) {
      const bedLossTarget = eqd2Loss * (1 + 2 / ab); // EQD2 → BED
      const bedPerFxNeeded = (calcBED(data.totalDose - doseDelivered, dpf, ab) + bedLossTarget) / fxRemaining;
      // Solve: dpf_new*(1 + dpf_new/ab) = bedPerFxNeeded
      // → dpf_new² + ab*dpf_new − ab*bedPerFxNeeded = 0
      const disc = ab * ab + 4 * ab * bedPerFxNeeded;
      if (disc >= 0) {
        stratB_newDpf  = (-ab + Math.sqrt(disc)) / 2;
        stratB_addPerFx = Math.max(0, stratB_newDpf - dpf);
      }
    }
    const stratB_newTotalDose = doseDelivered + fxRemaining * stratB_newDpf;

    // ── Compensation Strategy C: BID days (twice-daily) ─────────────────
    // Each BID day = 2 fractions at same dpf
    const eqd2PerFraction  = calcEQD2(dpf, dpf, ab);
    const eqd2PerBIDday    = 2 * eqd2PerFraction;
    const bidDaysNeeded    = eqd2PerBIDday > 0 ? Math.ceil(eqd2Loss / eqd2PerBIDday) : 0;
    const bidExtraFx       = bidDaysNeeded * 2;
    const bidNewTotalDose  = data.totalDose + bidExtraFx * dpf;

    const interpretation = getInterpretation(k);
    const urgency        = getUrgency(eqd2Loss);

    return {
      ab, k, tk,
      eqd2Total, bedTotal,
      eqd2Delivered,
      eqd2Loss,
      physicalDoseLoss,
      // Strategy A
      extraFxExact, extraFxA, newTotalDoseA, newTotalFxA,
      // Strategy B
      stratB_newDpf, stratB_addPerFx, stratB_newTotalDose, fxRemaining,
      // Strategy C
      bidDaysNeeded, bidExtraFx, bidNewTotalDose,
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Gap Correction
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Compensate for missed treatment days using the LQ repopulation model (Withers 1988).
        </p>
      </div>

      {/* Progress Bar */}
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

      {/* Wizard Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] relative">

        {/* ── STEP 1: SITE SELECTION ──────────────────────────────────── */}
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

            {/* Show repopulation preview after selection */}
            {selectedTumour && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Repopulation Parameters</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-black text-blue-800 font-mono">
                      {(selectedTumour.k ?? 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-blue-600">k (Gy/day)</p>
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

        {/* ── STEP 2: PRESCRIPTION ───────────────────────────────────── */}
        {step === 'prescription' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Prescription Details</h2>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Total Prescribed Dose (Gy)
                </label>
                <NumberInput
                  
                  value={data.totalDose || ''}
                  onChange={e => updateData('totalDose', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Dose per Fraction (Gy)
                </label>
                <NumberInput
                  
                  step="0.1"
                  value={data.dosePerFx || ''}
                  onChange={e => updateData('dosePerFx', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Fractions per Week
                  <span className="ml-1 text-[9px] text-slate-400 normal-case font-normal">(default 5 · use 10 for BID)</span>
                </label>
                <NumberInput
                  
                  min="1" max="14"
                  value={data.fxPerWeek || 5}
                  onChange={e => updateData('fxPerWeek', parseFloat(e.target.value) || 5)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Total Fractions</p>
                  <p className="text-2xl font-black text-blue-800 font-mono">{totalFx} fx</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Est. Overall Time</p>
                  <p className="text-2xl font-black text-blue-800 font-mono">
                    {totalFx <= (data.fxPerWeek || 5)
                      ? `${totalFx}d`
                      : `${Math.round((totalFx / (data.fxPerWeek || 5)) * 7)}d`}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep('site')} className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => nextStep('gap')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: GAP DETAILS ─────────────────────────────────────── */}
        {step === 'gap' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Gap Information</h2>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Fractions Completed Before Gap
                </label>
                <NumberInput
                  
                  value={data.fxCompleted || ''}
                  onChange={e => updateData('fxCompleted', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dose delivered before gap: {(data.fxCompleted * data.dosePerFx).toFixed(1)} Gy
                  ({totalFx > 0 ? Math.round((data.fxCompleted / totalFx) * 100) : 0}% complete)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Gap Duration (Calendar Days)
                </label>
                <NumberInput
                  
                  value={data.gapDays || ''}
                  onChange={e => updateData('gapDays', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 5"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Include weekends and public holidays in the count.
                </p>
              </div>

              {/* Live preview */}
              {selectedTumour && data.gapDays > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
                  <p className="font-bold mb-1">Quick Preview</p>
                  <p>Tumour α/β = {getAB(selectedTumour)} Gy · k = {(selectedTumour.k ?? 0).toFixed(2)} Gy/day · Tk = {selectedTumour.tk ?? 0} days</p>
                  <p className="mt-1 text-amber-600 italic">{selectedTumour.repopNote}</p>
                </div>
              )}
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

        {/* ── STEP 4: RESULTS ─────────────────────────────────────────── */}
        {step === 'results' && results && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Analysis Results</h2>
              <div className="flex items-center gap-3 no-print">
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
                            ? `${results.urgency.label} impact. ${getUrgencyMessage(results.eqd2Loss, results.extraFxA, data.dosePerFx)} ${selectedTumour?.repopNote ?? ''}`
                            : ''
                        }
                      />
                    );
                    const blob = await generatePDFBlob(doc);
                    await sharePDF(blob, `RadOnc_Gap_Report.pdf`, `Clinical Report: ${selectedTumour?.subsite} Gap Correction Analysis.`);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm"
                  title="Share Report via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  Share to WhatsApp
                </button>
              </div>
            </div>

            {/* Urgency Banner */}
            <div className={`mb-4 p-3 rounded-xl border ${results.urgency.bg} ${results.urgency.border} flex items-start gap-3`}>
              <span className={`text-lg font-black ${results.urgency.color}`}>{results.urgency.icon}</span>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${results.urgency.color}`}>
                  {results.urgency.label} Impact
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${results.urgency.color}`}>
                  {getUrgencyMessage(results.eqd2Loss, results.extraFxA, data.dosePerFx)}
                </p>
              </div>
            </div>

            {/* Main summary card */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white mb-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">EQD2 Loss</p>
                  <p className="text-3xl font-black">
                    {results.eqd2Loss.toFixed(2)}
                    <span className="text-sm font-normal text-blue-200 ml-1">Gy</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {results.effectiveRepopDays} of {data.gapDays} gap days effective
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">Best Compensation</p>
                  <p className="text-3xl font-black text-amber-400">
                    +{results.extraFxA}
                    <span className="text-sm font-normal text-amber-200 ml-1">fx</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Strategy A (extra fractions)</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-400">α/β</p>
                  <p className="font-bold text-white">{results.ab} Gy</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">k value</p>
                  <p className="font-bold text-white">{results.k.toFixed(2)} Gy/d</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Tk kick-off</p>
                  <p className="font-bold text-white">{results.tk}d</p>
                </div>
              </div>
            </div>

            {/* Repopulation timing note */}
            <div className="mb-4 px-4 py-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-3">
              <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">
                  {results.tkReachedBeforeGap
                    ? `Tk (${results.tk}d) reached before gap — full repopulation applies`
                    : `Tk (${results.tk}d) not yet reached at gap start (day ~${results.daysElapsedAtGapStart})`}
                </p>
                <p className="text-[11px] text-blue-700 leading-tight mt-0.5">
                  Gap started ~day {results.daysElapsedAtGapStart} of ~{results.estimatedOverallTime} day course
                  ({results.fxPerWeek} fx/week).
                  {results.effectiveRepopDays < data.gapDays
                    ? ` Only ${results.effectiveRepopDays} of ${data.gapDays} days attract repopulation loss.`
                    : ` All ${data.gapDays} days attract repopulation loss.`}
                </p>
                {selectedTumour?.repopNote && (
                  <p className="text-[10px] text-blue-600 italic mt-1">{selectedTumour.repopNote}</p>
                )}
              </div>
            </div>

            {/* 3-Strategy Compensation Tabs */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Compensation Options
              </p>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden mb-3">
                {(['A', 'B', 'C'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCompensationTab(tab)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition ${
                      compensationTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'A' ? 'Extra Fractions' : tab === 'B' ? 'Increase Dose/Fx' : 'BID Days'}
                  </button>
                ))}
              </div>

              {compensationTab === 'A' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Strategy A — Add extra fractions at same dose/fx</p>
                  <div className="grid grid-cols-3 gap-3 text-center mt-2">
                    <div>
                      <p className="text-xl font-black text-blue-700">+{results.extraFxA}</p>
                      <p className="text-[10px] text-slate-500">Extra fractions</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-700">{results.newTotalDoseA.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">New total (Gy)</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-700">{results.newTotalFxA}</p>
                      <p className="text-[10px] text-slate-500">New total fx</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Each fraction = {data.dosePerFx} Gy. Simplest approach; schedule after treatment resumes.
                  </p>
                </div>
              )}

              {compensationTab === 'B' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Strategy B — Increase dose per fraction for remaining {results.fxRemaining} fractions</p>
                  {results.fxRemaining > 0 && results.eqd2Loss > 0 ? (
                    <div className="grid grid-cols-3 gap-3 text-center mt-2">
                      <div>
                        <p className="text-xl font-black text-blue-700">{results.stratB_newDpf.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">New Gy/fx</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-700">+{results.stratB_addPerFx.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">Added Gy/fx</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-700">{results.stratB_newTotalDose.toFixed(1)}</p>
                        <p className="text-[10px] text-slate-500">New total (Gy)</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      {results.fxRemaining === 0
                        ? 'No fractions remaining — use Strategy A (extra fractions) instead.'
                        : 'No EQD2 loss — no dose increase needed.'}
                    </p>
                  )}
                  <p className="text-[10px] text-amber-600 mt-1">
                    ⚠ Increasing dose/fx raises late-tissue BED — verify OAR constraints (α/β≈3) before implementing.
                  </p>
                </div>
              )}

              {compensationTab === 'C' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Strategy C — BID fractionation (twice daily)</p>
                  <div className="grid grid-cols-3 gap-3 text-center mt-2">
                    <div>
                      <p className="text-xl font-black text-blue-700">{results.bidDaysNeeded}</p>
                      <p className="text-[10px] text-slate-500">BID days needed</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-700">+{results.bidExtraFx}</p>
                      <p className="text-[10px] text-slate-500">Extra fractions</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-700">{results.bidNewTotalDose.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">New total (Gy)</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">
                    ⚠ BID MANDATORY: minimum 6-hour inter-fraction interval for complete sublethal damage repair in late tissues.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Each BID day = 2 × {data.dosePerFx} Gy = {(2 * data.dosePerFx).toFixed(1)} Gy/day.
                  </p>
                </div>
              )}
            </div>

            {/* Parameters summary */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Tumour / Site</span>
                <span className="text-xs font-bold text-slate-900">{selectedTumour?.subsite} — {selectedTumour?.tumour}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Prescription</span>
                <span className="text-xs font-mono text-slate-700">{data.totalDose} Gy / {totalFx} fx ({data.dosePerFx} Gy/fx)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Physical Dose Loss</span>
                <span className="text-xs font-bold text-slate-900">{results.physicalDoseLoss.toFixed(2)} Gy</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Sensitivity</span>
                <span className={`text-xs font-bold ${results.interpretation.color}`}>
                  {results.interpretation.level} — {results.interpretation.description}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => prevStep('gap')} className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => { setData(INITIAL_STATE); setStep('site'); setSelectedTumour(null); }}
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition"
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 max-w-md mx-auto">
          Ref: Withers HR et al. Acta Oncol 1988 (repopulation); Dale RG, Jones B. Radiobiological Modelling in Radiation Oncology.
          Mauguen A et al. J Clin Oncol 2012 (lung meta-analysis). Kim JJ et al. Breast Cancer Res 2018 (TNBC).
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
