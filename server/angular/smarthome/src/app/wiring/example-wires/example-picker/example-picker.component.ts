import type { OnInit } from '@angular/core';
import { Component, Inject } from '@angular/core';
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
    if (el.name == "manual") {
      el.content = prompt("paste tempalte");
    }
    this.snackbarRef.dismiss(el.content)
  }
}
