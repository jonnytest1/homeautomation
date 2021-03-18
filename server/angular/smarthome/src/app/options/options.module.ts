import { OptionsComponent } from './options.component';
import { routes } from './options.routes';
import { OptionsService } from './options.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCheckboxModule,
    MatFormFieldModule, ReactiveFormsModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
    NgxDropzoneModule, MatIconModule, MatButtonModule
  ],
  declarations: [OptionsComponent],
  providers: [OptionsService]
})
export class OptionsModule { }
