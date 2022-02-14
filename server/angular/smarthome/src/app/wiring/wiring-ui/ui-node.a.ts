
import { Component, Injectable, ViewChild } from '@angular/core';
import { Vector2 } from '../util/vector';
import { Wiring } from '../wirings/wiring.a';
import { InOutComponent } from './in-out/in-out.component';


export abstract class UINode<T extends Wiring = Wiring> {

    abstract inOutComponent?: InOutComponent


    getInOutComponent(): InOutComponent {
        return this.inOutComponent
    }

    getPosition(): Vector2 {
        throw new Error("not implemented")
    }

    constructor(public node: T) {
        node.uiNode = this
    }

    abstract getIcon(): string


    toJSON() {
        return this.getPosition()
    }

}