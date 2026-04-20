const fs = require('fs');
const path = require('path');

const dirs = [
  'D:/hax2026hoo/3FIL/customModel/data-prep/g-code-non-gun',
  'D:/hax2026hoo/3FIL/customModel/data-prep/g-code-spliced'
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.gcode'));
  console.log(`Processing ${files.length} files in ${dirPath}`);

  let processed = 0;
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const filtered = lines.filter(line => !line.trim().startsWith(';'));
    fs.writeFileSync(filePath, filtered.join('\n'));
    processed++;
  }
  console.log(`Processed ${processed} files`);
}

for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  } else {
    console.log(`Directory not found: ${dir}`);
  }
}

console.log('Done!');
