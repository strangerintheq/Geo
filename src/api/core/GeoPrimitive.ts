import {GeoPrimitiveType} from "./GeoPrimitiveType";
import {Coordinate} from "./Coordinate";
import {Link} from "./Link";

export abstract class GeoPrimitive {

    readonly type: GeoPrimitiveType;
    image: string;
    text: string;
    link: Link;
    coordinates: Coordinate[];


    protected constructor(type: GeoPrimitiveType) {
        this.type = type;
    }

    setVisible(isVisible: boolean): void {
        this.link.setVisible(isVisible);
    }

    setLink(link: Link) {
        this.link = link;
    }
}