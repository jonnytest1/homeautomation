import { Injector, ViewContainerRef } from '@angular/core';
import { Options } from 'selenium-webdriver';
import { Vector2 } from './util/vector';
import { positionInjectionToken } from './wiring-ui/in-out/in-out.component';
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
                injector: Injector.create({
                    providers: [{
                        provide: positionInjectionToken, useValue: position
                    }], parent: optinos.viewRef.injector
                })
            })

            element.instance.node = node
            element.instance.getPosition = () => position
            node.uiNode = element.instance
            optinos.displayNodes.push({
                uiInstance: element.instance,
                componentRef: element
            })
        }
    }

}