import type { TemplateRef } from '@angular/core';
import { Component, Injector } from '@angular/core';
import type { FromJson } from '../../serialisation';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import type { Connection } from '../../wirings/connection';
import { UINode } from '../ui-node';

@Component({
  selector: 'app-battery-ui',
  templateUrl: './battery-ui.component.html',
  styleUrls: ['./battery-ui.component.less']
})
export class BatteryUiComponent extends UINode<Battery>  {

  public static templateIcon = "battery_charging_full"
  batteryCollection: Collection;

  getIcon(): string {
    const percent = this.getChargedPercent()
    const perSeven = Math.floor(percent / (100 / 7))

    if (perSeven == 7) {
      return `battery_full`
    }
    return `battery_${perSeven}_bar`


  }

  getChargedPercent() {
    return +(this.node.ampereSeconds * 100 / this.node.maxAmpereSeconds).toPrecision(5)
  }

  constructor(injector: Injector) {
    super(new Battery(5, 0.001), injector)


  }

  ngOnInit() {
    this.batteryCollection = new Collection(this.node.inC, this.node.outC)
  }

  refill() {
    this.node.ampereSeconds = this.node.maxAmpereSeconds;
  }

  logStructure(template: TemplateRef<any>) {
    this.openSnackbar()
    // this.snackbarRef = this.snackbar.openFromTemplate(template)

    /*const structureStart = this.node.get batteryCollection?.outC?.connectedTo?.outC?.parent as (SerialConnected | Parrallel)
        console.log(structureStart.getStructure(true));*/
  }

  static fromJSON(json: any, map: Record<string, FromJson>, context: { inC: Connection; }): Connection {

    throw new Error("not implemented")

  }
}
