import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-example-picker',
  templateUrl: './example-picker.component.html',
  styleUrls: ['./example-picker.component.less']
})
export class ExamplePickerComponent implements OnInit {

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: Array<{ name: string, content: string }>,
    private snackbarRef: MatBottomSheetRef<unknown>) {
  }

  ngOnInit() {
  }
  choose(el: { name: string, content: string }) {
    this.snackbarRef.dismiss(el.content)
  }
}
