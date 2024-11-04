import { Component, inject, Input, OnInit } from '@angular/core';
import type { ItemFe } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../inventory.service';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  imports: [CommonModule, MatIconModule],
  standalone: true
})
export class LocationComponent implements OnInit {

  @Input()
  item: ItemFe

  inventoryService = inject(InventoryService)

  bottomsheet = inject(MatBottomSheet)
  ngOnInit() {
  }


  updateLocation(newLocId: string) {
    if (!newLocId) {
      return
    }
    this.inventoryService.setLocation(this.item, newLocId)
  }
  newLocation(newloc) {
    this.bottomsheet.open(newloc)
  }

  createNewLcoation(event: SubmitEvent) {
    event.stopPropagation()
    event.preventDefault()

    const lcoation = Object.fromEntries(new FormData(event.target as HTMLFormElement).entries())
    this.inventoryService.createLocation(lcoation)
    this.bottomsheet.dismiss()
  }
}
