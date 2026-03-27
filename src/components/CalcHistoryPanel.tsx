import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Ghost } from 'lucide-react';
import { useRxContext, HistoryEntry } from '../context/RadiobiologyContext';

interface CalcHistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export const CalcHistoryPanel: React.FC<CalcHistoryPanelProps> = ({ open, onClose }) => {
  const { history, clearHistory } = useRxContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 flex flex-col border-l border-slate-700"
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-700">
            <h2 className="font-semibold">History</h2>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <Ghost size={48} />
                <p>No calculations yet</p>
              </div>
            ) : (
              history.slice(-10).reverse().map((entry: HistoryEntry) => (
                <div key={entry.id} className="bg-slate-800 p-3 rounded-lg text-sm">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{entry.tool}</span>
                    <span>{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(entry.detail).map(([k, v]) => (
                      <span key={k} className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{k}: {v as React.ReactNode}</span>
                    ))}
                  </div>
                  <div className="font-bold text-blue-400">{entry.summary}</div>
                </div>
              ))
            )}
          </div>
          <button onClick={clearHistory} className="p-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700">
            <Trash2 size={16} /> Clear History
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
