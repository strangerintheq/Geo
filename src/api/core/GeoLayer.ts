import {GeoObject} from "./GeoObject";
import {GeoPrimitive} from "./GeoPrimitive";
import {Link} from "./Link";

export abstract class GeoLayer {

    primitives: GeoPrimitive[] = [];
    added: boolean;

    addObject(geoObject: GeoObject): void {
        geoObject.primitives.forEach(primitive => this.add(primitive));
    }

    removeObject(geoObject: GeoObject): void{
        geoObject.primitives.forEach(primitive => this.remove(primitive));
    }

    abstract addPrimitive(geoPrimitive: GeoPrimitive): Link;

    setVisible(isVisible: boolean): void {
        this.primitives.forEach(p => p.setVisible(isVisible));
    };

    abstract removePrimitive(primitive: GeoPrimitive): void;

    add(primitive: GeoPrimitive) {
        let link: Link = this.addPrimitive(primitive);
        primitive.setLink(link);
        this.primitives.push(primitive);
    }

    remove(primitive: GeoPrimitive) {
        let i = this.primitives.indexOf(primitive);
        this.primitives.splice(i, 1);
        this.removePrimitive(primitive);
    }
}
