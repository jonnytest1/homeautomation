import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[dbltap]',
  standalone: true
})
export class DblClickDirective {

  @Output()
  dbltap = new EventEmitter();
  constructor() {}


  private lastTap = -1;

  @HostListener('dblclick', ['$event'])

  emitDouble(event) {
    event.stopPropagation()
    this.dbltap.emit()
  }


  @HostListener("touchend", ['$event'])
  tap(event) {

    if (this.lastTap > (Date.now() - 500)) {
      this.emitDouble(event)
    } else {
      this.lastTap = Date.now()
    }
  }

}
