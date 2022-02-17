import { Component, Injector, OnInit } from '@angular/core';
import { FromJson } from '../../serialisation';
import { Connection } from '../../wirings/connection';
import { LED } from '../../wirings/led';
import { UINode } from '../ui-node';

@Component({
  selector: 'app-led-ui',
  templateUrl: './led-ui.component.html',
  styleUrls: ['./led-ui.component.less']
})
export class LedUiComponent extends UINode<LED> implements OnInit {
  public static templateIcon = "emoji_objects"

  getIcon(): string {
    return `emoji_objects`
  }

  constructor(injector: Injector) {
    super(new LED(), injector)
  }

  ngOnInit() {
  }

  backgroundColor() {
    if (this.node.blown) {
      return "red"
    }
    return `hsl(54deg,100%,${Math.min(100, this.node.brightness)}%)`
  }
  static fromJSON(json: any, map: Record<string, FromJson>, context: { inC: Connection; }): Connection {

    debugger;
    return null

  }
}
