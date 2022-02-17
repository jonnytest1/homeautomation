import { Component, Injector, OnInit } from '@angular/core';
import { Switch } from '../../wirings/switch';
import { UINode } from '../ui-node';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.less']
})
export class SwitchComponent extends UINode<Switch> implements OnInit {
  public static templateIcon = "switch_left"



  getIcon(): string {
    if (this.node.enabled) {
      return "toggle_on"
    }
    return "toggle_off"
  }

  constructor(injector: Injector) {
    super(new Switch(), injector)
  }

  ngOnInit() {
  }

}
