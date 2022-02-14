import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { NetDisplayComponent } from './net-display/net-display.component';
import { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import { WiringUiModule } from './wiring-ui/wiring-ui.module';
import { WiringComponent } from './wiring.component';

@NgModule({
    imports: [
        CommonModule, WiringUiModule,
        MatSidenavModule,
        MatSortModule, MatIconModule,
    ],
    declarations: [WiringComponent, NetDisplayComponent], exports: []
})
export class WiringModule { }