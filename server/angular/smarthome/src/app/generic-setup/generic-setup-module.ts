import { NgModule } from '@angular/core';
import { featureName, genericReducer } from './store/reducers';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { GenericSetupComponent } from './generic-setup.component';
import { RouterModule } from '@angular/router';
import { GenericSEtupEffects } from './store/effects';

const storeMod = StoreModule.forFeature(featureName, genericReducer);

@NgModule({
  imports: [
    storeMod,
    GenericSetupComponent,
    EffectsModule.forFeature(GenericSEtupEffects),
    RouterModule.forChild([{
      path: "",
      pathMatch: "prefix",
      component: GenericSetupComponent
    }])]
})
export class GenericSetupModule {

}


// loadComponent: () => import('./generic-setup/generic-setup.component').then(m => m.GenericSetupComponent)