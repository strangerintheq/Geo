import {GeoObject} from "../core/GeoObject";
import {Coordinate} from "../core/Coordinate";
import {Line} from "../primitives/Line";
import {PointSet} from "../primitives/PointSet";

export class Trajectory extends GeoObject {

    line: Line;
    pointSet: PointSet;

    constructor(coordinates: Coordinate[]) {
        super();

        let tooltip = "Траектория";
        this.line = new Line(coordinates, tooltip);
        this.line.tooltip = "Траектория"
        this.primitives.push(this.line);

        this.pointSet = new PointSet(coordinates, tooltip);
        this.pointSet.tooltip = "Траектория"
        this.primitives.push(this.pointSet)
    }


}