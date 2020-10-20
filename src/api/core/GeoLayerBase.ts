import {GeoPrimitive} from "./GeoPrimitive";
import {GeoObject} from "./GeoObject";
import {Link} from "./Link";
import {GeoLayer} from "./GeoLayer";

export abstract class GeoLayerBase implements GeoLayer{

    primitives: GeoPrimitive[] = [];
    added: boolean = false;

    addObject(geoObject: GeoObject): void {
        geoObject.primitives.forEach(primitive => this.add(primitive));
    }

    removeObject(geoObject: GeoObject): void{
        geoObject.primitives.forEach(primitive => this.remove(primitive));
    }

    abstract addPrimitive(geoPrimitive: GeoPrimitive): Link | undefined;

    setVisible(isVisible: boolean): void {
        this.primitives.forEach(p => p.setVisible(isVisible));
    };

    abstract removePrimitive(primitive: GeoPrimitive): void;

    add(primitive: GeoPrimitive) {
        let link: Link|undefined = this.addPrimitive(primitive);
        link && primitive.setLink(link);
        this.primitives.push(primitive);
    }

    remove(primitive: GeoPrimitive) {
        let i = this.primitives.indexOf(primitive);
        this.primitives.splice(i, 1);
        this.removePrimitive(primitive);
    }
}