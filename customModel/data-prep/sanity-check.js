const fs = require("fs");
const path = require("path");

const m = JSON.parse(
  fs.readFileSync(path.join(__dirname, "stl-manifest.json"), "utf-8")
);
const dir = path.join(__dirname, "g-code-spliced");

const gcodes = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith(".gcode"))
  : [];

console.log("Gcode files on disk:", gcodes.length);

const withGcode = m.filter((e) => e.gcode);
console.log("Manifest entries with gcode field:", withGcode.length);

// Check every manifest gcode reference points to a real file
let missingFiles = 0;
for (const e of withGcode) {
  if (!fs.existsSync(path.join(dir, e.gcode))) {
    console.log("  MISSING FILE:", e.gcode, "for", e.file);
    missingFiles++;
  }
}
console.log("Missing gcode files:", missingFiles);

// Check numbering matches index
let indexMismatches = 0;
for (let i = 0; i < m.length; i++) {
  const expected = `${i + 1}.gcode`;
  if (m[i].gcode && m[i].gcode !== expected) {
    console.log(
      `  INDEX MISMATCH: manifest[${i}].gcode="${m[i].gcode}" expected="${expected}"`
    );
    indexMismatches++;
    if (indexMismatches >= 10) {
      console.log("  ... (showing first 10)");
      break;
    }
  }
}
console.log("Index mismatches:", indexMismatches);

// Check for gaps in on-disk numbering
if (gcodes.length > 0) {
  const nums = gcodes.map((f) => parseInt(f)).sort((a, b) => a - b);
  console.log("Number range:", nums[0], "to", nums[nums.length - 1]);
  const gaps = [];
  for (let i = 1; i < nums.length; i++) {
    for (let g = nums[i - 1] + 1; g < nums[i]; g++) gaps.push(g);
  }
  console.log("Gaps:", gaps.length > 0 ? gaps.slice(0, 20) : "none");
}

// Spot check: verify STL filename relates to manifest entry
console.log("\nSpot checks (index -> stl file -> gcode):");
[0, 49, 199, 499, 999, m.length - 1].forEach((i) => {
  if (!m[i]) return;
  const stlName = m[i].file.split("/").pop();
  console.log(`  [${i}] ${stlName} -> ${m[i].gcode || "(no gcode)"}`);
});
