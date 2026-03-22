const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLED_CURA_DIR = path.resolve(__dirname, 'cura');
const BUNDLED_CURA_BIN_DIR = path.join(BUNDLED_CURA_DIR, 'bin');
const BUNDLED_CURA_LIB_DIR = path.join(BUNDLED_CURA_DIR, 'lib');
const BUNDLED_EXTRUDER_DEF = path.join(__dirname, 'fdmextruder.def.json');
const DEFAULT_DEFINITION_SEARCH_PATHS = [__dirname, BUNDLED_CURA_DIR, BUNDLED_CURA_BIN_DIR];

function isExecutable(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

function isExistingFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch {
        return false;
    }
}

function isElfBinary(filePath) {
    if (!isExistingFile(filePath)) {
        return false;
    }

    try {
        const fd = fs.openSync(filePath, 'r');
        const magic = Buffer.alloc(4);
        fs.readSync(fd, magic, 0, magic.length, 0);
        fs.closeSync(fd);
        return magic.equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]));
    } catch {
        return false;
    }
}

function toWslPath(inputPath) {
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    const driveMatch = normalizedPath.match(/^([A-Za-z]):\/(.*)$/);

    if (!driveMatch) {
        throw new Error(`Cannot convert path to WSL format: ${inputPath}`);
    }

    const [, driveLetter, rest] = driveMatch;
    return `/mnt/${driveLetter.toLowerCase()}/${rest}`;
}

function resolveCuraEngineBinary({ curaEnginePath, cwd }) {
    if (curaEnginePath && curaEnginePath !== 'CuraEngine') {
        return curaEnginePath;
    }

    const candidates = [];

    if (process.platform === 'darwin') {
        candidates.push('/Applications/UltiMaker Cura.app/Contents/Frameworks/CuraEngine');
        if (process.arch === 'arm64') {
            candidates.push(path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine.macos-arm64'));
        }
        if (process.arch === 'x64') {
            candidates.push(path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine.macos-x86_64'));
        }
    }

    if (process.platform === 'linux') {
        if (process.arch === 'x64') {
            candidates.push(path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine.linux-x86_64'));
        }
        candidates.push(path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine'));
    }

    candidates.push(
        path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine.exe'),
        path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine'),
        path.resolve(cwd, 'CuraEngine', 'build', 'Release', 'CuraEngine'),
        path.resolve(cwd, 'build', 'Release', 'CuraEngine'),
        path.resolve(cwd, 'CuraEngine', 'build', 'Release', 'CuraEngine.exe'),
        path.resolve(cwd, 'build', 'Release', 'CuraEngine.exe')
    );

    for (const candidate of candidates) {
        if (!isExistingFile(candidate)) {
            continue;
        }
        if (process.platform === 'darwin' && isElfBinary(candidate)) {
            continue;
        }
        if (isExecutable(candidate)) {
            return candidate;
        }
    }

    return '/usr/bin/CuraEngine';
}

function appendEnvPath(existingValue, nextValue) {
    if (!nextValue) {
        return existingValue;
    }

    return existingValue ? `${nextValue}${path.delimiter}${existingValue}` : nextValue;
}

function resolveCuraEngineEnv(baseEnv = process.env) {
    const env = { ...baseEnv };

    if (fs.existsSync(BUNDLED_CURA_BIN_DIR)) {
        env.PATH = appendEnvPath(env.PATH, BUNDLED_CURA_BIN_DIR);
    }

    if (fs.existsSync(BUNDLED_CURA_LIB_DIR)) {
        env.LD_LIBRARY_PATH = appendEnvPath(env.LD_LIBRARY_PATH, BUNDLED_CURA_LIB_DIR);
        env.DYLD_LIBRARY_PATH = appendEnvPath(env.DYLD_LIBRARY_PATH, BUNDLED_CURA_LIB_DIR);
        env.PATH = appendEnvPath(env.PATH, BUNDLED_CURA_LIB_DIR);
    }

    for (const searchPath of DEFAULT_DEFINITION_SEARCH_PATHS) {
        if (fs.existsSync(searchPath)) {
            env.CURA_ENGINE_SEARCH_PATH = appendEnvPath(env.CURA_ENGINE_SEARCH_PATH, searchPath);
        }
    }

    return env;
}

function resolveSpawnConfig({ curaEnginePath, args, cwd }) {
    const useWsl = process.platform === 'win32' && isElfBinary(curaEnginePath);

    if (!useWsl) {
        return {
            command: curaEnginePath,
            args,
            options: {
                cwd,
                stdio: ['ignore', 'pipe', 'pipe'],
                env: resolveCuraEngineEnv(process.env),
                shell: false
            }
        };
    }

    const linuxCwd = toWslPath(cwd);
    const linuxBinaryPath = toWslPath(curaEnginePath);
    const linuxArgs = args.map((arg, index) => {
        if (index > 0 && ['-j', '-l', '-o'].includes(args[index - 1])) {
            return toWslPath(arg);
        }

        return arg;
    });
    const linuxLibDir = fs.existsSync(BUNDLED_CURA_LIB_DIR) ? toWslPath(BUNDLED_CURA_LIB_DIR) : '';
    const linuxSearchPaths = DEFAULT_DEFINITION_SEARCH_PATHS
        .filter((searchPath) => fs.existsSync(searchPath))
        .map((searchPath) => toWslPath(searchPath))
        .join(':');

    return {
        command: 'wsl',
        args: [
            '--cd', linuxCwd,
            'env',
            ...(linuxLibDir ? [`LD_LIBRARY_PATH=${linuxLibDir}`] : []),
            ...(linuxSearchPaths ? [`CURA_ENGINE_SEARCH_PATH=${linuxSearchPaths}`] : []),
            linuxBinaryPath,
            ...linuxArgs
        ],
        options: {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: process.env,
            shell: false
        }
    };
}

function resolveInputPath(inputPath, cwd) {
    return path.isAbsolute(inputPath) ? inputPath : path.resolve(cwd, inputPath);
}

function sanitizeCuraOutput(output = '') {
    return output
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            // Cura can emit a giant warning line that echoes every `-s` override.
            // But sometimes the [ERROR] is appended to the end of this giant line.
            if (trimmed.includes('-s machine_nozzle_offset_y=')) {
                const errorIndex = trimmed.indexOf('[ERROR]');
                if (errorIndex !== -1) {
                    return trimmed.substring(errorIndex);
                }
                return ''; // Strip pure warning lines
            }
            return line;
        })
        .filter(Boolean)
        .join('\n')
        .trim();
}

function sliceStlWithCuraEngine({
    stlPath,
    outputGcodePath,
    definitionPath,
    curaEnginePath = process.env.CURAENGINE_BIN || 'CuraEngine',
    settings = {},
    cwd = process.cwd(),
    timeoutMs = 10 * 60 * 1000
}) {
    if (!stlPath) throw new Error('stlPath is required');
    if (!outputGcodePath) throw new Error('outputGcodePath is required');
    if (!definitionPath) throw new Error('definitionPath is required');

    const resolvedCuraEnginePath = resolveCuraEngineBinary({ curaEnginePath, cwd });
    const resolvedDefinitionPath = resolveInputPath(definitionPath, cwd);
    const resolvedStlPath = resolveInputPath(stlPath, cwd);
    const resolvedOutputGcodePath = resolveInputPath(outputGcodePath, cwd);

    const compatibilityDefaults = {};
    const mergedSettings = { ...compatibilityDefaults, ...settings };

    const args = ['slice', '-j', resolvedDefinitionPath];
    if (isExistingFile(BUNDLED_EXTRUDER_DEF)) {
        args.push('-j', BUNDLED_EXTRUDER_DEF);
    }

    for (const [key, value] of Object.entries(mergedSettings)) {
        args.push('-s', `${key}=${value}`);
    }

    args.push('-l', resolvedStlPath, '-o', resolvedOutputGcodePath);

    return new Promise((resolve, reject) => {
        const spawnConfig = resolveSpawnConfig({ curaEnginePath: resolvedCuraEnginePath, args, cwd });

        const child = spawn(spawnConfig.command, spawnConfig.args, spawnConfig.options);

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            stdout += text;
            process.stdout.write(text);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            stderr += text;
        });

        child.on('error', (error) => {
            clearTimeout(timer);
            if (error && error.code === 'ENOENT') {
                reject(
                    new Error(
                        [
                            `CuraEngine binary not found (${resolvedCuraEnginePath}).`,
                            'Set CURAENGINE_BIN to the full binary path, for example:',
                            `  CURAENGINE_BIN=${path.join(BUNDLED_CURA_BIN_DIR, 'CuraEngine')}`,
                            'Or install CuraEngine into PATH.'
                        ].join('\n')
                    )
                );
                return;
            }
            reject(error);
        });

        child.on('close', (code) => {
            clearTimeout(timer);

            if (timedOut) {
                reject(new Error(`CuraEngine timed out after ${timeoutMs}ms`));
                return;
            }

            if (code !== 0) {
                const cleanedStderr = sanitizeCuraOutput(stderr);
                reject(new Error(`CuraEngine exited with code ${code}\n${cleanedStderr}`));
                return;
            }

            resolve({ code, stdout, stderr, outputGcodePath: resolvedOutputGcodePath });
        });
    });
}

module.exports = { sliceStlWithCuraEngine };

if (require.main === module) {
    const [stlPath, outputGcodePath, definitionPath] = process.argv.slice(2);

    sliceStlWithCuraEngine({
        stlPath,
        outputGcodePath,
        definitionPath,
        settings: {
            layer_height: 1,
            infill_sparse_density: 20,
            speed_print: 60,
            roofing_layer_count: 0,
            flooring_layer_count: 0,

        }
    })
        .then((result) => {
            console.log(`Slicing complete: ${result.outputGcodePath}`);
        })
        .catch((error) => {
            console.error(error.message);
            process.exit(1);
        });
}
