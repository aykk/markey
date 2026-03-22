const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "gitOne");
const MANIFEST_PATH = path.join(__dirname, "stl-manifest.json");
const OUTPUT_DIR = path.join(__dirname, "g-code-spliced");
const SPLICER_DIR = "D:/hax2026hoo/3FIL/splicer";
const CONVERT_SCRIPT = path.join(SPLICER_DIR, "convert.js");
const DEF_FILE = path.join(SPLICER_DIR, "fdmprinter.def.json");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

console.log(`Loaded ${manifest.length} entries from manifest\n`);

let success = 0;
let failed = 0;
let skipped = 0;

for (let i = 0; i < manifest.length; i++) {
  const entry = manifest[i];
  const idx = i + 1;
  const stlPath = path.join(ROOT, entry.file.replace(/\//g, path.sep));
  const gcodeFileName = `${idx}.gcode`;
  const outputFile = path.join(OUTPUT_DIR, gcodeFileName);

  if (!fs.existsSync(stlPath)) {
    console.log(`[MISS] ${entry.file} not found, skipping`);
    failed++;
    continue;
  }

  if (fs.existsSync(outputFile)) {
    console.log(`[SKIP] ${gcodeFileName} already exists`);
    entry.gcode = gcodeFileName;
    skipped++;
    continue;
  }

  try {
    console.log(`[${idx}/${manifest.length}] ${entry.file}...`);
    execSync(
      `node "${CONVERT_SCRIPT}" "${stlPath}" "${outputFile}" "${DEF_FILE}"`,
      { cwd: SPLICER_DIR, stdio: "inherit", timeout: 120000 }
    );
    entry.gcode = gcodeFileName;
    success++;
    console.log(`[OK] -> ${gcodeFileName}\n`);
  } catch (err) {
    failed++;
    console.error(`[FAIL] ${entry.file}: ${err.message}\n`);
  }

  // Periodically save manifest progress
  if (idx % 50 === 0) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`[SAVE] Manifest updated at entry ${idx}\n`);
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

console.log(`\n=== Summary ===`);
console.log(`Total:     ${manifest.length}`);
console.log(`Converted: ${success}`);
console.log(`Skipped:   ${skipped}`);
console.log(`Failed:    ${failed}`);
console.log(`Manifest updated: ${MANIFEST_PATH}`);
