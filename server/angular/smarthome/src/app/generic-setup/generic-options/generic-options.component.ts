import type { AfterViewInit, OnChanges, OnInit } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { GenericNodesDataService } from '../generic-node-data-service';
import { CommonModule } from '@angular/common';
import type { NodeDefOptinos, NodeDefToType, NodeDefintion, NodeOptionTypes } from '../../settings/interfaces';
import { ElementNode } from '../../settings/interfaces';
import { GenOptionComponent } from './gen-option/gen-option.component';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from '../../settings.service';
import { Store } from '@ngrx/store';
import { backendActions } from '../store/action';
import { selectNode } from '../store/selectors';
import { Observable, combineLatest, first, map } from 'rxjs';
import { StoreService } from '../store/store-service';

@Component({
  selector: 'app-generic-options',
  templateUrl: './generic-options.component.html',
  styleUrls: ['./generic-options.component.scss'],
  imports: [CommonModule, GenOptionComponent, MatIconModule],
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
      this.node$.pipe(first()).subscribe(() => {

      })
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




  ngAfterViewInit(): void {
    this.form.nativeElement.addEventListener("change", e => {
      const options = Object.fromEntries(new FormData(this.form.nativeElement).entries()) as {
        [optinoskey: string]: string;
      }
      this.store.dispatch(backendActions.updateParameters({ params: options, node: this.nodeUuid }))
      /* for (const key in options) {
         const val = options[key]
         if (typeof val == "string") {
           this.node.parameters ??= {}
 
           this.node.parameters[key] = val
         }
       }
       this.con.store(this.node.uuid)*/
    })

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
