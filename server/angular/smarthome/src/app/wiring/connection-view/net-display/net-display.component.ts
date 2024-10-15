import type { OnInit, SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { ControlCollection, StrucureReturn } from '../../wirings/control-collection.a';
import { Wire } from '../../wirings/wire';
import type { Wiring } from '../../wirings/wiring.a';

@Component({
  selector: 'app-net-display',
  templateUrl: './net-display.component.html',
  styleUrls: ['./net-display.component.less']
})
export class NetDisplayComponent implements OnInit {

  @Input()
  data: StrucureReturn

  parsedData: StrucureReturn = []
  indentItem = []
  constructor() {}

  isArray(item: any) {
    return item instanceof Array
  }
  isObj(item: any): Array<StrucureReturn> {
    if (typeof item === "string") {
      return undefined
    }
    return item.parrallel
  }

  isItem(el): Wiring {
    return el
  }
  cast(item): StrucureReturn {
    return item
  }

  ngOnChanges(event: SimpleChanges) {
    if (event["data"].currentValue) {
      this.ngOnInit()
    }
  }

  click(item: Wiring) {
    item.uiNode?.openSnackbar()
  }

  ngOnInit() {
    let subArray: StrucureReturn
    if (!this.data) {
      return
    }
    this.indentItem = []
    this.parsedData = []

    let skipNext = false
    for (const item of this.data) {
      if (skipNext) {
        skipNext = false;
        continue
      }

      if (this.indentItem.length) {

        if (item == this.indentItem[this.indentItem.length - 1]) {
          this.parsedData.push(item)
          this.indentItem.pop()
        } else {
          subArray.push(item)

        }
      } else if ("name" in item && (item.name == "ControlCollection" || item.name == "Battery")) {
        subArray = []
        this.parsedData.push(item)
        this.parsedData.push(subArray)
        this.indentItem.push(item)
      } else if ("name" in item && (item.name == "Collection" && this.data.length > 3)) {
        const inConnection = this.parsedData.pop()
        skipNext = true
        const subArray = []
        if (inConnection) {
          subArray.push(inConnection)
        }
        subArray.push(item);
        //if (item.outC) {
        // subArray.push(item.outC)
        //}
        this.parsedData.push(subArray)
      } else if (item instanceof Array) {



        this.parsedData.push([{
          parrallel: item.map(i => {
            if (i instanceof Array) {
              return i
            } else {
              return [i]
            }
          })
        }])
      } else {
        this.parsedData.push(item)
      }
    }
    //debugger;
  }

}
