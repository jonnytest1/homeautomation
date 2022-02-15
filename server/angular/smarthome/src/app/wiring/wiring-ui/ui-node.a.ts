
import { Component, Injectable, ViewChild } from '@angular/core';
import { Vector2 } from '../util/vector';
import { Wiring } from '../wirings/wiring.a';
import { InOutComponent } from './in-out/in-out.component';


export abstract class UINode<T extends Wiring = Wiring> {

    abstract inOutComponent?: InOutComponent

    private position: Vector2

    getInOutComponent(): InOutComponent {
        return this.inOutComponent
    }

    setPosition(vector: Vector2) {
        //debugger;
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