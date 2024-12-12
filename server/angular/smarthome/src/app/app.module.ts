import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SettingsModule } from './settings/settings.module';
import { CameraComponent } from './camera/camera.component';
import { CustomErrorHandler, CustomGlobalErrorHandler } from './global-error-handler';
import { ErrorHandler, NgModule } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TimersComponent } from './timers/timers.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { SettingsService } from './settings.service';
import { TodoComponent } from './todo/todo.component';
import { InventoryComponent } from './inventory/inventory.component';
import { MatInputModule } from '@angular/material/input';
import { RegexHighlightedComponent } from './inventory/regex-highlighted/regex-highlighted.component';
import { MatSortModule } from '@angular/material/sort';
import { IframeComponent } from './iframe/iframe.component';
/**
 * with sideeffects
 */
import { InputsComponent } from './inputs/inputs.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { InventoryDetailComponent } from './inventory/inventory-detail/inventory-detail.component';

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    // swipe: { direction: DIRECTION_ALL },
  };
}

@NgModule({
  declarations: [
    AppComponent,
    CameraComponent,
    TimersComponent,
    TodoComponent,
    IframeComponent,
    InputsComponent
  ],
  imports: [
    BrowserModule, HammerModule,
    AppRoutingModule, SettingsModule, FormsModule, MatInputModule,
    MatSidenavModule, MatListModule, MatIconModule, MatGridListModule,
    BrowserAnimationsModule, NgCircleProgressModule.forRoot(),
    EffectsModule.forRoot(), InventoryDetailComponent, InventoryComponent,
    StoreModule.forRoot({}, {
      runtimeChecks: {
        // temporary until generic node is refactored for state usage
        strictStateImmutability: true,
        strictActionImmutability: true
      }
    })
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
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}




