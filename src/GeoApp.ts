import {CesiumGeo} from "./impl-cesium/CesiumGeo";
import {Geo} from "./api/core/Geo";
import {ScatteringEllipse} from "./api/objects/ScatteringEllipse";
import {Trajectory} from "./api/objects/Trajectory";
import {Coordinate} from "./api/core/Coordinate";
import SVG from "./api/core/InlineSVG";
import {Model} from "./api/primitives/Model";
import {EditorMode} from "./api/editor/EditorMode";
import InlineSVG from "./api/core/InlineSVG";
import {GeoEditor} from "./api/editor/GeoEditor";
import bezierSpline from "@turf/bezier-spline";
import turfAlong from "@turf/along";
import lineString from "turf-linestring";
import {Line} from "./api/primitives/Line";

window['CESIUM_BASE_URL'] = 'http://localhost:63342/Geo/dist/Cesium';

const lon = 30;
const lat = 60;

const domElement: HTMLElement = document.querySelector('#cesium');
const geo: Geo = new CesiumGeo(domElement, lon, lat, 10);
let layer = geo.createLayer();
geo.addLayer(layer);
const geoEditor: GeoEditor = geo.createEditor();
geoEditor.setMode(EditorMode.LINE_3D);

function bezier1d(p0, p1, p2, t) {
    return Math.pow(1 - t,2)*p0 + 2*t*(1 - t)*p1 + t*t*p2;
}

function along(from, to, dist) {
    const line = lineString([from, to]);
    const options = {units: 'kilometers'};
    const along = turfAlong(line, dist/1000, options).geometry.coordinates;
    return new Coordinate(...along, from[2])
}

function calcRoundCorner(p0: Coordinate, p1: Coordinate, p2: Coordinate, size) {
    p0 = along(p1, p0, size);
    p2 = along(p1, p2, size);
    const roundCorner = [];
    for (let i = 0; i <= 1; i += 0.1) {
        roundCorner.push(new Coordinate(
            bezier1d(p0[0], p1[0], p2[0], i),
            bezier1d(p0[1], p1[1], p2[1], i),
            bezier1d(p0[2], p1[2], p2[2], i),
        ))
    }
    return roundCorner;
}

geo.addButton(InlineSVG.smallCross('red'), () => {
    let c = geoEditor.getData();
    let result = [c[0]];
    for (let i = 1; i < c.length - 1; i++) {
        result.push(...calcRoundCorner(c[i - 1], c[i], c[i + 1], 1000))
    }
    result.push(c[c.length - 1]);
    layer.addPrimitive(new Line(result))
})






// testPrimitives();


function trajectoryData(lon, lat): Coordinate[] {
    let n = 100;
    return Array(n).fill(0).map((_, i) =>
        new Coordinate(lon + i/3,  lat - i/13 + Math.sin(i/10), i*6000))
}

function areaData() {
    return [
        [lon, lat],
        [lon+10, lat],
        [lon+10, lat+10],
        [lon, lat+10]
    ];
}

function testPrimitives() {
    let layer1 = geo.createLayer();
    geo.addLayer(layer1);
    let scatteringEllipse = new ScatteringEllipse(new Coordinate(lon, lat), 45, 10000, 20000);
    layer1.addObject(scatteringEllipse);


    let layer2 = geo.createLayer();

    let trajectory = new Trajectory(trajectoryData(lon, lat));
    trajectory.pointSet.image = SVG.dot('blue');
    layer2.addObject(trajectory);
    geo.addLayer(layer2);

    let layer3 = geo.createLayer();
    geo.addLayer(layer3);
    let tr2 = new Trajectory(trajectoryData(lon + 2, lat + 2));
    tr2.pointSet.image = SVG.dot('green');
    layer3.addObject(tr2);


    let layer4 = geo.createLayer();

    let model = new Model(new Coordinate(lon - 1, lat - 1), "Cesium_Air.glb");
    layer4.addPrimitive(model)
    geo.addLayer(layer4);


    requestAnimationFrame(function upd(t) {

        let c = model.coordinates;
        c[0][0] = lon + Math.cos(t / 1000)
        c[0][1] = lat + Math.sin(t / 1000)
        c[0][2] = 10000 + Math.sin(t / 1000) * 3000
        model.course = -90 - 180 / Math.PI * Math.atan2(
            (c[0][1] - lat),
            (c[0][0] - lon)
        )
        requestAnimationFrame(upd)
    })

}
