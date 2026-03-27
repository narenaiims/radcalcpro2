import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../components/Header';
import { Download, X, Share2 } from 'lucide-react';
import { getDeferredPrompt, installPWA } from '@/src/services/pwaService';

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
  const grouped = (['Calculators', 'Reference', 'Education'] as const).map(group => ({
    group,
    routes: ROUTES.filter(r => r.group === group),
  }));

  return (
    <div className="space-y-4 fade-in pb-2">

      {/* ── Masthead ──────────────────────────────────────────────────── */}
      <div className="bg-[#1e3a5f] rounded-lg px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/70 mb-0.5 font-display">
              RNT Medical College · Udaipur
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight leading-tight font-display">
              radcalcpro2
            </h1>
            <p className="text-[11px] text-blue-200/80 mt-0.5 font-medium">
              Dr. Narendra Rathore · Clinical Radiobiology Toolkit
            </p>
          </div>
          {/* Version badge */}
          <span className="flex-shrink-0 text-[9px] font-bold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded uppercase tracking-wider mt-1">
            v2.0
          </span>
        </div>

        {/* Stat strip */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-blue-800/60 pt-3">
          {[
            { val: '14', label: 'Calculators' },
            { val: '15', label: 'References' },
            { val: '11', label: 'Education' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-base font-black num text-white">{s.val}</p>
              <p className="text-[9px] text-blue-200/60 uppercase tracking-wider">{s.label}</p>
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
      {grouped.map(({ group, routes }) => {
        const meta = GROUP_META[group];
        return (
          <section key={group}>
            {/* Group header */}
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${meta.color}`}>
                {group}
              </p>
              <span className="text-[10px] text-slate-400 font-normal">— {meta.desc}</span>
            </div>

            {/* Route list */}
            <div className="bg-white rounded-lg border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
              {routes.map(r => (
                <Link
                  key={r.path}
                  to={r.path}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  {/* Active dot */}
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot} opacity-60`} />

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{r.label}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {ROUTE_HINTS[r.path] || ''}
                    </p>
                  </div>

                  <ChevronRight />
                </Link>
              ))}
            </div>
          </section>
        );
      })}

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