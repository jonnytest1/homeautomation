import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { IframeComponent } from './iframe/iframe.component';
import { InventoryComponent } from './inventory/inventory.component';
import { TimersComponent } from './timers/timers.component';
import { TodoComponent } from './todo/todo.component';
import { WiringComponent } from './wiring/wiring.component';
import { InputsComponent } from './inputs/inputs.component';

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
    loadComponent: () => import('./generic-setup/generic-setup.component').then(m => m.GenericSetupComponent)
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
    component: InventoryComponent
  }, {
    path: 'todo',
    component: TodoComponent
  }, {
    path: 'wiring',
    component: WiringComponent
  }, {
    path: 'nodered',
    component: IframeComponent,
    data: {
      src: "https://192.168.178.54/nodered"
    }
  }, {
    path: "inputs",
    component: InputsComponent
  }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
