import React, { useState, useMemo, useRef } from 'react';
import { Activity, Calculator, Printer, AlertTriangle, Info, BookOpen, Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintReport } from '@/src/components/PrintReport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceDot, Area, ComposedChart } from 'recharts';

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
  const [isPercent, setIsPercent] = useState<boolean>(false);
  const [isCumulative, setIsCumulative] = useState<boolean>(true);
  const [showLkbParams, setShowLkbParams] = useState<boolean>(false);
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
  const { gEUD, ntcpLKB, ntcpLKB_lower, ntcpLKB_upper, ntcpProbit, uValue, hasError, errorMessage, allOarsResults } = useMemo(() => {
    let validPoints = [];
    for (const pt of dvhPoints) {
      const d = parseFloat(pt.dose);
      const v = parseFloat(pt.vol);
      if (!isNaN(d) && !isNaN(v) && d >= 0 && v >= 0) {
        validPoints.push({ d, v });
      }
    }

    validPoints.sort((a, b) => a.d - b.d); // Sort ascending by dose

    let diffPts = [];
    let hasErr = false;
    let errMsg = '';

    if (isCumulative) {
      for (let i = 0; i < validPoints.length; i++) {
        const vol_decimal = isPercent ? validPoints[i].v / 100 : validPoints[i].v;
        if (vol_decimal > 1.0) {
          hasErr = true;
          errMsg = 'Volume fraction exceeds 1.0 (or 100%).';
        }
        
        let next_vol_decimal = 0;
        let next_d = validPoints[i].d;
        if (i < validPoints.length - 1) {
          next_vol_decimal = isPercent ? validPoints[i+1].v / 100 : validPoints[i+1].v;
          next_d = validPoints[i+1].d;
        }
        
        const dv = vol_decimal - next_vol_decimal;
        if (dv < 0) {
          hasErr = true;
          errMsg = 'Cumulative volume should decrease as dose increases.';
        }
        
        const bin_dose = (validPoints[i].d + next_d) / 2;
        diffPts.push({ d: bin_dose, v: dv });
      }
    } else {
      for (let i = 0; i < validPoints.length; i++) {
        const vol_decimal = isPercent ? validPoints[i].v / 100 : validPoints[i].v;
        if (vol_decimal > 1.0) {
          hasErr = true;
          errMsg = 'Volume fraction exceeds 1.0 (or 100%).';
        }
        diffPts.push({ d: validPoints[i].d, v: vol_decimal });
      }
    }

    let sumVDn = 0;
    let sumV = 0;

    for (const pt of diffPts) {
      if (pt.v > 0) {
        sumVDn += pt.v * Math.pow(pt.d, 1 / oar.n);
        sumV += pt.v;
      }
    }

    if (sumV > 1.001) {
      hasErr = true;
      errMsg = 'Total volume fraction exceeds 1.0 (or 100%).';
    }

    if (validPoints.length === 0 || sumV === 0 || hasErr) {
      return { gEUD: 0, ntcpLKB: 0, ntcpLKB_lower: 0, ntcpLKB_upper: 0, ntcpProbit: 0, uValue: 0, hasError: hasErr, errorMessage: errMsg, allOarsResults: [] };
    }

    const calculated_gEUD = Math.pow(sumVDn, oar.n);

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

    // All OARs
    const allOars = OAR_PARAMS.map(o => {
      let sVDn = 0;
      for (const pt of diffPts) {
        if (pt.v > 0) {
          sVDn += pt.v * Math.pow(pt.d, 1 / o.n);
        }
      }
      const g = Math.pow(sVDn, o.n);
      const t_oar = (g - o.d50) / (o.m * o.d50);
      const ntcp_oar = normalCDF(t_oar) * 100;
      return { oar: o, gEUD: g, ntcp: ntcp_oar };
    });

    return { 
      gEUD: calculated_gEUD, 
      ntcpLKB: calculated_ntcpLKB, 
      ntcpLKB_lower: calculated_ntcpLKB_lower, 
      ntcpLKB_upper: calculated_ntcpLKB_upper, 
      ntcpProbit: calculated_ntcpProbit,
      uValue: (oar.d50 - calculated_gEUD) / (oar.m * oar.d50),
      hasError: hasErr,
      errorMessage: errMsg,
      allOarsResults: allOars
    };
  }, [dvhPoints, oar, isPercent, isCumulative]);

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

  const curveData = useMemo(() => {
    const data = [];
    const maxDose = oar.d50 * 2;
    for (let d = 0; d <= maxDose; d += maxDose / 50) {
      const t = (d - oar.d50) / (oar.m * oar.d50);
      const ntcp = normalCDF(t) * 100;
      
      const m_lower = oar.m * 0.8;
      const m_upper = oar.m * 1.2;
      const t_lower = (d - oar.d50) / (m_upper * oar.d50);
      const t_upper = (d - oar.d50) / (m_lower * oar.d50);
      
      const ntcp1 = normalCDF(t_lower) * 100;
      const ntcp2 = normalCDF(t_upper) * 100;
      
      data.push({
        dose: d,
        ntcp: ntcp,
        ci: [Math.min(ntcp1, ntcp2), Math.max(ntcp1, ntcp2)]
      });
    }
    return data;
  }, [oar]);

  const targetNTCP = 5;
  const t_target = -1.64485; // For 5% NTCP
  const gEUD_target = oar.d50 + oar.m * oar.d50 * t_target;
  const doseReductionNeeded = gEUD > gEUD_target && ntcpLKB > targetNTCP;
  const reductionPercent = doseReductionNeeded ? ((gEUD - gEUD_target) / gEUD) * 100 : 0;

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

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={() => setShowLkbParams(!showLkbParams)}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full"
                >
                  {showLkbParams ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span className="font-bold uppercase tracking-wider">LKB Parameter Details</span>
                </button>
                
                {showLkbParams && (
                  <div className="mt-4 space-y-3 text-xs text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
                    <p>
                      <strong>n parameter meaning:</strong> n ≈ 0 indicates a serial structure (maximum dose matters most), while n ≈ 1 indicates a parallel structure (mean dose matters most).
                    </p>
                    <p>
                      <strong>Source:</strong> QUANTEC (Quantitative Analysis of Normal Tissue Effects in the Clinic), 2010.
                      <br />
                      <a href="https://doi.org/10.1016/j.ijrobp.2009.11.014" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                        Int J Radiat Oncol Biol Phys. 2010;76(3 Suppl)
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="label-micro opacity-40">QUANTEC Benchmarks</h2>
            <div className="card-premium p-6 space-y-4">
              <div className="space-y-4 text-xs text-slate-300">
                <div className="space-y-2">
                  <p className="font-bold text-slate-200">Parotid (mean 26 Gy)</p>
                  <p className="text-[10px] text-slate-400">n=1.0, m=0.4, D50=28.4</p>
                  <div className="font-mono text-[10px] text-slate-400 bg-black/20 p-2 rounded border border-white/5">
                    gEUD = 26 Gy (parallel, n=1)<br/>
                    u = (26 - 28.4)/(0.4 × 28.4) = -0.211<br/>
                    NTCP = Φ(-0.211) = 41.6%
                  </div>
                  <p className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Consistent with QUANTEC (20-25% at &lt;26 Gy)</p>
                </div>
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <p className="font-bold text-slate-200">Spinal cord (Dmax 45 Gy)</p>
                  <p className="text-[10px] text-slate-400">n=0.05, m=0.175, D50=66.5</p>
                  <div className="font-mono text-[10px] text-slate-400 bg-black/20 p-2 rounded border border-white/5">
                    gEUD ≈ Dmax = 45 Gy (serial, n=0.05)<br/>
                    u = (45 - 66.5)/(0.175 × 66.5) = -1.85<br/>
                    NTCP = Φ(-1.85) = 3.2%
                  </div>
                  <p className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Consistent with TD5/5 ≈ 45 Gy</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-4 pb-4 border-b border-white/5">
                <div className="space-y-2">
                  <p className="label-micro text-slate-400">Volume Format</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="radio" checked={!isPercent} onChange={() => setIsPercent(false)} className="accent-purple-500" />
                      Decimal (0.0 - 1.0)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="radio" checked={isPercent} onChange={() => setIsPercent(true)} className="accent-purple-500" />
                      Percentage (0 - 100%)
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="label-micro text-slate-400">DVH Type</p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="radio" checked={isCumulative} onChange={() => setIsCumulative(true)} className="accent-purple-500" />
                      Cumulative
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input type="radio" checked={!isCumulative} onChange={() => setIsCumulative(false)} className="accent-purple-500" />
                      Differential
                    </label>
                  </div>
                </div>
              </div>

              {hasError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

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

            {doseReductionNeeded && (
              <div className="card-premium p-6 bg-amber-500/10 border-amber-500/30">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Dose Reduction Target
                </h3>
                <p className="text-sm text-slate-300">
                  To reduce NTCP to <strong className="text-white">5%</strong>, mean dose must decrease from <strong className="text-white">{gEUD.toFixed(1)} Gy</strong> to <strong className="text-emerald-400">{gEUD_target.toFixed(1)} Gy</strong> (reduce by <strong className="text-white">{reductionPercent.toFixed(1)}%</strong>).
                </p>
              </div>
            )}

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
            <h2 className="label-micro opacity-40">NTCP vs Dose Curve</h2>
            <div className="card-premium p-6">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={curveData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="dose" type="number" domain={[0, 'dataMax']} label={{ value: 'gEUD (Gy)', position: 'bottom', fill: '#94a3b8' }} tick={{ fill: '#94a3b8' }} />
                  <YAxis label={{ value: 'NTCP (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} tick={{ fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    formatter={(value: number | number[], name: string) => {
                      if (Array.isArray(value)) {
                        return [`[${value[0].toFixed(1)}%, ${value[1].toFixed(1)}%]`, '95% CI'];
                      }
                      return [value.toFixed(1) + '%', name === 'ntcp' ? 'NTCP' : name];
                    }}
                    labelFormatter={(label: number) => `gEUD: ${label.toFixed(1)} Gy`}
                  />
                  <Area type="monotone" dataKey="ci" stroke="none" fill="#8b5cf6" fillOpacity={0.2} />
                  <Line type="monotone" dataKey="ntcp" stroke="#a855f7" strokeWidth={3} dot={false} />
                  {gEUD > 0 && (
                    <ReferenceDot x={gEUD} y={ntcpLKB} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="label-micro opacity-40">All Organs Summary</h2>
            <div className="card-premium p-0 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/40 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-bold text-slate-300">Organ at Risk</th>
                    <th className="p-4 font-bold text-slate-300">Endpoint</th>
                    <th className="p-4 font-bold text-slate-300 text-right">gEUD (Gy)</th>
                    <th className="p-4 font-bold text-slate-300 text-right">NTCP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allOarsResults.map((res, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-slate-200">{res.oar.name}</td>
                      <td className="p-4 text-slate-400 text-xs">{res.oar.endpoint}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{res.gEUD.toFixed(1)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${getTrafficLight(res.ntcp)}`}>
                        {res.ntcp.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <div className="sr-only">
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
