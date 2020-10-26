import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'smarthome';

  constructor() {

  }
  contentOpened: boolean;
  sidenavOpened: boolean;
}
