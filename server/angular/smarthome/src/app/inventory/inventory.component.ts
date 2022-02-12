import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { getPriority } from 'os';
import { pid } from 'process';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SettingsService } from '../data.service';
import { ItemFe } from '../settings/interfaces';

export type TableItemFe = ItemFe & { regexMatch?: RegExpExecArray, columnName?: string }


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

    constructor(private dataService: SettingsService) {
        this.dataSource.sortingDataAccessor = (data: TableItemFe, sortHeaderId: string): string => {

            if (typeof data[sortHeaderId] === 'string') {
                if (data.regexMatch) {
                    const emotyStrings = data.regexMatch.reduce((col, entry) => col + (entry === "" ? 1 : 0), 0)
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
            console.log("new inv")
            if (!this.keys && inv[0]) {
                this.keys = Object.keys(inv[0]).filter(key => {
                    return !key.startsWith("_") && typeof inv[1][key] !== "object" && key != "regexMatch" && key != "columnName";
                })
            }
        }))
    }
    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
        this.dataSource.filterPredicate = (data, filter) => {
            const regex = new RegExp(`(.*)${filter.split("").map(c => `(${c})`).join("(.*?)")}(.*)`)

            const pId = this.getProductId(data)
            const strs: Array<string | { value: string, column?: string }> = ["description", { column: "productLink", value: pId }]
            if (data.location) {
                strs.push({ value: data.location.description })
            }

            data.regexMatch = undefined
            for (let str of strs) {
                if (typeof str == "string") {
                    str = {
                        value: data[str],
                        column: str
                    }
                }
                const matches = regex.exec(str.value.toLowerCase());
                if (matches) {
                    matches.shift()
                    data.regexMatch = matches;
                    data.columnName = str.column
                    this.sort.active = str.column
                    this.sort.direction = "asc"
                    this.applySort = true
                    return true
                }
            }
            return false
        }
    }

    ngAfterContentChecked() {
        if (this.applySort) {
            this.dataSource.sort.sortChange.emit()
            this.applySort = false
        }
    }
    getProductId(item: ItemFe) {
        return item.productLink?.split("/product/")[1]
    }

    setFilter(event: Event, items: Array<TableItemFe>) {
        const input = event.target as HTMLInputElement
        this.dataSource.filter = input.value
        if (input.value == "") {
            items.forEach(item => item.regexMatch = undefined)
        }
    }
}
