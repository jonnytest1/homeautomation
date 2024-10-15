import { Component, OnInit, Injector, ViewChild, type ElementRef, ViewChildren, type QueryList, type AfterViewInit } from '@angular/core';
import { UINode } from '../ui-node';
import { PiPico } from '../../wirings/microprocessor/pipico';
import { InOutComponent } from '../in-out/in-out.component';
import { CommonModule } from '@angular/common';
import type { ParrallelWire } from '../../wirings/parrallel-wire';
import type { Wire } from '../../wirings/wire';
import type { Switch } from '../../wirings/switch';
import { Collection } from '../../wirings/collection';


@Component({
  selector: 'app-pico-ui',
  templateUrl: './pico-ui.component.html',
  styleUrls: ['./pico-ui.component.scss'],
  standalone: true,
  imports: [InOutComponent, CommonModule]
})
export class PicoUiComponent extends UINode<PiPico> implements OnInit {


  @ViewChildren("inout")
  connectorElements: QueryList<InOutComponent>

  public static templateIcon = "asset:assets/icons/pipico.png"


  topUiComponets: Array<Collection>

  @ViewChild("textscr")
  ref: ElementRef<HTMLTextAreaElement>
  bottomUiComponents: Collection[];

  getIcon(): string {
    return "assets/icons/pipico.png"
  }

  constructor(injector: Injector) {
    super(new PiPico(), injector)


    this.topUiComponets = this.node.inputs.map(pin => new Collection(pin, null))
    this.bottomUiComponents = this.node.outputs.map(pin => new Collection(pin, null))
  }


  templateIcon: string;


  getWires(): Array<Wire | ParrallelWire> {
    const wires = [];

    for (let i = 0; i < this.node.pinList.length; i++) {
      const pin = this.node.pinList[i]
      if (pin?.connectedTo) {
        wires.push(pin.connectedTo);
      }
    }
    return wires
  }


  getInOutComponent(id: string) {
    return this.connectorElements.find(el => el.node.inC.id === id)
  }

  ngOnInit() {

  }
}
