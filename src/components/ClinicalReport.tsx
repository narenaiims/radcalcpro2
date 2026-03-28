import React from 'react';

interface ClinicalReportProps {
  title: string;
  inputs: { label: string; value: string | number; unit?: string }[];
  outputs: { label: string; value: string | number; unit?: string }[];
  interpretation: string;
  citations: string[];
}

export const ClinicalReport: React.FC<ClinicalReportProps> = ({ 
  title, inputs, outputs, interpretation, citations 
}) => {
  return (
    <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-sm font-bold text-slate-900 mb-1">{title}</div>
          <div className="text-[10px] text-slate-500">UTC: {new Date().toISOString()}</div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">DRAFT — Verify before clinical use</div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Inputs</h3>
          {inputs.map((i, idx) => (
            <div key={idx} className="flex justify-between text-xs mb-2">
              <span className="text-slate-600">{i.label}</span>
              <span className="font-mono">{i.value} {i.unit}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Outputs</h3>
          {outputs.map((o, idx) => (
            <div key={idx} className="flex justify-between text-xs mb-2">
              <span className="text-slate-600">{o.label}</span>
              <span className="font-mono font-bold">{o.value} {o.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Interpretation</h3>
        <p className="text-xs text-slate-700">{interpretation}</p>
      </div>

      <div className="text-[10px] text-slate-400">
        <h3 className="font-bold uppercase mb-1">References</h3>
        {citations.map((c, idx) => <p key={idx}>{c}</p>)}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 italic">
        DISCLAIMER: This software is for reference only and does not replace clinical judgement.
      </div>
    </div>
  );
};
