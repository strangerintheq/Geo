import {GeoObject} from "../core/GeoObject";
import {Coordinate} from "../core/Coordinate";
import {Line} from "../primitives/Line";
import {Area} from "../primitives/Area";

import ellipse from "@turf/ellipse";
import point from "turf-point";
import {Title} from "../primitives/Title";

export class ScatteringEllipse extends GeoObject {


    constructor(center: Coordinate, azimuthDeg:number, ao:number, bo:number) {
        super();

        let coordinates: Coordinate[] = this.calcEllipse(center, azimuthDeg, ao, bo);
        this.primitives.push(new Line(coordinates));
        this.primitives.push(new Area(coordinates));
        this.primitives.push(new Title(center, "Эллипс рассеивания"))
    }

    private calcEllipse(center: Coordinate, azimuthDeg:number, ao:number, bo:number): Coordinate[] {

        let turfCenterPoint = point(center);

        let opts: any = {
            angle: azimuthDeg - 90,
            steps: 360
        };

        return ellipse(turfCenterPoint, ao / 1000, bo / 1000, opts)
            .geometry.coordinates[0].map(c => new Coordinate(c[0], c[1]));
    }
}