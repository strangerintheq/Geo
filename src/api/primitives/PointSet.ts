import {GeoPrimitive} from "./GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "./GeoPrimitiveType";

export class PointSet extends GeoPrimitive {

    constructor(coordinates: Coordinate[]) {
        super(GeoPrimitiveType.POINT_SET);
        this.coordinates = coordinates;
    }


}