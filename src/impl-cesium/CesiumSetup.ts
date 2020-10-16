import {
    Camera,
    CameraEventType,
    Rectangle,
    SceneMode,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Viewer
} from "cesium";

export class CesiumSetup {

    readonly cesium: Viewer;

    constructor(domElement: HTMLElement, lon:number, lat:number, size:number) {
        this.setHomeLocation(lon, lat, size);
        this.cesium = new Viewer(domElement);
        this.disableEntitySelection();
        this.setupCamera();
        this.translateTextMonkeyPatch();
        this.listenerForImageryChangeCrutch();
        this.hideUnnecessaryElements();
    }

    protected disableEntitySelection() {
        var handler = new ScreenSpaceEventHandler(this.cesium.scene.canvas);
        let resetSelectedEntity = (movement) => {
            this.cesium.selectedEntity = undefined;
            this.cesium.trackedEntity = undefined;
        };
        handler.setInputAction(resetSelectedEntity, ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(resetSelectedEntity, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    }

    protected setHomeLocation(lon:number, lat:number, size:number) {
        Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
            lon - size, lat - size,
            lon + size, lat + size);
        Camera.DEFAULT_VIEW_FACTOR = 0;
    }

    protected setupCamera() {
        let viewer = this.cesium;
        viewer.camera.changed.addEventListener( () => {
            if (viewer.camera['_suspendTerrainAdjustment'] && viewer.scene.mode === SceneMode.SCENE3D) {
                viewer.camera['_suspendTerrainAdjustment']= false;
                viewer.camera['_adjustHeightForTerrain']();
            }
        });
        let scene = this.cesium.scene;
        let cameraController = scene.screenSpaceCameraController;
        cameraController.zoomEventTypes = [
            CameraEventType.WHEEL,
            CameraEventType.PINCH,
            CameraEventType.MIDDLE_DRAG
        ];
        cameraController.tiltEventTypes = CameraEventType.RIGHT_DRAG;
    }

    protected translateTextMonkeyPatch() {
        setTimeout( () => {
            let dom = this.cesium.container
            dom.querySelector('button[title="View Home"]')!
                .setAttribute('title', 'К стартовой позиции');
            dom.querySelector('input[placeholder="Enter an address or landmark..."]')!
                .setAttribute('placeholder', 'Введите данные для поиска...');
            dom.querySelector('button[title="Columbus View"]')!
                .setAttribute('title', '2.5D');
        },1000);
    }

    protected listenerForImageryChangeCrutch() {
        setTimeout( () => {

            let imageries = document.querySelector('.cesium-baseLayerPicker-section')!
                .querySelectorAll('.cesium-baseLayerPicker-item');

            imageries.forEach((imagery,index) => {
                imagery.addEventListener('click', () => {
                    console.log('save')
                });
            });

        },1000);
    }

    private hideUnnecessaryElements() {
        let selector = [
            '.cesium-viewer-bottom',
            // '.cesium-viewer-animationContainer',
            // '.cesium-viewer-timelineContainer',
            '.cesium-viewer-fullscreenContainer',
        ].join(',')

        this.cesium.container.querySelectorAll(selector)
            .forEach(node => node.remove());
    }

    addButton(src: string, callback: () => void) {
        const button = document.createElement('button');
        button.className = "cesium-button cesium-toolbar-button";
        button.onclick = callback;
        button.innerHTML = `<img src="${src}">`
        const el =this.cesium.container.querySelector('.cesium-viewer-toolbar');
        el && el.append(button);
    }
}