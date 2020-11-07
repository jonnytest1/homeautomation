import { NgModule } from '@angular/core';

import { SettingsComponent } from './settings.component';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { SenderBottomSheetComponent } from './sender-bottom-sheet/sender-bottom-sheet.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReceiverBottomsheetComponent } from './receiver-bottomsheet/receiver-bottomsheet.component';
import { ConnectionBottomsheetComponent } from './connection-bottomsheet/connection-bottomsheet.component';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { AutosavingDirective, ROOT_AUTOSAVE_PATH } from './autosaving/autosaving';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { AutosavingDirectiveProvider } from './autosaving/autosaveProvider';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TransformerDropDownComponent } from './sender-bottom-sheet/transformer-drop-down/transformer-drop-down.component';
import { TimersComponent } from './sender-bottom-sheet/timers/timers.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { RouterModule } from '@angular/router';
import { routes } from './settings.routes';
import { TransformationEditorComponent } from './transformation-editor/transformation-editor.component';
@NgModule({
    declarations: [
        SettingsComponent,
        ConnectionBottomsheetComponent,
        SenderBottomSheetComponent,
        ReceiverBottomsheetComponent,
        AutosavingDirective,
        AutosavingDirectiveProvider,
        CodeEditorComponent,
        TransformerDropDownComponent,
        TimersComponent,
        TransformationEditorComponent
    ],
    imports: [
        CommonModule, FormsModule,
        MatListModule,
        MatIconModule, MatGridListModule, RouterModule.forChild(routes),
        MatCardModule, MatSelectModule, NgCircleProgressModule.forRoot(),
        MatBottomSheetModule, HttpClientModule, MatDialogModule,
        MatSnackBarModule, MatInputModule, MatButtonModule
    ],
    providers: [SettingsService, {
        provide: ROOT_AUTOSAVE_PATH,
        useValue: environment.prefixPath + 'rest/auto/'
    }],
    bootstrap: []
})
export class SettingsModule { }
