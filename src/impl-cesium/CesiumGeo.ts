import {Geo} from "../api/core/Geo";
import {BillboardCollection} from "cesium";
import {GeoLayer} from "../api/core/GeoLayer";
import {CesiumLayer} from "./CesiumLayer";
import {GeoPrimitive} from "../api/core/GeoPrimitive";
import {CesiumLink} from "./CesiumLink";
import {CesiumSetup} from "./CesiumSetup";
import {MouseOverSupport} from "./MouseOverSupport";
import {GeoEditor} from "../api/editor/GeoEditor";
import {CesiumEditor} from "./editor/CesiumEditor";

export class CesiumGeo extends CesiumSetup implements Geo {

    constructor(domElement:HTMLElement, lon:number, lat:number, size:number) {
        super(domElement,lon, lat, size);
        new MouseOverSupport(this.cesium)
    }

     addBillboardCollection(geoPrimitive: GeoPrimitive, data:any[]){
        let bc = new BillboardCollection();
        if (geoPrimitive.tooltip)
            bc['mouseOverText'] = geoPrimitive.tooltip;
        data.forEach(d => bc.add(d));
        this.cesium.scene.primitives.add(bc);
        (<CesiumLink>geoPrimitive.link).billboardCollection = bc;
    }

     removeBillboardCollection(geoPrimitive: GeoPrimitive) {
        let link = <CesiumLink>geoPrimitive.link;
        this.cesium.scene.primitives.remove(link.billboardCollection)
        link.billboardCollection = null;
    }

    addLayer(layer: GeoLayer): void {
        if (layer.added)
            return
        let cesiumLayer = <CesiumLayer>layer;
        this.cesium.dataSources.add(cesiumLayer.dataSource);
        [...cesiumLayer.billboardCollectionsData.keys()].forEach(geoPrimitive => {
            this.addBillboardCollection(geoPrimitive,
                cesiumLayer.billboardCollectionsData.get(geoPrimitive));
        });
        layer.added = true;
    }

    removeLayer(layer: GeoLayer): void {
        if (!layer.added)
            return
        let cesiumLayer = <CesiumLayer>layer;
        this.cesium.dataSources.remove(cesiumLayer.dataSource);
        [...cesiumLayer.billboardCollectionsData.keys()].forEach(geoPrimitive => {
            this.removeBillboardCollection(geoPrimitive);
        });
        layer.added = false
    }

    createLayer(): GeoLayer {
        return new CesiumLayer(this);
    }

    createEditor(): GeoEditor {
        return new CesiumEditor(this.cesium);
    }

    addButton(src: string, callback: () => void): void {
        super.addButton(src, callback)
    }

}