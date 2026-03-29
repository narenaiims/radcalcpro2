import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Layout, 
  Radio, 
  BookOpen, 
  GraduationCap,
  Activity,
  Zap,
  Clock,
  Layers,
  Shield,
  Target,
  FileText,
  Info,
  History as HistoryIcon,
  Search,
  Settings,
  User,
  Share2,
  Home,
  Sun,
  Moon,
  EyeOff,
  RotateCcw,
  ArrowLeft,
  X,
  Menu,
  ChevronRight,
  Stethoscope,
  Crosshair,
  Dna,
  FlaskConical,
  Microscope,
  Baby,
  Scale,
  ClipboardList,
  AlertTriangle,
  ZapOff,
  Database,
  Globe,
  Award,
  Atom,
  Beaker
} from 'lucide-react';
import { useRxContext } from '../src/context/RadiobiologyContext';
import { CalcHistoryPanel } from '../src/components/CalcHistoryPanel';
import ShareButton from './ShareButton';

// ── SECTION 1 — ROUTE MANIFEST ──────────────────────────────────────────
export const ROUTES = [
  // ── Calculators ──────────────────────────────────────────────────────────
  { path:'/eqd2',              label:'BED / EQD2',          group:'Calculators',   icon: Calculator,    keywords:['bed', 'eqd2', 'lq model', 'fractionation'] },
  { path:'/bed-eqd2',          label:'BED ↔ EQD2 Convert',  group:'Calculators',   icon: Zap,           keywords:['convert', 'bed', 'eqd2'] },
  { path:'/frac-adjust',       label:'Fractionation Adjust',group:'Calculators',   icon: Clock,         keywords:['adjust', 'fractionation', 'dose'] },
  { path:'/hdr-brachy',        label:'HDR Brachytherapy',   group:'Calculators',   icon: Radio,         keywords:['hdr', 'brachy', 'dose'] },
  { path:'/ebrt-gap',          label:'EBRT Gap (LQ)',       group:'Calculators',   icon: Layers,        keywords:['gap', 'ebrt', 'lq'] },
  { path:'/tdf',               label:'TDF Factor',          group:'Calculators',   icon: Activity,      keywords:['tdf', 'time', 'dose', 'fractionation'] },
  { path:'/reirradiation',     label:'Re-irradiation Calc', group:'Calculators',   icon: RotateCcw,     keywords:['re-rt', 're-irradiation', 'cumulative'] },
  { path:'/ntcp',              label:'NTCP Calculator',     group:'Calculators',   icon: Shield,        keywords:['ntcp', 'normal', 'tissue', 'complication'] },
  { path:'/tcp',               label:'TCP Calculator',      group:'Calculators',   icon: Target,        keywords:['tcp', 'tumor', 'control', 'probability'] },
  { path:'/ldr-brachy',        label:'LDR Brachytherapy',   group:'Calculators',   icon: Radio,         keywords:['ldr', 'brachy', 'seeds'] },
  { path:'/cervix-dosimeter',  label:'Cervix Dosimeter',    group:'Calculators',   icon: Stethoscope,   keywords:['cervix', 'dosimeter', 'eqd2'] },
  { path:'/isoeffect-chart',   label:'Isoeffect Chart',     group:'Calculators',   icon: Layout,        keywords:['isoeffect', 'chart', 'nomogram'] },
  { path:'/repair-kinetics',   label:'Repair Kinetics',     group:'Calculators',   icon: Dna,           keywords:['repair', 'kinetics', 'half-life'] },
  { path:'/oerletrbe',         label:'OER / LET / RBE',     group:'Calculators',   icon: FlaskConical,  keywords:['oer', 'let', 'rbe', 'protons'] },

  // ── Planning ─────────────────────────────────────────────────────────────
  { path:'/adaptive-rt',       label:'Adaptive RT',         group:'Planning',      icon: Crosshair,     keywords:['adaptive', 'art', 'replanning'] },
  { path:'/contouring-atlas',  label:'Contouring Atlas',    group:'Planning',      icon: Microscope,    keywords:['atlas', 'contouring', 'anatomy'] },
  { path:'/sbrt',              label:'SBRT Constraints',    group:'Planning',      icon: Target,        keywords:['sbrt', 'constraints', 'hypofractionation'] },
  { path:'/oar-limits',        label:'OAR Dose Limits',     group:'Planning',      icon: Shield,        keywords:['oar', 'limits', 'constraints', 'quantec'] },
  { path:'/pediatric-constraints', label:'Pediatric Constraints', group:'Planning', icon: Baby,        keywords:['pediatric', 'children', 'constraints'] },
  { path:'/pediatric-scaling', label:'Pediatric Dose Scaling', group:'Planning',    icon: Scale,       keywords:['pediatric', 'scaling', 'dose'] },

  // ── Brachytherapy ────────────────────────────────────────────────────────
  { path:'/cervix-brachytherapy', label:'Cervix Brachy',    group:'Brachytherapy', icon: Radio,         keywords:['cervix', 'brachy', 'tandem', 'ring'] },
  { path:'/brachytherapy-reference', label:'Brachy Reference', group:'Brachytherapy', icon: BookOpen,   keywords:['prostate', 'uterine', 'surface', 'brachy'] },
  { path:'/dose-rate-comparison', label:'Dose Rate Comparison', group:'Brachytherapy', icon: Activity,  keywords:['ldr', 'mdr', 'hdr', 'pdr'] },

  // ── Reference ────────────────────────────────────────────────────────────
  { path:'/clinical-trials',   label:'Clinical Trials',     group:'Reference',     icon: ClipboardList, keywords:['trials', 'protocols', 'rtog'] },
  { path:'/toxicity-grading',  label:'Toxicity Grading',    group:'Reference',     icon: AlertTriangle, keywords:['toxicity', 'ctcae', 'grading'] },
  { path:'/guidelines',        label:'Oncologic Emergencies', group:'Reference',   icon: Info,          keywords:['emergencies', 'guidelines', 'svc', 'cord'] },
  { path:'/dose-exposures',    label:'Dose Exposure Ref',   group:'Reference',     icon: ZapOff,        keywords:['exposure', 'occupational', 'public'] },
  { path:'/radiation-units',   label:'Radiation Units',     group:'Reference',     icon: Database,      keywords:['units', 'gray', 'sievert', 'becquerel'] },
  { path:'/icru',              label:'ICRU Standards',      group:'Reference',     icon: Globe,         keywords:['icru', 'standards', 'reporting'] },

  // ── Education ────────────────────────────────────────────────────────────
  { path:'/radioactive-sources', label:'Radioactive Sources', group:'Education',     icon: Atom,          keywords:['sources', 'isotopes', 'half-life'] },
  { path:'/radioiodine-i131',  label:'Radioiodine I-131',   group:'Education',     icon: Beaker,        keywords:['i-131', 'thyroid', 'radioiodine'] },
  { path:'/named-effects',     label:'Named Effects',       icon: Award,           group:'Education',   keywords:['effects', 'bystander', 'abscopal'] },
  { path:'/ionizing-radiation', label:'Radiation Effects',   group:'Education',     icon: Activity,      keywords:['biological', 'effects', 'stochastic'] },
  { path:'/radiation-mechanism', label:'Radiation Mechanisms', group:'Education',    icon: Dna,           keywords:['mechanisms', 'direct', 'indirect'] },
  { path:'/cell-survival',     label:'Cell Survival Curves', group:'Education',     icon: Activity,      keywords:['survival', 'curves', 'lq'] },
  { path:'/proton-therapy',    label:'Proton Therapy Ref',  group:'Education',     icon: Zap,           keywords:['protons', 'bragg', 'peak'] },
  { path:'/viva-definitions',  label:'Viva Definitions',    group:'Education',     icon: FileText,      keywords:['viva', 'definitions', 'exam'] },
  { path:'/radiation-history', label:'History of Oncology', group:'Education',     icon: HistoryIcon,   keywords:['history', 'discovery', 'roentgen'] },
  { path:'/about',             label:'About',               group:'Education',     icon: User,          keywords:['developer', 'contact', 'about'] },
];

export const GROUPS = {
  Calculators:   { icon: Calculator, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' },
  Planning:      { icon: Layout,     color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
  Brachytherapy: { icon: Radio,      color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' },
  Reference:     { icon: BookOpen,   color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
  Education:     { icon: GraduationCap, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
};

type GroupName = keyof typeof GROUPS;

// ── UTILS ───────────────────────────────────────────────────────────────
const fuzzyMatch = (query: string, item: typeof ROUTES[0]) => {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return (
    item.label.toLowerCase().includes(q) ||
    item.group.toLowerCase().includes(q) ||
    item.keywords.some(k => k.toLowerCase().includes(q))
  );
};

// ── ATOMS ───────────────────────────────────────────────────────────────
const RadIcon = () => (
  <motion.svg 
    className="w-6 h-6" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    animate={{ rotate: 360 }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
  >
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 10 L8 4" strokeLinecap="round" />
    <path d="M12 10 L16 4" strokeLinecap="round" />
    <path d="M10 13 L4 16" strokeLinecap="round" />
    <path d="M14 13 L20 16" strokeLinecap="round" />
    <path d="M10 11 L4 8" strokeLinecap="round" />
    <path d="M14 11 L20 8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="10" />
  </motion.svg>
);

const MorphMenuIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <motion.path
      animate={open ? { d: "M 18 6 L 6 18" } : { d: "M 4 7 L 20 7" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      strokeLinecap="round"
    />
    <motion.path
      animate={open ? { d: "M 6 6 L 18 18" } : { d: "M 4 12 L 20 12" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      strokeLinecap="round"
    />
    <motion.path
      animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0, d: "M 4 17 L 20 17" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      strokeLinecap="round"
    />
  </svg>
);

// ── MAIN COMPONENT ──────────────────────────────────────────────────────
const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rx, setTheme } = useRxContext();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<GroupName>('Calculators');

  const isHome = location.pathname === '/';
  const currentRoute = ROUTES.find(r => r.path === location.pathname);
  const currentGroup = currentRoute?.group as GroupName || 'Calculators';
  const groupConfig = GROUPS[currentGroup];

  // Sync active group on route change
  useEffect(() => {
    if (currentRoute) setActiveGroup(currentRoute.group as GroupName);
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname, currentRoute]);

  // Cmd+K Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (drawerOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [drawerOpen, searchOpen]);

  const searchResults = useMemo(() => {
    return ROUTES.filter(r => fuzzyMatch(searchQuery, r));
  }, [searchQuery]);

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'dim')[] = ['light', 'dark', 'dim'];
    const nextIndex = (themes.indexOf(rx.theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <>
      {/* ── HEADER BAR ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-[52px] bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 text-white overflow-hidden">
        {/* Animated Accent Line */}
        <motion.div 
          className="absolute top-0 left-0 h-[2px] z-10"
          initial={false}
          animate={{ 
            backgroundColor: GROUPS[currentGroup].color,
            boxShadow: `0 0 10px ${GROUPS[currentGroup].glow}`,
            width: '100%'
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Left Section */}
        <div className="flex items-center gap-3 min-w-0">
          {isHome ? (
            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-blue-400 group-hover:scale-110 transition-transform">
                <RadIcon />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-tight">RadCalcPro</span>
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-medium">RNT Medical College</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: groupConfig.color }}>
                  {currentGroup}
                </span>
                <span className="text-sm font-bold truncate max-w-[150px] sm:max-w-[300px]">
                  {currentRoute?.label || 'Tool'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ShareButton className="p-2 hover:bg-white/10 rounded-full transition-colors" />
          <Link 
            to="/about" 
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-blue-500 transition-colors"
          >
            <img 
              src="https://unavatar.io/twitter/drn_dr" 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </Link>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400/60"
            title="Reset App"
          >
            <RotateCcw className="w-5 h-5 opacity-60" />
          </button>
          <button 
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:flex"
            title="Search (Cmd+K)"
          >
            <Search className="w-5 h-5 opacity-60" />
          </button>
          
          <button 
            onClick={() => setHistoryOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="History"
          >
            <HistoryIcon className="w-5 h-5 opacity-60" />
          </button>

          <button 
            onClick={cycleTheme}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Toggle Theme"
          >
            {rx.theme === 'light' && <Sun className="w-5 h-5 opacity-60" />}
            {rx.theme === 'dark' && <Moon className="w-5 h-5 opacity-60" />}
            {rx.theme === 'dim' && <EyeOff className="w-5 h-5 opacity-60" />}
          </button>

          <button 
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-[100]"
            aria-label="Menu"
          >
            <MorphMenuIcon open={drawerOpen} />
          </button>
        </div>
      </header>

      {/* ── SEARCH OVERLAY ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-[#0a0a0a]/95 backdrop-blur-xl p-4 sm:p-8 flex flex-col"
          >
            <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search clinical tools, references..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-lg text-white outline-none focus:border-blue-500/50 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {searchQuery.trim() === '' ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Suggested Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(GROUPS) as GroupName[]).map(g => (
                          <button 
                            key={g}
                            onClick={() => setSearchQuery(g)}
                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Popular Tools</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ROUTES.slice(0, 6).map(r => (
                          <Link 
                            key={r.path}
                            to={r.path}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <r.icon className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-medium">{r.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.length > 0 ? (
                      searchResults.map(r => (
                        <Link 
                          key={r.path}
                          to={r.path}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                              <r.icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-base font-bold">{r.label}</span>
                              <span className="text-xs text-white/40">{r.group}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </Link>
                      ))
                    ) : (
                      <div className="text-center py-20">
                        <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40">No tools found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SIDE DRAWER ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[80] h-full w-[300px] max-w-[90vw] bg-[#0f0f0f] border-l border-white/10 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/5">
                <h2 className="text-lg font-bold mb-4 text-white">Navigation</h2>
                
                <div className="flex flex-col gap-1">
                  <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                    <Home className="w-5 h-5 opacity-60" />
                    <span className="text-sm font-medium">Home</span>
                  </Link>
                  <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors">
                    <HistoryIcon className="w-5 h-5 opacity-60" />
                    <span className="text-sm font-medium">History</span>
                  </button>
                </div>
              </div>

              {/* Group Switcher */}
              <div className="px-4 py-4 border-b border-white/5">
                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                  {(Object.keys(GROUPS) as GroupName[]).map(g => {
                    const Icon = GROUPS[g].icon;
                    const isActive = activeGroup === g;
                    return (
                      <button 
                        key={g}
                        onClick={() => setActiveGroup(g)}
                        className={`
                          flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                          ${isActive 
                            ? 'bg-white text-black' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}
                        `}
                      >
                        <Icon className="w-3 h-3" />
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Route List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeGroup}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 space-y-1"
                  >
                    {ROUTES.filter(r => r.group === activeGroup).map(r => (
                      <Link 
                        key={r.path}
                        to={r.path}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl transition-all group
                          ${location.pathname === r.path 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'hover:bg-white/5 text-white/60 hover:text-white'}
                        `}
                      >
                        <r.icon className={`w-4 h-4 ${location.pathname === r.path ? 'text-blue-400' : 'opacity-40 group-hover:opacity-100'}`} />
                        <span className="text-sm font-medium">{r.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 bg-white/5 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Dr. Narendra Rathore</span>
                    <span className="text-[10px] text-white/40">HoD Radiation Oncology</span>
                    <span className="text-[10px] text-white/40">RNT MC Udaipur</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HISTORY PANEL ─────────────────────────────────────────────────── */}
      <CalcHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default Header;
