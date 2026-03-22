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

const CANONICAL_KEYWORDS = {
  "stock": /stock/i,
  "grip": /grip/i,
  "barrel": /barrel/i,
  "trigger": /trigger/i,
  "magazine": /\b(mag\b|magazine|magwell|magplate|magblock)/i,
  "receiver": /receiver/i,
  "frame": /frame/i,
  "bolt": /\bbolt/i,
  "buffer tube": /buffer\s*tube/i,
  "buffer": /buffer/i,
  "spring": /spring/i,
  "pin": /pin/i,
  "ejector": /ejector/i,
  "extractor": /extractor/i,
  "hammer": /hammer/i,
  "sear": /sear/i,
  "follower": /follower/i,
  "baseplate": /(baseplate|base\s*plate|floor\s*plate)/i,
  "charging handle": /charging\s*(handle|block)/i,
  "handguard": /(handguard|hand\s*guard|fore\s*arm)/i,
  "rail": /\b(rail|picatinny)/i,
  "sight": /sight/i,
  "muzzle device": /(flash\s*(hider|suppressor)|muzzle|compensator|silencer|suppressor|sound\s*moderator|fauxcan)/i,
  "mount": /\bmount/i,
  "jig": /jig/i,
  "brace": /brace/i,
  "striker": /striker/i,
  "slide": /\bslide/i,
  "safety": /safety/i,
  "selector": /selector/i,
  "firing pin": /(firing\s*pin|firingpin)/i,
  "guide rod": /guide\s*rod/i,
  "trigger guard": /trigger\s*guard/i,
  "disconnector": /disconnector/i,
  "feed ramp": /feed\s*ramp/i,
  "feed guide": /feed\s*guide/i,
  "butt pad": /butt\s*pad/i,
  "loader": /loader/i,
  "clip": /\bclip/i,
  "cover": /cover/i,
  "adapter": /adapter/i,
  "upper": /\bupper/i,
  "lower": /\blower/i,
  "chamber": /chamber/i,
  "carrier": /carrier/i,
  "retainer": /retainer/i,
  "handle": /\bhandle/i,
  "handstop": /hand\s*stop/i,
  "spacer": /spacer/i,
  "chassis": /chassis/i,
  "cheek rest": /cheek\s*rest/i,
  "body": /\bbody/i,
  "tube": /\btube/i,
  "lock": /\block\b/i,
  "lifter": /lifter/i,
  "model": /\bmodel\b/i,
  "endcap": /end\s*cap/i,
};

const POSITION_KEYWORDS = {
  "front": /\bfront\b/i,
  "rear": /\brear\b/i,
  "left": /\bleft\b/i,
  "right": /\bright\b/i,
};

const NON_FUNCTIONAL_PATTERNS =
  /\b(render|jig|display|stand|engraving|mockup|model\s*(complex|simple)|pirate|come and take|warfairy logo)\b/i;

function normalizeLabels(labels) {
  const result = [];
  const combined = labels.join(" ");

  for (const [canonical, regex] of Object.entries(CANONICAL_KEYWORDS)) {
    if (regex.test(combined)) result.push(canonical);
  }

  for (const [pos, regex] of Object.entries(POSITION_KEYWORDS)) {
    if (regex.test(combined)) result.push(pos);
  }

  if (NON_FUNCTIONAL_PATTERNS.test(combined)) {
    result.push("non_functional");
  }

  return result;
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

  const rawLabels = [category, subcategory, item, part]
    .filter(Boolean)
    .map((l) => l.toLowerCase());
  const normalized = normalizeLabels(rawLabels);
  const uniqueLabels = [...new Set(normalized)];

  return {
    file: rel.join("/"),
    category,
    subcategory,
    item,
    part,
    labels: uniqueLabels,
  };
}).filter((entry) => {
  const partLower = entry.part.toLowerCase();
  const hasLogo = /logo/i.test(partLower);
  if (!hasLogo) return true;
  const partLabels = normalizeLabels([partLower]);
  const functionalPartLabels = partLabels.filter((l) => l !== "non_functional");
  return functionalPartLabels.length > 0;
});

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${manifest.length} entries to ${OUT}`);
