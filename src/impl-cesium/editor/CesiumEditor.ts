import {
    CallbackProperty,
    Cartesian2,
    Cartesian3,
    Cartographic,
    Color,
    CustomDataSource,
    DataSource,
    EllipsoidGeodesic,
    Entity,
    HeightReference,
    PolylineOutlineMaterialProperty,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Viewer
} from "cesium";

import {EditorMode} from "../../api/editor/EditorMode";
import {GeoEditor} from "../../api/editor/GeoEditor";
import SvgImages from "./SvgImages";
import {Coordinate} from "../../api/core/Coordinate";

/**
 * editor layer for Cesium.js
 */
export class CesiumEditor implements GeoEditor {

    private readonly cesiumViewer: Viewer;
    private inputHandler: ScreenSpaceEventHandler;

    private mode: EditorMode = EditorMode.OFF;
    private editorLayer: DataSource = new CustomDataSource();

    private insertPoint: Entity;
    private tooltipEntity: Entity;
    private pickedPoint: Entity;
    private pickedLine: Entity;

    private readonly allPoints: Entity[] = [];
    private readonly linkLines: Entity[] = [];
    private readonly groundLines: Entity[] = [];
    private readonly heightLines: Entity[] = [];
    private readonly groundPoints: Entity[] = [];

    private leftDownPosition: Cartesian2;
    private rightDownPosition: Cartesian2;
    private dragStartAltitude: number;

    private readonly geodesic = new EllipsoidGeodesic();
    private insertPointHeight: number = 0;


    constructor(cesiumViewer: Viewer) {
        this.cesiumViewer = cesiumViewer;
        this.createInsertPoint();
        this.createTooltip();
    }

    getData(): Array<Coordinate> {
        return this.allPoints.map(p => {
            let cartesian = this.extractPosition(p);
            let cartographic = Cartographic.fromCartesian(cartesian);
            return new Coordinate(
                cartographic.longitude/Math.PI*180,
                cartographic.latitude/Math.PI*180,
                cartographic.height)
        })
    }

    setMode(mode: EditorMode): void {
        this.mode = mode;
        if (mode === EditorMode.OFF) {
            this.detach();
        } else {
            this.attach()
        }
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

        this.inputHandler.setInputAction(
            m => this.rightDown(m.position), ScreenSpaceEventType.RIGHT_DOWN);

        this.inputHandler.setInputAction(
            m => this.rightUp(m.position), ScreenSpaceEventType.RIGHT_UP);
    }

    private mouseMove(screenPoint: Cartesian2) {

        if (this.pickedPoint && this.rightDownPosition)
            return this.updateAltitude(screenPoint);

        if (this.pickedPoint && this.leftDownPosition)
            return this.translatePoint(screenPoint);


        this.pickEditorEntity(screenPoint);

        if (this.pickedPoint) {
            this.insertPoint.show = false;
            return
        }

        if (this.pickedLine) {
            this.manageInsertPoint(screenPoint);
        } else {
            this.insertPoint.show = false;
        }

    }

    private leftDoubleClick(screenPoint: Cartesian2) {
        if (!this.pickedPoint || ~this.pickedPoint.id.indexOf('ground'))
            return;

        this.removePoint(this.pickedPoint);
        this.pickEditorEntity(screenPoint);
    }

    private leftDown(screenPoint: Cartesian2) {
        this.leftDownPosition = screenPoint;
        // console.log('leftDown', screenPoint);
        this.canRotateGlobe(!this.pickedPoint);
    }

    private rightDown(screenPoint: Cartesian2) {
        this.rightDownPosition = screenPoint;
        if (this.pickedPoint)
            this.dragStartAltitude = this.getHeightAboveSurface(this.pickedPoint);
        this.canPanGlobe(!this.pickedPoint);
    }

    private rightUp(screenPoint: Cartesian2) {
        this.rightDownPosition = null;
        this.dragStartAltitude = null;
    }

    private extractPosition(entity: Entity){
        return entity.position['_value']
    }

    private leftUp(screenPoint: Cartesian2) {
        let lastLeftDownPos = this.leftDownPosition
        this.leftDownPosition = null;
        if (this.pickedPoint)
            return;
        if (Cartesian2.distance(screenPoint, lastLeftDownPos) > 2)
            return;
        if (this.pickedLine) {
            this.insertPointInLine();
        } else {
            this.addPointAtEnd(screenPoint);
        }

        this.updateMouseCursor()
        this.canRotateGlobe(true);
    }

    private addPointAtEnd(screenPoint: Cartesian2) {
        let groundPosition = this.pickPosition(screenPoint);
        let position = groundPosition;
        if (this.allPoints.length) {
            let lastPoint = this.extractPosition(this.allPoints[this.allPoints.length - 1]);
            let globeCartographic = Cartographic.fromCartesian(position);
            let lastPointCartographic = Cartographic.fromCartesian(lastPoint);
            globeCartographic.height = lastPointCartographic.height;
            position = Cartographic.toCartesian(globeCartographic);
        }
        this.addEditorPoint(position, groundPosition);
    }

    private insertPointInLine() {
        let idParts = this.pickedLine.id.split('_');
        let nextPointIndex = +idParts.pop();

        let pos = this.extractPosition(this.insertPoint);
        let cart = Cartographic.fromCartesian(pos);
        cart.height = this.insertPointHeight;
        this.addEditorPoint(Cartographic.toCartesian(cart), pos, nextPointIndex);
        this.insertPoint.show = false;
        this.pickedLine = null;
    }

///
    ///
    ///

    private billboardParams(image: string, clampToGround){
        return {
            heightReference : clampToGround ? HeightReference.RELATIVE_TO_GROUND : HeightReference.NONE,
            image,
            // eyeOffset: new Cartesian3(0,0, -100000)
        }
    }

    private createInsertPoint() {
        this.insertPoint = this.editorLayer.entities.add({
            show: false,
            billboard: this.billboardParams(SvgImages.dot2(), true)
        });
    }

    private addEditorPoint(position: Cartesian3,
                           groundPosition: Cartesian3,
                           insertIndex: number = null): void {

        let id = Math.random().toString(36).substring(2);

        let anchorPoint = this.editorLayer.entities.add({
            id: 'point_' + id,
            position,
            billboard: this.billboardParams(SvgImages.dot(), false)
        });

        let groundPoint = this.editorLayer.entities.add({
            id: 'ground_point_' + id,
            position:groundPosition,
            billboard: this.billboardParams(SvgImages.dot3(), true)
        });

        let arr = [];

        let heightLine =  this.editorLayer.entities.add({
            id: 'height_line_' + id,
            polyline: {
                width: 2.0,
                material: new Color(0,1,0),
                positions: new CallbackProperty(() => {
                    arr[0] = this.extractPosition(groundPoint);
                    arr[1] = this.extractPosition(anchorPoint);
                    return arr;
                }, false)
            }
        });

        if (insertIndex !== null){
            this.allPoints.splice(insertIndex, 0, anchorPoint);
            this.groundPoints.splice(insertIndex, 0, groundPoint);
            this.heightLines.splice(insertIndex, 0, heightLine);
        } else {
            this.allPoints.push(anchorPoint);
            this.groundPoints.push(groundPoint);
            this.heightLines.push(heightLine);
        }


        this.updateEditorLines();

        this.pickedPoint = groundPoint;

        this.updateTooltipForPoint(this.pickedPoint)
    }

    private pickPosition(screenPoint: Cartesian2): Cartesian3 {
        const ellipsoid = this.cesiumViewer.scene.globe.ellipsoid;
        let cartesian3 =
                this.cesiumViewer.camera.pickEllipsoid(screenPoint, ellipsoid);

        return cartesian3;
    }

    private pickEditorPoint(pickedObjects: any[]): Entity {
        return pickedObjects.find(pickedObject => {
            let pickedPoint = pickedObject.id;
            let isPointPicked = pickedPoint?.id?.indexOf('point_') > -1;
            return isPointPicked ? pickedPoint : null;
        })?.id;
    }

    private updateTooltipForPoint(point) {
        this.tooltipEntity.show = !!point;
        if (point) {
            let cartographic = Cartographic.fromCartesian(this.extractPosition(point));
            let lat = this.formatDeg(cartographic.latitude);
            let lon = this.formatDeg(cartographic.longitude);
            // @ts-ignore
            this.tooltipEntity.label.text = `Широта  ${lat}\nДолгота ${lon}\nВысота ${cartographic.height.toFixed(0)}`;
            this.tooltipEntity.position = point.position;
        }
    }

    private formatDeg(n: number){
        return (n/Math.PI*180).toFixed(2)
    }

    private pickEditorLine(pickedObjects: any[]) {
        return pickedObjects.find(pickedObject => {
            let pickedLine = pickedObject?.id;
            let isLinePicked = pickedLine?.id?.indexOf('ground_line_') > -1;
            return isLinePicked ? pickedLine : null;
        })?.id;

    }

    private manageInsertPoint(screenPoint: Cartesian2) {
        let p = Cartographic.fromCartesian(this.pickPosition(screenPoint));
        let idParts = this.pickedLine.id.split('_');
        if (idParts[0] === 'height')
            return
        let p1 = this.extractPoint(idParts);
        let p2 = this.extractPoint(idParts);
        this.geodesic.setEndPoints(p1, p);
        let d1 = this.geodesic.surfaceDistance;
        this.geodesic.setEndPoints(p1, p2);
        let d2 = this.geodesic.surfaceDistance;
        let p3 = Cartographic.toCartesian(this.geodesic.interpolateUsingSurfaceDistance(d1));
        this.assignPointPosition(this.insertPoint, p3);
        this.insertPointHeight = this.lerp(p1.height, p2.height, d1/d2);
        this.insertPoint.show = true;
        this.updateTooltipForPoint(this.insertPoint);
    }

    private extractPoint(idParts: string[]){
        return Cartographic.fromCartesian(this.extractPosition(this.allPoints[+idParts.pop()]));
    }

    private pickEditorEntity(screenPoint: Cartesian2) {
        let pickedObject = this.cesiumViewer.scene.drillPick(screenPoint);
        // console.log(pickedObject)
        this.pickedPoint = this.pickEditorPoint(pickedObject);
        this.updateTooltipForPoint(this.pickedPoint)
        this.pickedLine = this.pickEditorLine(pickedObject);
        this.updateMouseCursor();
    }

    private updateMouseCursor(){
        let overPrimitive = this.pickedPoint || this.pickedLine;
        this.cesiumViewer.canvas.style.cursor = overPrimitive ? 'pointer' : 'default';

    }

    private translatePoint(screenPoint: Cartesian2) {


        let height = this.getHeightAboveSurface(this.pickedPoint);
        if (Math.abs(height)>1)
            return

        let p = this.pickPosition(screenPoint);
        if (!p) return;
        this.assignPointPosition(this.pickedPoint, p);
        this.updateTooltipForPoint(this.pickedPoint);


        if (this.pickedPoint.id.indexOf('ground') > -1) {
            let index = this.groundPoints.indexOf(this.pickedPoint);
            let cartographic = Cartographic.fromCartesian(p);
            let linkedPoint = this.allPoints[index];
            cartographic.height = this.getHeightAboveSurface(linkedPoint);
            this.assignPointPosition(linkedPoint, Cartographic.toCartesian(cartographic));
        } else {
            let index = this.allPoints.indexOf(this.pickedPoint);
            let linkedPoint = this.groundPoints[index];
            this.assignPointPosition(linkedPoint, p);
        }
    }

    private getHeightAboveSurface(point:Entity):number {
        return Cartographic.fromCartesian(this.extractPosition(point)).height
    }

    private assignPointPosition(point:any, p:Cartesian3){
        point.position = p; // ts compile time error crutch
    }

    private canRotateGlobe(canRotate: boolean){
        this.cesiumViewer.scene.screenSpaceCameraController.enableRotate = canRotate;
    }

    private canPanGlobe(canRotate: boolean){
        this.cesiumViewer.scene.screenSpaceCameraController.enableTilt  = canRotate;
    }

    private removePoint(point: Entity) {

        let index = this.allPoints.indexOf(point);
        this.editorLayer.entities.remove(point);
        this.allPoints.splice(index, 1);


        this.editorLayer.entities.remove(this.groundPoints[index])
        this.groundPoints.splice(index, 1);

        this.editorLayer.entities.remove(this.heightLines[index])
        this.heightLines.splice(index, 1);

        this.updateEditorLines()
    }

    private addEditorLine(i0, i1, clampToGround) {
        let p0 = this.allPoints[i0];
        let p1 = this.allPoints[i1];
        let arr = [];

        let id =`line_${i0}_${i1}`;
        if (clampToGround)
            id = 'ground_' + id;

        let material = new PolylineOutlineMaterialProperty({
            color: Color.fromCssColorString('orange'),
            outlineColor: Color.fromCssColorString('#0000'),
            outlineWidth: 2
        });

        let positions = new CallbackProperty(() => {
            arr[0] = this.extractPosition(p0);
            arr[1] = this.extractPosition(p1);
            return arr;
        }, false);

        return this.editorLayer.entities.add({
            id,
            polyline: {
                clampToGround,
                width: 5.0,
                material,
                positions
            }
        });
    }

    private updateEditorLines() {

        this.linkLines.forEach(l => this.editorLayer.entities.remove(l));
        this.linkLines.splice(0, this.linkLines.length);

        this.groundLines.forEach(l => this.editorLayer.entities.remove(l));
        this.groundLines.splice(0, this.groundLines.length);

        let total = this.allPoints.length - 1;
        for (let i=0; i<total; i++) {
            this.linkLines.push(this.addEditorLine(i, i + 1, false));
            this.groundLines.push(this.addEditorLine(i, i + 1, true));
        }
    }

    private createTooltip() {
        this.tooltipEntity = this.editorLayer.entities.add({
            show: false,
            label: {
                disableDepthTestDistance: 1e100,
                showBackground: true,
                pixelOffset: new Cartesian2(0,40),
                font: '16px monospace',
                // eyeOffset: new Cartesian3(0,0,-10000)
            }
        })
    }

    private updateAltitude(screenPoint: Cartesian2) {

        if (this.pickedPoint.id.indexOf('ground')>-1)
            return

        let movingPointPosition = this.extractPosition(this.pickedPoint);

        let cartographic = Cartographic.fromCartesian(movingPointPosition);
        // cartographic.height = 0;
        // let projectedOnSurface = Cartographic.toCartesian(cartographic);
        // let pickedEllipsoidPosition = this.pickEllipsoid(screenPoint);
        // let dist = Cartesian3.distance(projectedOnSurface, pickedEllipsoidPosition);
        // let angle1 = Cartesian3.angleBetween(projectedOnSurface, this.cesiumViewer.camera.position);
        // let angle2 = Cartesian3.angleBetween(pickedEllipsoidPosition, this.cesiumViewer.camera.position);

        // console.log(dist, angle1-angle2);
        // cartographic.height = dist*Math.tan(angle2-angle1);
        // console.log(cartographic.height)
        //
        // let p = Cartographic.toCartesian(cartographic);
        // console.log(p)

        let dy = this.rightDownPosition.y - screenPoint.y;
        let px = this.pixelSize(movingPointPosition);
        cartographic.height = Math.max(0, this.dragStartAltitude + dy*px.y);
        this.assignPointPosition(this.pickedPoint, Cartographic.toCartesian(cartographic));
        this.updateTooltipForPoint(this.pickedPoint);

        return undefined;
    }

    private pixelSize(movingPointPosition) {
        let camera = this.cesiumViewer.camera;
        let scene = this.cesiumViewer.scene;
        let cameraDirection = camera.direction;
        let cameraPosition = camera.position;
        // vector from camera to a primitive
        let toCenter = Cartesian3.subtract(movingPointPosition,
            cameraPosition,
            new Cartesian3()
        );

        // project vector onto camera cameraDirection vector
        let toCenterProj = Cartesian3.multiplyByScalar(
            cameraDirection,
            Cartesian3.dot(cameraDirection, toCenter),
            new Cartesian3()
        );

        let distance = Cartesian3.magnitude(toCenterProj);

        let pixelSize = this.cesiumViewer.camera.frustum.getPixelDimensions(
            scene.drawingBufferWidth,
            scene.drawingBufferHeight,
            distance,
            devicePixelRatio,
            new Cartesian2()
        );
        console.log(pixelSize)

        return pixelSize;
    }

    private lerp(a: number, b: number, t: number) {
        return a + (b-a)*t;
    }
}