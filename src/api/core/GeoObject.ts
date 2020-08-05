import {GeoPrimitive} from "./GeoPrimitive";

export abstract class GeoObject {

    primitives: GeoPrimitive[] = [];

    setVisible(isVisible:boolean){
        this.primitives.forEach(p => p.setVisible(isVisible));
    }

}
