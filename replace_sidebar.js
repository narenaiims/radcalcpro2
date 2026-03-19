import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('fixed right-0 top-0')) continue;
  if (content.includes('<KeyFactsSidebar')) continue;

  console.log('Processing', file);

  const animatePresenceRegex = /<AnimatePresence>[\s\S]*?<\/AnimatePresence>/;
  const buttonRegex = /\{!isSidebarOpen && \([\s\S]*?<\/motion\.button>\s*\)\}/;
  const buttonRegex2 = /\{!showQuickRef && \([\s\S]*?<\/motion\.button>\s*\)\}/;
  const buttonRegex3 = /\{!showQR && \([\s\S]*?<\/motion\.button>\s*\)\}/;
  
  const isSidebarOpenMatch = content.match(/const \[(isSidebarOpen|showQuickRef|showQR), (setIsSidebarOpen|setShowQuickRef|setShowQR)\] = useState\(false\);/);
  if (!isSidebarOpenMatch) {
    console.log('No state variable found for', file);
    continue;
  }
  
  const stateVar = isSidebarOpenMatch[1];
  const setStateVar = isSidebarOpenMatch[2];

  let newContent = content.replace(animatePresenceRegex, `<KeyFactsSidebar \n        isOpen={${stateVar}} \n        onClose={() => ${setStateVar}(false)} \n        onOpen={() => ${setStateVar}(true)} \n        data={SIDEBAR_DATA} \n      />`);
  newContent = newContent.replace(buttonRegex, '');
  newContent = newContent.replace(buttonRegex2, '');
  newContent = newContent.replace(buttonRegex3, '');

  
  if (!newContent.includes('KeyFactsSidebar')) {
    newContent = newContent.replace(/import \{ motion, AnimatePresence \} from ['"]framer-motion['"];/, `import { motion, AnimatePresence } from 'framer-motion';\nimport KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';`);
  }
  
  const quickRefMatch = content.match(/const QUICK_REF_DATA = (\[[\s\S]*?\]|{[\s\S]*?});/);
  
  let sidebarDataCode = `
  const SIDEBAR_DATA: KeyFactSection[] = []; // TODO: Map QUICK_REF_DATA to SIDEBAR_DATA
  `;
  
  if (quickRefMatch) {
    const quickRefStr = quickRefMatch[1];
    if (quickRefStr.startsWith('[')) {
      sidebarDataCode = `
  const SIDEBAR_DATA: KeyFactSection[] = QUICK_REF_DATA.map(sec => ({
    title: sec.category || (sec as any).title || 'Reference',
    emoji: "📌",
    accent: "text-indigo-400",
    bg: "bg-indigo-950/30",
    border: "border-indigo-500/30",
    rows: (sec.items || (sec as any).rows || []).map((item: any) => ({ k: item.label || item.k, v: item.value || item.v }))
  }));
`;
    } else {
      sidebarDataCode = `
  const SIDEBAR_DATA: KeyFactSection[] = Object.entries(QUICK_REF_DATA).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    emoji: "📌",
    accent: "text-indigo-400",
    bg: "bg-indigo-950/30",
    border: "border-indigo-500/30",
    rows: (items as any[]).map((item: any) => ({ k: item.label, v: item.value }))
  }));
`;
    }
  }
  
  newContent = newContent.replace(isSidebarOpenMatch[0], `${isSidebarOpenMatch[0]}\n${sidebarDataCode}`);
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
}
