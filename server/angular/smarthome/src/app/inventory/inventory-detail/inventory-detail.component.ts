import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../settings.service';
import { map, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../inventory.service';
import { LocationComponent } from './location/location.component';
import { getProductId } from '../inventory-util';
import { AutosavingDirectiveProviderDirective } from '../../autosaving/autosaveProvider';
import { AutosavingDirective } from '../../autosaving/autosaving';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.scss'],
  imports: [CommonModule, LocationComponent,
    FormsModule,
    AutosavingDirective,
    AutosavingDirectiveProviderDirective],
  standalone: true
})
export class InventoryDetailComponent implements OnInit {

  getProductId = getProductId

  item$ = this.dataService.inventory$
    .pipe(
      switchMap(items => this.activeRoute.params.pipe(map(param => {
        const item = items.find(item => item.id === +param.itemid);

        return item
      }))),
    );


  constructor(public activeRoute: ActivatedRoute,
    private readonly dataService: SettingsService,
    public inventoryService: InventoryService) {
    inventoryService.loadLocations()
  }

  ngOnInit() {
  }


}
