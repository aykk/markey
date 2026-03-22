const { spawnSync } = require('child_process');
const r = spawnSync('node', ['slicer/convert.js', '/tmp/dummy.stl', '/tmp/output.gcode', 'slicer/fdmprinter.def.json'], { encoding: 'utf8' });
console.log(r.stderr ? r.stderr.split('\n').pop() : r.stdout);
