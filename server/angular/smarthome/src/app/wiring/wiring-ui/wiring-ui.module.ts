import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InOutComponent } from './in-out/in-out.component';
import { LedUiComponent } from './led-ui/led-ui.component';
import { BatteryUiComponent } from './battery-ui/battery-ui.component';
import { ViewTemplateComponent } from './view-template/view-template.component';
import { MatIconModule } from '@angular/material/icon';
import { ResistorUiComponent } from './resistor-ui/resistor-ui.component';
import { SwitchComponent } from './switch/switch.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { WireUiComponent } from './wire-ui/wire-ui.component';

@NgModule({
    imports: [
        CommonModule, MatIconModule, MatBottomSheetModule
    ],
    declarations: [InOutComponent, LedUiComponent, BatteryUiComponent, ResistorUiComponent, SwitchComponent, WireUiComponent,
        ViewTemplateComponent], exports: [ViewTemplateComponent, WireUiComponent]
})
export class WiringUiModule { }
