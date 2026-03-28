import React, { useState, useMemo, useRef } from 'react';
import { Activity, Calculator, Printer, AlertTriangle, Info, BookOpen, Trash2, Plus } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from '@/src/components/PrintReport';

// ── LKB Parameters (QUANTEC 2010) ───────────────────────────────────────────
const OAR_PARAMS = [
  { name: 'Spinal cord', endpoint: 'Myelopathy', n: 0.05, m: 0.175, d50: 66.5 },
  { name: 'Brainstem', endpoint: 'Necrosis', n: 0.16, m: 0.14, d50: 65.1 },
  { name: 'Optic nerve', endpoint: 'Blindness', n: 0.25, m: 0.14, d50: 65.0 },
  { name: 'Parotid', endpoint: 'Severe xerostomia', n: 1.0, m: 0.40, d50: 28.4 },
  { name: 'Lung (mean)', endpoint: 'Pneumonitis', n: 1.0, m: 0.40, d50: 30.5 },
  { name: 'Rectum', endpoint: 'Severe proctitis', n: 0.12, m: 0.14, d50: 80.0 },
  { name: 'Bladder', endpoint: 'Severe cystitis', n: 0.50, m: 0.11, d50: 80.0 },
];

// ── Math Helpers ─────────────────────────────────────────────────────────────
// Abramowitz & Stegun approximation 7.1.26
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const poly = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const ans = poly * Math.exp(-z * z);
  return x >= 0 ? ans : 2 - ans;
}

function normalCDF(x: number): number {
  return 0.5 * erfc(-x / Math.SQRT2);
}

// ── Component ────────────────────────────────────────────────────────────────
const NTCPPage: React.FC = () => {
  const [selectedOarIdx, setSelectedOarIdx] = useState<number>(3); // Default Parotid
  const [dvhPoints, setDvhPoints] = useState<{ dose: string; vol: string }[]>([
    { dose: '70', vol: '0.05' },
    { dose: '60', vol: '0.20' },
    { dose: '50', vol: '0.40' },
  ]);
  const [activeTab, setActiveTab] = useState<'lkb' | 'probit'>('lkb');
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const oar = OAR_PARAMS[selectedOarIdx];

  const handleDvhChange = (index: number, field: 'dose' | 'vol', value: string) => {
    const newPoints = [...dvhPoints];
    newPoints[index][field] = value;
    setDvhPoints(newPoints);
  };

  const addDvhPoint = () => setDvhPoints([...dvhPoints, { dose: '', vol: '' }]);
  const removeDvhPoint = (index: number) => setDvhPoints(dvhPoints.filter((_, i) => i !== index));

  // ── Calculations ───────────────────────────────────────────────────────────
  const { gEUD, ntcpLKB, ntcpLKB_lower, ntcpLKB_upper, ntcpProbit, uValue } = useMemo(() => {
    let sumVDn = 0;
    let sumV = 0;
    let validPoints = 0;

    for (const pt of dvhPoints) {
      const d = parseFloat(pt.dose);
      const v = parseFloat(pt.vol);
      if (!isNaN(d) && !isNaN(v) && d >= 0 && v >= 0) {
        sumVDn += v * Math.pow(d, 1 / oar.n);
        sumV += v;
        validPoints++;
      }
    }

    if (validPoints === 0 || sumV === 0) {
      return { gEUD: 0, ntcpLKB: 0, ntcpLKB_lower: 0, ntcpLKB_upper: 0, ntcpProbit: 0, uValue: 0 };
    }

    let normalizedSumVDn = sumVDn;
    if (sumV > 1) {
      normalizedSumVDn = sumVDn / 100;
    }

    const calculated_gEUD = Math.pow(normalizedSumVDn, oar.n);

    // LKB Model
    const t = (calculated_gEUD - oar.d50) / (oar.m * oar.d50);
    const calculated_ntcpLKB = normalCDF(t) * 100;

    // 95% CI (propagated from m uncertainty ±20%)
    const m_lower = oar.m * 0.8;
    const m_upper = oar.m * 1.2;
    const t_lower = (calculated_gEUD - oar.d50) / (m_upper * oar.d50);
    const t_upper = (calculated_gEUD - oar.d50) / (m_lower * oar.d50);
    
    const ntcp1 = normalCDF(t_lower) * 100;
    const ntcp2 = normalCDF(t_upper) * 100;
    const calculated_ntcpLKB_lower = Math.min(ntcp1, ntcp2);
    const calculated_ntcpLKB_upper = Math.max(ntcp1, ntcp2);

    // Probit / Logistic (Niemierko)
    const gamma50 = 1 / (oar.m * Math.sqrt(2 * Math.PI));
    const k = 4 * gamma50;
    const calculated_ntcpProbit = (1 / (1 + Math.pow(oar.d50 / (calculated_gEUD || 1e-10), k))) * 100;

    return { 
      gEUD: calculated_gEUD, 
      ntcpLKB: calculated_ntcpLKB, 
      ntcpLKB_lower: calculated_ntcpLKB_lower, 
      ntcpLKB_upper: calculated_ntcpLKB_upper, 
      ntcpProbit: calculated_ntcpProbit,
      uValue: (oar.d50 - calculated_gEUD) / (oar.m * oar.d50)
    };
  }, [dvhPoints, oar]);

  const getTrafficLight = (ntcp: number) => {
    if (ntcp < 5) return 'text-emerald-400';
    if (ntcp <= 15) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTrafficLightBg = (ntcp: number) => {
    if (ntcp < 5) return 'bg-emerald-500/10 border-emerald-500/30';
    if (ntcp <= 15) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-8 animate-slam pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <p className="label-micro text-purple-400">Radiobiology Solver</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">NTCP Calculator</h1>
          <p className="text-sm text-slate-500 font-serif italic">Lyman-Kutcher-Burman & Niemierko Models</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => reactToPrintFn()} className="btn-premium btn-primary py-2 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">OAR Parameters (QUANTEC)</h2>
            <div className="card-premium p-6 space-y-4">
              <div className="space-y-2">
                <label className="label-micro">Select Organ at Risk</label>
                <select 
                  className="input-premium w-full"
                  value={selectedOarIdx}
                  onChange={(e) => setSelectedOarIdx(Number(e.target.value))}
                >
                  {OAR_PARAMS.map((o, i) => (
                    <option key={i} value={i}>{o.name} - {o.endpoint}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Volume Effect (n)</p>
                  <p className="text-lg font-mono font-bold text-white">{oar.n}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Slope (m)</p>
                  <p className="text-lg font-mono font-bold text-white">{oar.m}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">TD₅₀ (Gy)</p>
                  <p className="text-lg font-mono font-bold text-white">{oar.d50}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="label-micro opacity-40">DVH Input</h2>
              <button onClick={addDvhPoint} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Point
              </button>
            </div>
            <div className="card-premium p-6 space-y-4">
              <div className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-5 label-micro">Dose (Gy)</div>
                <div className="col-span-5 label-micro">Volume Fraction</div>
                <div className="col-span-2"></div>
              </div>
              
              {dvhPoints.map((pt, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input 
                      type="number" inputMode="decimal" step="0.1" min="0"
                      value={pt.dose} 
                      onChange={(e) => handleDvhChange(i, 'dose', e.target.value)}
                      className="input-premium w-full"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="col-span-5">
                    <input 
                      type="number" inputMode="decimal" step="0.01" min="0" max="1"
                      value={pt.vol} 
                      onChange={(e) => handleDvhChange(i, 'vol', e.target.value)}
                      className="input-premium w-full"
                      placeholder="e.g. 0.2"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={() => removeDvhPoint(i)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                      disabled={dvhPoints.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-500 mt-4 italic">
                Enter differential DVH points. Volume fractions should sum to ≤ 1.0 (or ≤ 100 if using percentages). Remaining volume is assumed to receive 0 Gy.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          <section className="space-y-4">
            <h2 className="label-micro opacity-40">Calculated Risk</h2>
            
            <div className={`card-premium p-8 border ${getTrafficLightBg(ntcpLKB)} flex flex-col items-center text-center transition-colors duration-500`}>
              <p className="label-micro opacity-60 mb-2">LKB Model NTCP</p>
              <p className={`text-6xl font-black font-mono leading-none tracking-tighter ${getTrafficLight(ntcpLKB)}`}>
                {ntcpLKB.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400 mt-3 font-mono">
                95% CI: [{ntcpLKB_lower.toFixed(1)}% - {ntcpLKB_upper.toFixed(1)}%]
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
                <AlertTriangle className={`w-4 h-4 ${getTrafficLight(ntcpLKB)}`} />
                <span className="text-xs font-semibold text-white">{oar.endpoint}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                <p className="label-micro opacity-40 mb-2">gEUD</p>
                <p className="text-3xl font-black text-white font-mono leading-none">
                  {gEUD.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Gy</p>
              </div>
              <div className="card-premium p-6 bg-white/[0.02] flex flex-col items-center text-center">
                <p className="label-micro opacity-40 mb-2">u-value</p>
                <p className="text-3xl font-black text-white font-mono leading-none">
                  {uValue.toFixed(3)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Standard deviations</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-4 border-b border-white/5">
              <button 
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'lkb' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setActiveTab('lkb')}
              >
                LKB Details
              </button>
              <button 
                className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'probit' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setActiveTab('probit')}
              >
                Logistic Comparison
              </button>
            </div>

            <div className="card-premium p-6 min-h-[200px]">
              {activeTab === 'lkb' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Lyman-Kutcher-Burman Model</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        The LKB model uses a probit function based on the generalized Equivalent Uniform Dose (gEUD). It assumes that the complication probability follows a cumulative normal distribution.
                      </p>
                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300 space-y-1">
                        <p>NTCP = 0.5 × erfc(-u / √2)</p>
                        <p>u = (D₅₀ - gEUD) / (m × D₅₀)</p>
                        <p>gEUD = (Σ vᵢ × Dᵢ^(1/n))^n</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h4 className="text-sm font-bold text-white mb-1">Niemierko Logistic Model</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        An alternative formulation using a logistic function. While LKB and Logistic models agree closely near D₅₀, they diverge in the high and low dose tails.
                      </p>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Logistic NTCP</p>
                          <p className={`text-2xl font-mono font-bold ${getTrafficLight(ntcpProbit)}`}>
                            {ntcpProbit.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase">Absolute Diff</p>
                          <p className="text-lg font-mono font-bold text-white">
                            {Math.abs(ntcpLKB - ntcpProbit).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300 space-y-1">
                        <p>NTCP = 1 / (1 + (D₅₀ / gEUD)^k)</p>
                        <p>k = 4 × γ₅₀</p>
                        <p>γ₅₀ = 1 / (m × √(2π))</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="hidden">
        <PrintReport
          ref={contentRef}
          title="NTCP Calculator Report"
          parameters={[
            { label: 'OAR', value: oar.name },
            { label: 'Endpoint', value: oar.endpoint },
            { label: 'n (Volume Effect)', value: oar.n.toString() },
            { label: 'm (Slope)', value: oar.m.toString() },
            { label: 'D50', value: `${oar.d50} Gy` },
          ]}
          results={[
            { label: 'gEUD', value: gEUD.toFixed(2), unit: 'Gy' },
            { label: 'LKB NTCP', value: ntcpLKB.toFixed(2), unit: '%' },
            { label: '95% CI Lower', value: ntcpLKB_lower.toFixed(2), unit: '%' },
            { label: '95% CI Upper', value: ntcpLKB_upper.toFixed(2), unit: '%' },
            { label: 'Logistic NTCP', value: ntcpProbit.toFixed(2), unit: '%' },
          ]}
        />
      </div>
    </div>
  );
};

export default NTCPPage;
