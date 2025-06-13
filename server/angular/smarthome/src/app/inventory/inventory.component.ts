import type { AfterViewInit, OnInit, TemplateRef } from '@angular/core';
import { Component, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SettingsService } from '../settings.service';
import type { ItemFe } from '../settings/interfaces';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { RegexHighlightedComponent } from './regex-highlighted/regex-highlighted.component';
import { RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { getBackendBaseUrl } from '../backend';
import type { TableItemFe } from './inventory-type';
import { getProductId } from './inventory-util';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTableModule, MatSortModule, MatFormFieldModule, MatIconModule, RegexHighlightedComponent,
    RouterModule, MatInputModule
  ]
})
export class InventoryComponent implements OnInit, AfterViewInit {
  inventory$: Observable<Array<TableItemFe>>;

  keys: Array<string>

  @ViewChild(MatSort)
  sort: MatSort;

  matBottomSheet = inject(MatBottomSheet)

  filter: string
  dataSource = new MatTableDataSource<TableItemFe>();

  applySort = false
  getProductId = getProductId;

  constructor(private dataService: SettingsService, private cdr: ChangeDetectorRef) {
    this.dataSource.sortingDataAccessor = (data: TableItemFe, sortHeaderId: string): string => {

      if (typeof data[sortHeaderId] === 'string') {
        const regexMatch = data?.highlightInfo?.value?.regexMatch;
        if (regexMatch) {
          const emotyStrings = regexMatch.reduce((col, entry) => col + (entry === "" ? 1 : 0), 0)
          return new Array(emotyStrings).fill(" ").join("") + data[sortHeaderId].toLocaleLowerCase()
        }
        return data[sortHeaderId].toLocaleLowerCase();
      }

      return data[sortHeaderId];
    };

  }

  ngOnInit() {
    this.inventory$ = this.dataService.inventory$.pipe(tap(inv => {
      this.dataSource.data = inv
        .filter(item => item.order?.orderStatus !== "storniert")
        .reverse()
        .map(item => ({

          ...item,
          highlightInfo: new BehaviorSubject(null)
        }))
      console.log("new inv")
      if (!this.keys && inv[0]) {

        this.keys = Object.keys(inv[0]).filter(key => {
          return !key.startsWith("_") && key != "regexMatch" && key != "columnName";
        })
      }
    }))
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => {
      try {
        const regex = new RegExp(`(.*?)${filter.split("").map(c => `(${c})`).join("(.*?)")}(.*)`)

        const pId = getProductId(data)
        const strs: Array<string | { value: string, column?: string }> = [
          "description", {
            column: "customdescription",
            value: data.customdescription?.split("\n")?.[0]
          },
          { column: "productLink", value: pId }
        ]
        if (data.location) {
          strs.push({
            value: data.location.description,
            column: "location"
          })
        }
        data.highlightInfo.next({
          ...data.highlightInfo.value,
          regexMatch: undefined
        })
        for (let str of strs) {
          if (typeof str == "string") {
            str = {
              value: data[str],
              column: str
            }
          }
          const matches = regex.exec(str.value?.toLowerCase());
          if (matches) {
            //  const emptySlots = matches.filter(m => m === "").length
            matches.shift()
            data.highlightInfo.next({
              ...data.highlightInfo.value,
              regexMatch: matches,
              columnName: str.column
            })
            if (this.sort) {
              this.sort.active = str.column
              this.sort.direction = "asc"
              this.applySort = true
            }
            return true
          }
        }
        return false
      } catch (e) {
        debugger
      }
    }
  }

  ngAfterContentChecked() {
    if (this.applySort) {
      this.dataSource.sort.sortChange.emit()
      this.applySort = false
    }
  }


  getLocation(item: ItemFe) {
    return item.location?.description || item.location as string || (item.order.orderStatus == "pending" ? "(pending)" : undefined) || '-'
  }

  getTrackingLink(item: ItemFe) {
    return `https://www.amazon.de/gp/your-account/order-details/ref=dp_iou_view_order_details?ie=UTF8&orderID=${item.order.orderId}`
  }

  setFilter(event: Event, items: Array<TableItemFe>) {
    const input = event.target as HTMLInputElement
    this.dataSource.filter = input.value
    if (input.value == "") {
      items.forEach(item => {
        item.highlightInfo?.next({
          ...item.highlightInfo.value,
          regexMatch: undefined
        })
      })
    }
    this.cdr.markForCheck()
  }


  addItem(addItemTemplate: TemplateRef<unknown>) {
    this.matBottomSheet.open(addItemTemplate)
  }

  async imageDrop(ev: DragEvent, target: HTMLInputElement, img: HTMLImageElement) {
    const file = ev.dataTransfer.files[0];
    ev.preventDefault();
    const buffer = await file?.arrayBuffer()
    const uint8Array = new Uint8Array(buffer);

    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });

    const base64String = btoa(binaryString);

    img.src = `data:${file.type};base64,${base64String}`
    target.value = `data:${file.type};base64,${base64String}`
  }

  submitNewItem(form: HTMLFormElement) {
    const obj = Object.fromEntries(new FormData(form).entries())



    const order = {
      orderStatus: obj.status === "delivered" ? "received" : "pending",
      type: "custom",
      items: [{
        amount: +obj.amount,
        description: obj.description as string,
        orderImageSrc: obj.image as string,
      }]
    }
    const url = new URL(`rest/inventory`, getBackendBaseUrl())
    fetch(url, {
      method: "POST",
      body: JSON.stringify(order),
      headers: {
        "content-type": "application/json"
      }
    })

    debugger
  }
}
