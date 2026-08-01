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
import type { FrontendOrder, Item } from '../../../../../src/models/inventory/item';
import { Title } from '@angular/platform-browser';

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



  isPending(item: TableItemFe) {
    return item.order?.orderStatus == "pending" && !item.location
  }
  pendingClick($event: MouseEvent, inv: Array<TableItemFe>) {
    if ($event.ctrlKey) {
      $event.preventDefault();

      const urls = inv.filter(this.isPending)
        .map(this.getTrackingLink);

      urls.forEach(url => {
        window.open(url);
      });
    }
  }


  constructor(private dataService: SettingsService, private cdr: ChangeDetectorRef, title: Title) {
    title.setTitle("Smarthome - Inventory")
    this.dataSource.sortingDataAccessor = (data: TableItemFe, sortHeaderId: string): string | number => {
      if (this.isPending(data) && sortHeaderId === "location") {
        return -2;
      }
      const dataRecord = data as Record<string, string | number>
      const dataValue = dataRecord[sortHeaderId];
      if (typeof dataValue === 'string') {
        const regexMatch = data?.highlightInfo?.value?.regexMatch;
        if (regexMatch) {
          const emotyStrings = regexMatch.reduce((col, entry) => col + (entry === "" ? 1 : 0), 0)
          return new Array(emotyStrings).fill(" ").join("") + dataValue.toLocaleLowerCase()
        }
        return dataValue.toLocaleLowerCase();
      }

      return dataValue ?? 0;
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
        const regex = new RegExp(`(.*)${filter.split("").map(c => `(${c})`).join("(.*?)")}(.*)`)

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
        if (data.order?.orderStatus == "pending" && !data.location) {
          strs.push({
            value: "pending",
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
              value: data[str as keyof TableItemFe] as string,
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
    return item.location?.description || item.location as string || (item.order?.orderStatus == "pending" ? "(pending)" : undefined) || '-'
  }

  getTrackingLink(item: ItemFe) {
    if (item.order.type == "amazon") {
      return `https://www.amazon.de/gp/your-account/order-details/ref=dp_iou_view_order_details?ie=UTF8&orderID=${item.order.orderId}`
    } else if (item.order.type == "aliexpress") {
      return `https://www.aliexpress.com/p/order/detail.html?orderId=${item.order.orderId}`
    }
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

  async imageDrop(ev: DragEvent | ClipboardEvent, target: HTMLInputElement, img: HTMLImageElement) {
    const dataTransfer = "dataTransfer" in ev ? ev.dataTransfer : ev.clipboardData


    const file = dataTransfer.files[0];
    ev.preventDefault();

    if (!file) {
      const nativeImage = [...dataTransfer.items].find(i => i.kind === "application/x-moz-nativeimage")

      nativeImage.getAsString(str => {
        debugger
      })


    }

    if (!file) {
      return
    }
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

  submitNewItem(form: HTMLFormElement, evt: MouseEvent) {
    evt.preventDefault()
    const obj = Object.fromEntries(new FormData(form).entries())



    const order = {
      orderStatus: obj.status === "delivered" ? "received" : "pending",
      type: "custom",
      items: [{
        amount: +obj.amount,
        description: obj.description as string,
        orderImageSrc: obj.image as string,
        productLink: obj.productlink as string
      } as Item]
    } as FrontendOrder
    const url = new URL(`rest/inventory`, getBackendBaseUrl())
    fetch(url, {
      method: "POST",
      body: JSON.stringify(order),
      headers: {
        "content-type": "application/json"
      }
    }).then(r => {
      if (r.status !== 200) {
        throw r
      }
    })

      .catch(e => {


        debugger
      })
  }
}
