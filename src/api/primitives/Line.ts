import {GeoPrimitive} from "../core/GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";

export class Line extends GeoPrimitive {

    constructor(coordinates: Coordinate[], tooltip:string = null) {
        super(GeoPrimitiveType.LINE);
        this.coordinates = coordinates;
        this.tooltip = tooltip;
    }

}