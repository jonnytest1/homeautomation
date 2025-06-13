import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { SettingsService } from '../../settings.service';
import { InventoryService } from '../inventory.service';
import { CommonModule } from '@angular/common';
import { ThreeDdisplayComponent } from '../3ddisplay/3ddisplay.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { AddLocationComponent } from '../add-location/add-location.component';
import type { LocationFe } from '../../settings/interfaces';
import { TextDisplayComponent, type EditingConfig } from '../../utils/text-display/text-display.component';

@Component({
  selector: 'app-inventory-location',
  templateUrl: './inventory-location.component.html',
  styleUrls: ['./inventory-location.component.scss'],
  standalone: true,
  imports: [CommonModule, ThreeDdisplayComponent, RouterLink, MatIconModule, AddLocationComponent, TextDisplayComponent]
})
export class InventoryLocationComponent implements OnInit {


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
