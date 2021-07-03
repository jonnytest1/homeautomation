
import { BottomSheetHandler } from './bottom-sheet-handler';
import { ConnectionHandler } from './connection-handler';
import { ReceiverFe, SenderFe } from './interfaces';
import { SettingsService } from './settings.service';
import { AppComponent } from '../app.component';
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

    bottomSheetHandler: BottomSheetHandler;

    isMobile$ = AppComponent.isMobile();

    constructor(
        snack: MatSnackBar,
        private router: Router,
        private activeRoute: ActivatedRoute,
        public service: SettingsService,
        private cdr: ChangeDetectorRef) {

        this.bottomSheetHandler = new BottomSheetHandler(this, this.router, this.activeRoute, snack);
        this.connectionHandler = new ConnectionHandler(service, data => {
            this.bottomSheetHandler.navigate('connection', data.con.id);
            // this.openSnackBar(data, ConnectionBottomsheetComponent)
        });
        service.senders$.subscribe(senders => {
            this.senders = senders
            setTimeout(() => {
                // gotta wait till its drawn to dom
                this.connectionHandler.drawConnections();
            }, 10);
        });

        this.fetchData().then(() => {
            if (this.canvas) {
                this.connectionHandler.setCanvas(this.canvas.nativeElement);
            }
            setTimeout(async () => {
                await this.bottomSheetHandler.checkSnackbar(this.senders);
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
        return Promise.all([
            this.service.senders$.toPromise(),
            this.service.getReceivers().toPromise().then(receivers => {
                this.receivers = receivers;
            })]);
    }

    setActive(sender: SenderFe, event: MouseEvent) {
        this.bottomSheetHandler.navigate('sender', sender.id);
        event.stopPropagation();
    }

    ngOnDestroy(): void {
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
