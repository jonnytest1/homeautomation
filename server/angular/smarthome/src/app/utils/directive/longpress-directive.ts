import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';


@Directive({
  selector: '[longpress]',
  standalone: true
})
export class LongPressDirective {

  @Output()
  longpress = new EventEmitter<MouseEvent>()


  @Input()
  longPressDelay = 1000

  startTime: number = -1

  longPressTimeout: NodeJS.Timeout | undefined = undefined

  @HostListener("mousedown", ["$event"])
  mouseDown(ev: MouseEvent) {
    this.startTime = Date.now()

    setTimeout(() => {
      this.longPressTimeout = undefined
      if (this.startTime !== -1) {
        this.longpress.emit(ev);
      }
    }, this.longPressDelay)

  }
  @HostListener("mouseup")
  mouseUp() {
    this.startTime = -1
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout)
    }
  }

}