const fs = require('fs');
const path = require('path');

const DEFAULT_PARAMS = {
    toolDiameter: 6,
    stepover: 40,
    cutDepth: 1,
    feedRate: 300,
    plungeRate: 100,
    spindleSpeed: 12000,
    safeZ: 5
};

function printUsage() {
    console.log('Usage: node worker.js --input <model.stl|job.json> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --out <file.gcode>       Output G-code path (default: output.gcode)');
    console.log('  --toolpath <file.json>   Optional output toolpath JSON');
    console.log('  --stats <file.json>      Optional output stats JSON');
    console.log('  --params <file.json>     Optional machining params JSON');
    console.log('');
    console.log('Direct parameter overrides (all optional):');
    console.log('  --toolDiameter <number>  --stepover <percent>  --cutDepth <number>');
    console.log('  --feedRate <number>      --plungeRate <number> --spindleSpeed <number> --safeZ <number>');
    console.log('');
    console.log('For .stl input, params come from defaults + --params file + CLI overrides.');
}

function parseNumericArg(args, key) {
    if (!(key in args)) {
        return undefined;
    }
    const value = Number(args[key]);
    if (Number.isNaN(value)) {
        throw new Error(`Invalid --${key}: expected a number.`);
    }
    return value;
}

function loadParams(args, payloadParams) {
    let fileParams = {};
    if (args.params) {
        const paramsPath = path.resolve(String(args.params));
        fileParams = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
    }

    const cliParams = {
        toolDiameter: parseNumericArg(args, 'toolDiameter'),
        stepover: parseNumericArg(args, 'stepover'),
        cutDepth: parseNumericArg(args, 'cutDepth'),
        feedRate: parseNumericArg(args, 'feedRate'),
        plungeRate: parseNumericArg(args, 'plungeRate'),
        spindleSpeed: parseNumericArg(args, 'spindleSpeed'),
        safeZ: parseNumericArg(args, 'safeZ')
    };

    return {
        ...DEFAULT_PARAMS,
        ...(payloadParams || {}),
        ...fileParams,
        ...Object.fromEntries(Object.entries(cliParams).filter(([, value]) => value !== undefined))
    };
}

function buildGeometryFromPositions(positions) {
    if (!Array.isArray(positions) || positions.length === 0 || positions.length % 9 !== 0) {
        throw new Error('Invalid STL geometry: expected triangle positions array with length multiple of 9.');
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;
    }

    return {
        attributes: {
            position: {
                array: positions
            }
        },
        boundingBox: {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ }
        }
    };
}

function parseBinaryStl(buffer) {
    if (buffer.length < 84) {
        throw new Error('Invalid binary STL: file too small.');
    }
    const faceCount = buffer.readUInt32LE(80);
    const expectedSize = 84 + faceCount * 50;
    if (buffer.length < expectedSize) {
        throw new Error('Invalid binary STL: truncated data.');
    }

    const positions = [];
    let offset = 84;
    for (let i = 0; i < faceCount; i++) {
        offset += 12;
        for (let v = 0; v < 3; v++) {
            positions.push(buffer.readFloatLE(offset));
            positions.push(buffer.readFloatLE(offset + 4));
            positions.push(buffer.readFloatLE(offset + 8));
            offset += 12;
        }
        offset += 2;
    }

    return buildGeometryFromPositions(positions);
}

function parseAsciiStl(text) {
    const vertexRegex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
    const positions = [];
    let match;
    while ((match = vertexRegex.exec(text)) !== null) {
        positions.push(Number(match[1]), Number(match[2]), Number(match[3]));
    }
    if (positions.length === 0 || positions.length % 9 !== 0) {
        throw new Error('Invalid ASCII STL: could not parse triangle vertices.');
    }
    return buildGeometryFromPositions(positions);
}

function readStlGeometry(stlPath) {
    const buffer = fs.readFileSync(stlPath);
    const binaryFaceCount = buffer.length >= 84 ? buffer.readUInt32LE(80) : 0;
    const expectedBinarySize = 84 + binaryFaceCount * 50;
    const looksBinary = buffer.length >= 84 && expectedBinarySize === buffer.length;

    if (looksBinary) {
        return parseBinaryStl(buffer);
    }

    const text = buffer.toString('utf8');
    if (!text.trimStart().toLowerCase().startsWith('solid')) {
        return parseBinaryStl(buffer);
    }
    return parseAsciiStl(text);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (!token.startsWith('--')) {
            continue;
        }
        const key = token.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith('--')) {
            args[key] = true;
            continue;
        }
        args[key] = next;
        i += 1;
    }
    return args;
}

function reportProgress(value) {
    const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
    process.stderr.write(`Progress: ${percent}%\n`);
}

function validateInput(geometry, params) {
    if (!geometry || !geometry.attributes || !geometry.attributes.position || !geometry.attributes.position.array) {
        throw new Error('Invalid geometry: expected geometry.attributes.position.array');
    }
    if (!geometry.boundingBox || !geometry.boundingBox.min || !geometry.boundingBox.max) {
        throw new Error('Invalid geometry: expected geometry.boundingBox.min/max');
    }
    if (!params) {
        throw new Error('Missing params object.');
    }

    const requiredNumeric = ['toolDiameter', 'stepover', 'cutDepth', 'feedRate', 'plungeRate', 'spindleSpeed', 'safeZ'];
    for (const key of requiredNumeric) {
        if (typeof params[key] !== 'number' || Number.isNaN(params[key])) {
            throw new Error(`Invalid params.${key}: must be a number.`);
        }
    }
    if (params.toolDiameter <= 0) throw new Error('Tool diameter must be positive.');
    if (params.stepover <= 0) throw new Error('Stepover must be positive.');
    if (params.cutDepth <= 0) throw new Error('Cut depth must be positive.');
    if (params.feedRate <= 0) throw new Error('Feed rate must be positive.');
    if (params.plungeRate <= 0) throw new Error('Plunge rate must be positive.');
}

function generateJobResult(geometry, params, onProgress = () => {}) {
    const positions = geometry.attributes.position.array;
    const bb = geometry.boundingBox;
    const stepover = params.toolDiameter * (params.stepover / 100);
    if (stepover <= 0) {
        throw new Error('Stepover must be positive.');
    }

    onProgress(0.05);
    const resolution = stepover / 4;
    const gridX = Math.ceil((bb.max.x - bb.min.x) / resolution) + 1;
    const gridY = Math.ceil((bb.max.y - bb.min.y) / resolution) + 1;
    const heightmap = new Float32Array(gridX * gridY).fill(bb.min.z - 1);

    for (let i = 0; i < positions.length; i += 9) {
        const vA = { x: positions[i], y: positions[i + 1], z: positions[i + 2] };
        const vB = { x: positions[i + 3], y: positions[i + 4], z: positions[i + 5] };
        const vC = { x: positions[i + 6], y: positions[i + 7], z: positions[i + 8] };

        const triBB = {
            min: { x: Math.min(vA.x, vB.x, vC.x), y: Math.min(vA.y, vB.y, vC.y) },
            max: { x: Math.max(vA.x, vB.x, vC.x), y: Math.max(vA.y, vB.y, vC.y) }
        };

        const startX = Math.max(0, Math.floor((triBB.min.x - bb.min.x) / resolution));
        const endX = Math.min(gridX, Math.ceil((triBB.max.x - bb.min.x) / resolution));
        const startY = Math.max(0, Math.floor((triBB.min.y - bb.min.y) / resolution));
        const endY = Math.min(gridY, Math.ceil((triBB.max.y - bb.min.y) / resolution));

        for (let gy = startY; gy < endY; gy++) {
            for (let gx = startX; gx < endX; gx++) {
                const x = bb.min.x + gx * resolution;
                const y = bb.min.y + gy * resolution;

                const z = rayTriangleIntersect(x, y, vA, vB, vC);
                if (z !== null) {
                    const index = gy * gridX + gx;
                    if (z > heightmap[index]) {
                        heightmap[index] = z;
                    }
                }
            }
        }
    }

    onProgress(0.3);
    const toolpath = { rapid: [], cutting: [] };
    let totalCuttingLength = 0;

    const startZ = bb.max.z;
    const zLevels = [];
    for (let z = startZ; z >= bb.min.z; z -= params.cutDepth) {
        zLevels.push(z);
    }
    if (zLevels.length === 0 || zLevels[zLevels.length - 1] > bb.min.z) {
        zLevels.push(bb.min.z);
    }

    let lastPos = null;

    zLevels.forEach((currentZ, zIndex) => {
        onProgress(0.3 + 0.6 * (zIndex / zLevels.length));

        let direction = 0;
        for (let x = bb.min.x; x <= bb.max.x; x += stepover) {
            let currentSegment = [];
            const yRange = direction === 0
                ? { start: bb.min.y, end: bb.max.y, step: resolution }
                : { start: bb.max.y, end: bb.min.y, step: -resolution };

            for (let y = yRange.start; (yRange.step > 0 ? y <= yRange.end : y >= yRange.end); y += yRange.step) {
                const gx = Math.round((x - bb.min.x) / resolution);
                const gy = Math.round((y - bb.min.y) / resolution);
                const index = gy * gridX + gx;

                if (index >= 0 && index < heightmap.length && heightmap[index] >= currentZ) {
                    currentSegment.push({ x, y, z: currentZ });
                } else {
                    if (currentSegment.length > 1) {
                        addPathSegment(currentSegment, toolpath, params, lastPos);
                        lastPos = currentSegment[currentSegment.length - 1];
                    }
                    currentSegment = [];
                }
            }

            if (currentSegment.length > 1) {
                addPathSegment(currentSegment, toolpath, params, lastPos);
                lastPos = currentSegment[currentSegment.length - 1];
            }
            direction = 1 - direction;
        }
    });

    onProgress(0.95);
    const gcode = [];
    gcode.push('(Generated by CLI STL-to-Gcode)');
    gcode.push('(Tool Dia: ' + params.toolDiameter + 'mm, Stepover: ' + params.stepover + '%, Cut Depth: ' + params.cutDepth + 'mm)');
    gcode.push('(Feed: ' + params.feedRate + 'mm/min, Plunge: ' + params.plungeRate + 'mm/min, Spindle: ' + params.spindleSpeed + 'RPM)');
    gcode.push('');
    gcode.push('G90 ; Absolute positioning');
    gcode.push('G21 ; Units to mm');
    gcode.push('G17 ; XY plane selection');
    gcode.push('');
    gcode.push('S' + params.spindleSpeed + ' M3 ; Spindle ON');
    gcode.push('G0 Z' + params.safeZ.toFixed(3) + ' ; Move to safe Z');

    toolpath.rapid.forEach(seg => {
        gcode.push('G0 X' + seg[1].x.toFixed(3) + ' Y' + seg[1].y.toFixed(3));
    });

    toolpath.cutting.forEach(seg => {
        gcode.push('G1 Z' + seg[0].z.toFixed(3) + ' F' + params.plungeRate);
        for (let i = 0; i < seg.length; i++) {
            gcode.push('G1 X' + seg[i].x.toFixed(3) + ' Y' + seg[i].y.toFixed(3) + ' F' + params.feedRate);
            if (i > 0) totalCuttingLength += distance(seg[i - 1], seg[i]);
        }
        gcode.push('G0 Z' + params.safeZ.toFixed(3));
    });

    gcode.push('');
    gcode.push('M5 ; Spindle OFF');
    gcode.push('G0 Z20 ; Retract Z');
    gcode.push('G0 X0 Y0 ; Go to home');
    gcode.push('M2 ; End of program');

    const estimatedTime = (totalCuttingLength / params.feedRate) + (toolpath.cutting.length * (params.safeZ - startZ) / params.plungeRate);

    onProgress(1);
    return {
        gcode,
        toolpath,
        stats: {
            time: estimatedTime.toFixed(2),
            pathLength: totalCuttingLength.toFixed(2)
        }
    };
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || args.h) {
        printUsage();
        process.exit(0);
    }
    if (!args.input) {
        printUsage();
        process.exit(1);
    }

    const inputPath = path.resolve(String(args.input));
    const outPath = path.resolve(String(args.out || 'output.gcode'));
    const toolpathPath = args.toolpath ? path.resolve(String(args.toolpath)) : null;
    const statsPath = args.stats ? path.resolve(String(args.stats)) : null;

    try {
        let geometry;
        let params;
        const inputExt = path.extname(inputPath).toLowerCase();

        if (inputExt === '.stl') {
            geometry = readStlGeometry(inputPath);
            params = loadParams(args);
        } else {
            const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
            geometry = payload.geometry;
            params = loadParams(args, payload.params);
        }

        validateInput(geometry, params);

        const result = generateJobResult(geometry, params, reportProgress);

        fs.writeFileSync(outPath, result.gcode.join('\n') + '\n', 'utf8');
        if (toolpathPath) {
            fs.writeFileSync(toolpathPath, JSON.stringify(result.toolpath, null, 2), 'utf8');
        }
        if (statsPath) {
            fs.writeFileSync(statsPath, JSON.stringify(result.stats, null, 2), 'utf8');
        }

        process.stdout.write(`Wrote G-code: ${outPath}\n`);
        process.stdout.write(`Stats: ${JSON.stringify(result.stats)}\n`);
    } catch (error) {
        process.stderr.write(`Error: ${error.message}\n`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    generateJobResult,
    readStlGeometry
};

            function addPathSegment(segment, toolpath, params, lastPos) {
                 if (!lastPos) lastPos = {x: segment[0].x, y: segment[0].y, z: params.safeZ};
                 const startPoint = segment[0];
                 toolpath.rapid.push([lastPos, {x: startPoint.x, y: startPoint.y, z: params.safeZ}]);
                 toolpath.cutting.push(segment);
            }

            // Moller–Trumbore intersection algorithm
            function rayTriangleIntersect(x, y, vA, vB, vC) {
                const EPSILON = 0.000001;
                const O = {x: x, y: y, z: 10000}; // Ray origin high above the model
                const D = {x: 0, y: 0, z: -1};

                const e1 = {x: vB.x - vA.x, y: vB.y - vA.y, z: vB.z - vA.z};
                const e2 = {x: vC.x - vA.x, y: vC.y - vA.y, z: vC.z - vA.z};

                const h = cross(D, e2);
                const a = dot(e1, h);

                if (a > -EPSILON && a < EPSILON) return null;

                const f = 1.0 / a;
                const s = {x: O.x - vA.x, y: O.y - vA.y, z: O.z - vA.z};
                const u = f * dot(s, h);

                if (u < 0.0 || u > 1.0) return null;

                const q = cross(s, e1);
                const v = f * dot(D, q);

                if (v < 0.0 || u + v > 1.0) return null;

                const t = f * dot(e2, q);
                if (t > EPSILON) return O.z + D.z * t;
                
                return null;
            }

            function dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
            function cross(v1, v2) {
                return { x: v1.y * v2.z - v1.z * v2.y, y: v1.z * v2.x - v1.x * v2.z, z: v1.x * v2.y - v1.y * v2.x };
            }
            function distance(p1, p2) {
                return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
            }