import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SettingsModule } from './settings/settings.module';
import { CameraComponent } from './camera/camera.component';
import { CustomErrorHandler, CustomGlobalErrorHandler } from './global-error-handler';
import { ErrorHandler, NgModule } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TimersComponent } from './timers/timers.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { SettingsService } from './settings.service';
import { TodoComponent } from './todo/todo.component';
import { InventoryComponent } from './inventory/inventory.component';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { RegexHighlightedComponent } from './inventory/regex-highlighted/regex-highlighted.component';
import { WiringModule } from './wiring/wiring.module';
import { MatSortModule } from '@angular/material/sort';
import { IframeComponent } from './iframe/iframe.component';

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    TimersComponent,
    TodoComponent,
    InventoryComponent,
    RegexHighlightedComponent,
    IframeComponent
  ],
  imports: [
    BrowserModule, HammerModule,
    AppRoutingModule, SettingsModule, FormsModule, MatInputModule, WiringModule, MatTableModule,
    MatSidenavModule, MatListModule, MatIconModule, MatGridListModule, MatSortModule,
    BrowserAnimationsModule, NgCircleProgressModule.forRoot()
  ],
  providers: [
    SettingsService,
    {
      // processes all errors
      provide: ErrorHandler,
      useClass: CustomGlobalErrorHandler,
    },
    {
      // interceptor for HTTP errors
      provide: HTTP_INTERCEPTORS,
      useClass: CustomErrorHandler,
      multi: true // multiple interceptors are possible
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}




