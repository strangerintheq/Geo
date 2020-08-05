const { build } = require('esbuild')

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
