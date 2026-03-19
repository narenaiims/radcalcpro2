import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';
import { Search, BookOpen, ChevronRight, GraduationCap, Zap, Activity } from 'lucide-react';
import { NAMED_EFFECTS } from '@/src/data/namedEffectsData';
import { NamedEffectIcon }   from '@/src/components/NamedEffectIcon';
import { DynamicEffectIcon } from '@/src/components/DynamicEffectIcon';

const QUICK_REF_DATA = [
  {
    category: "Physics & Dosimetry",
    items: [
      { label: "LET", value: "keV/μm" },
      { label: "RBE (Proton)", value: "1.1" },
      { label: "α/β Early", value: "10 Gy" },
      { label: "α/β Late", value: "3 Gy" },
      { label: "Compton", value: "Dominant MV" },
      { label: "Photoelectric", value: "Dominant kV" },
    ]
  },
  {
    category: "Radiobiology",
    items: [
      { label: "4 R's", value: "Repair, Redistribution, Reox, Repop" },
      { label: "5th R", value: "Radiosensitivity" },
      { label: "Cell Cycle", value: "G2/M most sensitive" },
      { label: "DNA Repair", value: "NHEJ (fast) / HR (slow)" },
      { label: "OER", value: "2.5 - 3.0" },
      { label: "FLASH", value: "Ultra-high dose rate" },
    ]
  },
  {
    category: "Clinical Concepts",
    items: [
      { label: "Therapeutic Ratio", value: "TCP / NTCP" },
      { label: "NSD", value: "1800 rets" },
      { label: "Hormesis", value: "Low-dose stimulation" },
      { label: "Bystander Effect", value: "Non-targeted" },
    ]
  }
];

const NamedEffectsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || (sec as any).title || 'Reference',
    emoji: "📌",
    accent: "#00d4ff",
    bg: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.3)",
    rows: (sec.items || (sec as any).rows || []).map((item: any) => ({ k: item.label || item.k, v: item.value || item.v }))
  }));


  const categories = [
    { id: 'all', label: 'All' },
    { id: 'classic', label: 'Classic' },
    { id: 'cell', label: 'Cell' },
    { id: 'dna', label: 'DNA' },
    { id: 'physical', label: 'Physical' },
    { id: 'modern', label: 'Modern' },
    { id: 'eponymous', label: 'Eponymous' },
    { id: 'molecular', label: 'Molecular' },
  ];

  const filteredEffects = useMemo(() => {
    return NAMED_EFFECTS.filter(effect => {
      const matchesSearch = effect.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            effect.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || effect.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);
  
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-zinc-100 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0a0f1e] to-[#0f172a] border-b border-white/10 py-8 px-6 text-center relative overflow-hidden">
        <h1 className="text-2xl font-bold font-display text-zinc-100 tracking-tight">
          Radiobiology <span className="text-blue-400">Named Effects</span>
        </h1>
        <div className="flex gap-2 justify-center mt-4 flex-wrap relative z-10">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{NAMED_EFFECTS.length} Effects</span>
          <span className="font-mono text-[10px] px-2 py-1 rounded-full border border-[#ff6b35] text-[#ff6b35] bg-[#ff6b35]/10">SVG Illustrated</span>
          <span className="font-mono text-[10px] px-2 py-1 rounded-full border border-[#10b981] text-[#10b981] bg-[#10b981]/10">Exam Ready</span>
          <span className="font-mono text-[10px] px-2 py-1 rounded-full border border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/10">Clinical Uses</span>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-[#1e2d4a] p-4 flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            className="w-full bg-[#111827] border border-[#1e2d4a] rounded-lg py-2 pl-10 pr-4 text-sm font-mono outline-none focus:border-[#00d4ff] transition"
            type="text"
            placeholder="Search effects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`font-mono text-xs px-3 py-2 rounded-md border transition ${
              activeCategory === cat.id 
                ? 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/10' 
                : 'border-[#1e2d4a] text-[#64748b] hover:border-[#00d4ff] hover:text-[#00d4ff]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence>
            {filteredEffects.map(effect => (
              <motion.div
                key={effect.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0f172a] rounded-xl border border-[#1e2d4a] overflow-hidden hover:border-[#00d4ff] transition-colors group flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#00d4ff] transition-colors leading-tight">{effect.title}</h3>
                      <p className="text-xs text-[#64748b] mt-1">{effect.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded-full bg-[#1e2d4a] text-[#94a3b8] whitespace-nowrap">{effect.category}</span>
                  </div>
                  
                  <div className="mb-4 flex justify-center py-6 bg-[#0a0e1a] rounded-lg border border-[#1e2d4a] relative overflow-hidden group-hover:border-[#00d4ff]/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {effect.svgData ? (
                      <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: effect.svgData }} />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-[#00d4ff]/50">
                        <Activity size={32} />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-[#cbd5e1] mb-5 leading-relaxed flex-1">{effect.definition}</p>
                  
                  <div className="space-y-4 mt-auto pt-4 border-t border-[#1e2d4a]">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#00d4ff]"/> Mechanism</h4>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">{effect.mechanism}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#ff6b35]"/> Clinical Relevance</h4>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">{effect.clinicalRelevance}</p>
                    </div>
                    {effect.examPoints && effect.examPoints.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#10b981]"/> Exam Points</h4>
                        <ul className="text-xs text-[#94a3b8] leading-relaxed list-disc list-inside space-y-1">
                          {effect.examPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filteredEffects.length === 0 && (
          <p className="text-center text-[#64748b] font-mono mt-10">
            No effects found matching your criteria.
          </p>
        )}
      </div>


      {/* Quick Reference Sidebar */}
      <KeyFactsSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpen={() => setIsSidebarOpen(true)} 
        data={SIDEBAR_DATA} 
      />

      
    </div>
  );
};

export default NamedEffectsPage;

