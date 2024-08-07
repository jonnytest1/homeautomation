import type { OnInit } from '@angular/core';
import { Component, Injector } from '@angular/core';
import type { ParrallelWire } from '../../wirings/parrallel-wire';
import { Transformator } from '../../wirings/transformator';
import type { Wire } from '../../wirings/wire';
import { UINode } from '../ui-node';
import { MockUiNode } from '../mock-ui';

@Component({
  selector: 'app-transformator-ui',
  templateUrl: './transformator-ui.component.html',
  styleUrls: ['./transformator-ui.component.less']
})
export class TransformatorUiComponent extends UINode<Transformator> implements OnInit {
  constructor(injecotr: Injector) {
    super(new Transformator(), injecotr);
    this.initNodes()
  }
  public static templateIcon = 'asset:/assets/icons/Transformer.svg';
  initNodes(): void {
    this.node.providingBattery.mockSetUiNode(new MockUiNode(this.node.providingBattery, null as any));
  }

  getIcon(): string {
    return TransformatorUiComponent.templateIcon.split('asset:')[1];
  }

  ngOnInit() {

  }

  getTurnRatio(p: "left" | "right") {
    const turnRatio = this.node.turnsRatio
    if (turnRatio <= 0) {
      return ""
    }
    if (turnRatio < 1) {
      const invertedRatio = 1 / turnRatio;
      let left = 1;
      let right = invertedRatio
      const rightStr = `${right}`
      if (rightStr.includes(".")) {
        left = +(100 * turnRatio).toPrecision(2)
        right = 100
      }

      let changed = false
      do {
        changed = false
        for (let i = 2; i <= right; i++) {
          if (left % i == 0 && right % i == 0) {
            left /= i
            right /= i
            changed = true
            break
          }
        }
      } while (changed)

      if (p === "left") {
        return left
      }
      return right;
    }
    if (p === "right") {
      return 1
    }
    return turnRatio
  }


  getWires(): Array<Wire | ParrallelWire> {
    return [...super.getWires(), ... this.getWiresforNode(this.node.providingBattery)];
  }
}
