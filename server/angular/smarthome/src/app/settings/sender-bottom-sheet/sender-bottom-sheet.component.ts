import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { Sender, TransformFe } from '../interfaces';
import { SettingsService } from '../settings.service';
import { BatteryComponent } from './battery/battery.component';
import { EventsComponent } from './events/events.component';
import { TimersComponent } from './timers/timers.component';

@Component({
  selector: 'app-sender-bottom-sheet',
  templateUrl: './sender-bottom-sheet.component.html',
  styleUrls: ['./sender-bottom-sheet.component.less']
})
export class SenderBottomSheetComponent implements OnInit {


  public transformer: TransformFe = {}
  title$: Observable<string>;
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: Sender,
    private service: SettingsService,
    private snackbarRef: MatSnackBarRef<any>, private dialog: MatDialog,
    private cdr: ChangeDetectorRef) {
    this.transformer = this.data.transformation[0] || {}

    this.title$ = this.service.getSenderTitleKeys(this.data.id);
  }

  ngOnInit() {
  }


  displayTimers() {
    this.dialog.open(TimersComponent, {
      data: this.data,
      panelClass: 'unlimitedsnackbar',
    });
  }
  displayBattery() {
    this.dialog.open(BatteryComponent, {
      data: this.data,
      panelClass: 'unlimitedsnackbar',
    });
  }

  displayEvents() {
    this.dialog.open(EventsComponent, {
      data: this.data,
      panelClass: 'unlimitedsnackbar',
    });
  }
  testSend() {
    this.service.testSend(this.data.deviceKey).toPromise();
  }
}
