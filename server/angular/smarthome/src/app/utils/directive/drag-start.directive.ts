import { Directive, EventEmitter, HostListener, Output, ElementRef, type OnInit, type OnDestroy, Input } from '@angular/core';
import { Vector2 } from '../../wiring/util/vector';
import { VectorDomUtils } from '../../wiring/util/vector-dom-utils';
import { BoundingBox } from '../../wiring/util/bounding-box';





class DragDataHandler {

  private props: Record<string, string> = {}
  setData(key: string, value: string) {
    this.props[key] = value
  }


  getData(key: string) {
    return this.props[key]
  }

  hasKey(key: string) {
    return key in this.props
  }
}

let dragDataHandler: DragDataHandler;
let startEvent: MBDragEvent

export type MBDragEvent = Event & {
  position: Vector2
  offsetPosition: Vector2
  dataTransferHandler: DragDataHandler
  isMouseEvent?: boolean
}



function prepareEvent(event: Event) {
  let position: Vector2
  let offsetPos: Vector2

  if ("TouchEvent" in window && event instanceof TouchEvent) {
    const touch = event.changedTouches[0] || event.targetTouches[0];
    position = new Vector2(touch.clientX, touch.clientY)

    const target = event.target as HTMLElement

    offsetPos = position.subtract(new Vector2(target.getBoundingClientRect()))

  } else if (event instanceof MouseEvent) {
    position = new Vector2(event.clientX, event.clientY)
    offsetPos = new Vector2(event.offsetX, event.offsetY)
  } else {
    debugger
  }

  const evt = event as MBDragEvent
  evt.position = position;
  evt.offsetPosition = offsetPos;
  evt.isMouseEvent = event.type === "mousedown"
  return evt;
}


let dragCpy: HTMLElement



window.addEventListener("touchmove", e => {
  e.preventDefault()
  if (dragCpy) {
    const touch = e.changedTouches[0] || e.targetTouches[0];
    let position = new Vector2(touch.clientX, touch.clientY)

    const offset = startEvent?.offsetPosition
    if (offset) {
      position = position.subtract(offset)
    }
    VectorDomUtils.applyPosition(dragCpy, position)


  }

})


@Directive({
  selector: '[mb-dragstart]',
  standalone: true
})
export class MBDragStartDirective implements OnDestroy {

  @Output("mb-dragstart")
  dragStart = new EventEmitter<MBDragEvent>();

  @Input()
  disableDragPreview = false

  // partial implementation (so far) of dragging simulated without preview on desktop
  @Input()
  mouseDrag = false


  constructor(private elementRef: ElementRef) {}
  ngOnDestroy(): void {
    dragCpy?.remove()
  }


  @HostListener("touchstart", ['$event'])
  @HostListener("dragstart", ['$event'])
  @HostListener("mousedown", ['$event'])
  tap(event: Event) {
    if (event.type === "mousedown" && !this.mouseDrag) {
      return
    }

    const eventRef = prepareEvent(event)
    dragDataHandler = new DragDataHandler()
    eventRef.dataTransferHandler = dragDataHandler

    this.dragStart.emit(eventRef)

    event.stopPropagation()
    dragCpy?.remove()
    startEvent = eventRef

    if ("TouchEvent" in window && event instanceof TouchEvent) {


      if (!this.disableDragPreview) {
        const target = this.elementRef.nativeElement as HTMLElement;


        eventRef.offsetPosition = eventRef.position.subtract(new Vector2(target.getBoundingClientRect()))


        dragCpy = target.cloneNode(true) as HTMLElement
        dragCpy.style.opacity = "0.5"
        dragCpy.style.position = "fixed"
        dragCpy.style.zIndex = "999999"
        dragCpy.style.pointerEvents = "none";

        [...document.querySelectorAll(".dragelementcpy")].forEach(n => n.remove());

        dragCpy.classList.add("dragelementcpy")
        dragCpy.addEventListener('touchstart touchmove touchend', function (e) {
          e.preventDefault();
        });

        target.parentElement.appendChild(dragCpy)
      }
    } else {
      dragCpy = undefined
    }
    //event.preventDefault()
  }
}


@Directive({
  selector: '[mb-dragover]',
  standalone: true
})
export class MBDagOverDirective {

  @Output("mb-dragover")
  dragOver = new EventEmitter<MBDragEvent>();

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener("dragover", ['$event'])
  tap(event: Event) {

    const eventRef = prepareEvent(event)
    eventRef.dataTransferHandler = dragDataHandler

    this.dragOver.emit(eventRef)
  }


  @HostListener("window:touchmove", ["$event"])
  touchover(evt: TouchEvent) {
    evt.preventDefault()
    const movePos = new Vector2(evt)

    const box = new BoundingBox(this.elementRef)
    if (!startEvent) {
      return
    }

    //.withMargin(new Vector2(10, 10))
    if (box.includes(movePos)) {
      const eventRef = prepareEvent(evt)

      eventRef.preventDefault ??= () => {
        //console.log("prevented")
      }

      eventRef.dataTransferHandler = dragDataHandler
      this.dragOver.emit(eventRef)
    }


    for (const leave of leaveDirectives) {
      leave.update(movePos)
    }

    for (const drop of dropDirectives) {
      drop.update(movePos)
    }
  }

}



const leaveDirectives = new Set<MBDragLeaveDirective>()
const dropDirectives = new Set<MBDropDirective>()
@Directive({
  selector: '[mb-dragleave]',
  standalone: true
})
export class MBDragLeaveDirective implements OnInit, OnDestroy {

  @Output("mb-dragleave")
  dragLeave = new EventEmitter<MBDragEvent>();

  private wasInside: boolean;

  constructor(private elementRef: ElementRef<HTMLElement>) {}
  ngOnDestroy(): void {
    leaveDirectives.delete(this)
  }
  ngOnInit(): void {
    leaveDirectives.add(this)
  }

  update(position: Vector2) {
    const isInside = new BoundingBox(this.elementRef).includes(position)

    if (!isInside && this.wasInside) {
      this.dragLeave.emit()
    }
    this.wasInside = isInside
  }
}





@Directive({
  selector: '[mb-drop]',
  standalone: true
})
export class MBDropDirective implements OnInit, OnDestroy {

  @Output("mb-drop")
  drop = new EventEmitter<MBDragEvent>();
  lastPos: Vector2;
  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    dropDirectives.delete(this)
  }
  ngOnInit(): void {
    dropDirectives.add(this)
  }

  @HostListener("window:touchend", ['$event'])
  @HostListener("drop", ['$event'])
  tap(event: Event) {

    const eventRef = prepareEvent(event)
    eventRef.dataTransferHandler = dragDataHandler


    this.drop.emit(eventRef)

    event.stopPropagation()
    //event.preventDefault()
    document.body.style.cursor = "default"

    dragCpy?.remove()
    if (!startEvent) {
      return
    }

    startEvent = undefined


    for (const drop of dropDirectives) {
      if (drop !== this) {
        drop.emitDrop(eventRef)
      }
    }
  }
  emitDrop(eventRef: MBDragEvent) {
    if (!this.lastPos) {
      this.lastPos = eventRef.position
    }

    if (new BoundingBox(this.elementRef).includes(this.lastPos)) {
      this.drop.emit(eventRef)
    }
  }


  update(position: Vector2) {
    this.lastPos = position
  }
}


