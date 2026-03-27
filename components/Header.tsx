import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ShareButton from './ShareButton';
import { CalcHistoryPanel } from '../src/components/CalcHistoryPanel';
import { useRxContext } from '../src/context/RadiobiologyContext';

import { RotateCcw, Home, History } from 'lucide-react';

// ── Route manifest (single source of truth for nav) ──────────────────────
export const ROUTES = [
  // ── Calculators
  { path: '/eqd2',           label: 'BED / EQD2',          group: 'Calculators',  short: 'BED/EQD2' },
  { path: '/bed-eqd2',       label: 'BED ↔ EQD2 Convert',  group: 'Calculators',  short: 'BED↔EQD2' },
  { path: '/frac-adjust',    label: 'Fractionation Adjust', group: 'Calculators',  short: 'Frac Adj' },
  { path: '/hdr-brachy',     label: 'HDR Brachytherapy',    group: 'Calculators',  short: 'HDR' },
  { path: '/ebrt-gap',       label: 'EBRT Gap (LQ)',        group: 'Calculators',  short: 'Gap LQ' },
  { path: '/tdf',            label: 'TDF Factor',           group: 'Calculators',  short: 'TDF' },
  { path: '/reirradiation',  label: 'Re-irradiation Calc',  group: 'Calculators',  short: 'Re-RT' },
  { path: '/ntcp',           label: 'NTCP Calculator',      group: 'Calculators',  short: 'NTCP' },
  { path: '/tcp',            label: 'TCP Calculator',       group: 'Calculators',  short: 'TCP' },
  { path: '/ldr-brachy',     label: 'LDR Brachytherapy',    group: 'Calculators',  short: 'LDR' },
  { path: '/cervix-dosimeter', label: 'Cervix Dosimeter',    group: 'Calculators',  short: 'Cervix EQD2' },
  { path: '/isoeffect-chart',label: 'Isoeffect Chart',      group: 'Calculators',  short: 'Isoeffect' },
  { path: '/repair-kinetics',label: 'Repair Kinetics',      group: 'Calculators',  short: 'Repair' },
  { path: '/oerletrbe',      label: 'OER / LET / RBE',      group: 'Calculators',  short: 'OER/RBE' },
  // ── References
  { path: '/oar-limits',     label: 'OAR Dose Limits',      group: 'Reference',    short: 'OAR' },
  { path: '/pediatric-constraints', label: 'Pediatric Constraints', group: 'Reference', short: 'Pediatric' },
  { path: '/pediatric-scaling',     label: 'Pediatric Dose Scaling', group: 'Reference', short: 'Scaling' },
  { path: '/clinical-trials',      label: 'Clinical Trials Ref',  group: 'Reference', short: 'Trials' },
  { path: '/toxicity-grading',     label: 'RT Toxicity Grading',  group: 'Reference', short: 'Toxicity' },
  { path: '/dose-rate-comparison', label: 'Brachy Dose Rates',    group: 'Reference', short: 'Brachy' },
  { path: '/cervix-brachytherapy', label: 'Cervix Brachytherapy', group: 'Reference', short: 'Cervix' },
  { path: '/brachytherapy-reference', label: 'Prostate, uterine & Surface brachytherapy', group: 'Reference', short: 'Brachy Ref' },
  { path: '/adaptive-rt',    label: 'Adaptive RT Decision Tool', group: 'Reference', short: 'Adaptive RT' },
  { path: '/contouring-atlas', label: 'Contouring Atlas', group: 'Reference', short: 'Atlas' },
  { path: '/sbrt',           label: 'SBRT Constraints',     group: 'Reference',    short: 'SBRT' },
  { path: '/guidelines',     label: 'Oncologic Emergencies',group: 'Reference',    short: 'Emergencies' },
  { path: '/dose-exposures', label: 'Dose Exposure Ref',    group: 'Reference',    short: 'Exposure' },
  { path: '/radiation-units',label: 'Radiation Units',      group: 'Reference',    short: 'Units' },
  // ── Education
  { path: '/radioactive-sources', label: 'Radioactive Sources', group: 'Education', short: 'Sources' },
  { path: '/radioiodine-i131', label: 'Radioiodine I-131', group: 'Education', short: 'I-131' },
  { path: '/icru',           label: 'ICRU Standards',      group: 'Education', short: 'ICRU' },
  { path: '/named-effects',  label: 'Named Effects',       group: 'Education', short: 'Effects' },
  { path: '/ionizing-radiation', label: 'Ionizing Radiation Effects', group: 'Education', short: 'Radiation' },
  { path: '/radiation-mechanism', label: 'Radiation Mechanisms', group: 'Education', short: 'Mechanisms' },
  { path: '/proton-therapy',     label: 'Proton Therapy Ref',  group: 'Education', short: 'Protons' },
  { path: '/cell-survival',      label: 'Cell Survival Curves', group: 'Education', short: 'Survival' },
  { path: '/viva-definitions',label: 'Viva Definitions',    group: 'Education',    short: 'Viva' },
  { path: '/radiation-history',label: 'History of Oncology',group: 'Education',   short: 'History' },
  { path: '/about',          label: 'About',                group: 'Education',    short: 'About' },
] as const;

type RouteGroup = 'Calculators' | 'Reference' | 'Education';
const GROUP_ORDER: RouteGroup[] = ['Calculators', 'Reference', 'Education'];

const GROUP_COLORS: Record<RouteGroup, string> = {
  Calculators: 'text-blue-700',
  Reference:   'text-teal-700',
  Education:   'text-slate-500',
};

const ACCENT_COLORS: Record<RouteGroup, { text: string; glow: string }> = {
  Calculators: { text: 'text-blue-400', glow: 'via-blue-400/30' },
  Reference:   { text: 'text-teal-400', glow: 'via-teal-400/30' },
  Education:   { text: 'text-slate-400', glow: 'via-slate-400/30' },
};

// ── Magnetic Wrapper Component ──────────────────────────────────────────
const Magnetic: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.35, y: y * 0.35 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

// ── Atom: close icon (Static for drawer) ──────────────────────────────────
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Atom: Menu/X Morph Icon ──────────────────────────────────────────────
const MorphMenuIcon: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <motion.path
        animate={open ? { d: "M 18 6 L 6 18" } : { d: "M 4 6 L 20 6" }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        strokeLinecap="round"
      />
      <motion.path
        animate={open ? { d: "M 6 6 L 18 18" } : { d: "M 4 12 L 20 12" }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        strokeLinecap="round"
      />
      <motion.path
        animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0, d: "M 4 18 L 20 18" }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ── Atom: radiation symbol (Enhanced & Continuous) ──────────────────────
const RadIcon = () => (
  <motion.svg 
    className="w-5 h-5" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8"
    animate={{ rotate: 360 }}
    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
  >
    <motion.circle 
      cx="12" cy="12" r="2" 
      fill="currentColor" stroke="none"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
    />
    <motion.path 
      d="M12 10 L8.5 4" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
    <motion.path 
      d="M12 10 L15.5 4" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
    />
    <motion.path 
      d="M10.3 13 L4 15.5" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
    />
    <motion.path 
      d="M13.7 13 L20 15.5" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
    />
    <motion.path 
      d="M10.3 11 L4 8.5" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
    />
    <motion.path 
      d="M13.7 11 L20 8.5" 
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut", delay: 0.5 }}
    />
    <motion.circle 
      cx="12" cy="12" r="9.5" 
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, ease: "circOut" }}
    />
  </motion.svg>
);

// ── Back-button label helper ──────────────────────────────────────────────
function usePageInfo(pathname: string): { label: string; group: string } | null {
  const route = ROUTES.find(r => r.path === pathname);
  return route ? { label: route.label, group: route.group } : null;
}

// ── Main Header ───────────────────────────────────────────────────────────
const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery]   = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const { history } = useRxContext();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isHome = location.pathname === '/';
  const pageInfo = usePageInfo(location.pathname);

  // Close drawer on route change
  useEffect(() => { setOpen(false); setQuery(''); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Trap body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Filtered routes for search
  const filteredRoutes = query.trim().length > 0
    ? ROUTES.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.group.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const currentAccent = pageInfo?.group ? ACCENT_COLORS[pageInfo.group as RouteGroup] : ACCENT_COLORS.Calculators;

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0a1020]/85 backdrop-blur-xl text-white shadow-lg border-b border-white/5 overflow-hidden">
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise pointer-events-none" />
        {/* Shimmer line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] animate-shimmer opacity-30" />
        {/* Top glow */}
        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${currentAccent.glow} to-transparent transition-all duration-500`} />

        <div className="flex items-center justify-between px-3 md:px-4 min-h-[3.5rem] py-2 relative z-10">

          {/* Left: logo or back button */}
          <div className="flex-1 min-w-0 mr-2">
            {isHome ? (
              <Link to="/" className="flex items-center gap-2.5 min-w-0 group hover-rotate">
                <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] shrink-0"><RadIcon /></span>
                <div className="leading-none truncate">
                  <span className="text-sm md:text-base font-bold tracking-tight font-display group-hover:text-blue-300 transition-colors">radcalcpro2</span>
                  <span className="block text-[9px] md:text-[10px] text-blue-200/50 uppercase tracking-widest font-black truncate">
                    RNT Medical College
                  </span>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-1.5 text-blue-200 hover:text-white transition-all min-w-0"
                aria-label="Go back"
              >
                <div className="p-1 rounded-lg group-hover:bg-white/10 transition-colors shrink-0">
                  <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={location.pathname}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex flex-col items-start leading-none min-w-0"
                  >
                    <span className={`text-[9px] font-black uppercase tracking-widest font-mono mb-0.5 ${currentAccent.text}/70 truncate max-w-full`}>
                      {pageInfo?.group || 'Navigation'}
                    </span>
                    <span className="text-xs md:text-sm font-bold truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px] group-hover:translate-x-0.5 transition-transform">
                      {pageInfo?.label || 'Back'}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </button>
            )}
          </div>

          {/* Right: home icon + menu button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Magnetic>
              <Link
                to="/"
                className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-blue-200 hover:text-white transition-all overflow-hidden
                  ${isHome ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
                title="Home"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${currentAccent.glow} blur-xl transition-opacity`} />
                <Home className="w-4 h-4 relative z-10 drop-shadow-sm shrink-0" />
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider relative z-10">Home</span>
              </Link>
            </Magnetic>

            <Magnetic>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="group relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all overflow-hidden"
                title="Master Reset"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${currentAccent.glow} blur-xl transition-opacity`} />
                <RotateCcw className="w-4 h-4 relative z-10 drop-shadow-sm shrink-0" />
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider relative z-10">Reset</span>
              </button>
            </Magnetic>

            <Magnetic>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                className={`
                  group relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all overflow-hidden
                  ${historyOpen ? 'bg-amber-600/30 text-amber-300' : 'text-blue-200 hover:text-white hover:bg-white/5'}
                `}
                title="Calculation History"
                aria-label="Open calculation history"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${currentAccent.glow} blur-xl transition-opacity`} />
                <div className="relative z-10 shrink-0">
                  <History className="w-4 h-4" />
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border border-[#0a1020]" />
                  )}
                </div>
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider relative z-10">History</span>
              </button>
            </Magnetic>

            <Magnetic>
              <div className="relative group flex items-center">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${currentAccent.glow} blur-xl transition-opacity rounded-xl`} />
                <ShareButton className="relative z-10 flex items-center gap-1.5 px-2 py-1.5">
                  <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider relative z-10 pointer-events-none text-blue-200 group-hover:text-white transition-colors">Share</span>
                </ShareButton>
              </div>
            </Magnetic>

            <Link
              to="/about"
              className="ml-1 w-7 h-7 md:w-8 md:h-8 rounded-full border border-blue-400/30 overflow-hidden hover:border-white transition-colors shrink-0"
              title="About Developer"
            >
              <img 
                src="https://unavatar.io/twitter/drn_dr" 
                alt="Dr. Narendra Rathore" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </Link>

            <Magnetic>
              <button
                onClick={() => setOpen(o => !o)}
                className={`
                  relative ml-1 px-3 py-1.5 md:py-2 rounded-xl transition-all flex items-center gap-2 min-w-[70px] md:min-w-[85px] justify-center group overflow-hidden shrink-0
                  ${open 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : 'bg-white/10 text-blue-200 hover:text-white hover:bg-white/20'}
                `}
                aria-label="Open navigation"
                aria-expanded={open}
              >
                {!open && <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${currentAccent.glow} blur-xl transition-opacity`} />}
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest relative z-10">{open ? 'Close' : 'Menu'}</span>
                <div className={`relative z-10 ${open ? 'animate-pulse-subtle' : ''}`}>
                  <MorphMenuIcon open={open} />
                </div>
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 right-0 z-[70] h-full w-72 bg-white shadow-2xl
          flex flex-col
          transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1020] text-white flex-shrink-0">
          <span className="text-sm font-bold tracking-tight">All Tools</span>
          <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white transition" aria-label="Close">
            <XIcon />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-slate-100 flex-shrink-0">
          <input
            type="search"
            placeholder="Search tools…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto overscroll-contain py-1">
          {filteredRoutes ? (
            /* Search results — flat list */
            filteredRoutes.length > 0 ? (
              <ul>
                {filteredRoutes.map(r => (
                  <li key={r.path}>
                    <Link
                      to={r.path}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition
                        ${location.pathname === r.path ? 'bg-blue-50 text-blue-800 font-semibold' : ''}`}
                    >
                      <span>{r.label}</span>
                      <span className={`text-[10px] font-bold uppercase ${GROUP_COLORS[r.group as RouteGroup]}`}>
                        {r.group}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No tools found</p>
            )
          ) : (
            /* Grouped nav */
            GROUP_ORDER.map(group => (
              <div key={group} className="mb-1">
                <p className={`px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest ${GROUP_COLORS[group]}`}>
                  {group}
                </p>
                <ul>
                  {ROUTES.filter(r => r.group === group).map(r => (
                    <li key={r.path}>
                      <Link
                        to={r.path}
                        className={`flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition
                          ${location.pathname === r.path
                            ? 'bg-blue-50 text-blue-800 font-semibold border-l-2 border-blue-700'
                            : 'border-l-2 border-transparent'}`}
                      >
                        {r.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>

        {/* Drawer footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-600">Dr. Narendra Rathore</span><br />
            HoD Radiation Oncology · RNT MC Udaipur
          </p>
        </div>
      </div>

      {/* ── Calculation History Panel ─────────────────────────────────── */}
      <CalcHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default Header;