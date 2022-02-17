import { Component, Injector, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Vector2 } from '../../util/vector';
import { Collection } from '../../wirings/collection';
import { Relay } from '../../wirings/relay';
import { Switch } from '../../wirings/switch';
import { Wire } from '../../wirings/wire';
import { InOutComponent } from '../in-out/in-out.component';
import { UINode } from '../ui-node';


class NestedSwitch extends UINode<Switch>{
  inOutComponent?: InOutComponent;
  getIcon(): string {
    throw new Error('Method not implemented.');
  }

}


@Component({
  selector: 'app-relay-ui',
  templateUrl: './relay-ui.component.html',
  styleUrls: ['./relay-ui.component.less']
})
export class RelayUiComponent extends UINode<Relay> implements OnInit {
  public static templateIcon = "asset:/assets/icons/relay.png"


  @ViewChild("innerSwitch", { read: InOutComponent })
  innerSwitchInOut?: InOutComponent;

  @ViewChild("outerSwitch", { read: InOutComponent })
  outerSwitchInOut?: InOutComponent;

  @ViewChild("options")
  public optionsTemplate?: TemplateRef<any>

  public switchRef: Switch;

  mainOffset = new Vector2(-10, -9)

  innerSwitchOffset = new Vector2(20, 14)
  outerSwitchOffset = new Vector2(40, 16)
  innerSwitchRef: Switch;
  outerSwitchRef: Switch;
  nestedSwitchColelction: Collection;
  switch2uiNode: NestedSwitch;

  constructor(inj: Injector) {
    super(new Relay(), inj)


  }
  getWires(): Array<Wire> {
    const wires = []
    if (this.node?.inC?.connectedTo) {
      wires.push(this.node?.inC?.connectedTo)
    }
    if (this.node?.outC?.connectedTo) {
      wires.push(this.node?.outC?.connectedTo)
    }
    if (this.node.switch1.outC.connectedTo) {
      wires.push(this.node.switch1.outC.connectedTo)
    }
    if (this.node.switch1.inC.connectedTo) {
      wires.push(this.node.switch1.inC.connectedTo)
    }
    if (this.node.switch1.negatedOutC.connectedTo) {
      wires.push(this.node.switch1.negatedOutC.connectedTo)
    }
    return wires
  }
  toggleRelay() {
    this.node.setSwitchOneEnabled(!this.node.switch1.enabled)
  }

  ngOnInit() {
    this.node.switch1.uiNode = new NestedSwitch(this.node.switch1, null);
    this.switch2uiNode = new NestedSwitch({} as any, null);
    this.nestedSwitchColelction = new Collection(null, this.node.switch1.negatedOutC)
  }

  ngAfterViewInit() {
    this.node.switch1.uiNode.inOutComponent = this.outerSwitchInOut
    this.switch2uiNode.inOutComponent = this.innerSwitchInOut
  }
  getIcon(): string {
    if (!this.node.switch1.enabled) {
      return `/assets/icons/relay.png`
    }
    return `/assets/icons/relay_right.png`
  }

}
