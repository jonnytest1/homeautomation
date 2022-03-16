import type { OnInit } from '@angular/core';
import { Component, Input, ViewContainerRef } from '@angular/core';
import { MatColumnDef } from '@angular/material/table';
import type { TableItemFe } from '../inventory.component';

@Component({
  selector: 'app-regex-highlighted',
  templateUrl: './regex-highlighted.component.html',
  styleUrls: ['./regex-highlighted.component.less']
})
export class RegexHighlightedComponent implements OnInit {
  data: TableItemFe;

  @Input()
  text: string

  constructor(private columnDef: MatColumnDef, ref: ViewContainerRef) {
    //   const views
    this.data = ref["_hostLView"][8].$implicit;
    this.text = `${this.data[columnDef.name] ?? ''}`
  }

  isHighlighted() {

    const highlighted = !!this.data.regexMatch && this.columnDef.name == this.data.columnName;
    return highlighted
  }

  ngOnInit() {
  }


  getParts() {
    return this.data.regexMatch.map((str, i) => {
      return {
        str,
        highlighted: i % 2 == 1
      }
    })
  }


  ngAfterViewInit() {
  }

}
