import {GeoPrimitive} from "./GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "./GeoPrimitiveType";

export class Line extends GeoPrimitive {



    constructor(coordinates: Coordinate[]) {
        super(GeoPrimitiveType.LINE);
        this.coordinates = coordinates;
    }

}