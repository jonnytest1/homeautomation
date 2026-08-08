import { BoundingBox } from '../wiring/util/bounding-box';
import { Vector2 } from '../wiring/util/vector';
import { BehaviorSubject, combineLatest } from 'rxjs';

export class ZoomUtils {


  zoom = 1;
  finalzoom = 1;
  zoomTransform: Vector2

  scale$ = new BehaviorSubject(this.getTransform())
  saveZoomTimeout: number | undefined;

  getDimensions() {
    return Math.floor(100 / this.zoom) + "%"
  }

  getZoomRounded() {
    return Math.round(100 * this.zoom) / 100;
  }
  getTransform() {
    const zoomRounded = this.getZoomRounded()
    return `scale(${zoomRounded})`
  }

  convertWindowPositionToViewPosition(position: Vector2) {

    const zoomRounded = this.getZoomRounded()

    return position.dividedBy(zoomRounded)
  }

  convertViewPositionToWindowPosition(position: Vector2) {

    const zoomRounded = this.getZoomRounded()

    return position.multipliedBy(zoomRounded)
  }


  onPinch(ev: PointerEventInput) {

    this.zoom = this.finalzoom * ev.scale

    this.saveZoom()
    //this.zoomTransform = new Vector2(ev.center)



  }

  onPinchEnd(ev: any) {
    const evt = ev as PointerEventInput


    this.finalzoom = this.zoom
  }

  onscroll(ev: WheelEvent) {

    if (ev.deltaY) {
      if (ev.deltaY < 0) {
        this.zoom *= 1.05
      } else {
        this.zoom /= 1.05
      }
      this.saveZoom()
      //this.zoomTransform = new Vector2(ev)
    }
  }

  saveZoom() {
    clearTimeout(this.saveZoomTimeout);

    this.saveZoomTimeout = window.setTimeout(() => {
      sessionStorage.setItem(
        "node_zoom",
        String(this.zoom)
      );
    }, 250);
  }


  updateBackgroundEl(wrapperElement: HTMLElement, offset = Vector2.ZERO) {
    const backgroundEl = wrapperElement.querySelector<HTMLElement>("#background-drop")
    if (!backgroundEl) {
      return
    }
    const contentDimensions = new BoundingBox(backgroundEl)
    const parentDimensions = new BoundingBox(wrapperElement)

    const needed = parentDimensions.diagonal().added(offset)

    // if (newSCroll.y < 0) {
    //backgroundEl.style.minHeight = contentDimensions.getHeight() - newSCroll.y + "px"
    //}
    //if (newSCroll.x < 0) {
    //backgroundEl.style.minWidth = contentDimensions.getWidth() - newSCroll.x + "px"
    // }
    if (needed.y > contentDimensions.getHeight()) {
      backgroundEl.style.minHeight = needed.y - 12 + "px"
    }
    if (needed.x > contentDimensions.getWidth()) {
      backgroundEl.style.minWidth = needed.x - 12 + "px"
    }
  }
}