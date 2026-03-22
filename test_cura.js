const path = require('path');
const { sliceStlWithCuraEngine } = require(path.resolve('/Users/jungmin/Documents/GitHub/markey/slicer/convert.js'));
sliceStlWithCuraEngine({
    stlPath: '/tmp/dummy.stl',
    outputGcodePath: '/tmp/output.gcode',
    definitionPath: '/Users/jungmin/Documents/GitHub/markey/slicer/fdmprinter.def.json',
    settings: {}
}).catch(e => {
    console.error("CURA ERROR CAUGHT:");
    console.error(e.message);
});
