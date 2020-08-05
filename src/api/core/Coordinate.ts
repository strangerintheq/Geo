export class Coordinate extends Array<number> {

    constructor(lon:number=0, lat:number=0, alt:number=0) {
        super(lon, lat, alt);
    }

}