import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [{
  path: 'setup',
  component: SettingsComponent
  // loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
}, {
  path: 'options',
  loadChildren: () => import('./options/options.module').then(m => m.OptionsModule)
}, {
  path: '',
  redirectTo: 'setup',
  pathMatch: 'prefix'
}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
