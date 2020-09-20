import {CesiumGeo} from "./impl-cesium/CesiumGeo";
import {Geo} from "./api/core/Geo";
import {Coordinate} from "./api/core/Coordinate";
import {Model} from "./api/primitives/Model";
import {EditorMode} from "./api/editor/EditorMode";
import InlineSVG from "./api/core/InlineSVG";
import {GeoEditor} from "./api/editor/GeoEditor";
import {Line} from "./api/primitives/Line";
import {GeoPrimitive} from "./api/core/GeoPrimitive";

import turfAlong from "@turf/along";
import turfDistance from "@turf/distance";
import turfLineString from "turf-linestring";

import {
    Cartesian3,
    ClockRange,
    Entity,
    JulianDate,
    LinearApproximation,
    SampledPositionProperty,
    VelocityOrientationProperty
} from "cesium";
import {Area} from "./api/primitives/Area";


document.body.innerHTML += `
    <div style="position: fixed; top:45px; right: 5px">
        <input id="cornerSizeDisplay" value="1000" style="width:50px">
        <input type="range" 
               min="0" max="5000" step="100" value="1000" 
               id="cornerSize" 
               style="width:200px;" 
               oninput="cornerSizeDisplay.value=this.value">
    </div>
`;


let cesiumUrl = document.location.origin + document.location.pathname + '/Cesium';
console.log(cesiumUrl);
window['CESIUM_BASE_URL'] = cesiumUrl;

const params = new URLSearchParams(document.location.search)

const lon = +params.get('lon') || 30;
const lat = +params.get('lat') || 60;

const domElement: HTMLElement = document.querySelector('#cesium');
const geo: Geo = new CesiumGeo(domElement, lon, lat, 0.1);
const geoEditor: GeoEditor = geo.createEditor();

let layer = geo.createLayer();
geo.addLayer(layer);


let editorIsOn = false;
let trajectory: GeoPrimitive;
let plane: Entity;

addRect(lon, lat, 0.00001, 0.009, '#ffffff');
for (let i=-8; i<=8; i+=2)
    i && addRect(lon-0.0001*i, lat-0.0094, 0.00005, 0.0005, '#ffffff');
addRect(lon, lat, 0.001, 0.01, '#999999');

geo.addButton(InlineSVG.smallCross('white'), () => {
    editorIsOn = !editorIsOn;
    geoEditor.setMode(editorIsOn ? EditorMode.LINE_3D : EditorMode.OFF);
})

geo.addButton(InlineSVG.smallCross('red'), () => {
    let data = geoEditor.getData();
    if (!data.length)
        return
    let flyPath: Coordinate[] = roundCorners(data);
    updatePrimitives(flyPath);
    let start = JulianDate.fromDate(new Date());
    let travelTime = configureFlyPath(flyPath, start);
    configureTimeline(start, travelTime);
});

function addRect(lon, lat, w, h, color) {
    let airportCoords = [
        [lon + w, lat + h],
        [lon + w, lat - h],
        [lon - w, lat - h],
        [lon - w, lat + h],
    ].map(p => new Coordinate(...p));
    let airport = new Area(airportCoords);
    airport.color = color
    layer.addPrimitive(airport)
}

function configureFlyPath(result: Coordinate[], start: JulianDate) {
    let spp = plane.position = new SampledPositionProperty();
    plane.orientation = new VelocityOrientationProperty(spp);
    spp.setInterpolationOptions({interpolationAlgorithm: LinearApproximation})
    let prevPosition;
    let travelTime = 0;
    result.forEach((p: Coordinate) => {
        let position = Cartesian3.fromDegrees(p[0], p[1], p[2]);
        if (prevPosition)
            travelTime += Cartesian3.distance(prevPosition, position) / 100;
        prevPosition = position;

        let time = JulianDate.addSeconds(start, travelTime, new JulianDate());
        spp.addSample(time, position);

    });
    return travelTime;
}

function updatePrimitives(flyPath: Coordinate[]) {
    if (plane) {
        try {
            layer.removePrimitive(trajectory);
        } catch (e) {
        }
    } else {
        let model = new Model(new Coordinate(), "Cesium_Air.glb");
        plane = layer.addPrimitive(model)['entity'];
    }
    trajectory = new Line(flyPath);
    layer.addPrimitive(trajectory);
}

function roundCorners(c: Coordinate[]) {
    let result = [c[0]];
    let corner = +(<HTMLInputElement>document.getElementById('cornerSizeDisplay')).value;
    for (let i = 1; i < c.length - 1; i++)
        result.push(...calcRoundCorner(c[i - 1], c[i], c[i + 1], corner));
    result.push(c[c.length - 1]);
    return result;
}

function configureTimeline(start: JulianDate, travelTime: number) {
    let stop = JulianDate.addSeconds(start, travelTime, new JulianDate());
    let viewer = geo['cesium'];
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = ClockRange.CLAMPED; //Loop at the end
    viewer.timeline.zoomTo(start, stop);
}

function bezier1d(p0, p1, p2, t) {
    return Math.pow(1 - t,2)*p0 + 2*t*(1 - t)*p1 + t*t*p2;
}

function along(from, to, dist) {
    const line = turfLineString([from, to]);
    const options = {units: 'kilometers'};
    const totalDistance = turfDistance(from, to, options)*1000;
    dist = Math.min(dist, totalDistance / 2);
    const along = turfAlong(line, dist/1000, options).geometry.coordinates;
    const t = dist / totalDistance;
    const altitude = lerp(from[2], to[2], t)
    return new Coordinate(...along, altitude)
}

function lerp(a, b, t) {
    return a + (b - a)*t;
}

function calcRoundCorner(p0: Coordinate, p1: Coordinate, p2: Coordinate, size) {
    p0 = along(p1, p0, size);
    p2 = along(p1, p2, size);
    const roundCorner = [];
    for (let i = 0; i <= 1; i += 0.025) {
        roundCorner.push(new Coordinate(
            bezier1d(p0[0], p1[0], p2[0], i),
            bezier1d(p0[1], p1[1], p2[1], i),
            bezier1d(p0[2], p1[2], p2[2], i),
        ))
    }
    return roundCorner;
}


// requestAnimationFrame(function upd(t) {
//     if (model) {
//         travelDistance += 1;
//         const options = {units: 'kilometers'};
//         const along = turfAlong(alongPath, travelDistance/1000, options).geometry.coordinates;
//         // console.log(along)
//         // let c = model.coordinates;
//         // c[0][0] = lon + Math.cos(t / 1000);
//         // c[0][1] = lat + Math.sin(t / 1000);
//         // c[0][2] = 10000 + Math.sin(t / 1000) * 3000;
//         // model.course = -90 - 180 / Math.PI * Math.atan2(
//         //     (c[0][1] - lat),
//         //     (c[0][0] - lon)
//         // );
//
//     }
//     requestAnimationFrame(upd);
// })
//
//
//
//
// testPrimitives();
//
// function trajectoryData(lon, lat): Coordinate[] {
//     let n = 100;
//     return Array(n).fill(0).map((_, i) =>
//         new Coordinate(lon + i/3,  lat - i/13 + Math.sin(i/10), i*6000))
// }
//
// function areaData() {
//     return [
//         [lon, lat],
//         [lon+10, lat],
//         [lon+10, lat+10],
//         [lon, lat+10]
//     ];
// }
//
// function testPrimitives() {
//     let layer1 = geo.createLayer();
//     geo.addLayer(layer1);
//     let scatteringEllipse = new ScatteringEllipse(new Coordinate(lon, lat), 45, 10000, 20000);
//     layer1.addObject(scatteringEllipse);
//
//
//     let layer2 = geo.createLayer();
//
//     let trajectory = new Trajectory(trajectoryData(lon, lat));
//     trajectory.pointSet.image = SVG.dot('blue');
//     layer2.addObject(trajectory);
//     geo.addLayer(layer2);
//
//     let layer3 = geo.createLayer();
//     geo.addLayer(layer3);
//     let tr2 = new Trajectory(trajectoryData(lon + 2, lat + 2));
//     tr2.pointSet.image = SVG.dot('green');
//     layer3.addObject(tr2);
//
//
//     let layer4 = geo.createLayer();
//
//     let model = new Model(new Coordinate(lon - 1, lat - 1), "Cesium_Air.glb");
//     layer4.addPrimitive(model)
//     geo.addLayer(layer4);
//
//
//     requestAnimationFrame(function upd(t) {
//
//         let c = model.coordinates;
//         c[0][0] = lon + Math.cos(t / 1000)
//         c[0][1] = lat + Math.sin(t / 1000)
//         c[0][2] = 10000 + Math.sin(t / 1000) * 3000
//         model.course = -90 - 180 / Math.PI * Math.atan2(
//             (c[0][1] - lat),
//             (c[0][0] - lon)
//         )
//         requestAnimationFrame(upd)
//     })
//
// }
