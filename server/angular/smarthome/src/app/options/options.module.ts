import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionsComponent } from './options.component';
import { RouterModule } from '@angular/router';
import { routes } from './options.routes';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCheckboxModule,
    MatFormFieldModule, MatSlideToggleModule,
  ],
  declarations: [OptionsComponent]
})
export class OptionsModule { }
