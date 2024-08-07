import { BatteryComponent } from './battery/battery.component';
import { EventsComponent } from './events/events.component';
import { TimersComponent } from './timers/timers.component';
import { SenderFe } from '../interfaces';
import type { TransformFe } from '../interfaces';
import { SettingsService } from '../../settings.service';
import type { OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';

@Component({
  selector: 'app-sender-bottom-sheet',
  templateUrl: './sender-bottom-sheet.component.html',
  styleUrls: ['./sender-bottom-sheet.component.less']
})
export class SenderBottomSheetComponent implements OnInit {


  public transformer: TransformFe = {};
  title$: Observable<string>;

  sendState = new BehaviorSubject<"pendingrequest" | "default">("default")

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: SenderFe,
    private service: SettingsService,
    private snackbarRef: MatSnackBarRef<unknown>, private dialog: MatDialog,
    private cdr: ChangeDetectorRef) {


    this.transformer = this.data.transformation[0] || {};

    this.title$ = this.service.getSenderTitleKeys(this.data.id);
  }

  isManual() {
    return this.data.type === 'manual';
  }

  ngOnInit() {
    //
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

  async deleteSender() {
    await this.service.deleteSender(this.data.id).toPromise();
    this.snackbarRef.dismissWithAction();
  }
  async send() {
    const dataObj: { [key: string]: unknown } = {
      deviceKey: this.data.deviceKey
    };
    if (!this.isManual()) {
      // dataObj.testsend = true
    }
    if (this.data.transformationAttribute && this.transformer) {
      dataObj[this.data.transformationAttribute] = this.transformer.transformationKey;
    }
    this.sendState.next("pendingrequest")
    try {
      await this.service.send(dataObj).toPromise();
      if (this.transformer && this.transformer.tsTransformation?.includes('delay')
        && this.transformer.tsTransformation.includes('promise')) {
        this.displayTimers();
      }
    } finally {
      this.sendState.next("default")
    }
  }
}
