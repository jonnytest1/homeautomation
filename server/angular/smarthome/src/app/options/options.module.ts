import { OptionsComponent } from './options.component';
import { routes } from './options.routes';
import { OptionsService } from './options.service';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
@NgModule({
  imports: [
    RouterModule.forChild(routes),

    OptionsComponent
  ],
  declarations: [],
  providers: [OptionsService]
})
export class OptionsModule {}
