
import { BottomSheetHandler } from './bottom-sheet-handler';
import { ConnectionHandler } from './connection-handler';
import { ReceiverFe, SenderFe } from './interfaces';
import { SettingsService } from './settings.service';
import { AppComponent } from '../app.component';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.less']
})
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {

    senders: Array<SenderFe> = [];

    @ViewChild('canvas')
    canvas: ElementRef<HTMLCanvasElement>;
    connectionHandler: ConnectionHandler;
    receivers: ReceiverFe[];
    data$: Observable<[SenderFe[], ReceiverFe[]]>;


    interval;

    bottomSheetHandler: BottomSheetHandler;

    isMobile = AppComponent.isMobile();

    constructor(
        private snack: MatSnackBar,
        private router: Router,
        private activeRoute: ActivatedRoute,
        private service: SettingsService,
        private cdr: ChangeDetectorRef) {

        this.bottomSheetHandler = new BottomSheetHandler(this, this.router, this.activeRoute, snack);
        this.connectionHandler = new ConnectionHandler(service, data => {
            this.bottomSheetHandler.navigate('connection', data.con.id);
            // this.openSnackBar(data, ConnectionBottomsheetComponent)
        });

        service.senders$.subscribe(senders => {
            senders.forEach(sender => {
                let foundSender = false;
                this.senders.forEach(sender2 => {
                    if (sender.id === sender2.id) {
                        foundSender = true;
                        sender2.batteryEntries = sender.batteryEntries;
                        sender2.events = sender.events;
                    }
                });
                if (!foundSender) {
                    this.senders.push(sender);
                }
            });
        });

        this.fetchData().then(() => {
            if (this.canvas) {
                this.connectionHandler.setCanvas(this.canvas.nativeElement);
            }
            setTimeout(() => {
                this.bottomSheetHandler.checkSnackbar();
                this.cdr.detectChanges();
            });

        });
    }

    removeSenderByIndex(senderIndex: number) {
        this.senders.splice(senderIndex, 1);
        this.cdr.detectChanges();
        this.bottomSheetHandler.navigate(null, null);
    }

    async addManualSender() {
        const sender = await this.service.addSender().toPromise();
        this.senders.push(sender);
        this.cdr.detectChanges();
        this.bottomSheetHandler.navigate('sender', sender.id);
    }
    private fetchData() {
        return Promise.all([this.service.getSenders().toPromise().then(senders => {
            this.senders = senders;
        }),
        this.service.getReceivers().toPromise().then(receivers => {
            this.receivers = receivers;
        })]);
    }

    setActive(sender: SenderFe, event: MouseEvent) {
        this.bottomSheetHandler.navigate('sender', sender.id);
        event.stopPropagation();
    }

    ngOnDestroy(): void {
        clearInterval(this.interval);
        this.bottomSheetHandler.dismiss();
    }

    ngOnInit() {
        //
    }

    ngAfterViewInit() {
        if (this.connectionHandler) {
            this.connectionHandler.setCanvas(this.canvas.nativeElement);
        }
    }

    async receiverClick(item: ReceiverFe) {
        const newConnection = await this.connectionHandler.addConnection(item);
        if (newConnection) {
            this.bottomSheetHandler.navigate('connection', newConnection.id);
        } else {
            this.bottomSheetHandler.navigate('receiver', item.id);
        }
    }

    senderAddClick(sender: SenderFe) {
        this.connectionHandler.startAdd(sender);
    }

    wrapperClick() {
        if (this.connectionHandler) {
            this.connectionHandler.reset();
        }
        this.bottomSheetHandler.navigate(null, null);
        this.bottomSheetHandler.dismiss();
    }
}
