import { Component, inject, Input, OnInit } from '@angular/core';
import type { ItemFe } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../inventory.service';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class LocationComponent implements OnInit {

  @Input()
  item: ItemFe

  inventoryService = inject(InventoryService)
  ngOnInit() {
  }


  updateLocation(newLocId: string) {
    if (!newLocId) {
      return
    }
    this.inventoryService.setLocation(this.item, newLocId)
  }

}
