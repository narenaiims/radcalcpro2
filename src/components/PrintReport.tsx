import React, { useRef } from 'react';

interface PrintReportProps {
  title: string;
  parameters?: { label: string; value: string | number }[];
  results?: { label: string; value: string | number; unit?: string }[];
  clinicalInsight?: string;
  fields?: { label: string; value: string | number }[];
  footer?: string;
}

export const PrintReport = React.forwardRef<HTMLDivElement, PrintReportProps>(
  ({ title, parameters, results, clinicalInsight, fields, footer }, ref) => {
    return (
      <div ref={ref} className="hidden print:block p-8 bg-white text-black font-serif">
        <style>{`@media print { body * { visibility: hidden; } .print-content, .print-content * { visibility: visible; } .print-content { position: absolute; left: 0; top: 0; } }`}</style>
        <div className="print-content">
          <h1 className="text-2xl font-bold mb-4">Rad Calc Pro</h1>
          <h2 className="text-xl mb-2">{title}</h2>
          <p className="text-sm mb-6">{new Date().toLocaleString()}</p>
          
          {parameters && parameters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2 border-b">Parameters</h3>
              <table className="w-full border-collapse">
                <tbody>
                  {parameters.map((f, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-semibold">{f.label}</td>
                      <td className="py-2 text-right">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2 border-b">Results</h3>
              <table className="w-full border-collapse">
                <tbody>
                  {results.map((f, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-semibold">{f.label}</td>
                      <td className="py-2 text-right">{f.value} {f.unit || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {clinicalInsight && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2 border-b">Clinical Insight</h3>
              <p className="py-2">{clinicalInsight}</p>
            </div>
          )}

          {fields && fields.length > 0 && (
            <table className="w-full border-collapse mb-6">
              <tbody>
                {fields.map((f, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-semibold">{f.label}</td>
                    <td className="py-2 text-right">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {footer && <p className="text-xs italic">{footer}</p>}
        </div>
      </div>
    );
  }
);

export const usePrintRef = () => useRef<HTMLDivElement>(null);
