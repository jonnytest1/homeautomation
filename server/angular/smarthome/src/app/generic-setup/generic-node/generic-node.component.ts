import { CommonModule } from '@angular/common';
import type { AfterContentChecked, AfterViewChecked, AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, Input, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ConnectionLines } from '../connection-lines';
import { DropDataHandler } from '../drop-data';
import type { DropData } from '../drop-data-types';
import type { ElementNode } from '../../settings/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, timer } from "rxjs"
import { map, startWith } from 'rxjs/operators';
import { SettingsService } from '../../settings.service';
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
  activity$ = combineLatest([
    this.settings.nodeEventTimes,
    timer(0, 100),
  ]).pipe(
    map(([eventTimes]) => {
      if (!this.node || !eventTimes[this.node.uuid]) {
        return {
          input: undefined,
          output: undefined
        }
      }
      return eventTimes[this.node.uuid]
    })
  )


  is_Active = this.activity$.pipe(map(times => {
    return {
      output: this.isActive(times.output),
      input: this.isActive(times.input)
    }
  }))

  constructor(private elementRef: ElementRef<HTMLElement>, public con: ConnectionLines, private settings: SettingsService) {


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
  localeTime(time: number) {
    return new Date(time).toLocaleTimeString()
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

  isActive(time?: number) {
    if (!time) {
      return false
    }

    return time > (Date.now() - (1000 * 2))
  }
}
