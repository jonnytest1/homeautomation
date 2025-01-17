import { NgModule } from '@angular/core';
import type { ActivatedRouteSnapshot, DetachedRouteHandle, Routes } from '@angular/router';
import { RouteReuseStrategy, RouterModule, BaseRouteReuseStrategy } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { IframeComponent } from './iframe/iframe.component';
import { InventoryComponent } from './inventory/inventory.component';
import { TimersComponent } from './timers/timers.component';
import { TodoComponent } from './todo/todo.component';
import { InputsComponent } from './inputs/inputs.component';
import { InventoryDetailComponent } from './inventory/inventory-detail/inventory-detail.component';
import { InventoryLocationComponent } from './inventory/inventory-location/inventory-location.component';


const routes: Routes = [
  {
    path: "",
    redirectTo: "shortcut",
    pathMatch: "full"
  },
  {
    path: 'shortcut',
    loadComponent: () => import('./shortcut/shortcut.component').then(m => m.ShortcutComponent)
  },
  {
    path: 'setup',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'generic-setup',
    loadChildren: () => import("./generic-setup/generic-setup-module").then(m => m.GenericSetupModule)

  }, {
    path: 'options',
    loadChildren: () => import('./options/options.module').then(m => m.OptionsModule)
  }, {
    path: 'camera',
    component: CameraComponent
  }, {
    path: 'timers',
    component: TimersComponent
  }, {
    path: 'inventory',
    loadChildren: () => import('./inventory/inventory-module').then(m => m.InventoryModule)
  }, {
    path: 'todo',
    component: TodoComponent
  }, {
    path: 'wiring',
    loadChildren: () => import('./wiring/wiring.module').then(c => c.WiringModule)
  }, {
    path: 'nodered',
    component: IframeComponent,
    data: {
      src: "https://smarthome/nodered"
    }
  }, {
    path: "inputs",
    component: InputsComponent
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  providers: [],
  exports: [RouterModule]
})
export class AppRoutingModule {}



setTimeout(() => {

  import("./generic-setup/generic-setup-module")
  import("./wiring/wiring.module")

}, 1000)