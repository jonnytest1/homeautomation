import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InventoryService } from './inventory.service';
import { RouterModule, type Route } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { InventoryDetailComponent } from './inventory-detail/inventory-detail.component';
import { InventoryLocationComponent } from './inventory-location/inventory-location.component';



export const routes: Array<Route> = [
  {
    path: '',
    component: InventoryComponent
  }, {
    path: 'item/:itemid',
    component: InventoryDetailComponent
  }, , {
    path: 'location',
    redirectTo: "location/-1"
  }, {
    path: 'location/:locationid',
    component: InventoryLocationComponent
  },
];



@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  declarations: [],
  providers: [InventoryService]
})
export class InventoryModule {

}