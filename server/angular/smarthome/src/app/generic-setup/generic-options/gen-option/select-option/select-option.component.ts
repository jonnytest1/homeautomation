import { Component, Input, OnInit, ViewChild } from '@angular/core';
import type { NodeOptionTypes } from '../../../../settings/interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-option',
  templateUrl: './select-option.component.html',
  styleUrls: ['./select-option.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SelectOptionComponent implements OnInit {

  @Input()
  definition: NodeOptionTypes & { type: "select" }


  @Input()
  name: string
  @Input()
  value: string

  arrayValue: Set<string> | null = null

  constructor() {}

  ngOnInit() {
    if (this.definition.multiple) {
      this.arrayValue = new Set(JSON.parse(this.value))
    }
  }



  isSelected(option: string) {
    if (this.definition.multiple) {
      return this.arrayValue?.has(option)
    }
    return option === this.value
  }

  getSize() {
    if (this.definition.multiple) {
      return Math.min(this.definition.options.length, 14)
    }
    return null
  }
  getSelectValues(select: HTMLSelectElement) {
    const result: Array<string> = [];
    const options = select && select.options;


    for (var i = 0, iLen = options.length; i < iLen; i++) {
      const opt = options[i];

      if (opt.selected) {
        result.push(opt.value || opt.text);
      }
    }
    return result;
  }
  onChange($event: Event, changeEmit: HTMLTextAreaElement) {
    $event.stopPropagation()
    const selectElement = $event.target as HTMLSelectElement;

    if (this.definition.multiple) {
      const selected = this.getSelectValues(selectElement)

      changeEmit.value = JSON.stringify(selected)
      changeEmit.dispatchEvent(new Event('change', { 'bubbles': true }))
    } else {
      changeEmit.value = selectElement.value
      changeEmit.dispatchEvent(new Event('change', { 'bubbles': true }))
    }


  }
}
