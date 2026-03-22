const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const stlDir = path.join(__dirname, '..');
const outputDir = path.join(__dirname, '../g-code-spliced');
const splicerDir = 'D:/hax2026hoo/3FIL/splicer';
const convertScript = path.join(splicerDir, 'convert.js');
const defFile = path.join(splicerDir, 'fdmprinter.def.json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all STL files
const stlFiles = fs.readdirSync(stlDir)
  .filter(f => f.toLowerCase().endsWith('.stl'))
  .map(f => path.join(stlDir, f));

console.log(`Found ${stlFiles.length} STL files to convert\n`);

let success = 0;
let failed = 0;

for (const stlFile of stlFiles) {
  const baseName = path.basename(stlFile, '.stl');
  const outputFile = path.join(outputDir, `${baseName}.gcode`);
  
  // Skip if output already exists
  if (fs.existsSync(outputFile)) {
    console.log(`[SKIP] ${baseName}.gcode already exists`);
    continue;
  }
  
  try {
    console.log(`[CONVERT] ${path.basename(stlFile)}...`);
    execSync(`node "${convertScript}" "${stlFile}" "${outputFile}" "${defFile}"`, {
      cwd: splicerDir,
      stdio: 'inherit',
      timeout: 120000
    });
    success++;
    console.log(`[OK] ${baseName}.gcode\n`);
  } catch (err) {
    failed++;
    console.error(`[FAIL] ${baseName}: ${err.message}\n`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Converted: ${success}`);
console.log(`Failed: ${failed}`);
