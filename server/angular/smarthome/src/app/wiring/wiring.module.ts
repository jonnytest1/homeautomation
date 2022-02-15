import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { ConnectionViewComponent } from './connection-view/connection-view.component';
import { NetDisplayComponent } from './connection-view/net-display/net-display.component';
import { ExamplePickerComponent } from './example-wires/example-picker/example-picker.component';
import { LocalStorageSerialization } from './storage';
import { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import { WiringUiModule } from './wiring-ui/wiring-ui.module';
import { WiringComponent } from './wiring.component';

@NgModule({
    imports: [
        CommonModule, WiringUiModule,
        MatSidenavModule,
        MatSortModule, MatIconModule,
    ],
    declarations: [WiringComponent, NetDisplayComponent, ConnectionViewComponent, ExamplePickerComponent],
    exports: [],
    providers: [LocalStorageSerialization]
})
export class WiringModule { }