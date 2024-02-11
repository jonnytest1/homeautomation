import { BoundingBox } from './bounding-box';
import type { Vector2 } from './vector';

export class VectorDomUtils {


  static applyPosition(element: HTMLElement, position: Vector2 | BoundingBox) {
    let pos: Vector2;
    if (position instanceof BoundingBox) {
      pos = position.topLeft;
    } else {
      pos = position;
    }

    element.style.left = pos.xStyle;
    element.style.top = pos.yStyle;
  }

  static applyDimensions(element: HTMLElement, box: BoundingBox) {
    //this.applyPosition(element, box);

    const dimensions = box.diagonal();
    element.style.width = dimensions.xStyle;
    element.style.height = dimensions.yStyle;
  }
  static applyDimensionVector(element: HTMLElement, dimensions: Vector2) {
    //this.applyPosition(element, box);

    element.style.width = dimensions.xStyle;
    element.style.height = dimensions.yStyle;
  }
  static applyRotation(element: HTMLElement, arrowBox: BoundingBox) {
    const rotationOffset = arrowBox.diagonal().length() / 2;
    const degrees = arrowBox.axisRotation();
    const tranform = `translate(-${rotationOffset}px,0px) rotate(${degrees}deg) translate(${rotationOffset}px, 0px)`;
    element.style.transform = tranform;
  }

  static createDiv(boundingBox: BoundingBox) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    this.applyDimensions(div, boundingBox);

    return div;
  }
}
