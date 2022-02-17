import type { AfterContentChecked, ComponentRef, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, ViewContainerRef } from '@angular/core';
import { LocalStorageSerialization } from './storage';
import { Vector2 } from './util/vector';
import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import type { UINode } from './wiring-ui/ui-node';
import { WiringDataService } from './wiring.service';
import type { Battery } from './wirings/battery';
import type { StrucureReturn } from './wirings/control-collection.a';
import type { LED } from './wirings/led';
import type { Resistor } from './wirings/resistor';
import type { Switch } from './wirings/switch';
import { Wire } from './wirings/wire';
import { ParrallelWire } from './wirings/parrallel-wire';
import { NODE_TEMPLATES } from './node-templates';




export interface NodeTemplate {

  new(...args): UINode
  templateIcon: string
}

export type NodeEl = {
  componentRef: ComponentRef<UINode>,
  uiInstance: UINode

}


@Component({
  selector: 'app-wiring',
  templateUrl: './wiring.component.html',
  styleUrls: ['./wiring.component.scss']
})
export class WiringComponent implements OnInit, AfterContentChecked, OnDestroy {
  batteries: Battery[];


  lastTime: number
  interval: NodeJS.Timeout;
  switch: Switch;
  led: LED;
  resist: Resistor;

  dataStructures: Array<StrucureReturn> = []

  wirePositions: Array<{ from: Vector2, to: Vector2, wire: Wire }> = []

  nodeTemplates: Array<NodeTemplate> = NODE_TEMPLATES


  nodes: Array<NodeEl> = []


  constructor(private cdr: ChangeDetectorRef,
    private viewRef: ViewContainerRef,
    public data: WiringDataService,
    public serialize: LocalStorageSerialization) {

    this.batteries = []


    this.interval = setInterval(() => {
      this.cdr.markForCheck()


      //this.dataStructures.length = this.batteries.length + this.data.tempSerialBlocks.length
      this.batteries.forEach((battery, i) => {


        const structreArray = battery.getStructure();

        if (!this.dataStructures[i] || structreArray.length !== this.dataStructures[i].length) {
          this.dataStructures[i] = structreArray
        }

      })

      const positinons = this.getWirePositions();
      if (JSON.stringify(this.wirePositions) !== JSON.stringify(positinons)) {
        this.wirePositions = positinons
      }
    }, 100)

    this.preloadImages()
  }
  preloadImages() {
    for (const image of ["/assets/icons/relay_right.png"]) {
      let img = new Image();
      img.src = image;
    }
  }

  storeToLocal() {
    this.serialize.storeToLocal(this.batteries)
  }
  async load(remote = false) {

    this.batteries = await this.serialize.load({
      remote: remote,
      viewRef: this.viewRef,
      displayNodes: this.nodes,
      injectorFactory: () => this.viewRef.injector,
    })
  }

  getWires(): Set<Wire> {
    const wires = new Set<Wire>()
    this.nodes.forEach(node => {
      const nodeWires = node.uiInstance.getWires();
      nodeWires.forEach(wire => {
        if (wire instanceof ParrallelWire) {
          for (const inWire of wire.inC) {
            for (const outC of wire.outC) {
              const tWire = new Wire()
              tWire.inC = inWire
              tWire.outC = outC
              wires.add(tWire)
            }
          }
        } else {
          wires.add(wire);
        }
      })
    })
    return wires;
  }

  getWirePositions() {
    const wireList = this.getWires()

    return [...wireList].map(wire => {
      const connectionParent = wire.inC?.parent
      let from = connectionParent?.uiNode?.getInOutComponent()?.getOutVector();

      const toParent = wire.outC?.parent;
      let to = toParent?.uiNode?.getInOutComponent()?.getInVector();

      if (!to || !from) {
        return undefined
      }
      return {
        from: from,
        to: to,
        wire: wire
      }
    })
  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
  }

  getRemainingBattery(bat: Battery) {
    return bat.ampereSeconds
  }

  dragMove(event: MouseEvent) {
    if (this.data.currentWire) {
      const position = new Vector2(event).dividedBy(10).rounded().multipliedBy(10);
      this.data.currentWire = { ...this.data.currentWire, to: position }
    } else if (this.data.editingWire) {
      const position = new Vector2(event).dividedBy(10).rounded().multipliedBy(10);
      this.data.editingWire = { ...this.data.editingWire, toPosition: position }
    }
    // this.wirePositions = this.getWirePositions()

  }
  updatePosition(node: NodeEl, event: DragEvent) {

    node.uiInstance.setPosition(new Vector2({ x: event.x, y: event.y }).dividedBy(10).rounded().multipliedBy(10));
    this.wirePositions = this.getWirePositions()

  }




  dropped(el: DragEvent, nodeTemplate: NodeTemplate) {

    const position = new Vector2({ x: el.x, y: el.y }).dividedBy(10).rounded().multipliedBy(10)
    const newNode = this.viewRef.createComponent(nodeTemplate, {
      injector: this.viewRef.injector
    })
    if (newNode.instance instanceof BatteryUiComponent) {
      this.batteries.push(newNode.instance.node);
    }
    newNode.instance.setPosition(position)

    this.nodes.push({
      componentRef: newNode,
      uiInstance: newNode.instance,
    })
    this.cdr.markForCheck()
  }

  ngAfterContentChecked(): void {
    const now = Date.now()
    if (!this.lastTime) {
      this.lastTime = now;
      return
    }
    const delta = now - this.lastTime
    this.lastTime = now
    this.batteries.forEach(b => b.checkContent(delta / 1000));
  }

  ngOnInit() {
  }

}
