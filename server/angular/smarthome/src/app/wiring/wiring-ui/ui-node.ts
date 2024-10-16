
import { Directive, Injector, TemplateRef, ViewChild } from '@angular/core';

import type { Vector2 } from '../util/vector';
import type { Collection } from '../wirings/collection';
import type { Wire } from '../wirings/wire';
import { InOutComponent } from './in-out/in-out.component';
import type { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { ParrallelWire } from '../wirings/parrallel-wire';

@Directive()
export abstract class UINode<T extends Collection = Collection> {

  private position: Vector2;

  private rotation: number

  @ViewChild('options')
  public optionsTemplate?: TemplateRef<any>;


  @ViewChild(InOutComponent)
  public inOutComponent?: InOutComponent;
  snackbarRef: MatSnackBarRef<any>;

  constructor(public node: T, private injector: Injector) {
    node.uiNode = this;
  }

  initNodes() {

  }

  openSnackbar() {
    if (!this.optionsTemplate) {
      return;
    }
    const snackbar = this.injector.get(MatSnackBar);
    this.snackbarRef = snackbar.openFromTemplate(this.optionsTemplate);
  }

  getWires(): Array<Wire | ParrallelWire> {
    return this.getWiresforNode(this.node);
  }

  getWiresforNode(col: Collection) {
    const wires: Array<Wire | ParrallelWire> = [];
    if (col?.inC?.connectedTo) {
      wires.push(col?.inC?.connectedTo);
    }
    if (col?.outC?.connectedTo) {
      wires.push(col?.outC?.connectedTo);
    }
    return wires;
  }

  getInOutComponent(wireId: string): InOutComponent {
    return this.inOutComponent;
  }

  setRotation(rot: number) {
    this.rotation = rot;
  }
  getRotation() {
    return this.rotation;
  }

  setPosition(vector: Vector2) {
    this.position = vector;
  }


  getPosition(): Vector2 {
    return this.position;
  }



  abstract getIcon(): string;


  toJSON() {
    return {
      ...this.getPosition(),
      rotation: this.rotation
    }
  }

}
