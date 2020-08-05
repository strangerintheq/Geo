import {GeoPrimitive} from "../core/GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";

export class Area extends GeoPrimitive {

    constructor(coordinates: Coordinate[]) {
        super(GeoPrimitiveType.AREA);
        this.coordinates = coordinates;
    }

}