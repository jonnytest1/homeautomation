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
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
    declarations: [
        AppComponent,
        CameraComponent
    ],
    imports: [
        BrowserModule, HammerModule,
        AppRoutingModule, SettingsModule, FormsModule,
        MatSidenavModule, MatListModule, MatIconModule,
        BrowserAnimationsModule,
    ],
    providers: [
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
export class AppModule { }




