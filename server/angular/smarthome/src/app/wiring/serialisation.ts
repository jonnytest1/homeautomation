import { Injector, ViewContainerRef } from '@angular/core';
import { Vector2 } from './util/vector';
import { NodeEl, NodeTemplate } from './wiring.component';
import { Collection } from './wirings/collection';
import { Connection } from './wirings/connection';
import { ParrallelWire } from './wirings/parrallel-wire';
import { Wire } from './wirings/wire';
import { Wiring } from './wirings/wiring.a';


export interface ControllerRef {
  setControlRef: (controlRef, key: string) => void
}

export interface FromJsonOptions {
  inC?: Connection,
  wire?: Wire | ParrallelWire
  displayNodes?: NodeEl[],
  viewRef?: ViewContainerRef,
  injectorFactory?: (pos: Vector2) => Injector

  controlRefs: Record<string, Array<Wiring>>
  controllerRefs: Record<string, ControllerRef>

  constorlRefsInitialized: Promise<void>
  elementMap: Record<string, FromJson>


}


export interface FromJson {
  name: string

  uiConstructor?: NodeTemplate,

  fromJSON: (json: any, context: FromJsonOptions) => Wire
}

export class JsonSerializer {

  static async createUiRepresation(node: Wiring & Collection, json: any, optinos: FromJsonOptions) {
    await optinos.constorlRefsInitialized;
    const conststructorName = node.constructor.name;
    const uiConstructor = optinos.elementMap[conststructorName].uiConstructor
    if (uiConstructor && json.ui?.x && json.ui.y && optinos.viewRef) {
      const position = new Vector2(json.ui)
      const element = optinos.viewRef.createComponent(uiConstructor, {
        injector: optinos.injectorFactory(position)
      })

      element.instance.node = node
      element.instance.setPosition(position)
      node.uiNode = element.instance
      optinos.displayNodes.push({
        uiInstance: element.instance,
        componentRef: element
      })
    }
  }

}