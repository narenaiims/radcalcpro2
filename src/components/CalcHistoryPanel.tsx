import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Ghost, History, Download, Filter, AlertCircle } from 'lucide-react';
import { getHistory, deleteHistoryEntry, clearAllHistory, CalcHistoryEntry } from '../lib/db';

interface CalcHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  calculatorId?: string;
}

export const useCalcHistory = (calculatorId?: string) => {
  const [entries, setEntries] = useState<CalcHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await getHistory(calculatorId);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [calculatorId]);

  return { entries, loading, refresh };
};

export const CalcHistoryPanel: React.FC<CalcHistoryPanelProps> = ({ open, onClose, calculatorId: initialCalculatorId }) => {
  const [filterId, setFilterId] = useState<string>(initialCalculatorId || 'all');
  const { entries, loading, refresh } = useCalcHistory(filterId === 'all' ? undefined : filterId);
  const [confirming, setConfirming] = useState(false);

  // Get unique calculators for filter
  const [availableCalculators, setAvailableCalculators] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const all = await getHistory();
      const unique = Array.from(new Set(all.map(h => h.calculatorId))).map(id => {
        const entry = all.find(h => h.calculatorId === id);
        return { id, name: entry?.calculatorName || id };
      });
      setAvailableCalculators(unique);
    };
    if (open) fetchAll();
  }, [open, entries]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this calculation from history?')) {
      await deleteHistoryEntry(id);
      refresh();
    }
  };

  const handleClearAll = async () => {
    await clearAllHistory();
    setConfirming(false);
    refresh();
  };

  const exportToCSV = () => {
    if (entries.length === 0) return;
    
    const headers = ['Timestamp', 'Calculator', 'Inputs', 'Outputs', 'Flags'];
    const rows = entries.map(e => [
      new Date(e.timestamp).toISOString(),
      e.calculatorName,
      JSON.stringify(e.inputs).replace(/"/g, '""'),
      JSON.stringify(e.outputs).replace(/"/g, '""'),
      e.flags.join(';')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `radcalcpro_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
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
            className="fixed right-0 top-0 h-full w-80 md:w-96 bg-slate-900 text-white shadow-2xl z-50 flex flex-col border-l border-slate-700"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <History size={18} className="text-blue-400" />
                <h2 className="font-bold tracking-tight">Calculation History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportToCSV}
                  disabled={entries.length === 0}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                  title="Export to CSV"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none flex-1 cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Calculators</option>
                {availableCalculators.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 opacity-50">
                  <Ghost size={48} strokeWidth={1.5} />
                  <p className="text-sm font-medium">No calculations found</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-sm hover:bg-slate-800 transition-colors group relative">
                    <div className="flex justify-between items-start text-[10px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{entry.calculatorName}</span>
                        {entry.flags.includes('fail') && (
                          <span className="flex items-center gap-0.5 text-red-400 font-bold">
                            <AlertCircle size={10} /> FAIL
                          </span>
                        )}
                      </div>
                      <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Inputs</p>
                        <div className="space-y-1">
                          {Object.entries(entry.inputs).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px]">
                              <span className="text-slate-500">{k}:</span>
                              <span className="text-slate-300 font-medium">{typeof v === 'number' ? v.toFixed(1) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase mb-1">Results</p>
                        <div className="space-y-1">
                          {Object.entries(entry.outputs).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px]">
                              <span className="text-slate-500">{k}:</span>
                              <span className="text-blue-400 font-bold">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => entry.id && handleDelete(entry.id)}
                      className="absolute top-2 right-2 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 backdrop-blur-md">
              {confirming ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center mb-1">Confirm Clear All History?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleClearAll}
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
                  disabled={entries.length === 0}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-400 text-xs font-bold rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 size={14} /> Clear All History
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
