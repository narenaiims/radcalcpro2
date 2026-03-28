import React from 'react';
import { CLINICAL_COLORS } from '../lib/designSystem';

interface ResultCardProps {
  label: string;
  value: number;
  unit: string;
  interpretation: string;
  status: keyof typeof CLINICAL_COLORS;
}

export const ResultCard: React.FC<ResultCardProps> = ({ label, value, unit, interpretation, status }) => {
  const color = CLINICAL_COLORS[status];
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-4xl font-bold font-mono tracking-tight tabular-nums text-slate-900">
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-slate-500 font-medium">{unit}</span>
      </div>
      <div className={`border-t border-slate-100 pt-3 mt-1 flex items-center gap-2 ${color.text}`}>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color.bg}`}>
          {color.label}
        </span>
        <span className="text-xs font-medium">{interpretation}</span>
      </div>
    </div>
  );
};
