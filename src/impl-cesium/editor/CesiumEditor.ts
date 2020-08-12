import {
    CallbackProperty,
    Cartesian2, Cartesian3, Color,
    CustomDataSource,
    DataSource, Entity, HeightReference, PolylineGlowMaterialProperty, PolylineOutlineMaterialProperty,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Viewer
} from "cesium";

import {EditorMode} from "../../api/editor/EditorMode";
import {GeoEditor} from "../../api/editor/GeoEditor";
import SvgImages from "./SvgImages";

/**
 * editor layer for Cesium.js
 */
export class CesiumEditor implements GeoEditor {

    private readonly cesiumViewer: Viewer;
    private inputHandler: ScreenSpaceEventHandler;

    private mode: EditorMode = EditorMode.OFF;
    private editorLayer: DataSource = new CustomDataSource();
    private leftDownPosition: Cartesian2;

    private pickedPoint: Entity;
    private pickedLine: Entity;
    private readonly allPoints: Entity[] = [];
    private readonly allLines: Entity[] = [];


    private insertPoint: Entity;

    constructor(cesiumViewer: Viewer) {
        this.cesiumViewer = cesiumViewer;
        this.createInsertPoint();

    }

    private createEditorLine() {
        let linePointsMapper = () => this.allPoints.map(p => p.position['_value']);
        this.editorLine = this.editorLayer.entities.add({
            id: 'line_0',
            polyline: {
                clampToGround: true,
                // depthFailMaterial: new Color(1,0,0),
                positions: new CallbackProperty(linePointsMapper, false),
                width: 5.0,
                material: new PolylineOutlineMaterialProperty({
                    color: Color.fromCssColorString('orange'),
                    outlineColor: Color.fromCssColorString('#0000'),
                    outlineWidth: 2
                })
            }
        });
    }

    private billboardParams(image: string){
        return {
            heightReference : HeightReference.CLAMP_TO_GROUND,
            image,
            eyeOffset: new Cartesian3(0,0, -100000)
        }
    }

    private createInsertPoint() {
        this.insertPoint = this.editorLayer.entities.add({
            show: false,
            billboard: this.billboardParams(SvgImages.dot2())
        });
    }

    private addEditorPoint(position: Cartesian3): void {
        let entity = this.editorLayer.entities.add({
            id: 'point_' + Math.random().toString(36).substring(2),
            position,
            billboard: this.billboardParams(SvgImages.dot())
        });

        this.allPoints.push(entity);

        this.updateEditorLines();

        this.pickedPoint = entity;
    }

    private pickEllipsoid(screenPoint: Cartesian2): Cartesian3 {
        const ellipsoid = this.cesiumViewer.scene.globe.ellipsoid;
        const cartesian3 = this.cesiumViewer.camera.pickEllipsoid(screenPoint, ellipsoid);
        // console.log(cartesian3)
        return cartesian3;
    }

    private pickEditorPoint(pickedObjects: any[]): Entity {
        return pickedObjects.find(pickedObject => {
            let pickedPoint = pickedObject.id;
            let isPointPicked = pickedPoint?.id?.indexOf('point_') > -1;
            return isPointPicked ? pickedPoint : null;
        })?.id;
    }

    private pickEditorLine(pickedObjects: any[]) {
        return pickedObjects.find(pickedObject => {
            let pickedLine = pickedObject?.id;
            let isLinePicked = pickedLine?.id?.indexOf('line_') > -1;
            return isLinePicked ? pickedLine : null;
        })?.id;

    }

    setMode(mode: EditorMode): void {
        this.mode = mode;
        if (mode === EditorMode.OFF) {
            this.detach();
        } else {
            this.attach()
        }
    }

    private mouseMove(screenPoint: Cartesian2) {

        if (this.pickedPoint && this.leftDownPosition) {
            this.translatePoint(screenPoint);

            return
        }

        this.pickEditorEntity(screenPoint);

        if (this.pickedPoint) {
            this.insertPoint.show = false;
        } else {
            if (this.pickedLine) {
                this.insertPoint.position = this.pickEllipsoid(screenPoint);
                this.insertPoint.show = true;
            }
        }



    }

    private pickEditorEntity(screenPoint: Cartesian2) {
        let pickedObject = this.cesiumViewer.scene.drillPick(screenPoint);
        // console.log(pickedObject)
        this.pickedPoint = this.pickEditorPoint(pickedObject);
        this.pickedLine = this.pickEditorLine(pickedObject);
        this.updateMouseCursor();

        // console.log('pickedPoint',this.pickedPoint)
        // console.log('pickedLine',this.pickedLine)
    }

    private updateMouseCursor(){
        let overPrimitive = this.pickedPoint || this.pickedLine;
        this.cesiumViewer.canvas.style.cursor = overPrimitive ? 'pointer' : 'default'
    }

    private leftDown(screenPoint: Cartesian2) {
        this.leftDownPosition = screenPoint;
        // console.log('leftDown', screenPoint);
        this.canRotateGlobe(!this.pickedPoint);
    }

    private leftUp(screenPoint: Cartesian2) {
        let lastLeftDownPos = this.leftDownPosition
        this.leftDownPosition = null;
        if (this.pickedPoint)
            return;
        if (Cartesian2.distance(screenPoint, lastLeftDownPos) > 2)
            return;
        let globePoint = this.pickEllipsoid(screenPoint);
        this.addEditorPoint(globePoint);
        this.updateMouseCursor()
        this.canRotateGlobe(true);
    }

    private detach() {
        this.cesiumViewer.dataSources.remove(this.editorLayer);
        this.inputHandler.destroy();
        this.inputHandler = null;
    }

    private attach() {

        this.cesiumViewer.dataSources.add(this.editorLayer);
        this.inputHandler = new ScreenSpaceEventHandler(this.cesiumViewer.scene.canvas);

        this.inputHandler.setInputAction(
            m => this.mouseMove(m.endPosition), ScreenSpaceEventType.MOUSE_MOVE);

        this.inputHandler.setInputAction(
            m => this.leftDown(m.position), ScreenSpaceEventType.LEFT_DOWN);

        this.inputHandler.setInputAction(
            m => this.leftUp(m.position), ScreenSpaceEventType.LEFT_UP);

        this.inputHandler.setInputAction(
            m => this.leftDoubleClick(m.position), ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    private translatePoint(screenPoint: Cartesian2) {
        let p = this.pickEllipsoid(screenPoint);
        if (!p) return;
        this.pickedPoint.position = p;
    }

    private canRotateGlobe(canRotate: boolean){
        this.cesiumViewer.scene.screenSpaceCameraController.enableRotate = canRotate;
        // this.cesiumViewer.scene.screenSpaceCameraController.enableInputs = canRotate;
    }

    private leftDoubleClick(screenPoint: Cartesian2) {
        if (!this.pickedPoint)
            return;

        this.removePoint(this.pickedPoint);
        this.pickEditorEntity(screenPoint);
    }

    private removePoint(point: Entity) {
        let index = this.allPoints.indexOf(point);
        this.allPoints.splice(index, 1);
        this.editorLayer.entities.remove(point);
        this.updateEditorLines()
    }


    private addEditorLine(i0, i1) {
        let p0 = this.allPoints[i0];
        let p1 = this.allPoints[i1];
        let line = this.editorLayer.entities.add({
            id: `line_${Math.random().toString(36).substring(2)}`,
            polyline: {
                clampToGround: true,
                width: 5.0,
                material: new PolylineOutlineMaterialProperty({
                    color: Color.fromCssColorString('orange'),
                    outlineColor: Color.fromCssColorString('#0000'),
                    outlineWidth: 2
                }),
                positions: new CallbackProperty(() => {
                    return [p0, p1].map(p => p.position['_value'])
                }, false)
            }
        });
        this.allLines.push(line);
        return line;
    }

    private updateEditorLines() {
        this.allLines.forEach(l => this.editorLayer.entities.remove(l));
        this.allLines.splice(0, this.allLines.length);

        let total = this.allPoints.length-1;
        for (let i=0; i<total; i++) {
            this.addEditorLine(i, i+1);
        }
    }
}