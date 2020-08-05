import {GeoPrimitive} from "../core/GeoPrimitive";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";
import {Coordinate} from "../core/Coordinate";

export class Title extends GeoPrimitive {

    constructor(center: Coordinate, text: string) {
        super(GeoPrimitiveType.TITLE);
        this.coordinates = [center];
        this.text = text;
    }
}