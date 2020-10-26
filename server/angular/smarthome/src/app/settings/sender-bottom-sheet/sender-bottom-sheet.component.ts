import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { Sender } from '../interfaces';
import { SettingsService } from '../settings.service';
import { BatteryComponent } from './battery/battery.component';

@Component({
  selector: 'app-sender-bottom-sheet',
  templateUrl: './sender-bottom-sheet.component.html',
  styleUrls: ['./sender-bottom-sheet.component.less']
})
export class SenderBottomSheetComponent implements OnInit {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: Sender,
    private service: SettingsService,
    private snackbarRef: MatSnackBarRef<any>, private dialog: MatDialog) {
  }

  ngOnInit() {
  }
  displayBattery() {
    this.dialog.open(BatteryComponent, {
      data: this.data.batteryEntries,
      panelClass: 'unlimitedsnackbar',
    });
  }
  testSend() {
    this.service.testSend(this.data.deviceKey).toPromise();
  }
}
