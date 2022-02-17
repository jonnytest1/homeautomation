import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { InventoryComponent } from './inventory/inventory.component';
import { MonacoEditorComponent } from './monaco-editor/monaco-editor.component';
import { TimersComponent } from './timers/timers.component';
import { TodoComponent } from './todo/todo.component';
import { WiringComponent } from './wiring/wiring.component';

const routes: Routes = [{
  path: 'setup',
  loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
}, {
  path: 'options',
  loadChildren: () => import('./options/options.module').then(m => m.OptionsModule)
}, {
  path: 'camera',
  component: CameraComponent
}, {
  path: 'code',
  component: MonacoEditorComponent
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
}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
