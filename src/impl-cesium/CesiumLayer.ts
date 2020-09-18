import {
    CallbackProperty,
    Cartesian3,
    Color, CustomDataSource, DataSource, Entity, HeadingPitchRoll, HeightReference, NearFarScalar,
    PolylineGlowMaterialProperty, Transforms,
} from "cesium";

import {GeoLayer} from "../api/core/GeoLayer";
import {GeoPrimitive} from "../api/core/GeoPrimitive";
import {GeoPrimitiveType} from "../api/core/GeoPrimitiveType";
import {Line} from "../api/primitives/Line";
import {Link} from "../api/core/Link";
import {CesiumLink} from "./CesiumLink";
import {PointSet} from "../api/primitives/PointSet";
import {Area} from "../api/primitives/Area";
import {CesiumGeo} from "./CesiumGeo";
import {Title} from "../api/primitives/Title";
import {Model} from "../api/primitives/Model";
import {GeoLayerBase} from "../api/core/GeoLayerBase";

export class CesiumLayer extends GeoLayerBase {

    readonly dataSource: DataSource = new CustomDataSource();
    readonly billboardCollectionsData = new Map<GeoPrimitive, any[]>();
    private cesiumGeo: CesiumGeo;

    constructor(cesiumGeo:CesiumGeo) {
        super();
        this.cesiumGeo = cesiumGeo;
    }

     addPrimitive(geoPrimitive: GeoPrimitive): Link {
        let link:Link;
        if (geoPrimitive.type === GeoPrimitiveType.LINE)
            link =  this.cesiumLine(<Line>geoPrimitive);

        if (geoPrimitive.type === GeoPrimitiveType.POINT_SET)
            link =  this.cesiumPointSet(<PointSet>geoPrimitive);

        if (geoPrimitive.type === GeoPrimitiveType.AREA)
            link =  this.cesiumPolygon(<Line>geoPrimitive);

        if (geoPrimitive.type === GeoPrimitiveType.TITLE)
            link =  this.cesiumTitle(<Title>geoPrimitive);

        if (geoPrimitive.type === GeoPrimitiveType.MODEL)
            link =  this.cesiumModel(<Model>geoPrimitive);

         geoPrimitive.setLink(link);
         return link
    }

    removePrimitive(primitive: GeoPrimitive): void {
        this.dataSource.entities.remove(primitive.link['entity'])
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
                material : Color.RED.withAlpha(0.5),
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

    private cesiumModel(model: Model) {
        let heightReference = false ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE;
        let k = Math.PI/180;
        return this.addLinkedEntity({

            position: new CallbackProperty(() => {
                return DegreesToCartesian3(model.coordinates[0])
            }, false),

            orientation: new CallbackProperty(() => {
                let position = DegreesToCartesian3(model.coordinates[0]);
                let heading =  (model.heading + model.course)*k;
                let pitch = model.pitch*k;
                let roll = model.roll*k;
                let headingPitchRoll = new HeadingPitchRoll( heading, pitch, roll);
                return Transforms.headingPitchRollQuaternion(position, headingPitchRoll);
            }, false),

            model: {
                uri: model.url,
                scale: 0.01,
                minimumPixelSize: 64,
                maximumScale: 500,
                heightReference
            }
        });
    }
}



function DegreesToCartesian3(pt: number[]) {
    return Cartesian3.fromDegrees(pt[0], pt[1], pt[2] || 0)
}