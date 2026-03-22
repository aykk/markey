const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'gitOne');
const targetDir = path.join(__dirname, '..');

// Category feature mappings
const categoryFeatures = {
  'Accessories': { type: 'accessory' },
  'Home_Designed': { type: 'firearm', designed: 'home' },
  'Pistols_and_Subs': { type: 'firearm', firearm_type: 'pistol_submachine' },
  'Rifles': { type: 'firearm', firearm_type: 'rifle' }
};

const subcategoryFeatures = {
  // Accessories
  'Braces': { accessory_type: 'brace' },
  'Clips_Holders_Catchers': { accessory_type: 'clip_holder_catcher' },
  'Grips': { accessory_type: 'grip' },
  'Loaders': { accessory_type: 'loader' },
  'Magazines': { accessory_type: 'magazine' },
  'Misc_Lower_Parts': { accessory_type: 'lower_part' },
  'Misc_Upper_Parts': { accessory_type: 'upper_part' },
  'Mounts': { accessory_type: 'mount' },
  'Muzzle_Devices': { accessory_type: 'muzzle_device' },
  'Optics': { accessory_type: 'optic' },
  'Rail_Systems': { accessory_type: 'rail_system' },
  'Stocks': { accessory_type: 'stock' },
  // Rifles
  '10_22': { platform: '10/22' },
  'AK-47': { platform: 'AK-47' },
  'AR-10': { platform: 'AR-10' },
  'AR-15': { platform: 'AR-15' },
  'M-16': { platform: 'M-16' },
  'Misc': { platform: 'misc' },
  // Pistols
  '1911': { platform: '1911' },
  'Glock': { platform: 'Glock' },
  'Skorpion_vz61': { platform: 'Skorpion VZ61' },
  // Home_Designed - extract designer from folder name (e.g., "PM522_Washbear_Revolver_v2.0-JamesRPatrick")
};

function extractDesignerFromFolder(folderName) {
  const match = folderName.match(/-([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

function extractModelFromFolder(folderName) {
  // Remove designer suffix if present
  const cleaned = folderName.replace(/-([A-Za-z0-9]+)$/, '');
  return cleaned;
}

function getAllStlFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      getAllStlFiles(fullPath, files);
    } else if (item.name.toLowerCase().endsWith('.stl')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractFeatures(filePath) {
  const relativePath = path.relative(sourceDir, filePath);
  const parts = relativePath.split(path.sep);
  
  const features = {
    filename: parts[parts.length - 1],
    category: parts[0] || null,
    subcategory: parts[1] || null,
    subsubcategory: parts[2] || null
  };
  
  // Add category-based features
  if (features.category && categoryFeatures[features.category]) {
    Object.assign(features, categoryFeatures[features.category]);
  }
  
  // Add subcategory-based features
  if (features.subcategory && subcategoryFeatures[features.subcategory]) {
    Object.assign(features, subcategoryFeatures[features.subcategory]);
  }
  
  // Extract designer for Home_Designed items
  if (features.category === 'Home_Designed' && features.subcategory) {
    features.model = extractModelFromFolder(features.subcategory);
    features.designer = extractDesignerFromFolder(features.subcategory);
  }
  
  return features;
}

const stlFiles = getAllStlFiles(sourceDir);
console.log(`Found ${stlFiles.length} STL files`);

const manifest = {
  generated: new Date().toISOString(),
  total_files: stlFiles.length,
  categories: {},
  files: []
};

let copied = 0;
let skipped = 0;

for (const file of stlFiles) {
  const fileName = path.basename(file);
  const destPath = path.join(targetDir, fileName);
  const features = extractFeatures(file);
  
  // Track category counts
  const cat = features.category || 'unknown';
  manifest.categories[cat] = (manifest.categories[cat] || 0) + 1;
  
  manifest.files.push(features);
  
  if (fs.existsSync(destPath)) {
    skipped++;
  } else {
    fs.copyFileSync(file, destPath);
    copied++;
  }
}

// Write manifest JSON
const manifestPath = path.join(targetDir, 'stl-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to: ${manifestPath}`);

console.log(`Copied: ${copied}`);
console.log(`Skipped (already exist): ${skipped}`);
