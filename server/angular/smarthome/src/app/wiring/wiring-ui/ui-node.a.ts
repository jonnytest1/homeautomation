
import { Component, Injectable, ViewChild } from '@angular/core';
import { Vector2 } from '../util/vector';
import { Collection } from '../wirings/collection';
import { Wire } from '../wirings/wire';
import { Wiring } from '../wirings/wiring.a';
import { InOutComponent } from './in-out/in-out.component';


export abstract class UINode<T extends Collection = Collection> {

    abstract inOutComponent?: InOutComponent

    private position: Vector2

    getWires(): Array<Wire> {
        const wires = []
        if (this.node?.inC?.connectedTo) {
            wires.push(this.node?.inC?.connectedTo)
        }
        if (this.node?.outC?.connectedTo) {
            wires.push(this.node?.outC?.connectedTo)
        }
        return wires
    }

    getInOutComponent(): InOutComponent {
        return this.inOutComponent
    }

    setPosition(vector: Vector2) {
        this.position = vector
        if (this.inOutComponent) {
            this.inOutComponent.position = vector
        }
    }

    getPosition(): Vector2 {
        return this.position
    }

    constructor(public node: T) {
        node.uiNode = this
    }

    abstract getIcon(): string


    toJSON() {
        return this.getPosition()
    }

}