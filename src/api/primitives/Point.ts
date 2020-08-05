import {GeoPrimitive} from "./GeoPrimitive";
import {GeoPrimitiveType} from "./GeoPrimitiveType";
import {Coordinate} from "../core/Coordinate";

export class Point extends GeoPrimitive {

    constructor(coordinate: Coordinate) {
        super(GeoPrimitiveType.POINT);
        this.coordinates = [coordinate];
    }

}