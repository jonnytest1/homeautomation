import { ComponentType } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, ContentChild, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {

  senders: Array<Sender>;

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement>;
  snackbarRef: MatSnackBarRef<any>;
  connectionHandler: ConnectionHandler;
  receivers: any[];
  data$: Observable<[Sender[], any[]]>;


  interval
  setActive(sender: Sender, event: MouseEvent) {
    this.openSnackBar(sender, SenderBottomSheetComponent);
    this.connectionHandler.setAcvtiveSender(sender);
    event.stopPropagation();
  }

  constructor(private bottomSheet: MatBottomSheet, private snack: MatSnackBar, service: SettingsService, private cdr: ChangeDetectorRef) {
    this.connectionHandler = new ConnectionHandler(this.openSnackBar.bind(this));

    this.interval = setInterval(async () => {
      const senders = await service.getSenders().toPromise();
      senders.forEach(sender => {
        let foundSender = false;
        this.senders.forEach(sender2 => {
          if (sender.id == sender2.id) {
            foundSender = true;
            sender2.batteryEntries = sender.batteryEntries;
          }
        })
        if (!foundSender) {
          this.senders.push(sender);
        }
      })

    }, 3000)

    Promise.all([service.getSenders().toPromise().then(senders => {
      this.senders = senders;
      return senders;
    }),
    service.getReceivers().toPromise().then(receivers => {
      this.receivers = receivers;
      return receivers;
    })]).then(data => {
      if (this.canvas) {
        this.connectionHandler.setCanvas(this.canvas.nativeElement);
      }
      this.cdr.detectChanges();
    });
  }
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.connectionHandler) {
      this.connectionHandler.setCanvas(this.canvas.nativeElement);
    }
  }

  receiverClick(item: Receiver) {
    const sender = this.connectionHandler.activeSender;
    const newConnection = this.connectionHandler.addConnection(item);
    if (newConnection) {
      this.connectionHandler.drawConnections();
      this.openSnackBar({ con: newConnection, sender });
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
    if (this.snackbarRef) {
      this.snackbarRef.dismiss();
      this.snackbarRef = undefined;
    }
  }
  openSnackBar(config, type: ComponentType<any> = ReceiverBottomsheetComponent) {
    if (this.snackbarRef) {
      this.snackbarRef.dismiss();
    }

    this.snackbarRef = this.snack.openFromComponent(type, {
      panelClass: 'unlimitedsnackbar',
      data: config,
    });

    this.snackbarRef.onAction().subscribe(() => {
      this.connectionHandler.drawConnections()
    })
  }
}
