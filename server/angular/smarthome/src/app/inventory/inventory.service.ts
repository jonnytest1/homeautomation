import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

import type { ItemFe, LocationFe } from '../settings/interfaces';




@Injectable({
  providedIn: 'root'
})
export class InventoryService {


  public locations$ = new BehaviorSubject<Array<LocationFe>>([])


  httpClient = inject(HttpClient)




  loadLocations() {
    this.httpClient.get<Array<LocationFe>>(`${environment.prefixPath}rest/inventory/location`).subscribe(locs => {

      this.locations$.next(locs)
    })
  }


  setLocation(item: ItemFe, locId: string) {
    this.httpClient.post(`${environment.prefixPath}rest/inventory/location`, {
      locationId: locId,
      itemid: item.id
    }).subscribe()
  }
}
