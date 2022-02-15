import type { Injector, ViewContainerRef } from '@angular/core';
import { Vector2 } from './util/vector';
import { NodeEl, NodeTemplate } from './wiring.component';
import { Collection } from './wirings/collection';
import { Connection } from './wirings/connection';
import { Wire } from './wirings/wire';
import { Wiring } from './wirings/wiring.a';


export interface FromJsonOptions {
    inC?: Connection,
    wire?: Wire
    displayNodes?: NodeEl[],
    viewRef?: ViewContainerRef,
    injectorFactory?: (pos: Vector2) => Injector
    elementMap?: Record<string, FromElementJson>
}

export interface FromElementJson {
    name: string

    uiConstructor?: NodeTemplate,

    fromJSON: (json: any, map: Record<string, FromJson>, context: FromJsonOptions) => (Collection)
}


export interface FromJson {
    name: string

    uiConstructor?: NodeTemplate,

    fromJSON: (json: any, map: Record<string, FromJson>, context: FromJsonOptions) => Wire
}

export class JsonSerializer {


    static createUiRepresation(node: Wiring, json: any, optinos: FromJsonOptions) {
        const conststructorName = node.constructor.name;
        const uiConstructor = optinos.elementMap[conststructorName].uiConstructor
        if (uiConstructor && json.ui?.x && json.ui.y) {
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