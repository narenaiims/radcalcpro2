import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Ghost, History } from 'lucide-react';
import { useRxContext, HistoryEntry } from '../context/RadiobiologyContext';

interface CalcHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export const CalcHistoryPanel: React.FC<CalcHistoryPanelProps> = ({ open, onClose }) => {
  const { history, clearHistory } = useRxContext();
  const [confirming, setConfirming] = React.useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 flex flex-col border-l border-slate-700"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <History size={18} className="text-blue-400" />
                <h2 className="font-bold tracking-tight">Calculation History</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 opacity-50">
                  <Ghost size={48} strokeWidth={1.5} />
                  <p className="text-sm font-medium">No calculations yet</p>
                </div>
              ) : (
                history.map((entry: HistoryEntry) => (
                  <div key={entry.id} className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-sm hover:bg-slate-800 transition-colors group">
                    <div className="flex justify-between items-start text-[10px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
                      <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{entry.tool}</span>
                      <span>{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="font-bold text-slate-100 mb-2 leading-tight">{entry.summary}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(entry.detail).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[9px] text-slate-400 border border-white/5">
                          <span className="opacity-50">{k}:</span>
                          <span className="text-slate-200 font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 backdrop-blur-md">
              {confirming ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center mb-1">Confirm Clear All?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        clearHistory();
                        setConfirming(false);
                      }}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Yes, Clear
                    </button>
                    <button 
                      onClick={() => setConfirming(false)}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirming(true)} 
                  disabled={history.length === 0}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-400 text-xs font-bold rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 size={14} /> Clear History
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
