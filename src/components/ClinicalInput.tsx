import React from 'react';

interface ClinicalInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit: string;
  type?: 'dose' | 'fraction';
  min?: number;
  max?: number;
  title?: string;
}

export const ClinicalInput: React.FC<ClinicalInputProps> = ({ 
  label, value, onChange, unit, type = 'dose', min, max, title 
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={type === 'dose' ? 0.1 : 1}
          min={min}
          max={max}
          title={title}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={(e) => e.target.select()}
          className="w-full text-2xl font-bold font-mono tabular-nums text-slate-900 bg-transparent border-none focus:ring-0 p-0"
        />
        <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>
    </div>
  );
};
