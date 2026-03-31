import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, GraduationCap, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';

export interface KeyFactRow {
  k: string;
  v: string;
  mono?: boolean;
}

export interface KeyFactSection {
  title: string;
  emoji: string;
  accent: string;
  bg: string;
  border: string;
  rows: KeyFactRow[];
}

interface KeyFactsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  data: KeyFactSection[];
  title?: string;
  children?: React.ReactNode; // For custom content (e.g. warnings, examples)
}

const KeyFactsSidebar: React.FC<KeyFactsSidebarProps> = ({ isOpen, onClose, onOpen, data, title = "Quick Reference", children }) => {
  const [expandedSec, setExpandedSec] = useState<number | null>(0);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 210 }}
              className="fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto shadow-2xl"
              style={{ background: 'linear-gradient(180deg,#0d1929 0%,#0a1020 100%)', borderLeft: '1px solid #1e3a5f' }}
            >
              {/* Sidebar header */}
              <div className="sticky top-0 px-4 py-4 border-b border-slate-800/80 flex items-center justify-between"
                style={{ background: '#0d1929' }}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                  <span className="text-lg font-black uppercase tracking-tight text-slate-100 font-display">
                    {title}
                  </span>
                </div>
                <button onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition">
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {data.map((sec, si) => (
                  <div key={si}
                    style={{ borderLeftColor: sec.accent, borderLeftWidth: 3, borderLeftStyle: 'solid', background: sec.bg, borderRadius: 12, border: `1px solid ${sec.border}`, borderLeft: `3px solid ${sec.accent}` }}
                    className="px-4 py-3"
                  >
                    <button
                      className="w-full flex items-center justify-between"
                      onClick={() => setExpandedSec(expandedSec === si ? null : si)}
                    >
                      <p className="text-[14px] font-black uppercase tracking-widest font-display" style={{ color: sec.accent }}>
                        {sec.emoji} {sec.title}
                      </p>
                      {expandedSec === si
                        ? <ChevronUp className="w-4 h-4 text-slate-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSec === si && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2.5">
                            {sec.rows.map((row, ri) => (
                              <div key={ri} className="flex items-start justify-between gap-3 py-1 border-b border-white/5 last:border-0">
                                <span className="text-[13px] text-slate-200 flex-1 leading-tight">{row.k}</span>
                                <span className={`text-[13px] font-bold text-right flex-shrink-0 ${row.mono ? 'font-mono' : ''}`}
                                  style={{ color: sec.accent }}>
                                  {row.v}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Always show first row as preview when collapsed */}
                    {expandedSec !== si && sec.rows.length > 0 && (
                      <p className="text-[12px] text-slate-400 mt-1.5 truncate">
                        {sec.rows[0].k}: <span className="font-mono" style={{ color: sec.accent }}>{sec.rows[0].v}</span>
                      </p>
                    )}
                  </div>
                ))}

                {/* Custom children content */}
                {children}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar open button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => { onOpen(); setExpandedSec(0); }}
          className="fixed right-6 bottom-6 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', border: '2px solid rgba(255,255,255,0.2)' }}
          title={title}
        >
          <BookOpen className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </>
  );
};

export default KeyFactsSidebar;
