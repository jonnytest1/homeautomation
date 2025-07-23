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

      const locations: Record<number, LocationFe> = {}
      for (const loc of locs) {
        locations[loc.id] = loc
      }
      for (const loc of locs) {
        if (loc.refs?.parent) {
          loc.parent = locations[loc.refs.parent];
        }
      }
      this.locations$.next(locs)
    })
  }


  setLocation(item: ItemFe, locId: string) {
    this.httpClient.post(`${environment.prefixPath}rest/inventory/location`, {
      locationId: locId,
      itemid: item.id
    }, {
      responseType: "text"
    }).subscribe()
  }

  updateLocation(item: LocationFe) {
    return this.httpClient.post<LocationFe>(`${environment.prefixPath}rest/inventory/location/new`, item).subscribe(loc => {
      this.locations$.next([...this.locations$.value, loc])
      this.loadLocations()
    })
  }


  setParent(loc: LocationFe, parent: LocationFe) {
    this.httpClient.post(`${environment.prefixPath}rest/inventory/location/parent`, {
      locationId: loc.id,
      parentLocationId: parent.id
    }, {
      responseType: "text"
    }).subscribe(() => {
      this.locations$.next(this.locations$.value.map(dataloc => {
        if (loc.id === dataloc.id) {
          return {
            ...loc,
            parent: parent
          }
        }
        return dataloc
      }))
      this.loadLocations()
    })
  }


}
