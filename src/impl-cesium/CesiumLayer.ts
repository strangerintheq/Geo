import {
    Cartesian3,
    Color, CustomDataSource, DataSource, NearFarScalar,
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

    cesiumTitle(title: Title):CesiumLink{
        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.entity = this.dataSource.entities.add({
            position: DegreesToCartesian3(title.coordinates[0]),
            label: {
                scaleByDistance: new NearFarScalar(1.5e2, .5, 1.5e7, .1),
                text: title.text,
            },
        });
        return cesiumLink
    }

    cesiumPolygon(polygon: Area):CesiumLink {

        let polygonData = {
            hierarchy: polygon.coordinates.map(DegreesToCartesian3),
            material : Cesium.Color.RED.withAlpha(0.5),
        };

        let polygonEntityData = {polygon :polygonData};
        // @ts-ignore
        let entity = this.dataSource.entities.add(polygonEntityData);

        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.entity = entity;
        return cesiumLink;
    }

    cesiumLine(line: Line): CesiumLink {

        let polyline = {
            positions: line.coordinates.map(DegreesToCartesian3),
            width: 5.0,
            material: new PolylineGlowMaterialProperty({
                color: new Color(1,0,0),
                glowPower: 0.2
            })
        };

        let entity = this.dataSource.entities.add({polyline});
        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.entity = entity;
        return cesiumLink;
    }

    cesiumPointSet(pointSet: PointSet): CesiumLink {

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