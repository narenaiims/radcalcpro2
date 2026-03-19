/**
 * TumourSelector.tsx — 2-Step Cancer Selector Wizard
 * Step 1: Site (anatomic group)
 * Step 2: Specific pathology/subtype
 *
 * On selection, passes back the full RadiobiologyData entry.
 * Used by EQD2Page, EBRTGapPage, FracAdjustPage, and other calculators.
 */
import React, { useState, useMemo } from 'react';
import {
  MASTER_RADIOBIOLOGY_TABLE,
  RadiobiologyData,
  uniqueSites,
  getSubsites,
} from '../src/data/radiobiologyData';

// ── Site icons (emoji fallback — no external deps) ────────────────────────
const SITE_ICONS: Record<string, string> = {
  'Head & Neck':       '🔴',
  'Thoracic':          '🫁',
  'Gastrointestinal':  '🟤',
  'Genitourinary':     '🔵',
  'Gynaecological':    '🩷',
  'Breast':            '🟣',
  'CNS':               '🧠',
  'Skin':              '🟡',
  'Sarcoma':           '🟠',
  'Lymphoma':          '🔶',
  'Bone':              '⬜',
  'Endocrine':         '🟢',
  'Paediatric':        '🟦',
};

// ── Site accent colours for cards ─────────────────────────────────────────
const SITE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'Head & Neck':       { bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-800',    badge: 'bg-red-100 text-red-700' },
  'Thoracic':          { bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-800',    badge: 'bg-sky-100 text-sky-700' },
  'Gastrointestinal':  { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-700' },
  'Genitourinary':     { bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
  'Gynaecological':    { bg: 'bg-pink-50',    border: 'border-pink-200',   text: 'text-pink-800',   badge: 'bg-pink-100 text-pink-700' },
  'Breast':            { bg: 'bg-purple-50',  border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  'CNS':               { bg: 'bg-indigo-50',  border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  'Skin':              { bg: 'bg-yellow-50',  border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
  'Sarcoma':           { bg: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  'Lymphoma':          { bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-800',   badge: 'bg-teal-100 text-teal-700' },
  'Bone':              { bg: 'bg-slate-50',   border: 'border-slate-200',  text: 'text-slate-800',  badge: 'bg-slate-100 text-slate-700' },
  'Endocrine':         { bg: 'bg-green-50',   border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700' },
  'Paediatric':        { bg: 'bg-cyan-50',    border: 'border-cyan-200',   text: 'text-cyan-800',   badge: 'bg-cyan-100 text-cyan-700' },
};

const defaultColor = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', badge: 'bg-slate-100 text-slate-700' };

// ── α/β badge display ─────────────────────────────────────────────────────
function ABBadge({ entry }: { entry: RadiobiologyData }) {
  const uncertain = entry.uncertaintyFlag;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded 
      ${uncertain ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
      α/β {entry.ab} Gy{entry.uncertaintyFlag && ' ⚠'}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────
interface TumourSelectorProps {
  selectedEntry: RadiobiologyData | null;
  onSelect: (entry: RadiobiologyData) => void;
  onClear?: () => void;
  compact?: boolean; // compact mode for inline use
}

// ── Component ─────────────────────────────────────────────────────────────
const TumourSelector: React.FC<TumourSelectorProps> = ({
  selectedEntry,
  onSelect,
  onClear,
  compact = false,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>(selectedEntry?.site ?? '');

  // Filtered subsites based on search
  const filteredSubsites = useMemo(() => {
    if (!selectedSite) return [];
    const entries = getSubsites(selectedSite);
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.subsite.toLowerCase().includes(q) ||
      (e.histology?.toLowerCase().includes(q) ?? false)
    );
  }, [selectedSite, searchQuery]);

  // If entry already selected, show compact summary
  if (selectedEntry && !compact) {
    const colors = SITE_COLORS[selectedEntry.site] ?? defaultColor;
    return (
      <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} px-3 py-3`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{SITE_ICONS[selectedEntry.site] ?? '●'}</span>
              <span className={`text-xs font-black uppercase tracking-widest ${colors.text}`}>
                {selectedEntry.site}
              </span>
              {selectedEntry.uncertaintyFlag && (
                <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                  ⚠ Limited data
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEntry.subsite}</p>
            {selectedEntry.histology && (
              <p className="text-[11px] text-slate-500 italic">{selectedEntry.histology}</p>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedSite('');
              setStep(1);
              if (onClear) onClear();
            }}
            className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded border border-slate-300 text-slate-500 hover:bg-white hover:text-slate-700 transition"
          >
            Change
          </button>
        </div>

        {/* Key parameters grid */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">α/β Ratio</p>
            <p className="text-base font-black text-blue-800 num">{selectedEntry.ab}</p>
            <p className="text-[9px] text-slate-400">Gy [{selectedEntry.abLow}–{selectedEntry.abHigh}]</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Tk Kick-off</p>
            <p className="text-base font-black text-slate-800 num">
              {selectedEntry.tk === 0 ? 'N/A' : selectedEntry.tk}
            </p>
            <p className="text-[9px] text-slate-400">{selectedEntry.tk === 0 ? 'no repop.' : 'days'}</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">K (repop.)</p>
            <p className="text-base font-black text-slate-800 num">
              {selectedEntry.k === 0 ? '0' : selectedEntry.k.toFixed(2)}
            </p>
            <p className="text-[9px] text-slate-400">Gy/day</p>
          </div>
        </div>

        {/* Citations */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 leading-snug">
            <span className="font-bold text-slate-600">α/β source: </span>{selectedEntry.abSource}
          </p>
          {selectedEntry.repopNote && (
            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
              <span className="font-bold text-slate-600">Repopulation: </span>{selectedEntry.repopNote}
            </p>
          )}
          {selectedEntry.clinicalContext && (
            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
              <span className="font-bold text-slate-600">Clinical: </span>{selectedEntry.clinicalContext}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── STEP 1: Site selection ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Step 1 of 2</p>
              <p className="text-sm font-bold">Select Tumour Site</p>
            </div>
            <div className="text-[10px] bg-blue-900/60 rounded px-2 py-1 text-blue-200 font-mono">
              {MASTER_RADIOBIOLOGY_TABLE.length} tumours indexed
            </div>
          </div>
        </div>

        {/* Site grid */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {uniqueSites.map(site => {
              const colors = SITE_COLORS[site] ?? defaultColor;
              const count = getSubsites(site).length;
              const isHovered = hoveredSite === site;
              return (
                <button
                  key={site}
                  onClick={() => {
                    setSelectedSite(site);
                    setSearchQuery('');
                    setStep(2);
                  }}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                  className={`text-left rounded-lg border-2 px-3 py-2.5 transition-all duration-150
                    ${isHovered ? `${colors.bg} ${colors.border} shadow-sm` : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{SITE_ICONS[site] ?? '●'}</span>
                      <span className={`text-xs font-bold leading-tight ${isHovered ? colors.text : 'text-slate-700'}`}>
                        {site}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded 
                      ${isHovered ? colors.badge : 'bg-slate-200 text-slate-500'}`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-3 pb-3">
          <p className="text-[10px] text-slate-400 text-center">
            Tap a site to browse specific histologies with evidence-based α/β values
          </p>
        </div>
      </div>
    );
  }

  // ── STEP 2: Subsite / histology selection ─────────────────────────────
  const colors = SITE_COLORS[selectedSite] ?? defaultColor;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className={`px-3 py-2.5 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStep(1); setSearchQuery(''); }}
              className={`text-[10px] font-bold px-2 py-1 rounded border ${colors.border} ${colors.text} hover:bg-white transition`}
            >
              ← Back
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 2 of 2</p>
              <p className={`text-sm font-bold ${colors.text}`}>
                {SITE_ICONS[selectedSite]} {selectedSite}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${colors.badge}`}>
            {filteredSubsites.length} {filteredSubsites.length === 1 ? 'type' : 'types'}
          </span>
        </div>
        {/* Search */}
        <div className="mt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search histology or subtype…"
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
        </div>
      </div>

      {/* Subsite list */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {filteredSubsites.length === 0 && (
          <p className="px-3 py-4 text-xs text-slate-400 text-center italic">No matching subtypes</p>
        )}
        {filteredSubsites.map(entry => (
          <button
            key={entry.subsite}
            onClick={() => {
              onSelect(entry);
            }}
            className={`w-full text-left px-3 py-2.5 hover:${colors.bg} transition group`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                    {entry.subsite}
                  </p>
                  {entry.uncertaintyFlag && (
                    <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold">⚠ est.</span>
                  )}
                </div>
                {entry.histology && (
                  <p className="text-[10px] text-slate-500 italic leading-tight">{entry.histology}</p>
                )}
                {entry.clinicalContext && (
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{entry.clinicalContext}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right space-y-0.5">
                <ABBadge entry={entry} />
                <div className="flex justify-end gap-1">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">
                    K={entry.k.toFixed(2)}
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">
                    Tk={entry.tk}d
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          α/β shown as best estimate [range]. ⚠ = limited or extrapolated data.
        </p>
      </div>
    </div>
  );
};

export default TumourSelector;
