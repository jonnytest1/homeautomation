import { HostListener, inject, Injectable } from "@angular/core"
import { Store } from '@ngrx/store'
import { frontendActions } from './store/action'


@Injectable({ providedIn: "root" })
export class TouchModeService {

  store = inject(Store)


  constructor() {
    window.addEventListener("touchstart", () => this.onTouch())
    window.addEventListener("touchmove", () => this.onTouch())


    window.addEventListener("click", () => this.onClick())
    window.addEventListener("mousemove", () => this.onClick())
  }

  onTouch() {
    this.store.dispatch(frontendActions.updateTouchMode({ touchmode: true }))
  }
  onClick() {
    this.store.dispatch(frontendActions.updateTouchMode({ touchmode: false }))

  }

}