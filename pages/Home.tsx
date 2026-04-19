import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, GROUPS } from '../components/Header';
import { Download, X, Share2 } from 'lucide-react';
import { getDeferredPrompt, installPWA, incrementVisitCount } from '@/src/services/pwaService';

// ── Types ─────────────────────────────────────────────────────────────────
interface RecentItem {
  path: string;
  label: string;
  summary: string;
}

// ── Recent-session detector ───────────────────────────────────────────────
function getRecentSessions(): RecentItem[] {
  const checks: { key: string; path: string; label: string; summarise: (d: any) => string }[] = [
    {
      key: 'radonco_eqd2_state_v2', path: '/eqd2', label: 'BED / EQD2',
      summarise: d => {
        const td = (parseFloat(d.dosePerFx) || 0) * (parseFloat(d.fractions) || 0);
        const ab = parseFloat(d.alphaBeta) || 10;
        const dpf = parseFloat(d.dosePerFx) || 0;
        const bed = td * (1 + dpf / ab);
        const eqd2 = ab > 0 ? bed / (1 + 2 / ab) : 0;
        return `${td.toFixed(1)} Gy → EQD2 ${eqd2.toFixed(1)} Gy (α/β=${ab})`;
      }
    },
    {
      key: 'radonco_brachy_state_v3', path: '/hdr-brachy', label: 'HDR Brachytherapy',
      summarise: d => `${d.activeLabel || 'Cervix'} · Target ${d.activeTarget || '85'} Gy EQD2`
    },
    {
      key: 'radonco_gap_state_v2', path: '/ebrt-gap', label: 'EBRT Gap (LQ)',
      summarise: d => `${d.daysOfGap || '?'} day gap · ${d.tumourSite || ''}`
    },
    {
      key: 'radonco_frac_adjust_state_v2', path: '/frac-adjust', label: 'Fractionation Adjust',
      summarise: d => `${d.newFractions || '?'} fx plan`
    },
    {
      key: 'radonco_bed_eqd2_state_v2', path: '/bed-eqd2', label: 'BED ↔ EQD2 Convert',
      summarise: d => {
        const val = parseFloat(d.input) || 0;
        const ab = parseFloat(d.ab) || 10;
        const isBtoE = d.mode === 'BED_TO_EQD2';
        const res = isBtoE ? val / (1 + 2 / ab) : val * (1 + 2 / ab);
        return isBtoE 
          ? `BED ${val.toFixed(1)} → EQD2 ${res.toFixed(1)} (α/β=${ab})`
          : `EQD2 ${val.toFixed(1)} → BED ${res.toFixed(1)} (α/β=${ab})`;
      }
    },
    {
      key: 'radonco_units_state_v2', path: '/radiation-units', label: 'Radiation Units',
      summarise: d => `${d.convValue || '0'} ${d.fromUnit || ''} → ${d.toUnit || ''}`
    }
  ];
  const results: RecentItem[] = [];
  checks.forEach(c => {
    try {
      const raw = localStorage.getItem(c.key);
      if (raw) {
        const d = JSON.parse(raw);
        results.push({ path: c.path, label: c.label, summary: c.summarise(d) });
      }
    } catch { /* ignore */ }
  });
  return results;
}

// ── Group metadata ────────────────────────────────────────────────────────
const GROUP_META: Record<string, { color: string; dot: string; desc: string }> = {
  Calculators: {
    color: 'text-blue-700',
    dot: 'bg-blue-600',
    desc: 'LQ-model radiobiology calculators',
  },
  Planning: {
    color: 'text-rose-700',
    dot: 'bg-rose-600',
    desc: 'Planning constraints and atlas',
  },
  Brachytherapy: {
    color: 'text-amber-700',
    dot: 'bg-amber-600',
    desc: 'Brachytherapy dosimetry and reference',
  },
  Reference: {
    color: 'text-teal-700',
    dot: 'bg-teal-600',
    desc: 'QUANTEC / GEC-ESTRO / RTOG constraints',
  },
  Education: {
    color: 'text-slate-600',
    dot: 'bg-slate-500',
    desc: 'Viva prep, history, units',
  },
};

// ── Route descriptions (supplementary to label) ───────────────────────────
const ROUTE_HINTS: Record<string, string> = {
  '/eqd2':             'BED = D·(1+d/α/β)  EQD2 = BED/(1+2/α/β)',
  '/bed-eqd2':         'Direct BED ↔ EQD2 interconversion',
  '/frac-adjust':      'Iso-effective schedule conversion',
  '/hdr-brachy':       'GEC-ESTRO cervix · vaginal vault · prostate boost',
  '/ebrt-gap':         'LQ repopulation model  Tk=28d, Tp=3d',
  '/tdf':              'Time-Dose-Fractionation (Orton & Ellis)',
  '/reirradiation':    'Cumulative BED with time-recovery (Dale model)',
  '/ntcp':             'Normal Tissue Complication Probability (LKB model)',
  '/tcp':              'Tumour Control Probability (Poisson model)',
  '/ldr-brachy':       'LDR Brachytherapy BED with repair kinetics',
  '/isoeffect-chart':  'Interactive fractionation isoeffect visualiser',
  '/repair-kinetics':  'Sublethal damage repair kinetics visualiser',
  '/oerletrbe':        'Oxygen Enhancement Ratio · Linear Energy Transfer · RBE',
  '/oar-limits':       'QUANTEC 2010 · SBRT constraints · DVH metrics',
  '/pediatric-constraints': 'Age-stratified OAR limits · PENTEC · COG',
  '/pediatric-scaling':     'BSA · Weight · Age-based pediatric dose scaling',
  '/cervix-dosimeter':      'Combined EBRT + Brachytherapy EQD2 tracker',
  '/clinical-trials':      'Landmark RT trials · RTOG · EORTC · NCI',
  '/toxicity-grading':     'RTOG v2.0 · CTCAE v5.0 · Management ladder',
  '/dose-rate-comparison': 'LDR · HDR · PDR · Radiobiology · BED Calc',
  '/cervix-brachytherapy': 'Applicator selection · Dosimetry · GEC-ESTRO · Insertion workflow',
  '/adaptive-rt':          'Online vs Offline ART · Modalities · Clinical Indications',
  '/contouring-atlas':     'H&N · Pelvis · Thorax · Nodal Stations · Error Atlas',
  '/sbrt':             'RTOG 0236/0813 · PACE-B · SMART · Sahgal · OAR constraints',
  '/guidelines':       'SVC syndrome · MSCC · pericardial effusion · SVCO',
  '/dose-exposures':   'Imaging dose reference · LNT/BEIR VII risk models',
  '/radiation-units':  'Gy · Sv · Bq · Ci · R — SI & legacy conversions',
  '/viva-definitions': 'α/β · Dmax · TD5/5 · OER · RBE · LQ model',
  '/radioactive-sources': 'Co-60 · Ir-192 · I-125 · Lu-177 · Ra-223 · EBRT vs Brachy sources',
  '/radioiodine-i131': 'Thyroid cancer · Graves disease · Hyperthyroidism · Dose calculations',
  '/icru':             'ICRU 50/62/83/91 · GTV/CTV/PTV · D50%/D2%/D98% · Reporting standards',
  '/ionizing-radiation': 'Deterministic & Stochastic effects · 5 Rs of Radiobiology · Modifiers',
  '/radiation-mechanism': 'Photoelectric · Compton · Pair Production · DNA Damage',
  '/cell-survival':       'LQ Model · 5 Rs · Fractionation · Alpha/Beta',
  '/proton-therapy':      'Bragg Peak · RBE 1.1 · SOBP · Range Uncertainty',
  '/radiation-history':'Röntgen 1895 → IMRT → MRgRT → AI-adaptive',
  '/about':            'Developer info · ecosystem · feedback',
};

// ── Inline SVG arrows ─────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);

// ── Home ──────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const [recent, setRecent] = React.useState<RecentItem[]>([]);
  const [canInstall, setCanInstall] = React.useState(!!getDeferredPrompt());
  const [showInstallCard, setShowInstallCard] = React.useState(true);

  React.useEffect(() => {
    incrementVisitCount();
    setRecent(getRecentSessions());
    
    const handler = () => setCanInstall(!!getDeferredPrompt());
    window.addEventListener('pwa-prompt-available', handler);
    window.addEventListener('pwa-prompt-cleared', handler);
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener('pwa-prompt-available', handler);
      window.removeEventListener('pwa-prompt-cleared', handler);
    };
  }, []);

  // Group routes preserving ROUTES order
  const grouped = Object.keys(GROUPS).map(group => ({
    group,
    routes: ROUTES.filter(r => r.group === group),
  }));

  const stats = Object.keys(GROUPS).map(group => ({
    val: ROUTES.filter(r => r.group === group).length.toString(),
    label: group,
  }));

  return (
    <div className="space-y-4 fade-in pb-2">

      {/* ── Masthead (Command Center) ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-white/10 shadow-2xl group">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-indigo-950" />
        <div className="absolute inset-0 opacity-20 mesh-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.1)_0%,transparent_50%)]" />
        
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-[spin_3s_linear_infinite]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-0.5 font-mono">
                  RadCalcPro System OS v2.4
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white font-display">
                    RadCalcPro<span className="text-blue-500">2</span>
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-white/90">Dr. Narendra Rathore</p>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Senior Oncologist · RNT Medical College, Udaipur
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400" />
              Standard A.I. Enhanced
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-500 text-[10px] font-black text-white hover:bg-blue-400 transition-colors uppercase tracking-widest cursor-default">
              Enterprise
            </span>
          </div>
        </div>

        {/* Console Data Strip */}
        <div className="relative px-6 py-4 bg-white/[0.02] border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {stats.map(s => (
            <div key={s.label} className="space-y-0.5">
              <p className="text-xl font-black text-white num leading-none">{s.val}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-bold font-mono">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PWA Install Card ─────────────────────────────────────────── */}
      {canInstall && showInstallCard && (
        <div className="bg-white rounded-lg border border-blue-200 p-3 flex items-center gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">Install RadOnc Pro</p>
            <p className="text-[10px] text-slate-500">Access tools offline from your home screen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={installPWA}
              className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallCard(false)}
              className="p-1 text-slate-300 hover:text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Recent sessions ───────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1">
            Resume Session
          </p>
          <div className="bg-white rounded-lg border border-zinc-100 divide-y divide-zinc-50">
            {recent.map(r => (
              <Link
                key={r.path}
                to={r.path}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{r.label}</p>
                  <p className="text-[11px] text-slate-500 num truncate">{r.summary}</p>
                </div>
                <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                  Resume →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tool groups ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {grouped.map(({ group, routes }) => {
          const meta = GROUP_META[group];
          return (
            <section key={group} className="space-y-3">
              {/* Group header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-4 rounded-full ${meta.dot}`} />
                  <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${meta.color}`}>
                    {group}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {routes.length} Tools
                </span>
              </div>

              {/* Route list */}
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                {routes.map(r => (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="flex items-center gap-4 px-4 py-3.5 group hover:bg-slate-50 transition-all duration-300"
                  >
                    <div className={`w-2 h-2 rounded-full ${meta.dot} opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                          {r.label}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-1">
                        {ROUTE_HINTS[r.path] || ''}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Clinical notice ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 leading-relaxed">
        <span className="font-bold">⚕ Clinical Use:</span>{' '}
        All results must be independently verified against current institutional protocols
        by a qualified Radiation Oncologist and Medical Physicist.
        α/β values and OAR constraints vary by institution and clinical context.
      </div>
    </div>
  );
};

export default Home;