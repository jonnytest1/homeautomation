import { CommonModule } from '@angular/common';
import type { AfterContentChecked, AfterViewChecked, AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, Input, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ConnectionLines } from '../connection-lines';
import { DropDataHandler } from '../drop-data';
import type { DropData } from '../drop-data-types';
import type { ElementNode } from '../../settings/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { timer } from "rxjs"
import { map } from 'rxjs/operators';
const dataHandler = new DropDataHandler<DropData>()
@Component({
  selector: 'app-generic-node',
  templateUrl: './generic-node.component.html',
  styleUrls: ['./generic-node.component.scss'],
  imports: [CommonModule, MatIconModule],
  standalone: true
})
export class GenericNodeComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input()
  node: ElementNode | undefined

  @Input()
  inputsCt = 0

  @Input()
  outputCt = 0

  @Input()
  editable = false

  @Input()
  selected = false

  @Input()
  prefix = ""

  size = 0

  inputArray: Array<null>
  ouputsArray: Array<null>

  @ViewChildren("output")
  outputElements: QueryList<ElementRef<HTMLElement>>

  @ViewChildren("input")
  inputElements: QueryList<ElementRef<HTMLElement>>

  outputActive$ = timer(0, 100).pipe(
    map(() => this.isOutputActive())
  )
  inputActive$ = timer(0, 100).pipe(
    map(() => this.isInputActive())
  )

  constructor(private elementRef: ElementRef<HTMLElement>, private con: ConnectionLines) {


  }

  ngAfterViewInit(): void {
    if (this.editable) {
      this.outputElements.forEach((el, i) => {
        this.con.registerConnection(this.node.uuid, "out", i, el.nativeElement)
      })
      this.inputElements.forEach((el, i) => {
        this.con.registerConnection(this.node.uuid, "in", i, el.nativeElement)
      })
    }
  }
  localeTime() {
    return new Date(this.node.runtimeContext.lastOutputEventTime).toLocaleTimeString()
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.size = Math.max(this.inputsCt, this.outputCt)
    this.inputArray = new Array(this.inputsCt).fill(null)
    this.ouputsArray = new Array(this.outputCt).fill(null)
  }
  ngOnDestroy(): void {
    if (this.node) {
      delete this.con.connectorMap[this.node.uuid]
    }
  }



  startConnection(evt: DragEvent, indx) {
    if (this.editable) {
      this.con.addConnection(this.node.uuid, indx)
      dataHandler.setDropData(evt, "connectionDrag", true)
      evt.stopPropagation()
    }
  }
  dropAllowed(evt: DragEvent) {
    const isAllowed = dataHandler.hasKey(evt, "connectionDrag");
    if (isAllowed) {
      evt.preventDefault()
    }
  }
  onDrop(evt: DragEvent, indx: number) {
    if (dataHandler.hasKey(evt, "connectionDrag")) {
      this.con.finalize(this.node.uuid, indx)
      evt.stopPropagation()
    }
  }


  isInputActive() {
    if (!this.node?.runtimeContext?.lastEventTime) {
      return false
    }

    return this.node?.runtimeContext?.lastEventTime > (Date.now() - (1000 * 2))
  }

  isOutputActive() {
    if (!this.node?.runtimeContext?.lastOutputEventTime) {
      return false
    }

    return this.node?.runtimeContext?.lastOutputEventTime > (Date.now() - (1000 * 2))
  }
}
