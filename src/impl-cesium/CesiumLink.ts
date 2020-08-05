import {Link} from "../api/core/Link";
import {BillboardCollection, Entity} from "cesium";
import {GeoPrimitive} from "../api/core/GeoPrimitive";
import {CesiumGeo} from "./CesiumGeo";

export class CesiumLink implements Link {
    source: GeoPrimitive;
    entity: Entity;
    billboardCollection: BillboardCollection;
    billboardCollectionData: any[];
    readonly cesiumGeo: CesiumGeo;

    constructor(cesiumGeo:CesiumGeo) {
        this.cesiumGeo = cesiumGeo;
    }

    setVisible(isVisible: boolean): void {
        if (this.entity)
            this.entity.show = isVisible;

        if (!isVisible && this.billboardCollection)
            this.cesiumGeo.removeBillboardCollection(this.source);

        if (isVisible && this.billboardCollectionData)
            this.cesiumGeo.addBillboardCollection(this.source, this.billboardCollectionData)

    }

}
