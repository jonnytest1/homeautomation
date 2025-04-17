import type { OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ElementNode, NodeOptionTypes } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { SafeHtml } from '@angular/platform-browser';
import { FrameOptionComponent } from '../frame-option/frame-option.component';
import { MonacoOptionComponent } from './monaco-option/monaco-option.component';
import { Store } from '@ngrx/store';
import { backendActions } from '../../store/action';
import { logKibana } from '../../../global-error-handler';
import { StoreService } from '../../store/store-service';
import { first } from 'rxjs';
import { selectGlobals } from '../../store/selectors';
import { MonacoHtmlComponent } from "../../../monaco-html/monaco-html.component"
import { SelectOptionComponent } from './select-option/select-option.component';


@Component({
  selector: 'app-gen-option',
  templateUrl: './gen-option.component.html',
  styleUrls: ['./gen-option.component.scss'],
  imports: [CommonModule, FormsModule, FrameOptionComponent, MonacoOptionComponent, MonacoHtmlComponent, SelectOptionComponent],
  standalone: true
})
export class GenOptionComponent implements OnChanges {


  @Input()
  name: string


  @Input()
  definition: NodeOptionTypes


  @Input()
  value


  @Input()
  node: ElementNode


  @Input()
  setting: "global" | "node" = "node"

  @ViewChild("hiddenValue")
  elementRef: ElementRef<HTMLTextAreaElement>

  frameProps: {
    trustedDocuemnt: SafeHtml
  }

  constructor(private store: Store, private stService: StoreService) {

  }

  ngOnChanges(changes: SimpleChanges): void {

  }


  paramChanged(event: Event) {
    event.stopPropagation()
    const target = event.target
    if (!target) {
      logKibana("ERROR", "target not defined at paramChanged")
      return
    }
    if ("value" in target) {
      const value = target.value
      if (typeof value !== "string") {
        logKibana("ERROR", {
          message: "valuetype is not string",
          valueType: typeof value
        })
        return
      }

      let modifiedValue = value
      if (this.definition.type === "boolean" && target instanceof HTMLInputElement) {
        modifiedValue = target.checked ? "on" : ""
      }


      if (this.setting === "global") {

        this.store.select(selectGlobals).pipe(first()).subscribe(globals => {


          const glboals = {
            ...globals as Record<string, string>,
            [this.name]: modifiedValue
          }
          this.store.dispatch(backendActions.updateGlobals({
            globals: glboals


          }))
        })

      } else {
        this.store.dispatch(backendActions.updateParameter({
          param: this.name,
          node: this.node.uuid,
          value: modifiedValue

        }))
      }


    } else {
      logKibana("ERROR", "target has no value");
    }


    /*const options = Object.fromEntries(new FormData(this.form.nativeElement).entries()) as {
        [optinoskey: string]: string;
      }
      
      /* for (const key in options) {
           const val = options[key]
           if (typeof val == "string") {
             this.node.parameters ??= {}
   
             this.node.parameters[key] = val
           }
         }
         this.con.store(this.node.uuid)*/

  }
}