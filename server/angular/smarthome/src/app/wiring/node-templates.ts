import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import { LedUiComponent } from './wiring-ui/led-ui/led-ui.component';
import { PicoUiComponent } from './wiring-ui/pico-ui/pico-ui.component';
import { RelayUiComponent } from './wiring-ui/relay-ui/relay-ui.component';
import { ResistorUiComponent } from './wiring-ui/resistor-ui/resistor-ui.component';
import { SwitchComponent } from './wiring-ui/switch/switch.component';
import { TransformatorUiComponent } from './wiring-ui/transformator-ui/transformator-ui.component';

export const NODE_TEMPLATES = [
  BatteryUiComponent,
  LedUiComponent,
  ResistorUiComponent,
  SwitchComponent,
  RelayUiComponent,
  TransformatorUiComponent,
  PicoUiComponent
];
