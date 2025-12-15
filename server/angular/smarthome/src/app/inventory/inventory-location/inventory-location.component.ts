import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { SettingsService } from '../../settings.service';
import { InventoryService } from '../inventory.service';
import { CommonModule } from '@angular/common';
import { ThreeDdisplayComponent } from '../3ddisplay/3ddisplay.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { AddLocationComponent } from '../add-location/add-location.component';
import type { LocationFe } from '../../settings/interfaces';
import { TextDisplayComponent, type EditingConfig } from '../../utils/text-display/text-display.component';
import { InventoryItemChildrenComponent, type InventoryTreeData } from './inventory-item-children/inventory-item-children.component';
import { combineLatest } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-location',
  templateUrl: './inventory-location.component.html',
  styleUrls: ['./inventory-location.component.scss'],
  standalone: true,
  imports: [CommonModule, ThreeDdisplayComponent,
    RouterLink, MatIconModule,
    AddLocationComponent, TextDisplayComponent,
    InventoryItemChildrenComponent, FormsModule]
})
export class InventoryLocationComponent implements OnInit {
  depth: number = 1

  items$ = this.dataService.inventory$
    .pipe(
      switchMap(items => this.activeRoute.params.pipe(map(param => {
        const item = items.filter(item => item.location?.id === +param.locationid);

        return item
      }))),
    );



  location$ = this.inventoryService.locations$.pipe(
    switchMap(locs => this.activeRoute.params.pipe(map(param => {
      const item = locs.find(loc => loc?.id === +param.locationid);

      return item
    })))

  )

  childlocations$ = this.inventoryService.locations$.pipe(
    switchMap(locs => this.activeRoute.params.pipe(map(param => {

      return locs.filter(loc => loc.parent?.id && loc.parent?.id == +param.locationid)
    })))

  )
  locationData$ = combineLatest([this.inventoryService.locations$, this.dataService.inventory$]).pipe(
    filter(([l, i]) => !!l.length && !!i.length),
    map(([locations, inventory]): InventoryTreeData => {

      const locationRecord: InventoryTreeData["locations"] = {}
      const itemRecord: InventoryTreeData["items"] = {}
      for (const location of locations) {
        const parentId = location.parent?.id
        if (parentId) {
          locationRecord[parentId] ??= []
          locationRecord[parentId].push(location)
        }
      }
      for (const item of inventory) {

        const locationId = item.location?.id
        if (locationId) {
          itemRecord[locationId] ??= []
          itemRecord[locationId].push(item)
        }
      }
      return {
        locations: locationRecord,
        items: itemRecord
      }
    }))


  public activeRoute = inject(ActivatedRoute)
  model: File

  constructor(private readonly dataService: SettingsService,
    public inventoryService: InventoryService) {
    inventoryService.loadLocations()
  }

  ngOnInit() {
  }


  onDrop(evt: DragEvent) {
    this.model = evt.dataTransfer.files[0]

    evt.preventDefault()
  }
  recurseParents(loc: LocationFe) {
    let tLoc = loc;

    let parentsstr = ""

    for (let i = 0; i < 5; i++) {
      tLoc = tLoc.parent
      if (!tLoc) {
        break
      }

      parentsstr = `/${tLoc.description.split("\n")[0]}${parentsstr}`
    }
    if (!parentsstr) {
      return ""
    }
    return `(${parentsstr})`
  }

  editConfig(locaton: LocationFe): EditingConfig<LocationFe> {
    return {
      dataRef: locaton.id,
      name: "description",
      resource: "location",
    }
  }

  updateParent(value: string, location: LocationFe, locs: Array<LocationFe>) {
    const newPArent = locs.find(loc => loc.id == +value)
    if (!newPArent) {
      return
    }
    this.inventoryService.setParent(location, newPArent)
  }

}
