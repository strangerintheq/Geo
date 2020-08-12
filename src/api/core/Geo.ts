import {GeoLayer} from "./GeoLayer";
import {GeoEditor} from "../editor/GeoEditor";

export interface Geo {
    createLayer(): GeoLayer;
    addLayer(layer: GeoLayer): void;
    removeLayer(layer: GeoLayer): void
    createEditor(): GeoEditor;
}