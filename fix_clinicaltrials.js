import fs from 'fs';
let content = fs.readFileSync('./pages/ClinicalTrials.tsx', 'utf8');

content = content.replace(
  /className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1\.5 text-xs font-mono text-cyan-400" \/>/g,
  'className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-400"\n                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />'
);

content = content.replace(
  /className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1\.5 text-xs font-mono text-emerald-400" \/>/g,
  'className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400"\n                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />'
);

content = content.replace(
  /className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1\.5 text-xs font-mono text-rose-400" \/>/g,
  'className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-rose-400"\n                        buttonClassName="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" />'
);

fs.writeFileSync('./pages/ClinicalTrials.tsx', content);
console.log('Done');
