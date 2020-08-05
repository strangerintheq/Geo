import {GeoLayer} from "../layers/GeoLayer";

export interface Geo {
    createLayer(): GeoLayer;
    addLayer(layer: GeoLayer): void;
    removeLayer(layer: GeoLayer): void
}