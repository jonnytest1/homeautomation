import { MobileSenderComponent } from './mobile/mobile-sender/mobile-sender.component';
import { SettingsComponent } from './settings.component';
import { SettingsMobileComponent } from './mobile/settings.mobile.component';
import { MobileSenderScanComponent } from './mobile/mobile-sender-scan/mobile-sender-scan.component';
import type { Route } from '@angular/router';


export const routes: Array<Route> = [
  {
    path: '',
    component: SettingsComponent
  }, {
    path: 'mobile',
    component: SettingsMobileComponent
  }, {
    path: 'mobile/senders/:id',
    component: MobileSenderComponent
  }, {
    path: 'mobile/senders/:id/add',
    component: MobileSenderScanComponent
  }
];
