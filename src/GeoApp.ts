import {CesiumGeo} from "./impl-cesium/CesiumGeo";
import {Geo} from "./api/core/Geo";
import {ScatteringEllipse} from "./api/objects/ScatteringEllipse";
import {Trajectory} from "./api/objects/Trajectory";
import {Coordinate} from "./api/core/Coordinate";
import SVG from "./api/core/InlineSVG";
import {Model} from "./api/primitives/Model";

window['CESIUM_BASE_URL'] = 'http://localhost:63342/Geo/dist/Cesium';

let lon = 30;
let lat = 60;

let geo: Geo = new CesiumGeo(document.querySelector('#cesium'), lon, lat, 10);

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
let tr2 = new Trajectory(trajectoryData(lon+2, lat+2));
tr2.pointSet.image = SVG.dot('green');
layer3.addObject(tr2);


let layer4 = geo.createLayer();

let model = new Model(new Coordinate(lon-1, lat-1), "Cesium_Air.glb");
model.course = 0;
layer4.addPrimitive(model)
geo.addLayer(layer4);


requestAnimationFrame(function upd(t){

    let c = model.coordinates;
    c[0][0] = lon + Math.cos(t/1000)
    c[0][1] = lat + Math.sin(t/1000)
    c[0][2] = 10000 + Math.sin(t/1000)*3000
    model.course = -90-180/Math.PI*Math.atan2(
        (c[0][1]-lat),
        (c[0][0]-lon)
    )
    requestAnimationFrame(upd)
})
// let toggle = false;
//
// setInterval(() => {
//     toggle = !toggle;
//     if (toggle){
//         geo.addLayer(layer2)
//         geo.removeLayer(layer1)
//
//     } else {
//         geo.removeLayer(layer2)
//         geo.addLayer(layer1)
//     }
//     tr2.setVisible(!toggle)
//
// },1000)


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
