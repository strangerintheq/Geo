import {
  Cartesian2,
  Cartographic,
  HorizontalOrigin,
  ScreenSpaceEventHandler,
  VerticalOrigin,
  Math as CesiumMath, ScreenSpaceEventType, Viewer, Entity, ConstantProperty, CallbackProperty
} from "cesium";

export class MouseOverSupport {

  private cesiumViewer:Viewer;
  private entity: Entity;

  constructor(cesiumViewer:Viewer) {

    this.cesiumViewer = cesiumViewer;

    this.entity = cesiumViewer.entities.add({
      label: {
        showBackground: true,
        font: '16px monospace',
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        horizontalOrigin: HorizontalOrigin.LEFT,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian2(15, 0)
      }
    });

    new ScreenSpaceEventHandler(cesiumViewer.scene.canvas).setInputAction(movement => {
      this.handleMouseMove(movement);
    }, ScreenSpaceEventType.MOUSE_MOVE);

  }

  handleMouseMove(movement): void {

    let pickedObject = this.cesiumViewer.scene.pick(movement.endPosition);
    if (!pickedObject) {
      this.entity.show = false;
      return;
    }

    let text = pickedObject.collection && pickedObject.collection.mouseOverText;
    if (!text) {
      text = pickedObject.id && pickedObject.id.mouseOverText; // ellipse
    }

    if (Number.isFinite(pickedObject.id)) {
      text += '\n Время: ' + pickedObject.id + 'c'
    }

    if (!text) {
      this.entity.show = false;
      return;
    }

    let mousePosition = this.cesiumViewer.camera.pickEllipsoid(movement.endPosition);
    let entityPosition = pickedObject.primitive._actualPosition; // point

    if (!entityPosition) { //ellipse
      entityPosition = pickedObject.id &&
          pickedObject.id._position &&
          pickedObject.id._position._value;
    }

    if (entityPosition){
      var cartographic = Cartographic.fromCartesian(entityPosition);
      var longitudeString = CesiumMath.toDegrees(cartographic.longitude).toFixed(2);
      var latitudeString = CesiumMath.toDegrees(cartographic.latitude).toFixed(2);

      text += '\n Широта: ' + latitudeString + '\n Долгота: ' + longitudeString;

      let h = cartographic.height.toFixed(0);
      if (+h)
        text += '\n Высота: ' + h + 'м';
    }

    this.entity.label && this.entity.label.text && (this.entity.label.text = text);
    this.entity.position = mousePosition || entityPosition;
    this.entity.show = true;

  }


}
