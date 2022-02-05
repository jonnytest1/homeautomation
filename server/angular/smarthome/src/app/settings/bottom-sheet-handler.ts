import { ConnectionBottomsheetComponent } from './connection-bottomsheet/connection-bottomsheet.component';
import { ReceiverBottomsheetComponent } from './receiver-bottomsheet/receiver-bottomsheet.component';
import { SenderBottomSheetComponent } from './sender-bottom-sheet/sender-bottom-sheet.component';
import { SettingsComponent } from './settings.component';
import { SenderFe } from './interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ComponentType } from '@angular/cdk/portal';
import { combineLatest } from 'rxjs';


type snackbarType = 'connection' | 'sender' | 'receiver';
export class BottomSheetHandler {


    snackbarRef: MatSnackBarRef<unknown>;
    paramType: string;
    id: string;

    registeredSenderIds: Array<number> = [];

    constructor(
        private settingsComponent: SettingsComponent,
        private router: Router,
        private activeRoute: ActivatedRoute,
        private snack: MatSnackBar) {

        this.register();
    }
    register() {
        combineLatest([this.settingsComponent.service.senders$, this.activeRoute.queryParams])
            .subscribe(([senders]) => {
                if (!this.registeredSenderIds.some(id => id === +this.id)) {
                    this.id = undefined;
                }
                this.checkSnackbar(senders);
                this.registeredSenderIds = senders.map(sender => sender.id);
            });
    }

    navigate(type: snackbarType, id: number) {
        this.router.navigate([], {
            queryParams: {
                type,
                id
            },
            queryParamsHandling: 'merge'
        });
    }

    checkSnackbar(senders: Array<SenderFe>) {
        const params: Record<string, string> = this.activeRoute.snapshot.queryParams;
        const paramType: snackbarType = params.type as snackbarType;

        let type: ComponentType<unknown>;
        let data;
        let actionDismiss;
        if (!paramType) {
            if (this.settingsComponent.connectionHandler) {
                this.settingsComponent.connectionHandler.setAcvtiveSender(null);
            }
        }
        if (paramType === this.paramType && params.id === this.id) {
            return;
        }

        if (paramType === 'connection') {
            if (!senders) {
                setTimeout(this.checkSnackbar.bind(this), 500);
                return;
            }
            type = ConnectionBottomsheetComponent;
            data = this.getConnectionData(+params.id);
            actionDismiss = () => {
                this.settingsComponent.connectionHandler.drawConnections();
            };
        } else if (paramType === 'sender') {
            type = SenderBottomSheetComponent;
            if (!senders) {
                setTimeout(this.checkSnackbar.bind(this), 500);
                return;
            }

            const senderIndex = senders.findIndex(sender => sender.id === +params.id);
            data = senders[senderIndex];
            actionDismiss = () => {
                this.settingsComponent.removeSenderByIndex(senderIndex);
            };
            this.settingsComponent.connectionHandler?.setAcvtiveSender(data);
        } else if (paramType === 'receiver') {
            if (!this.settingsComponent.receivers) {
                return;
            }
            type = ReceiverBottomsheetComponent;
            data = this.settingsComponent.receivers.find(rec => rec.id === +params.id);
        }

        this.paramType = paramType;
        this.id = params.id;

        if (!data) {
            return;
        }
        this.openSnackBar(data, type, actionDismiss);
    }

    getConnectionData(conId: number) {
        for (const sender of this.settingsComponent.senders) {
            for (const con of sender.connections) {
                if (con.id === conId) {
                    this.settingsComponent.connectionHandler.setAcvtiveSender(sender);
                    return { con, sender };
                }
            }
        }
        return null;
    }

    openSnackBar<T>(config, type: ComponentType<T>, actionDismiss?: () => void) {
        if (this.snackbarRef) {
            this.snackbarRef.dismiss();
        }

        this.snackbarRef = this.snack.openFromComponent(type, {
            panelClass: 'unlimitedsnackbar',
            data: config,
        });

        this.snackbarRef.onAction().subscribe(() => {
            if (actionDismiss) {
                actionDismiss();
            }
        });
    }

    dismiss() {
        if (this.snackbarRef) {
            this.snackbarRef.dismiss();
            this.snackbarRef = undefined;
        }
    }
}
