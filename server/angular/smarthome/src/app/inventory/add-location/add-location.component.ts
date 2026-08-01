import { Component, inject, Input, OnInit, TemplateRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../inventory.service';
import type { LcoationFeCreateUpdate, LocationFe } from '../../settings/interfaces';
import type { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-add-location',
  templateUrl: './add-location.component.html',
  styleUrls: ['./add-location.component.scss'],
  standalone: true,
  imports: [MatIconModule]
})
export class AddLocationComponent implements OnInit {

  bottomsheet = inject(MatBottomSheet)
  inventoryService = inject(InventoryService)

  @Input()
  parent?: LocationFe

  constructor() {}

  ngOnInit() {
  }
  newLocation(newloc: TemplateRef<unknown>) {
    this.bottomsheet.open(newloc)
  }
  createNewLcoation(event: SubmitEvent) {
    event.stopPropagation()
    event.preventDefault()

    const lcoation: LcoationFeCreateUpdate = Object.fromEntries(new FormData(event.target as HTMLFormElement).entries())
    lcoation["parent"] = this.parent.id ?? -1;
    this.inventoryService.createUpdateLocation(lcoation)
    this.bottomsheet.dismiss()
  }
}
