import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'smarthome';

  mobile = AppComponent.isMobile()
  constructor() {
  }
  contentOpened: boolean;
  sidenavOpened: boolean;

  leaveSideNav() {
    this.sidenavOpened = false
  }


  public static isMobile() {
    return window.innerWidth < 600;
  }
}
