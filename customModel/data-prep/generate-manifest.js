const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "gitOne");
const OUT = path.join(__dirname, "stl-manifest.json");

function walkDir(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(full));
    } else if (entry.name.toLowerCase().endsWith(".stl")) {
      results.push(full);
    }
  }
  return results;
}

const stlFiles = walkDir(ROOT);
const manifest = stlFiles.map((filePath) => {
  const rel = path.relative(ROOT, filePath).split(path.sep);
  const fileName = rel[rel.length - 1];
  const SKIP = new Set(["stl", "stls", "renders", "step", "guides", "gcode"]);
  const dirs = rel.slice(0, -1).filter((d) => !SKIP.has(d.toLowerCase()));
  const category = dirs[0] || null;
  const itemName = dirs[dirs.length - 1] || null;
  const rawSub = dirs.length > 2 ? dirs.slice(1, -1).join("/") : dirs[1] || null;
  const subcategory = rawSub === itemName ? null : rawSub;
  const fileSizeBytes = fs.statSync(filePath).size;

  return {
    fileName,
    category,
    subcategory,
    itemName,
    relativePath: rel.join("/"),
    fileSizeBytes,
  };
});

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${manifest.length} entries to ${OUT}`);
