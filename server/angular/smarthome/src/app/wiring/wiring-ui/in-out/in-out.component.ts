import type { AfterViewInit, OnInit } from '@angular/core';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { WiringDataService } from '../../wiring.service';
import { ParrallelWire } from '../../wirings/parrallel-wire';

@Component({
  selector: 'app-in-out',
  templateUrl: './in-out.component.html',
  styleUrls: ['./in-out.component.less']
})
export class InOutComponent implements OnInit, AfterViewInit {

  @Input()
  node: import('../../wirings/collection').Collection;

  @Input()
  invers: BindingBoolean;

  @Input()
  noInput: BindingBoolean;

  hover = false;

  @ViewChild('inLabel')
  public inLabel: ElementRef<HTMLElement>;

  @ViewChild('outLabel')
  public outLabel: ElementRef<HTMLElement>;

  constructor(private wiringService: WiringDataService) {


  }
  ngAfterViewInit(): void {
    if (this.node.uiNode && !this.node.uiNode.inOutComponent) {
      this.node.uiNode.inOutComponent = this;
    }
  }

  public getOutVector() {
    return new BoundingBox(this.outLabel).center();
  }

  public getInVector() {
    const inVec = new BoundingBox(this.inLabel).center();
    return inVec;
  }

  ngOnInit() {


  }

  markDropZone($event) {

    this.hover = true;
  }
  leaveDropZone() {
    this.hover = false;
  }

  clearDragCache() {
    this.hover = false;
    this.wiringService.dragConnection = undefined;
    this.wiringService.currentWire = undefined;
  }

  storeOutgoing() {
    this.wiringService.dragConnection = this.node.outC;
    this.wiringService.currentWire = { from: this.getOutVector(), to: this.getOutVector() };
  }

  onDrop(event) {
    if (this.wiringService.dragConnection) {
      const draggedOutConnection = this.wiringService.dragConnection;
      this.clearDragCache();
      draggedOutConnection.connectTo(this.node.inC);
    } else if (this.wiringService.editingWire) {

      const parrallelWireEnd = new ParrallelWire();
      parrallelWireEnd.newInC(this.wiringService.editingWire.component.wire.inC);
      parrallelWireEnd.newOutC(this.wiringService.editingWire.component.wire.outC);
      parrallelWireEnd.newOutC(this.node.inC);
    }
  }
}
