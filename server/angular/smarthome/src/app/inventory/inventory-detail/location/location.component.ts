import { Component, inject, Input, OnInit } from '@angular/core';
import type { ItemFe } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../inventory.service';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import QrScanner from "qr-scanner"
import { AddLocationComponent } from '../../add-location/add-location.component';
@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  imports: [CommonModule, MatIconModule, AddLocationComponent],
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
    this.item.location ??= {}
    this.item.location.id = +newLocId
    this.inventoryService.setLocation(this.item, newLocId)
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

}
