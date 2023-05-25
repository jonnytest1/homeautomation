import { OptionsComponent } from './options.component';
import { routes } from './options.routes';
import { OptionsService } from './options.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import {
  MatLegacyFormFieldModule as MatFormFieldModule
} from '@angular/material/legacy-form-field';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
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
export class OptionsModule {}
