const fs = require('fs');
const path = require('path');

function capFontWeight(content) {
  // Replace font-weight: 600, 700, 800, 900 with 500
  // Handle both CSS and JS style properties
  
  // CSS: font-weight: 700;
  content = content.replace(/(font-weight\s*:\s*)(\d+)/g, (match, p1, p2) => {
    return parseInt(p2) > 500 ? `${p1}500` : match;
  });

  // JS style: fontWeight: '700'
  content = content.replace(/(fontWeight\s*:\s*)(['"]?)(\d+)\2/g, (match, p1, p2, p3) => {
    return parseInt(p3) > 500 ? `${p1}${p2}500${p2}` : match;
  });

  // JS style: fontWeight: 700
  content = content.replace(/(fontWeight\s*:\s*)(\d+)(?![0-9"'])/g, (match, p1, p2) => {
    return parseInt(p2) > 500 ? `${p1}500` : match;
  });

  return content;
}

function processFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processFiles(fullPath);
    } else if (file.endsWith('.css') || file.endsWith('.jsx') || file.endsWith('.js')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const updated = capFontWeight(original);
      if (original !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

const srcPath = path.join(__dirname, 'src');
processFiles(srcPath);
console.log("Font Weight Capping Complete.");
