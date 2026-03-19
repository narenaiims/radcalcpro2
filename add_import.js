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
  
  if (content.includes('<KeyFactsSidebar') && !content.includes('import KeyFactsSidebar')) {
    console.log('Adding import to', file);
    content = content.replace(/import \{ motion, AnimatePresence \} from ['"]framer-motion['"];/, `import { motion, AnimatePresence } from 'framer-motion';\nimport KeyFactsSidebar, { KeyFactSection } from '@/components/KeyFactsSidebar';`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}
