import {
    CallbackProperty,
    Cartesian3,
    Color, CustomDataSource, DataSource, Entity, HeadingPitchRoll, HeightReference, NearFarScalar,
    PolylineGlowMaterialProperty, Transforms,
} from "cesium";

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

    addPrimitive(geoPrimitive: GeoPrimitive): Link | undefined{
        let link:Link|undefined = undefined;
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

        link && geoPrimitive.setLink(link);
        return link
    }

    removePrimitive(primitive: GeoPrimitive): void {
        if (this.dataSource && this.dataSource.entities && primitive.link && primitive.link['entity']) {
            this.dataSource.entities.remove(primitive.link['entity'])
        }
    }


    private addLinkedEntity(entityData: any): CesiumLink {
        let entity = this.dataSource.entities.add(entityData);
        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.entity = entity;
        return cesiumLink;
    }

    private cesiumTitle(title: Title): CesiumLink{
        const entityData: any = {
            label: {
                scaleByDistance: new NearFarScalar(1.5e2, .5, 1.5e7, .1),
                text: title.text,
            },
        }
        if (title && title.coordinates && title.coordinates.length) {
            entityData.position = DegreesToCartesian3(title.coordinates[0])
        }

        return this.addLinkedEntity(entityData)
    }

    private cesiumPolygon(area: Area): CesiumLink {
        let material = area.texture ? {
            // image: {
            image: { uri: area.texture },
            // color: cesiumColor,
            // },
        } : area.color && Color.fromCssColorString(area.color);

        let polygon: any = {
            material,
        };

        if (area.coordinates) {
            polygon.hierarchy = area.coordinates.map(DegreesToCartesian3);
        };

        return this.addLinkedEntity({
            mouseOverText: area.tooltip,
            polygon
        });
    }

    private cesiumLine(line: Line): CesiumLink {
        const polyline : any= {

            width: 5.0,
            material: new PolylineGlowMaterialProperty({
                color: new Color(1,0,0),
                glowPower: 0.2
            })
        };
        if (line.coordinates) {
            polyline.positions =  line.coordinates.map(DegreesToCartesian3)
        }
        return this.addLinkedEntity({
            mouseOverText: line.tooltip,
            polyline
        });
    }

    private cesiumPointSet(pointSet: PointSet): CesiumLink {
        let cesiumLink = new CesiumLink(this.cesiumGeo);
        cesiumLink.source = pointSet;

        if (pointSet.coordinates) {
            let billboardCollectionData = pointSet.coordinates.map(coordinate => ({
                position: DegreesToCartesian3(coordinate),
                image: pointSet.image
            }));

            this.billboardCollectionsData.set(pointSet, billboardCollectionData)
            cesiumLink.billboardCollectionData = billboardCollectionData;
        }

        return cesiumLink;
    }

    private cesiumModel(model: Model) {
        let heightReference = false ? HeightReference.CLAMP_TO_GROUND : HeightReference.NONE;
        let k = Math.PI/180;
        if (!model || !model.coordinates || !model.coordinates.length)
            return
        return this.addLinkedEntity({

            position: new CallbackProperty(() => {
                let crd = model && model.coordinates && model.coordinates[0];
                return crd && DegreesToCartesian3(crd)
            }, false),

            orientation: new CallbackProperty(() => {
                let crd = model && model.coordinates && model.coordinates[0];
                let position = crd && DegreesToCartesian3(crd);
                let heading =  (model.heading + model.course)*k;
                let pitch = model.pitch*k;
                let roll = model.roll*k;
                let headingPitchRoll = new HeadingPitchRoll( heading, pitch, roll);
                return position && Transforms.headingPitchRollQuaternion(position, headingPitchRoll);
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



function DegreesToCartesian3(pt: number[]):Cartesian3 {
    return Cartesian3.fromDegrees(pt[0], pt[1], pt[2] || 0);
}