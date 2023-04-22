import type { OnChanges, OnInit } from '@angular/core';
import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { MatLegacyColumnDef as MatColumnDef } from '@angular/material/legacy-table';
import { TableItemFe } from '../inventory.component';

@Component({
  selector: 'app-regex-highlighted',
  templateUrl: './regex-highlighted.component.html',
  styleUrls: ['./regex-highlighted.component.less']
})
export class RegexHighlightedComponent implements OnInit, OnChanges {

  @Input()
  data: TableItemFe;

  @Input()
  text: string

  @Input()
  highlightInfo: {
    regexMatch?: RegExpExecArray,
    columnName?: string
  }

  parts: Array<{
    str: string,
    highlighted: boolean
  }> = []

  isHighlighted = false


  displayText: string

  constructor(private columnDef: MatColumnDef, private cdr: ChangeDetectorRef) {
    //   const views
    //this.data = ref["_hostLView"][8].$implicit;
  }

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
    this.displayText = this.text
  }

  ngOnChanges() {
    //this.text = `${this.data?.[this.columnDef.name] ?? ''}`

    this.parts = this.highlightInfo?.regexMatch?.map((str, i) => ({
      str,
      highlighted: i % 2 == 1
    })) ?? []
    this.isHighlighted = !!this.highlightInfo?.regexMatch && this.columnDef.name == this.highlightInfo?.columnName
    this.cdr.markForCheck()
  }


  ngAfterViewInit() {
  }

}
