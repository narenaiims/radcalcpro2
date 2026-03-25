import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Info, Calculator, RotateCcw, Calendar, Activity, BookOpen, GraduationCap, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { RadiobiologyData, getInterpretation } from '@/src/data/radiobiologyData';

const QUICK_REF_DATA = [
  {
    category: "Gap Principles",
    items: [
      { label: "OTT Impact", value: "Repopulation Loss" },
      { label: "K-value", value: "EQD2 loss/day" },
      { label: "Tk", value: "Kick-off time (days)" },
    ]
  },
  {
    category: "Compensation",
    items: [
      { label: "Method 1", value: "Extra fractions" },
      { label: "Method 2", value: "Dose/fx increase" },
      { label: "Method 3", value: "BID (Twice daily)" },
    ]
  }
];
import TumourSelector from '@/components/TumourSelector';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from '@/src/components/PrintReport';

// ── Types ─────────────────────────────────────────────────────────────────
type WizardStep = 'site' | 'prescription' | 'gap' | 'results';

interface GapState {
  totalDose: number;
  dosePerFx: number;
  fxCompleted: number;
  gapDays: number;
}

const INITIAL_STATE: GapState = {
  totalDose: 60,
  dosePerFx: 2.0,
  fxCompleted: 15,
  gapDays: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────
const calcEQD2 = (dose: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? dose * (dpf + ab) / (2 + ab) : 0;

const calcBED = (dose: number, dpf: number, ab: number) =>
  ab > 0 && dpf > 0 ? dose * (1 + dpf / ab) : 0;

// ── Component ─────────────────────────────────────────────────────────────
const EBRTGapPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: sec.items.map(item => ({ k: item.label, v: item.value }))
  }));

  const [step, setStep] = useState<WizardStep>('site');
  const [data, setData] = useState<GapState>(INITIAL_STATE);
  const [selectedTumour, setSelectedTumour] = useState<RadiobiologyData | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // Derived calculations
  const totalFx = data.dosePerFx > 0 ? Math.round(data.totalDose / data.dosePerFx) : 0;
  const doseDelivered = data.fxCompleted * data.dosePerFx;
  
  // Calculation Logic
  const results = useMemo(() => {
    if (!selectedTumour) return null;

    const { ab, k, tk } = selectedTumour;
    const dpf = data.dosePerFx;
    
    // EQD2/BED of planned treatment
    const eqd2Total = calcEQD2(data.totalDose, dpf, ab);
    const bedTotal = calcBED(data.totalDose, dpf, ab);

    // Dose delivered before gap
    const eqd2Delivered = calcEQD2(doseDelivered, dpf, ab);
    
    // Repopulation Loss
    // Loss = K * GapDays
    const eqd2Loss = k * data.gapDays;
    
    // Compensation
    // Convert EQD2 loss back to physical dose at current d/fx
    const conversionFactor = ab > 0 ? (1 + 2/ab) / (1 + dpf/ab) : 1;
    const physicalDoseLoss = eqd2Loss * conversionFactor;
    
    const extraFxExact = dpf > 0 ? physicalDoseLoss / dpf : 0;
    const extraFx = Math.ceil(extraFxExact);
    
    const newTotalDose = data.totalDose + (extraFx * dpf);
    const newTotalFx = totalFx + extraFx;

    const interpretation = getInterpretation(k);

    return {
      eqd2Total,
      bedTotal,
      eqd2Delivered,
      eqd2Loss,
      physicalDoseLoss,
      extraFx,
      extraFxExact,
      newTotalDose,
      newTotalFx,
      interpretation,
      ab, k, tk
    };
  }, [data, selectedTumour, doseDelivered, totalFx]);

  // Navigation Handlers
  const nextStep = (target: WizardStep) => {
    setStep(target);
  };

  const prevStep = (target: WizardStep) => {
    setStep(target);
  };

  const updateData = (field: keyof GapState, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Gap Correction
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Compensate for missed treatment days using the LQ repopulation model.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full" />
        {(['site', 'prescription', 'gap', 'results'] as WizardStep[]).map((s, i) => {
          const isActive = s === step;
          const isPast = ['site', 'prescription', 'gap', 'results'].indexOf(step) > i;
          return (
            <div key={s} className={`flex flex-col items-center gap-1 bg-slate-100 px-2 rounded-full ${isActive ? 'scale-110 transition-transform' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 
                  isPast ? 'bg-green-500 border-green-500 text-white' : 
                  'bg-white border-slate-300 text-slate-400'}`}>
                {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 hidden sm:block">
                {s}
              </span>
            </div>
          );
        })}
      </div>

      {/* Wizard Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] relative">
          
          {/* STEP 1: SITE SELECTION */}
          {step === 'site' && (
            <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Select Tumour Site</h2>
              
              <TumourSelector
                selectedEntry={selectedTumour}
                onSelect={(entry) => {
                  setSelectedTumour(entry);
                }}
                onClear={() => setSelectedTumour(null)}
              />

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
                    type="number"
                    value={data.totalDose ?? ''}
                    onChange={e => updateData('totalDose', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Dose per Fraction (Gy)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={data.dosePerFx ?? ''}
                    onChange={e => updateData('dosePerFx', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total Fractions Planned</span>
                  <span className="text-xl font-bold text-blue-700 font-mono">{totalFx} fx</span>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => prevStep('site')}
                  className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition"
                >
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

          {/* STEP 3: GAP DETAILS */}
          {step === 'gap' && (
            <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Gap Information</h2>
              
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Fractions Completed Before Gap</label>
                  <input
                    type="number"
                    value={data.fxCompleted ?? ''}
                    onChange={e => updateData('fxCompleted', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                      type="number"
                      value={data.gapDays ?? ''}
                      onChange={e => updateData('gapDays', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full pl-10 p-3 rounded-xl border border-slate-300 text-lg font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Include weekends and holidays if they extended the gap.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => prevStep('prescription')}
                  className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition"
                >
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
          {step === 'results' && results && (
            <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Analysis Results</h2>
                <button
                  onClick={() => reactToPrintFn()}
                  className="no-print flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  <Printer className="w-3 h-3" />
                  Print Report
                </button>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${results.interpretation.color.replace('text-', 'border-').replace('600', '200')} bg-white`}>
                {results.interpretation.level} Sensitivity
              </span>

              {/* Main Card */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white mb-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">EQD2 Loss</p>
                    <p className="text-3xl font-black">{results.eqd2Loss.toFixed(2)} <span className="text-sm font-normal text-blue-200">Gy</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">Due to {data.gapDays} days gap</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">Extra Fractions</p>
                    <p className="text-3xl font-black text-amber-400">+{results.extraFx}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Recommended</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-200">New Total Dose</span>
                    <span className="text-lg font-bold">{results.newTotalDose.toFixed(1)} Gy <span className="text-xs font-normal opacity-70">in {results.newTotalFx} fx</span></span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Tumour Type</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTumour.subsite}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Parameters</span>
                  <span className="text-xs font-mono text-slate-500">α/β={results.ab} · K={results.k} · Tk={results.tk}d</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Physical Dose Loss</span>
                  <span className="text-xs font-bold text-slate-900">{results.physicalDoseLoss.toFixed(2)} Gy</span>
                </div>
              </div>

              {/* Recommendation Text */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase mb-1">Clinical Interpretation</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {results.interpretation.description}. 
                      {results.extraFx > 0 
                        ? ` Consider adding ${results.extraFx} fractions of ${data.dosePerFx} Gy to compensate for the biological effect of repopulation.` 
                        : ' The calculated loss is minimal; compensation may not be required.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => prevStep('gap')}
                  className="flex items-center gap-2 text-slate-500 px-4 py-3 font-bold hover:text-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => {
                    setData(INITIAL_STATE);
                    setStep('site');
                  }}
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
          Reference: Dale RG, Jones B. Radiobiological Modelling in Radiation Oncology. 
          Values derived from clinical data (Bentzen, Fowler, Wyatt, QUANTEC).
        </p>
      </div>

      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      <div className="hidden">
        <PrintReport
          ref={contentRef}
          title="EBRT Gap Correction Report"
          parameters={[
            { label: 'Tumour Site', value: selectedTumour?.subsite || 'N/A' },
            { label: 'Total Dose', value: `${data.totalDose} Gy` },
            { label: 'Dose per Fx', value: `${data.dosePerFx} Gy` },
            { label: 'Gap Duration', value: `${data.gapDays} days` },
          ]}
          results={[
            { label: 'EQD2 Loss', value: results?.eqd2Loss.toFixed(2) || '0', unit: 'Gy' },
            { label: 'Extra Fx', value: results?.extraFx.toString() || '0', unit: 'fx' },
            { label: 'New Total Dose', value: results?.newTotalDose.toFixed(1) || '0', unit: 'Gy' },
          ]}
          clinicalInsight={results?.interpretation.description}
        />
      </div>
    </div>
  );
};

export default EBRTGapPage;
