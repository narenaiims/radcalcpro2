import React from 'react';

interface ContentBlockProps {
  body: string;
  color: string;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ body, color }) => {
  if (!body) return null;
  
  const sections = body.split('\n\n');

  return (
    <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-light">
      {sections.map((section, idx) => {
        const lines = section.split('\n');
        
        if (lines.length > 1 && (lines[0].startsWith('•') || lines[0].startsWith('1.'))) {
             return (
               <ul key={idx} className="space-y-2 pl-4">
                 {lines.map((line, i) => (
                   <li key={i} className="flex gap-3">
                     <span style={{ color }} className="font-bold min-w-[1.5em]">{line.match(/^([•\d.]+)/)?.[1]}</span>
                     <span>{line.replace(/^[•\d.]+\s*/, '')}</span>
                   </li>
                 ))}
               </ul>
             );
        }

        if (lines[0].trim().endsWith(':') && !lines[0].includes('http')) {
             return (
               <div key={idx}>
                 <h4 style={{ color }} className="font-bold text-xs uppercase tracking-wider mb-2 border-b border-white/10 pb-1 inline-block">
                   {lines[0]}
                 </h4>
                 {lines.slice(1).map((l, i) => <p key={i} className="mb-1">{l}</p>)}
               </div>
             );
        }

        return <p key={idx}>{section}</p>;
      })}
    </div>
  );
};

export default ContentBlock;
