import { ReceiverFe } from '../interfaces';
import type { OnInit } from '@angular/core';
import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA, MatLegacySnackBarRef as MatSnackBarRef } from '@angular/material/legacy-snack-bar';


@Component({
  selector: 'app-receiver-bottomsheet',
  templateUrl: './receiver-bottomsheet.component.html',
  styleUrls: ['./receiver-bottomsheet.component.less']
})
export class ReceiverBottomsheetComponent implements OnInit {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ReceiverFe,
    private snackbarRef: MatSnackBarRef<unknown>) {}



  ngOnInit() {
    //
  }

}
