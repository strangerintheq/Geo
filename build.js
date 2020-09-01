const { build } = require('esbuild');
const fs = require('fs')

// если не выпилить эти require то сборка не происходит
const target = 'node_modules/cesium/Source/Core/Resource.js';
let data = fs.readFileSync(target, 'utf8');
data = data.replace(/require\("url"\)/g, 'xrequire("url")');
data = data.replace(/require\("zlib"\)/g, 'xrequire("zlib")');
data = data.replace(/require\("http"\)/g, 'xrequire("http")');
data = data.replace(/require\("https"\)/g, 'xrequire("https")');
fs.writeFileSync(target, data, 'utf8');

let t = Date.now();
build({
    entryPoints: [
        './src/GeoApp.ts'
    ],
    outdir: './dist',
    minify: false,
    bundle: true
}).then(() => {
    console.log("build finished in", (Date.now() - t)/1000, "s")
}).catch(() => process.exit(1));
