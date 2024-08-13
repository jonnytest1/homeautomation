import { Directive, EventEmitter, HostListener, Output, VERSION, ElementRef, type OnInit, type OnDestroy } from '@angular/core';
import { Vector2 } from '../../wiring/util/vector';
import { VectorDomUtils } from '../../wiring/util/vector-dom-utils';
import { off } from 'process';
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
}



function prepareEvent(event: Event) {
  let position: Vector2
  let offsetPos: Vector2

  if (event instanceof TouchEvent) {
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

  return evt;
}


let dragCpy: HTMLElement



window.addEventListener("touchmove", e => {
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
export class MBDragStartDirective {

  @Output("mb-dragstart")
  dragStart = new EventEmitter<MBDragEvent>();
  constructor(private elementRef: ElementRef) {}

  @HostListener("touchstart", ['$event'])
  @HostListener("dragstart", ['$event'])
  tap(event: Event) {

    const eventRef = prepareEvent(event)
    dragDataHandler = new DragDataHandler()
    eventRef.dataTransferHandler = dragDataHandler

    this.dragStart.emit(eventRef)

    event.stopPropagation()
    startEvent = eventRef

    if (event instanceof TouchEvent) {

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
    const movePos = new Vector2(evt)

    const box = new BoundingBox(this.elementRef)

    //.withMargin(new Vector2(10, 10))
    if (box.includes(movePos)) {
      const eventRef = prepareEvent(evt)

      eventRef.preventDefault = () => {
        console.log("prevented")
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
  isInside: boolean;
  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    dropDirectives.delete(this)
  }
  ngOnInit(): void {
    dropDirectives.add(this)
  }

  @HostListener("touchend", ['$event'])
  @HostListener("drop", ['$event'])
  tap(event: Event) {

    const eventRef = prepareEvent(event)
    eventRef.dataTransferHandler = dragDataHandler


    this.drop.emit(eventRef)

    event.stopPropagation()
    //event.preventDefault()
    document.body.style.cursor = "default"

    startEvent = undefined
    dragCpy?.remove()


    for (const drop of dropDirectives) {
      drop.emitDrop(eventRef)
    }
  }
  emitDrop(eventRef: MBDragEvent) {
    if (this.isInside) {
      this.drop.emit(eventRef)
    }
  }


  update(position: Vector2) {
    this.isInside = new BoundingBox(this.elementRef).includes(position)
  }
}


