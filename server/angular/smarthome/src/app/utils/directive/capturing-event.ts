import type { OnDestroy, OnInit } from '@angular/core';
import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[clickcpt]', standalone: true
})
export class CaptureEventDirective implements OnInit, OnDestroy {


  @Output()
  clickcpt = new EventEmitter<MouseEvent>();


  handler = (e: MouseEvent) => {
    this.clickcpt.emit(e)
  }

  constructor(private elementRef: ElementRef<HTMLElement>) { }

  ngOnInit() {
    this.elementRef.nativeElement.addEventListener("click", this.handler, {
      capture: true
    })
  }



  ngOnDestroy() {
    this.elementRef.nativeElement.removeEventListener("click", this.handler, true);
  }
}