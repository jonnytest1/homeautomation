import { Component, inject, Input, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../inventory.service';

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
  parentId?: number

  constructor() {}

  ngOnInit() {
  }
  newLocation(newloc) {
    this.bottomsheet.open(newloc)
  }
  createNewLcoation(event: SubmitEvent) {
    event.stopPropagation()
    event.preventDefault()

    const lcoation: unknown = Object.fromEntries(new FormData(event.target as HTMLFormElement).entries())
    lcoation["parent"] = this.parentId ?? -1;
    this.inventoryService.updateLocation(lcoation)
    this.bottomsheet.dismiss()
  }
}
