import { Component, Input, OnInit } from '@angular/core';
import { SettingsService } from '../../../settings.service';
import { InventoryService } from '../../inventory.service';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import type { ItemFe, LocationFe } from '../../../settings/interfaces';


export type InventoryTreeData = {
  items: Record<number, Array<ItemFe>>,
  locations: Record<number, Array<LocationFe>>
}



@Component({
  selector: 'app-inventory-item-children',
  templateUrl: './inventory-item-children.component.html',
  styleUrls: ['./inventory-item-children.component.scss'],
  imports: [RouterLink],
  standalone: true
})
export class InventoryItemChildrenComponent {

  @Input()
  locationId: number;

  @Input()
  depth: number

  @Input()
  treeData: InventoryTreeData


  constructor() {}

}
