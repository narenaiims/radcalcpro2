import fs from 'fs';

let content = fs.readFileSync('./pages/cellsurvivalcurve.tsx', 'utf8');

content = content.replace(
  /buttonClassName="bg-white\/10 hover:bg-white\/20 text-white border-white\/20"\n                        buttonClassName="bg-white\/10 hover:bg-white\/20 text-white border-white\/20"/g,
  'buttonClassName="bg-white/10 hover:bg-white/20 text-white border-white/20"'
);

content = content.replace(
  /buttonClassName="bg-white\/10 hover:bg-white\/20 text-white border-white\/20"\n                      buttonClassName="bg-white\/10 hover:bg-white\/20 text-white border-white\/20"/g,
  'buttonClassName="bg-white/10 hover:bg-white/20 text-white border-white/20"'
);

fs.writeFileSync('./pages/cellsurvivalcurve.tsx', content);
console.log('Done');
