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
 * The augmented manifest at customModel/data-prep/augmented-manifest.json is
 * the single source of truth: each entry records `gcode` (filename in
 * OUTPUT_DIR) and `uploaded` (true once the parsed parquet shard is committed
 * to HF). On every startup we reconcile OUTPUT_DIR against this manifest:
 *   - .gcode files whose manifest entry has uploaded=true  -> deleted
 *   - .gcode files without any manifest entry              -> deleted (orphan)
 *   - everything else                                       -> queued for upload
 */

const fs = require('fs');
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
const UPLOAD_SCRIPT = path.join(__dirname, 'upload_gcode_batch.py');
const DEFAULT_BATCH_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const TMP_DIR = 'D:\\markeyTemp';

const SHARD_PREFIX = '___SHARD___:';
const RESULT_PREFIX = '___RESULT___:';

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

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function parseByteSize(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    const match = String(value).trim().match(/^(\d+(?:\.\d+)?)([kmgt]?b?)?$/i);
    if (!match) return fallback;
    const n = Number(match[1]);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    const unit = (match[2] || '').toLowerCase().replace(/b$/, '');
    const multipliers = { '': 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3, t: 1024 ** 4 };
    return Math.floor(n * (multipliers[unit] || 1));
}

function parsePositiveInt(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

function formatBar(fraction, width) {
    const filled = Math.round(clamp(fraction, 0, 1) * width);
    const empty = width - filled;
    return '[' + '='.repeat(filled) + '>'.repeat(filled > 0 && filled < width ? 1 : 0) + ' '.repeat(Math.max(0, empty - (filled > 0 && filled < width ? 1 : 0))) + ']';
}

function renderProgress(tasks, perWorker, batchBytes, batchSizeBytes) {
    const totalSuccess = perWorker.reduce((s, w) => s + w.success, 0);
    const totalFail = perWorker.reduce((s, w) => s + w.fail, 0);
    const done = totalSuccess + totalFail;
    const total = tasks.length;
    const fraction = total > 0 ? done / total : 0;
    const pct = (fraction * 100).toFixed(0);
    const bar = formatBar(fraction, 45);
    const parts = perWorker.map((w, i) => `w${i + 1}: ${w.success} ok, ${w.fail} fail`);
    const lines = [`${bar} ${pct}%  ${done}/${total}  (${totalSuccess} ok, ${totalFail} fail)`, `  ${parts.join('  •  ')}`];
    if (batchBytes > 0) lines.push(`  Upload queue: ${(batchBytes / 1e9).toFixed(1)} GB / ${(batchSizeBytes / 1e9).toFixed(1)} GB`);
    return lines.join('\n');
}

function pickPythonBin() {
    if (process.env.PYTHON) return process.env.PYTHON;
    if (process.platform === 'win32') return 'python';
    return 'python3';
}

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function runPython(pythonBin, argsList, { streamStderr = false, onStdoutLine = null, env = null } = {}) {
    return new Promise((resolve) => {
        const child = spawn(pythonBin, argsList, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: env ? { ...process.env, ...env } : process.env,
        });
        let stdout = '';
        let stderr = '';
        let stdoutBuf = '';
        child.stdout.on('data', (c) => {
            const s = c.toString();
            stdout += s;
            if (onStdoutLine) {
                stdoutBuf += s;
                let idx;
                while ((idx = stdoutBuf.indexOf('\n')) !== -1) {
                    const line = stdoutBuf.slice(0, idx).replace(/\r$/, '');
                    stdoutBuf = stdoutBuf.slice(idx + 1);
                    try { onStdoutLine(line); } catch (_) { /* ignore */ }
                }
            }
        });
        child.stderr.on('data', (c) => {
            const s = c.toString();
            stderr += s;
            if (streamStderr) process.stderr.write(s);
        });
        child.on('error', (err) => resolve({ status: -1, stdout, stderr: stderr + err.message }));
        child.on('close', (code) => {
            if (onStdoutLine && stdoutBuf.length > 0) {
                try { onStdoutLine(stdoutBuf); } catch (_) { /* ignore */ }
            }
            resolve({ status: code, stdout, stderr });
        });
    });
}

function cleanupOrphanTmp() {
    if (!fs.existsSync(TMP_DIR)) return;
    let removed = 0;
    for (const name of fs.readdirSync(TMP_DIR)) {
        if (name.startsWith('hf-stage-') || name.startsWith('hf-batch-') || name.startsWith('stl-aug-')) {
            try {
                fs.rmSync(path.join(TMP_DIR, name), { recursive: true, force: true });
                removed++;
            } catch (_) { /* ignore */ }
        }
    }
    const parsedDir = path.join(TMP_DIR, 'markeyTemp1');
    if (fs.existsSync(parsedDir)) {
        for (const name of fs.readdirSync(parsedDir)) {
            if (name.endsWith('.parsed')) {
                try { fs.unlinkSync(path.join(parsedDir, name)); removed++; } catch (_) { /* ignore */ }
            }
        }
    }
    if (removed > 0) console.log(`Startup cleanup: removed ${removed} orphan tmp entries`);
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

async function uploadAndEvict(entries, pythonBin, { onShardUploaded, parseWorkers } = {}) {
    if (entries.length === 0) return;
    const tmpList = path.join(fs.mkdtempSync(path.join(TMP_DIR, 'hf-batch-')), 'batch.json');
    fs.writeFileSync(tmpList, JSON.stringify(entries));
    let shardHandlerError = null;
    try {
        const uploadEnv = { HF_HUB_ENABLE_HF_TRANSFER: '1' };
        if (parseWorkers) uploadEnv.HF_PARSE_WORKERS = String(parseWorkers);
        const res = await runPython(pythonBin, [UPLOAD_SCRIPT, tmpList], {
            streamStderr: true,
            env: uploadEnv,
            onStdoutLine: (line) => {
                if (!line.startsWith(SHARD_PREFIX)) return;
                try {
                    const payload = JSON.parse(line.slice(SHARD_PREFIX.length));
                    if (Array.isArray(payload.uploaded) && payload.uploaded.length && onShardUploaded) {
                        try {
                            onShardUploaded(payload.uploaded);
                        } catch (err) {
                            shardHandlerError = err;
                        }
                    }
                } catch (_) { /* ignore parse errors */ }
            },
        });
        if (shardHandlerError) throw shardHandlerError;
        const lines = res.stdout.trim().split('\n').filter(Boolean);
        const resultLine = lines.find(l => l.startsWith(RESULT_PREFIX));
        if (!resultLine) {
            console.error(`[UPLOAD ERROR] Python exited (status=${res.status}) with no result line.`);
            return;
        }
        const result = JSON.parse(resultLine.slice(RESULT_PREFIX.length));
        if (Array.isArray(result.uploaded) && result.uploaded.length && onShardUploaded) {
            onShardUploaded(result.uploaded);
        }
        if (result.failed && result.failed.length > 0) {
            console.warn(`[UPLOAD WARN] ${result.failed.length} files failed to upload`);
        }
    } catch (err) {
        console.error(`[UPLOAD ERROR] ${err.message}`);
    } finally {
        try { fs.rmSync(path.dirname(tmpList), { recursive: true, force: true }); } catch (_) { /* ignore */ }
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const VARIANTS_PER_STL = parseInt(args.variants || '5', 10);
    const START = parseInt(args.start || '0', 10);
    const END = args.end ? parseInt(args.end, 10) : null;
    const SEED = parseInt(args.seed || '42', 10);
    const TIMEOUT_MS = parseInt(args.timeout || (10 * 60 * 1000).toString(), 10);
    const LABEL = parseInt(args.label || '1', 10);
    const CONCURRENCY = parsePositiveInt(args.concurrency || '1', 1);
    const PARSE_WORKERS = parsePositiveInt(args['parse-workers'] || process.env.HF_PARSE_WORKERS || '1', 1);
    const BATCH_SIZE_BYTES = parseByteSize(
        args['batch-size'] || process.env.MARKEY_BATCH_SIZE_BYTES,
        DEFAULT_BATCH_SIZE_BYTES
    );
    const DRY_RUN = args['dry-run'] === 'true';

    ensureDir(OUTPUT_DIR);
    ensureDir(TMP_DIR);

    cleanupOrphanTmp();

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
    const manifestByKey = new Map();
    const manifestByGcode = new Map();
    const doneKeys = new Set();
    for (const e of augManifest) {
        if (!e.key) continue;
        if (e.key) manifestByKey.set(e.key, e);
        if (e.gcode) manifestByGcode.set(e.gcode, e);
        if (e.uploaded) {
            doneKeys.add(e.key);
        } else if (e.gcode && fs.existsSync(path.join(OUTPUT_DIR, e.gcode))) {
            doneKeys.add(e.key);
        }
    }

    const tmpDir = fs.mkdtempSync(path.join(TMP_DIR, 'stl-aug-'));
    const pythonBin = pickPythonBin();

    console.log(`Source manifest: ${manifest.length} entries`);
    console.log(`Range:           ${START}..${end}`);
    console.log(`Variants/STL:    ${VARIANTS_PER_STL}`);
    console.log(`Concurrency:     ${CONCURRENCY}`);
    console.log(`Parse workers:   ${PARSE_WORKERS}`);
    console.log(`Upload batch:    ${(BATCH_SIZE_BYTES / 1e9).toFixed(2)} GB`);
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

    const saveManifest = () => fs.writeFileSync(AUG_MANIFEST_PATH, JSON.stringify(augManifest, null, 2));

    function markEntriesUploaded(filePaths) {
        let changed = 0;
        const toDelete = [];
        for (const fp of filePaths) {
            const entry = manifestByGcode.get(path.basename(fp));
            if (entry) {
                if (!entry.uploaded) {
                    entry.uploaded = true;
                    changed++;
                }
                toDelete.push(fp);
            }
        }
        if (changed > 0) saveManifest();
        for (const fp of toDelete) {
            try { fs.unlinkSync(fp); } catch (_) { /* ignore */ }
        }
    }

    // === Reconcile OUTPUT_DIR against manifest ===
    let batchEntries = [];
    let batchBytes = 0;
    let resumeQueued = 0;
    let resumeDeletedUploaded = 0;
    let resumeDeletedOrphans = 0;
    if (fs.existsSync(OUTPUT_DIR)) {
        for (const f of fs.readdirSync(OUTPUT_DIR)) {
            if (!f.endsWith('.gcode')) continue;
            const fPath = path.join(OUTPUT_DIR, f);
            const entry = manifestByGcode.get(f);
            if (entry && entry.uploaded) {
                try { fs.unlinkSync(fPath); resumeDeletedUploaded++; } catch (_) { /* ignore */ }
                continue;
            }
            if (!entry) {
                try { fs.unlinkSync(fPath); resumeDeletedOrphans++; } catch (_) { /* ignore */ }
                continue;
            }
            try {
                const stat = fs.statSync(fPath);
                batchEntries.push({ path: fPath, label: entry.label || 1 });
                batchBytes += stat.size;
                resumeQueued++;
            } catch (_) { /* ignore */ }
        }
    }
    console.log(
        `Resume scan: queued=${resumeQueued} (${(batchBytes / 1e9).toFixed(2)} GB), ` +
        `deleted_uploaded=${resumeDeletedUploaded}, deleted_orphans=${resumeDeletedOrphans}`
    );

    let cursor = 0;
    let savesSinceFlush = 0;
    let batchLock = Promise.resolve();
    let activeSlicers = 0;
    let slicerDrainResolvers = [];
    const perWorker = [];
    for (let w = 0; w < CONCURRENCY; w++) perWorker.push({ success: 0, fail: 0 });

    function noteSlicerStarted() {
        activeSlicers++;
    }

    function noteSlicerFinished() {
        activeSlicers--;
        if (activeSlicers === 0) {
            const resolvers = slicerDrainResolvers;
            slicerDrainResolvers = [];
            for (const resolve of resolvers) resolve();
        }
    }

    function waitForSlicersToDrain() {
        if (activeSlicers === 0) return Promise.resolve();
        return new Promise((resolve) => slicerDrainResolvers.push(resolve));
    }

    async function uploadCurrentBatchIfNeeded(force = false) {
        if (!force && batchBytes < BATCH_SIZE_BYTES) return;
        if (batchEntries.length === 0) return;

        const toUpload = batchEntries;
        const uploadBytes = batchBytes;
        batchEntries = [];
        batchBytes = 0;

        console.log(`\nPausing Cura slicing; upload queue reached ${(uploadBytes / 1e9).toFixed(3)} GB.`);
        await waitForSlicersToDrain();
        await uploadAndEvict(toUpload, pythonBin, {
            onShardUploaded: (paths) => markEntriesUploaded(paths),
            parseWorkers: PARSE_WORKERS,
        });
    }

    function scheduleUploadIfNeeded(force = false) {
        batchLock = batchLock.then(() => uploadCurrentBatchIfNeeded(force));
        return batchLock;
    }

    // Render progress bar every 2s on a single line (carriage return)
    const progressTimer = setInterval(() => {
        const out = renderProgress(tasks, perWorker, batchBytes, BATCH_SIZE_BYTES);
        process.stdout.write('\r\x1b[K' + out.replace(/\n/g, '\n\r\x1b[K'));
    }, 2000);

    async function worker(workerId) {
        while (true) {
            await batchLock;
            const idx = cursor++;
            if (idx >= tasks.length) return;
            const task = tasks[idx];

            if (!fs.existsSync(task.stlPath)) {
                perWorker[workerId - 1].fail++;
                continue;
            }

            const tmpStl = path.join(tmpDir, `aug_w${workerId}_${task.key}.stl`);
            const outGcode = path.join(OUTPUT_DIR, `${task.key}.gcode`);

            if (DRY_RUN) {
                const dryEntry = {
                    key: task.key,
                    source_index: task.i + 1,
                    source_file: task.entry.file,
                    label: task.label,
                    variant: task.v + 1,
                    scale_axis: task.scaleAxis,
                    scale_factor: task.scaleFactor,
                    settings: task.settings,
                    gcode: null,
                    uploaded: false,
                };
                const existing = manifestByKey.get(task.key);
                if (existing) {
                    Object.assign(existing, dryEntry);
                } else {
                    augManifest.push(dryEntry);
                    manifestByKey.set(dryEntry.key, dryEntry);
                }
                perWorker[workerId - 1].success++;
                continue;
            }

            // 1) Augment STL
            const augRes = await runPython(pythonBin, [
                AUGMENT_SCRIPT, task.stlPath, tmpStl,
                '--axis', task.scaleAxis, '--scale', String(task.scaleFactor),
            ]);
            if (augRes.status !== 0) {
                console.error(`[AUG FAIL w${workerId}] ${task.key}: ${(augRes.stderr || augRes.stdout || '').trim()}`);
                perWorker[workerId - 1].fail++;
                continue;
            }

            // 2) Slice
            try {
                noteSlicerStarted();
                try {
                    await sliceStlWithCuraEngine({
                        stlPath: tmpStl,
                        outputGcodePath: outGcode,
                        definitionPath: DEF_FILE,
                        settings: task.settings,
                        cwd: SPLICER_DIR,
                        timeoutMs: TIMEOUT_MS,
                    });
                } finally {
                    noteSlicerFinished();
                }

                const newEntry = {
                    key: task.key,
                    source_index: task.i + 1,
                    source_file: task.entry.file,
                    label: task.label,
                    variant: task.v + 1,
                    scale_axis: task.scaleAxis,
                    scale_factor: task.scaleFactor,
                    settings: task.settings,
                    gcode: path.basename(outGcode),
                    uploaded: false,
                };
                const existing = manifestByKey.get(task.key);
                if (existing) {
                    if (existing.gcode && existing.gcode !== newEntry.gcode) {
                        manifestByGcode.delete(existing.gcode);
                    }
                    Object.assign(existing, newEntry);
                    manifestByGcode.set(existing.gcode, existing);
                } else {
                    augManifest.push(newEntry);
                    manifestByKey.set(newEntry.key, newEntry);
                    manifestByGcode.set(newEntry.gcode, newEntry);
                }
                savesSinceFlush++;

                // Track file size and flush upload batch — serialized via batchLock
                batchLock = batchLock.then(async () => {
                    try {
                        const stat = fs.statSync(outGcode);
                        batchEntries.push({ path: outGcode, label: task.label });
                        batchBytes += stat.size;
                    } catch (_) { /* file may have been cleaned up */ }

                    await uploadCurrentBatchIfNeeded(false);
                });

                await batchLock;

                perWorker[workerId - 1].success++;
            } catch (err) {
                console.error(`[SLICE FAIL w${workerId}] ${task.key}: ${err.message.split('\n')[0]}`);
                perWorker[workerId - 1].fail++;
            } finally {
                try { fs.unlinkSync(tmpStl); } catch (_) { /* ignore */ }
            }

            if (savesSinceFlush >= 25) {
                saveManifest();
                savesSinceFlush = 0;
            }
        }
    }

    await scheduleUploadIfNeeded(false);

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) workers.push(worker(w + 1));
    await Promise.all(workers);

    clearInterval(progressTimer);

    // Flush any remaining files in the batch
    if (batchEntries.length > 0) {
        console.log(`Flushing final upload batch: ${(batchBytes / 1e9).toFixed(3)} GB...`);
        await scheduleUploadIfNeeded(true);
    }

    saveManifest();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }

    const totalSuccess = perWorker.reduce((s, w) => s + w.success, 0);
    const totalFail = perWorker.reduce((s, w) => s + w.fail, 0);
    console.log('\n=== Phase 1 summary ===');
    console.log(`Converted: ${totalSuccess}`);
    console.log(`Failed:    ${totalFail}`);
    console.log(`Manifest:  ${AUG_MANIFEST_PATH} (${augManifest.length} entries)`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
