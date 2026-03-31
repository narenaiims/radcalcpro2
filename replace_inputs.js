import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'pages');
const componentsDir = path.join(__dirname, 'src', 'components');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('type="number"')) return;

  let newContent = content.replace(/<input([^>]*?)type="number"([^>]*?)>/g, '<NumberInput$1$2>');
  newContent = newContent.replace(/<input([^>]*?)type=\{'number'\}([^>]*?)>/g, '<NumberInput$1$2>');
  newContent = newContent.replace(/<input([^>]*?)type=\{"number"\}([^>]*?)>/g, '<NumberInput$1$2>');
  
  if (newContent !== content) {
    // Find the last import
    const importRegex = /^import.*?;?\s*$/gm;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(newContent)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    // Determine relative path to NumberInput
    let relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'components', 'NumberInput')).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    const importStatement = `\nimport { NumberInput } from '${relativePath}';\n`;
    
    newContent = newContent.slice(0, lastImportIndex) + importStatement + newContent.slice(lastImportIndex);
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.tsx')) {
      processFile(filePath);
    }
  }
};

walkSync(pagesDir);
walkSync(componentsDir);
