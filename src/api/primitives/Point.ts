import {GeoPrimitive} from "../core/GeoPrimitive";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";
import {Coordinate} from "../core/Coordinate";

export class Point extends GeoPrimitive {

    constructor(coordinate: Coordinate) {
        super(GeoPrimitiveType.POINT);
        this.coordinates = [coordinate];
    }

}