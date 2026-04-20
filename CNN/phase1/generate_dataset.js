/**
 * Phase 1 combinatorial synthetic data generator.
 *
 * For every entry in customModel/data-prep/stl-manifest.json this script
 * produces N variants by:
 *   1. Calling phase1/augment_stl.py (trimesh) to apply a random 1-3%
 *      anisotropic scale on X, Y or Z.
 *   2. Re-slicing the mutated STL through slicer/convert.js with a fresh
 *      random combination of layer height, infill density, infill pattern
 *      and wall (perimeter) count.
 *
 * Supports parallel workers via --concurrency N (default 1). Each worker
 * drives its own CuraEngine subprocess, so throughput scales roughly with
 * physical CPU cores.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const { sliceStlWithCuraEngine } = require('../../slicer/convert.js');

const DATA_PREP = path.resolve(__dirname, '..', '..', 'customModel', 'data-prep');
const STL_ROOT = path.join(DATA_PREP, 'gitOne');
const MANIFEST_PATH = path.join(DATA_PREP, 'stl-manifest.json');
const OUTPUT_DIR = path.join(DATA_PREP, 'g-code-augmented');
const AUG_MANIFEST_PATH = path.join(DATA_PREP, 'augmented-manifest.json');
const SPLICER_DIR = path.resolve(__dirname, '..', '..', 'slicer');
const DEF_FILE = path.join(SPLICER_DIR, 'fdmprinter.def.json');
const AUGMENT_SCRIPT = path.join(__dirname, 'augment_stl.py');

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (next === undefined || next.startsWith('--')) {
                out[key] = 'true';
            } else {
                out[key] = next;
                i++;
            }
        }
    }
    return out;
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randFloat(rand, lo, hi) { return lo + rand() * (hi - lo); }
function randInt(rand, lo, hi) { return Math.floor(lo + rand() * (hi - lo + 1)); }
function choice(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }

function pickPythonBin() {
    if (process.env.PYTHON) return process.env.PYTHON;
    if (process.platform === 'win32') return 'python';
    return 'python3';
}

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function runPython(pythonBin, argsList) {
    return new Promise((resolve) => {
        const child = spawn(pythonBin, argsList, { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (c) => { stdout += c.toString(); });
        child.stderr.on('data', (c) => { stderr += c.toString(); });
        child.on('error', (err) => resolve({ status: -1, stdout, stderr: stderr + err.message }));
        child.on('close', (code) => resolve({ status: code, stdout, stderr }));
    });
}

function buildTasks({ manifest, start, end, variantsPerStl, seed, label, doneKeys }) {
    const tasks = [];
    for (let i = start; i < end; i++) {
        const entry = manifest[i];
        const stlPath = path.join(STL_ROOT, entry.file.replace(/\//g, path.sep));
        for (let v = 0; v < variantsPerStl; v++) {
            const key = `${i + 1}_${v + 1}`;
            if (doneKeys.has(key)) continue;

            const rand = mulberry32(seed ^ ((i + 1) * 10007) ^ ((v + 1) * 31));
            const scaleAxis = choice(rand, ['x', 'y', 'z']);
            const scaleFactor = +(1.0 + randFloat(rand, 0.01, 0.03)).toFixed(6);
            const layerHeight = +randFloat(rand, 0.12, 0.28).toFixed(3);
            const infillDensity = randInt(rand, 15, 100);
            const infillPattern = choice(rand, ['gyroid', 'grid', 'cubic']);
            const wallLineCount = randInt(rand, 2, 6);

            tasks.push({
                key,
                i,
                v,
                entry,
                stlPath,
                scaleAxis,
                scaleFactor,
                label,
                settings: {
                    layer_height: layerHeight,
                    infill_sparse_density: infillDensity,
                    infill_pattern: infillPattern,
                    wall_line_count: wallLineCount,
                    support_enable: 'false',
                    adhesion_type: 'skirt',
                    roofing_layer_count: 0,
                    flooring_layer_count: 0,
                },
            });
        }
    }
    return tasks;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const VARIANTS_PER_STL = parseInt(args.variants || '5', 10);
    const START = parseInt(args.start || '0', 10);
    const END = args.end ? parseInt(args.end, 10) : null;
    const SEED = parseInt(args.seed || '42', 10);
    const TIMEOUT_MS = parseInt(args.timeout || (10 * 60 * 1000).toString(), 10);
    const LABEL = parseInt(args.label || '1', 10);
    const CONCURRENCY = Math.max(1, parseInt(args.concurrency || '1', 10));
    const DRY_RUN = args['dry-run'] === 'true';

    ensureDir(OUTPUT_DIR);

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const end = END ?? manifest.length;

    let augManifest = [];
    if (fs.existsSync(AUG_MANIFEST_PATH)) {
        try {
            augManifest = JSON.parse(fs.readFileSync(AUG_MANIFEST_PATH, 'utf-8'));
        } catch {
            augManifest = [];
        }
    }
    const doneKeys = new Set(augManifest.map((e) => e.key));

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stl-aug-'));
    const pythonBin = pickPythonBin();

    console.log(`Source manifest: ${manifest.length} entries`);
    console.log(`Range:           ${START}..${end}`);
    console.log(`Variants/STL:    ${VARIANTS_PER_STL}`);
    console.log(`Concurrency:     ${CONCURRENCY}`);
    console.log(`Output dir:      ${OUTPUT_DIR}`);
    console.log(`Temp dir:        ${tmpDir}`);
    console.log(`Seed:            ${SEED}`);
    console.log(`Label:           ${LABEL}`);
    if (DRY_RUN) console.log('--- DRY RUN (no slicing) ---');

    const tasks = buildTasks({
        manifest, start: START, end, variantsPerStl: VARIANTS_PER_STL,
        seed: SEED, label: LABEL, doneKeys,
    });
    console.log(`Pending tasks:   ${tasks.length}`);

    let success = 0;
    let failed = 0;
    let missing = 0;
    let cursor = 0;
    let savesSinceFlush = 0;

    const saveManifest = () => fs.writeFileSync(AUG_MANIFEST_PATH, JSON.stringify(augManifest, null, 2));

    async function worker(workerId) {
        while (true) {
            const idx = cursor++;
            if (idx >= tasks.length) return;
            const task = tasks[idx];

            if (!fs.existsSync(task.stlPath)) {
                missing++;
                continue;
            }

            const tmpStl = path.join(tmpDir, `aug_w${workerId}_${task.key}.stl`);
            const outGcode = path.join(OUTPUT_DIR, `${task.key}.gcode`);

            if (DRY_RUN) {
                console.log(`[DRY w${workerId}] ${task.key}: axis=${task.scaleAxis} scale=${task.scaleFactor}`);
                augManifest.push({
                    key: task.key,
                    source_index: task.i + 1,
                    source_file: task.entry.file,
                    label: task.label,
                    variant: task.v + 1,
                    scale_axis: task.scaleAxis,
                    scale_factor: task.scaleFactor,
                    settings: task.settings,
                    gcode: null,
                });
                continue;
            }

            // 1) Augment STL
            const augRes = await runPython(pythonBin, [
                AUGMENT_SCRIPT, task.stlPath, tmpStl,
                '--axis', task.scaleAxis, '--scale', String(task.scaleFactor),
            ]);
            if (augRes.status !== 0) {
                console.error(`[AUG FAIL w${workerId}] ${task.key}: ${(augRes.stderr || augRes.stdout || '').trim()}`);
                failed++;
                continue;
            }

            // 2) Slice
            try {
                await sliceStlWithCuraEngine({
                    stlPath: tmpStl,
                    outputGcodePath: outGcode,
                    definitionPath: DEF_FILE,
                    settings: task.settings,
                    cwd: SPLICER_DIR,
                    timeoutMs: TIMEOUT_MS,
                });

                augManifest.push({
                    key: task.key,
                    source_index: task.i + 1,
                    source_file: task.entry.file,
                    label: task.label,
                    variant: task.v + 1,
                    scale_axis: task.scaleAxis,
                    scale_factor: task.scaleFactor,
                    settings: task.settings,
                    gcode: path.basename(outGcode),
                });
                success++;
                savesSinceFlush++;
                console.log(`[OK ${success}/${tasks.length} w${workerId}] ${task.key} -> ${path.basename(outGcode)}`);
            } catch (err) {
                failed++;
                console.error(`[SLICE FAIL w${workerId}] ${task.key}: ${err.message.split('\n')[0]}`);
            } finally {
                try { fs.unlinkSync(tmpStl); } catch (_) { /* ignore */ }
            }

            if (savesSinceFlush >= 25) {
                saveManifest();
                savesSinceFlush = 0;
            }
        }
    }

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) workers.push(worker(w + 1));
    await Promise.all(workers);

    saveManifest();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }

    console.log('\n=== Phase 1 summary ===');
    console.log(`Converted: ${success}`);
    console.log(`Missing:   ${missing}`);
    console.log(`Failed:    ${failed}`);
    console.log(`Manifest:  ${AUG_MANIFEST_PATH} (${augManifest.length} entries)`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
