import {
    Cartesian3,
    Color, CustomDataSource, DataSource, Entity, NearFarScalar,
    PolylineGlowMaterialProperty,
} from "cesium";

import {GeoLayer} from "../api/core/GeoLayer";
import {GeoPrimitive} from "../api/core/GeoPrimitive";
import {GeoPrimitiveType} from "../api/core/GeoPrimitiveType";
import {Line} from "../api/primitives/Line";
import {Link} from "../api/core/Link";
import {CesiumLink} from "./CesiumLink";
import {PointSet} from "../api/primitives/PointSet";
import {Area} from "../api/primitives/Area";
import * as Cesium from "cesium";
import {CesiumGeo} from "./CesiumGeo";
import {Title} from "../api/primitives/Title";

export class CesiumLayer extends GeoLayer {

    readonly dataSource: DataSource = new CustomDataSource();
    readonly billboardCollectionsData = new Map<GeoPrimitive, any[]>();
    private cesiumGeo: CesiumGeo;

    constructor(cesiumGeo:CesiumGeo) {
        super();
        this.cesiumGeo = cesiumGeo;
    }

    addPrimitive(geoPrimitive: GeoPrimitive): Link {
        if (geoPrimitive.type === GeoPrimitiveType.LINE)
            return this.cesiumLine(<Line>geoPrimitive)

        if (geoPrimitive.type === GeoPrimitiveType.POINT_SET)
            return this.cesiumPointSet(<PointSet>geoPrimitive);

        if (geoPrimitive.type === GeoPrimitiveType.AREA)
            return this.cesiumPolygon(<Line>geoPrimitive)

        if (geoPrimitive.type === GeoPrimitiveType.TITLE)
            return this.cesiumTitle(<Title>geoPrimitive)
    }

    removePrimitive(primitive: GeoPrimitive): void {

    }


    private addLinkedEntity(entityData: any): CesiumLink {
        let entity = this.dataSource.entities.add(entityData);
        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.entity = entity;
        return cesiumLink;
    }

    private cesiumTitle(title: Title): CesiumLink{
        return this.addLinkedEntity({
            position: DegreesToCartesian3(title.coordinates[0]),
            label: {
                scaleByDistance: new NearFarScalar(1.5e2, .5, 1.5e7, .1),
                text: title.text,
            },
        })
    }

    private cesiumPolygon(area: Area): CesiumLink {
        return this.addLinkedEntity({
            mouseOverText: area.tooltip,
            polygon: {
                hierarchy: area.coordinates.map(DegreesToCartesian3),
                material : Cesium.Color.RED.withAlpha(0.5),
            }
        });
    }

    private cesiumLine(line: Line): CesiumLink {
        return this.addLinkedEntity({
            mouseOverText: line.tooltip,
            polyline: {
                positions: line.coordinates.map(DegreesToCartesian3),
                width: 5.0,
                material: new PolylineGlowMaterialProperty({
                    color: new Color(1,0,0),
                    glowPower: 0.2
                })
            }
        });
    }

    private cesiumPointSet(pointSet: PointSet): CesiumLink {

        let billboardCollectionData = pointSet.coordinates.map(coordinate => ({
            position: DegreesToCartesian3(coordinate),
            image: pointSet.image
        }));

        this.billboardCollectionsData.set(pointSet, billboardCollectionData)

        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.source = pointSet;
        cesiumLink.billboardCollectionData = billboardCollectionData;
        return cesiumLink;
    }

}



function DegreesToCartesian3(pt: number[]) {
    return Cartesian3.fromDegrees(pt[0], pt[1], pt[2] || 0)
}