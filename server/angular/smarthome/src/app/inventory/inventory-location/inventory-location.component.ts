import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { SettingsService } from '../../settings.service';
import { InventoryService } from '../inventory.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-location',
  templateUrl: './inventory-location.component.html',
  styleUrls: ['./inventory-location.component.scss'],
  standalone: true,
  imports: [CommonModule]
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

  constructor(public activeRoute: ActivatedRoute,
    private readonly dataService: SettingsService,
    public inventoryService: InventoryService) {
    inventoryService.loadLocations()
  }

  ngOnInit() {
  }

}
