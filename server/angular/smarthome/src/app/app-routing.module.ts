import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonacoEditorComponent } from './monaco-editor/monaco-editor.component';

const routes: Routes = [{
  path: 'setup',
  loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
}, {
  path: 'options',
  loadChildren: () => import('./options/options.module').then(m => m.OptionsModule)
}, {
  path: 'code',
  component: MonacoEditorComponent
}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
