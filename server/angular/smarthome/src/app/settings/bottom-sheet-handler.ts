import { ComponentType } from '@angular/cdk/portal';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ConnectionBottomsheetComponent } from './connection-bottomsheet/connection-bottomsheet.component';
import { ReceiverBottomsheetComponent } from './receiver-bottomsheet/receiver-bottomsheet.component';
import { SenderBottomSheetComponent } from './sender-bottom-sheet/sender-bottom-sheet.component';
import { SettingsComponent } from './settings.component';


type snackbarType = "connection" | "sender" | "receiver"
export class BottomSheetHandler {


    snackbarRef: MatSnackBarRef<any>;
    paramType: string;
    id: string;



    constructor(
        private settingsComponent: SettingsComponent,
        private router: Router,
        private activeRoute: ActivatedRoute,
        private snack: MatSnackBar,) {
        this.register();
    }
    register() {
        this.activeRoute.queryParams.subscribe(params => {
            this.checkSnackbar()
        })
    }

    navigate(type: snackbarType, id: number) {
        this.router.navigate([], {
            queryParams: {
                type,
                id
            },
            queryParamsHandling: "merge"
        })
    }

    checkSnackbar() {
        const params = this.activeRoute.snapshot.queryParams;
        const paramType: snackbarType = params.type;

        let type: ComponentType<any>;
        let data;
        let actionDismiss
        if (!paramType) {
            if (this.settingsComponent.connectionHandler) {
                this.settingsComponent.connectionHandler.setAcvtiveSender(null);
            }
        }
        if (paramType == this.paramType && params.id == this.id) {
            return;
        }

        if (paramType == "connection") {
            if (!this.settingsComponent.senders) {
                setTimeout(this.checkSnackbar.bind(this), 500);
                return
            }
            type = ConnectionBottomsheetComponent
            data = this.getConnectionData(params.id)
            actionDismiss = () => {
                this.settingsComponent.connectionHandler.drawConnections()
            }
        } else if (paramType == "sender") {
            type = SenderBottomSheetComponent
            if (!this.settingsComponent.senders) {
                setTimeout(this.checkSnackbar.bind(this), 500);
                return
            }
            const senderIndex = this.settingsComponent.senders.findIndex(sender => sender.id == params.id);
            data = this.settingsComponent.senders[senderIndex]
            actionDismiss = () => {
                this.settingsComponent.removeSenderByIndex(senderIndex)
            }
            this.settingsComponent.connectionHandler.setAcvtiveSender(data);
        } else if (paramType == "receiver") {
            if (!this.settingsComponent.receivers) {
                return
            }
            type = ReceiverBottomsheetComponent
            data = this.settingsComponent.receivers.find(rec => rec.id == params.id);
        }

        this.paramType = paramType;
        this.id = params.id;

        if (!data) {
            return;
        }
        this.openSnackBar(data, type, actionDismiss);
    }

    getConnectionData(conId: number) {
        for (let sender of this.settingsComponent.senders) {
            for (let con of sender.connections) {
                if (con.id == conId) {
                    this.settingsComponent.connectionHandler.setAcvtiveSender(sender);
                    return { con, sender };
                }
            }
        }
        return null;
    }

    openSnackBar(config, type: ComponentType<any>, actionDismiss?: Function) {
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
        })
    }

    dismiss() {
        if (this.snackbarRef) {
            this.snackbarRef.dismiss();
            this.snackbarRef = undefined;
        }
    }
}