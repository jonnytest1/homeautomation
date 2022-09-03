import { ChangeDetectorRef, Component } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  constructor(private cdr: ChangeDetectorRef) {
    window["defaultLog"] = true
    //
  }
  title = 'smarthome';

  mobile$ = AppComponent.isMobile();
  sidenavOpened: boolean;


  lastOpen: number | null = null

  public static isMobile() {
    return fromEvent(window, 'resize').pipe(
      map(() => window.innerWidth < 600),
      startWith(window.innerWidth < 600)
    );
  }
  openFromContent() {
    this.openSideNav()
  }

  click(event: Event) {
    if (Date.now() - this.lastOpen < 500) {
      return
    }
    const target = event.target as HTMLElement
    target.click()
  }
  openSideNav() {
    this.sidenavOpened = true
    this.lastOpen = Date.now()
    console.log(this.lastOpen)
  }

  leaveContentHover() {
    this.leaveSideNav()
  }
  leaveSideNav() {
    console.log("sidenav init leave")
    this.delayedLeave(() => {
      console.log("sidenavOpened leave")
      this.sidenavOpened = false;
    })
  }
  async delayedLeave(cb: Function) {
    const lastOpen = this.lastOpen
    await new Promise(res => setTimeout(res, 100));
    if (lastOpen == this.lastOpen) {
      cb();
      this.cdr.markForCheck()
    }
  }
}
