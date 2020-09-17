const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// remove require calls which breaks esbuild
const target = 'node_modules/cesium/Source/Core/Resource.js';
let data = fs.readFileSync(target, 'utf8');
data = data.replace(/require\("url"\)/g, 'xrequire("url")');
data = data.replace(/require\("zlib"\)/g, 'xrequire("zlib")');
data = data.replace(/require\("http"\)/g, 'xrequire("http")');
data = data.replace(/require\("https"\)/g, 'xrequire("https")');
fs.writeFileSync(target, data, 'utf8');

// build
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




//copy resources
copyFolderSync('node_modules/cesium/Build/Cesium', 'dist/Cesium');

//create html
fs.writeFileSync('dist/index.html', `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <link href="Cesium/Widgets/widgets.css" rel="stylesheet">
</head>
<body style="margin: 0;overflow: hidden">
    <div id="cesium" style="width: 100vw; height:100vh"></div>
    <script src="GeoApp.js"></script>
</body>
</html>
`, 'utf8')



function copyFolderSync(from, to) {
   !fs.existsSync(to) && fs.mkdirSync(to);
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}