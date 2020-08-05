import {GeoObject} from "./GeoObject";
import {Coordinate} from "../core/Coordinate";
import {Line} from "../primitives/Line";
import {PointSet} from "../primitives/PointSet";

export class Trajectory extends GeoObject {

    line: Line;
    pointSet: PointSet;

    constructor(coordinates: Coordinate[]) {
        super();

        this.line = new Line(coordinates);
        this.primitives.push(this.line);

        this.pointSet = new PointSet(coordinates);
        this.primitives.push(this.pointSet)
    }


}