import { ComponentType } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, ContentChild, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { CanvasUtil } from '../utils/context';
import { ConnectionBottomsheetComponent } from './connection-bottomsheet/connection-bottomsheet.component';
import { ConnectionHandler } from './connection-handler';
import { ReceiverBottomsheetComponent } from './receiver-bottomsheet/receiver-bottomsheet.component';
import { Receiver, Sender } from './interfaces';
import { SenderBottomSheetComponent } from './sender-bottom-sheet/sender-bottom-sheet.component';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.less']
})
export class SettingsComponent implements OnInit, AfterViewInit {

  senders: Array<Sender>;

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement>;
  bottomSheetRef: MatSnackBarRef<any>;
  connectionHandler: ConnectionHandler;
  receivers: any[];
  data$: Observable<[Sender[], any[]]>;

  setActive(sender: Sender, event: MouseEvent) {
    this.openSnackBar(sender, SenderBottomSheetComponent);
    this.connectionHandler.setAcvtiveSender(sender);
    event.stopPropagation();
  }

  constructor(private bottomSheet: MatBottomSheet, private snack: MatSnackBar, service: SettingsService, private cdr: ChangeDetectorRef) {
    Promise.all([service.getSenders().toPromise().then(senders => {
      this.senders = senders;
      return senders;
    }),
    service.getReceivers().toPromise().then(receivers => {
      this.receivers = receivers;
      return receivers;
    })]).then(data => {
      this.connectionHandler = new ConnectionHandler(data[0], data[1], this.openSnackBar.bind(this));
      if (this.canvas) {
        this.connectionHandler.setCanvas(this.canvas.nativeElement);
      }
      this.connectionHandler.randomize();
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.connectionHandler) {
      this.connectionHandler.setCanvas(this.canvas.nativeElement);
    }
  }

  receiverClick(item: Receiver) {
    const newConnection = this.connectionHandler.addConnection(item);
    if (newConnection) {
      this.connectionHandler.drawConnections();
      this.openSnackBar(newConnection);
    } else {
      this.openSnackBar(item);
    }
  }

  senderAddClick(sender: Sender) {
    this.connectionHandler.startAdd(sender);
  }

  wrapperClick() {
    if (this.connectionHandler) {
      this.connectionHandler.reset();
    }
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
      this.bottomSheetRef = undefined;
    }
  }
  openSnackBar(config, type: ComponentType<any> = ReceiverBottomsheetComponent) {
    if (this.bottomSheetRef) {
      this.bottomSheetRef.dismiss();
    }

    this.bottomSheetRef = this.snack.openFromComponent(type, {
      panelClass: 'unlimitedsnackbar',
      data: config,
    });
  }
}
