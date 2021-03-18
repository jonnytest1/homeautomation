import { ReceiverFe } from '../interfaces';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';


@Component({
  selector: 'app-receiver-bottomsheet',
  templateUrl: './receiver-bottomsheet.component.html',
  styleUrls: ['./receiver-bottomsheet.component.less']
})
export class ReceiverBottomsheetComponent implements OnInit {

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ReceiverFe,
    private snackbarRef: MatSnackBarRef<unknown>) { }



  ngOnInit() {
    //
  }

}
