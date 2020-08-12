import {GeoObject} from "./GeoObject";
import {GeoPrimitive} from "./GeoPrimitive";
import {Link} from "./Link";

export interface GeoLayer {

    primitives: GeoPrimitive[];
    added: boolean;

    addObject(geoObject: GeoObject): void;
    removeObject(geoObject: GeoObject): void;

    addPrimitive(geoPrimitive: GeoPrimitive): Link;
    removePrimitive(primitive: GeoPrimitive): void;

    setVisible(isVisible: boolean): void;
}
