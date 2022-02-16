import { Component, ElementRef, Inject, InjectionToken, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { ControlCollection } from '../../wirings/control-collection.a';
import { Wire } from '../../wirings/wire';
import { Wiring } from '../../wirings/wiring.a';
import { UINode } from '../ui-node.a';
import { WireUiComponent } from '../wire-ui/wire-ui.component';

@Component({
    selector: 'app-in-out',
    templateUrl: './in-out.component.html',
    styleUrls: ['./in-out.component.less']
})
export class InOutComponent implements OnInit {

    @Input()
    node: Collection

    @Input()
    invers: BindingBoolean

    @Input()
    noInput: BindingBoolean

    hover = false

    @ViewChild("inLabel")
    public inLabel: ElementRef<HTMLElement>

    @ViewChild("outLabel")
    public outLabel: ElementRef<HTMLElement>

    constructor(private wiringService: WiringDataService) {


    }

    public getOutVector() {
        return new BoundingBox(this.outLabel).center()
    }

    public getInVector() {
        const inVec = new BoundingBox(this.inLabel).center();
        return inVec
    }

    ngOnInit() {

    }

    markDropZone($event) {

        this.hover = true
    }
    leaveDropZone() {
        this.hover = false
    }

    clearDragCache() {
        this.hover = false
        this.wiringService.dragConnection = undefined
        this.wiringService.currentWire = undefined
    }

    storeOutgoing() {
        this.wiringService.dragConnection = this.node.outC
        this.wiringService.currentWire = { from: this.getOutVector(), to: this.getOutVector() }
    }

    onDrop(event) {
        let draggedOutConnection = this.wiringService.dragConnection
        const draggedParent = draggedOutConnection.parent;
        // const draggedConnectionSerial = draggedParent?.controlContainer
        const currnetParent = this.node.inC?.parent;
        //const currentSerial = currnetParent?.controlContainer
        const previousConnection = draggedOutConnection.connectedTo
        this.clearDragCache()
        if (previousConnection && !(previousConnection.outC.parent instanceof ControlCollection)) {
            // draggedConnectionSerial.removeAfter(previousConnection)
        }

        Wire.connect(draggedOutConnection, this.node.inC)
        /*  if (this.node.inC.parent instanceof Battery) {
  
              if (currentSerial !== draggedConnectionSerial) {
                  this.wiringService.tempSerialBlocks = this.wiringService.tempSerialBlocks.filter(b => b !== draggedConnectionSerial);
                  if (draggedConnectionSerial) {
                      currentSerial.addNodes(...draggedConnectionSerial.nodes)
                  } else {
                      currentSerial.addNodes(draggedParent)
                  }
              }
              currentSerial.connectLast()
          } else if (draggedParent instanceof Battery) {
              if (draggedConnectionSerial == currentSerial) {
                  draggedParent.connectTo(draggedConnectionSerial)
              } else {
                  this.wiringService.tempSerialBlocks = this.wiringService.tempSerialBlocks.filter(b => b !== currentSerial);
                  if (currentSerial) {
                      draggedConnectionSerial.addNodes(...currentSerial.nodes)
                  } else {
                      draggedConnectionSerial.addNodes(currnetParent)
                  }
              }
              draggedParent.connectTo(draggedConnectionSerial)
          } else {
              const serialBlock = currentSerial
                  ?? draggedConnectionSerial;
  
              if (!serialBlock) {
                  this.wiringService.tempSerialBlocks.push(new SerialConnected(draggedOutConnection.parent, this.node.inC.parent))
                  return
              }
  
  
              serialBlock.addNodes(this.node.inC.parent as any)
          }*/

    }
}
