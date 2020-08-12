import {ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer} from "cesium";
import {EditorMode} from "../../api/editor/EditorMode";
import {GeoEditor} from "../../api/editor/GeoEditor";

export class CesiumEditor implements GeoEditor{

    private readonly cesiumViewer: Viewer;
    private mode: EditorMode = EditorMode.OFF;
    private inputHandler: ScreenSpaceEventHandler;

    constructor(cesiumViewer: Viewer) {
        this.cesiumViewer = cesiumViewer;

        this.inputHandler = new ScreenSpaceEventHandler(cesiumViewer.scene.canvas);

        this.inputHandler.setInputAction(
            m => this.handleMouseMove(m), ScreenSpaceEventType.MOUSE_MOVE)
    }

    setMode(mode: EditorMode):void {
        this.mode = mode;
    }

    private handleMouseMove(movement: any) {
        console.log(movement)
    }
}