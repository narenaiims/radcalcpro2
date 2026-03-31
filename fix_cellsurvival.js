import fs from 'fs';
let content = fs.readFileSync('./pages/cellsurvivalcurve.tsx', 'utf8');

// Replace the dark theme ones
content = content.replace(
  /className="w-full px-2 py-1\.5 rounded-lg text-sm font-mono focus:outline-none transition"/g,
  'className="w-full px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none transition"\n                        buttonClassName="bg-white/10 hover:bg-white/20 text-white border-white/20"'
);

content = content.replace(
  /className="w-full px-2 py-1\.5 rounded-lg text-sm font-mono focus:outline-none"/g,
  'className="w-full px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none"\n                      buttonClassName="bg-white/10 hover:bg-white/20 text-white border-white/20"'
);

content = content.replace(
  /className="w-full bg-\[#060c18\] border border-cyan-900\/50 rounded px-2 py-1 text-xs font-mono" \/>/g,
  'className="w-full bg-[#060c18] border border-cyan-900/50 rounded px-2 py-1 text-xs font-mono"\n                      buttonClassName="bg-white/10 hover:bg-white/20 text-white border-white/20" />'
);

fs.writeFileSync('./pages/cellsurvivalcurve.tsx', content);
console.log('Done');
