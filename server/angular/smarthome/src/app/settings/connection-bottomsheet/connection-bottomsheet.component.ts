import type { ConnectionFe, SenderFe } from '../interfaces';
import { SettingsService } from '../../settings.service';
import type { OnInit } from '@angular/core';
import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA, MatLegacySnackBarRef as MatSnackBarRef } from '@angular/material/legacy-snack-bar';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-connection-bottomsheet',
  templateUrl: './connection-bottomsheet.component.html',
  styleUrls: ['./connection-bottomsheet.component.less']
})
export class ConnectionBottomsheetComponent implements OnInit {

  title$ = new Observable<string>();

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { con: ConnectionFe, sender: SenderFe },
    private snackbarRef: MatSnackBarRef<unknown>, private settingsService: SettingsService) {
    this.title$ = this.settingsService.getTitleKeys(this.data.con.id);
  }

  deleteConnection() {
    this.data.sender.connections = this.data.sender.connections.filter(con => con.id !== this.data.con.id)
    this.settingsService.deleteConneciton(this.data.con.id).toPromise()
    this.snackbarRef.dismissWithAction()


  }


  ngOnInit() {
    //
  }

}
