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

function cleanName(str) {
  if (!str) return null;
  return str
    .replace(/\.stl$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPart(fileName, itemName) {
  let raw = fileName.replace(/\.stl$/i, "");
  if (itemName) {
    const escaped = itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefix = escaped.replace(/[-_]+/g, "[-_ ]*");
    raw = raw.replace(new RegExp("^" + prefix + "[-_ ]*", "i"), "");
  }
  return cleanName(raw) || cleanName(fileName);
}

const stlFiles = walkDir(ROOT);
const manifest = stlFiles.map((filePath) => {
  const rel = path.relative(ROOT, filePath).split(path.sep);
  const fileName = rel[rel.length - 1];
  const SKIP = new Set(["stl", "stls", "renders", "step", "guides", "gcode"]);
  const dirs = rel.slice(0, -1).filter((d) => !SKIP.has(d.toLowerCase()));
  const category = cleanName(dirs[0]);
  const rawItem = dirs[dirs.length - 1] || null;
  const item = cleanName(rawItem);
  const rawSub = dirs.length > 2 ? dirs.slice(1, -1).join("/") : dirs[1] || null;
  const subcategory = rawSub === rawItem ? null : cleanName(rawSub);
  const part = extractPart(fileName, rawItem);

  const labels = [category, subcategory, item, part]
    .filter(Boolean)
    .map((l) => l.toLowerCase());
  const uniqueLabels = [...new Set(labels)];

  return {
    file: rel.join("/"),
    category,
    subcategory,
    item,
    part,
    labels: uniqueLabels,
  };
});

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${manifest.length} entries to ${OUT}`);
