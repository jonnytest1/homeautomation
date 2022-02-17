import { Component, Injector, OnInit } from '@angular/core';
import { Resistor } from '../../wirings/resistor';
import { UINode } from '../ui-node';

@Component({
  selector: 'app-resistor-ui',
  templateUrl: './resistor-ui.component.html',
  styleUrls: ['./resistor-ui.component.less']
})
export class ResistorUiComponent extends UINode<Resistor> implements OnInit {

  public static templateIcon = "insights"

  getIcon(): string {
    return `assets/icons/resistor-svgrepo-com.svg`
  }

  constructor(injector: Injector) {
    super(new Resistor(30), injector)
  }

  ngOnInit() {
  }

  setResistance(input: HTMLInputElement) {
    this.node.resistance = +input.value
  }
}
