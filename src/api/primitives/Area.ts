import {GeoPrimitive} from "./GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "./GeoPrimitiveType";

export class Area extends GeoPrimitive {

    constructor(coordinates: Coordinate[]) {
        super(GeoPrimitiveType.AREA);
        this.coordinates = coordinates;
    }

}