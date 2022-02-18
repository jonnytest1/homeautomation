import type { OnInit } from '@angular/core';
import { Component, Injector } from '@angular/core';
import { LED } from '../../wirings/led';
import { UINode } from '../ui-node';

@Component({
  selector: 'app-led-ui',
  templateUrl: './led-ui.component.html',
  styleUrls: ['./led-ui.component.less']
})
export class LedUiComponent extends UINode<LED> implements OnInit {

  constructor(injector: Injector) {
    super(new LED(), injector);
  }
  public static templateIcon = 'emoji_objects';


  getIcon(): string {
    return `emoji_objects`;
  }

  ngOnInit() {
  }

  backgroundColor() {
    if (this.node.blown) {
      return 'red';
    }
    return `hsl(54deg,100%,${Math.min(100, this.node.brightness)}%)`;
  }
}
