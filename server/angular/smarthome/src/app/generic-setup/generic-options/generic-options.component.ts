import type { AfterViewInit, OnChanges } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { GenericNodesDataService } from '../generic-node-data-service';
import { CommonModule } from '@angular/common';
import type { NodeDefOptinos, NodeDefToType, NodeOptionTypes } from '../../settings/interfaces';
import type { ElementNode } from '../../settings/interfaces';
import { GenOptionComponent } from './gen-option/gen-option.component';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { selectGlobals, selectNode } from '../store/selectors';
import type { Observable } from 'rxjs';
import { combineLatest, map, timer } from 'rxjs';
import { StoreService } from '../store/store-service';
import { RouterModule } from '@angular/router';


export const GENERIC_OPTIONS_TAG = "app-generic-options"

@Component({
  selector: GENERIC_OPTIONS_TAG,
  templateUrl: './generic-options.component.html',
  styleUrls: ['./generic-options.component.scss'],
  imports: [CommonModule, GenOptionComponent, MatIconModule, RouterModule],
  standalone: true
})
export class GenericOptionsComponent implements AfterViewInit, OnChanges {


  @Input()
  nodeUuid: string

  options$: ReturnType<typeof this.storeService["getNodeDefsByNodeUuid"]>

  @ViewChild("form")
  form: ElementRef<HTMLFormElement>


  @ViewChild("formglob")
  formGlob: ElementRef<HTMLFormElement>

  node$: Observable<ElementNode | undefined>

  entries$: Observable<Array<{ name: string, value: NodeOptionTypes }>>

  globals$ = this.store.select(selectGlobals)


  activity$ = combineLatest([
    this.con.nodeEventTimes,
    timer(0, 100),
  ]).pipe(
    map(([eventTimes]) => {

      if (!this.nodeUuid || !eventTimes?.[this.nodeUuid]) {
        return {
          input: undefined,
          output: undefined
        }
      }
      return eventTimes[this.nodeUuid]
    })
  )


  constructor(public con: GenericNodesDataService, private store: Store, private storeService: StoreService) {}

  async ngOnChanges(): Promise<void> {
    this.node$ = this.store.select(selectNode(this.nodeUuid))
    this.options$ = this.storeService.getNodeDefsByNodeUuid(this.nodeUuid)
    this.entries$ = combineLatest([
      this.node$,
      this.options$
    ]).pipe(map(([node, options]) => {
      if (!node) {
        return []
      }
      const entries: Array<{ name: string, value: NodeOptionTypes }> = [{
        name: "name",
        value: {
          type: "text",
          order: 99999
        }
      }]
      const nodeDefOpts = options.options ?? {};
      for (const option in nodeDefOpts) {
        const opt = nodeDefOpts[option]
        if (opt.type === "placeholder") {
          continue
        }
        entries.push({
          name: option,
          value: opt
        })
      }
      if (node.runtimeContext?.parameters) {
        for (const option in node.runtimeContext?.parameters) {
          const opt = node.runtimeContext?.parameters[option]
          if (opt) {
            if (opt.type === "placeholder") {
              continue
            }
            entries.push({
              name: option,
              value: opt
            })
          }
        }
      }
      entries.sort((a, b) => {
        return (b.value.order ?? 1) - (a.value.order ?? 1)
      })

      return entries
    }))
  }


  localeTime(time: number | undefined) {

    if (!time) {
      return undefined
    }
    const eventTime = new Date(time);
    return eventTime.toLocaleString("sv-SE", { hour12: false })
  }


  ngAfterViewInit(): void {
    this.formGlob.nativeElement.addEventListener("change", e => {
      const options = Object.fromEntries(new FormData(this.formGlob.nativeElement).entries()) as Partial<NodeDefToType<NodeDefOptinos>>

      this.con.mergeGlobals(options)
      /* for (const key in options) {
         const val = options[key]
         if (typeof val == "string") {
           this.node.parameters ??= {}
 
           this.node.parameters[key] = val
         }
       }
       this.con.store(this.node.uuid)*/
    })

    this.form.nativeElement.addEventListener("submit", e => {
      e.preventDefault()
      return false
    })
  }

  entryName(i, entry) {
    return entry.name
  }

}
