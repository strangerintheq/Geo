import {Point} from "./Point";
import {Coordinate} from "../core/Coordinate";
import {GeoPrimitiveType} from "../core/GeoPrimitiveType";

export class Model extends Point {

    url: string;
    heading: number = 0;
    course: number = 0;
    pitch: number = 0;
    roll: number = 0;

    constructor(coordinate: Coordinate, url: string, tooltip :string) {
        super(coordinate, tooltip);
        this.url = url;
        this.type = GeoPrimitiveType.MODEL;
    }
}