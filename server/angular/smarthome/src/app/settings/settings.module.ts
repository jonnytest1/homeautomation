import { SettingsComponent } from './settings.component';
import { SenderBottomSheetComponent } from './sender-bottom-sheet/sender-bottom-sheet.component';
import { ReceiverBottomsheetComponent } from './receiver-bottomsheet/receiver-bottomsheet.component';
import { ConnectionBottomsheetComponent } from './connection-bottomsheet/connection-bottomsheet.component';
import { AutosavingDirective, ROOT_AUTOSAVE_PATH } from '../autosaving/autosaving';
import { AutosavingDirectiveProviderDirective } from '../autosaving/autosaveProvider';
import { TransformerDropDownComponent } from './sender-bottom-sheet/transformer-drop-down/transformer-drop-down.component';
import { TimersComponent } from './sender-bottom-sheet/timers/timers.component';
import { routes } from './settings.routes';
import { TransformationEditorComponent } from './transformation-editor/transformation-editor.component';
import { SettingsMobileComponent } from './mobile/settings.mobile.component';
import { MobileSenderComponent } from './mobile/mobile-sender/mobile-sender.component';
import { environment } from '../../environments/environment';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { MonacoEditorComponent } from '../monaco-editor/monaco-editor.component';
import { DebounceClickDirective } from '../utils/directive/debounce-click';
import { Injectable, NgModule } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { HammerGestureConfig, HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { MobileTimersComponent } from './mobile/timers/timers.component';

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    // swipe: { direction: hammer.DIRECTION_ALL },
    pinch: { enable: false },
    rotate: { enable: false }
  };
}
@NgModule({
  declarations: [
    SettingsComponent,
    ConnectionBottomsheetComponent,
    SenderBottomSheetComponent,
    ReceiverBottomsheetComponent,
    CodeEditorComponent, MobileSenderComponent,
    TransformerDropDownComponent,
    TimersComponent,
    TransformationEditorComponent, SettingsMobileComponent, DebounceClickDirective, MobileTimersComponent
  ],
  imports: [
    MonacoEditorComponent,
    CommonModule,
    FormsModule,
    MatListModule, MatTabsModule, HammerModule,
    MatIconModule,
    MatGridListModule,
    RouterModule.forChild(routes),
    MatCardModule, MatSelectModule,
    AutosavingDirective,
    AutosavingDirectiveProviderDirective,
    NgCircleProgressModule.forRoot(),
    MatBottomSheetModule, HttpClientModule, MatDialogModule,
    MatSnackBarModule, MatInputModule, MatButtonModule
  ],
  providers: [{
    provide: HAMMER_GESTURE_CONFIG,
    useClass: MyHammerConfig
  },],
  bootstrap: []
})
export class SettingsModule {}
