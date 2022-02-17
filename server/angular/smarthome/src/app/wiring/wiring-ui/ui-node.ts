
import { Directive, Injector, TemplateRef, ViewChild } from '@angular/core';

import type { Vector2 } from '../util/vector';
import type { Collection } from '../wirings/collection';
import type { Wire } from '../wirings/wire';
import { InOutComponent } from './in-out/in-out.component';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Directive()
export abstract class UINode<T extends Collection = Collection> {

  private position: Vector2

  @ViewChild("options")
  public optionsTemplate?: TemplateRef<any>


  @ViewChild(InOutComponent)
  public inOutComponent?: InOutComponent
  snackbarRef: MatSnackBarRef<any>;

  constructor(public node: T, private injector: Injector) {
    node.uiNode = this
  }

  openSnackbar() {
    if (!this.optionsTemplate) {
      return
    }
    const snackbar = this.injector.get(MatSnackBar)
    this.snackbarRef = snackbar.openFromTemplate(this.optionsTemplate)
  }

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
  }

  getPosition(): Vector2 {
    return this.position
  }



  abstract getIcon(): string


  toJSON() {
    return this.getPosition()
  }

}