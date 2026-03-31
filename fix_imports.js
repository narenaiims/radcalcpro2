import fs from 'fs';
import path from 'path';

const filesToFix = [
  './pages/DoseExposuresPage.tsx',
  './pages/IsoeffectChartPage.tsx',
  './pages/LDRBrachyPage.tsx',
  './pages/OARReferencePage.tsx',
  './pages/RepairKineticsPage.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the misplaced import
  const misplacedImport = "import { \nimport { NumberInput } from '../src/components/NumberInput';\n";
  if (content.includes(misplacedImport)) {
    content = content.replace(misplacedImport, "import { \n");
    content = "import { NumberInput } from '../src/components/NumberInput';\n" + content;
  }
  
  const misplacedImport2 = "import {\nimport { NumberInput } from '../src/components/NumberInput';\n";
  if (content.includes(misplacedImport2)) {
    content = content.replace(misplacedImport2, "import {\n");
    content = "import { NumberInput } from '../src/components/NumberInput';\n" + content;
  }

  const misplacedImport3 = "import { \nimport { NumberInput } from '../src/components/NumberInput';\n\n";
  if (content.includes(misplacedImport3)) {
    content = content.replace(misplacedImport3, "import { \n");
    content = "import { NumberInput } from '../src/components/NumberInput';\n" + content;
  }

  fs.writeFileSync(file, content);
}
console.log('Done');
