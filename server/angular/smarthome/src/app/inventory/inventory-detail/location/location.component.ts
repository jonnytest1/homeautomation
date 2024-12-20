import { Component, inject, Input, OnInit } from '@angular/core';
import type { ItemFe } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../inventory.service';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import QrScanner from "qr-scanner"
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
    this.item.location ??= {}
    this.item.location.id = +newLocId
    this.inventoryService.setLocation(this.item, newLocId)
  }
  newLocation(newloc) {
    this.bottomsheet.open(newloc)
  }


  scan_qr(videoRef: HTMLVideoElement) {

    videoRef.style.display = "initial"
    const qrScanner = new QrScanner(
      videoRef,
      async result => {
        qrScanner.stop()
        videoRef.style.display = "none"

        const inventoryUrl = result.data
        const resp = await fetch(inventoryUrl)

        const redirectedUrl = new URL(resp.url)

        const locationMAtch = redirectedUrl.pathname.match(/\/inventory\/location\/(?<id>\d*)/)
        if (locationMAtch?.groups?.id) {
          this.updateLocation(locationMAtch?.groups?.id)
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true
      },
    );
    qrScanner.start()
  }
  createNewLcoation(event: SubmitEvent) {
    event.stopPropagation()
    event.preventDefault()

    const lcoation = Object.fromEntries(new FormData(event.target as HTMLFormElement).entries())
    this.inventoryService.createLocation(lcoation)
    this.bottomsheet.dismiss()
  }
}
