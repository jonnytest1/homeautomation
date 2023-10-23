import type { AfterViewInit, OnInit } from '@angular/core';
import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SettingsService } from '../settings.service';
import type { ItemFe } from '../settings/interfaces';

export type TableItemFe = ItemFe & {
  highlightInfo?: BehaviorSubject<null | {
    regexMatch?: RegExpExecArray,
    columnName?: string
  }>
}


@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, AfterViewInit {
  inventory$: Observable<Array<TableItemFe>>;

  keys: Array<string>

  @ViewChild(MatSort)
  sort: MatSort;

  filter: string
  dataSource = new MatTableDataSource<TableItemFe>();

  applySort = false

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
        const regex = new RegExp(`(.*)${filter.split("").map(c => `(${c})`).join("(.*?)")}(.*)`)

        const pId = this.getProductId(data)
        const strs: Array<string | { value: string, column?: string }> = ["description", { column: "productLink", value: pId }]
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
  getProductId(item: ItemFe) {
    return item.productLink?.split("/product/")?.[1] ?? ''
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
}
