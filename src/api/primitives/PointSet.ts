import {GeoPrimitive} from "../core/GeoPrimitive";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";

export class PointSet extends GeoPrimitive {

    constructor(coordinates: Coordinate[], tooltip :string ) {
        super(GeoPrimitiveType.POINT_SET);
        this.coordinates = coordinates;
        this.tooltip = tooltip || undefined;
    }


}