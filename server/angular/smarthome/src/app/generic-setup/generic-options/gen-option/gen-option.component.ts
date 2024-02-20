import type { ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input, ViewChild } from '@angular/core';
import { ElementNode, NodeOptionTypes } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { MonacoEditorComponent } from '../../../monaco-editor/monaco-editor.component';
import { FormsModule } from '@angular/forms';
import { ConnectionLines } from '../../connection-lines';
import { BehaviorSubject } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';
import { FrameOptionComponent } from '../frame-option/frame-option.component';

const expansionType = `
  type ExpandRecursively<T> = T extends Date 
      ? T 
      : T extends object
        ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
        : T;
`


@Component({
  selector: 'app-gen-option',
  templateUrl: './gen-option.component.html',
  styleUrls: ['./gen-option.component.scss'],
  imports: [CommonModule, MonacoEditorComponent, FormsModule, FrameOptionComponent],
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

  @ViewChild("hiddenValue")
  elementRef: ElementRef<HTMLTextAreaElement>


  monacoData: {
    tsCode: string,
    jsCode: string,
    timestamp: number
  }


  frameProps: {
    trustedDocuemnt: SafeHtml
  }

  constructor(private con: ConnectionLines) {

  }


  updateCode(evt: { js: string; ts: string; }) {
    this.monacoData = {
      tsCode: evt.ts,
      timestamp: Date.now(),
      jsCode: evt.js
    }
    this._additionalVal = evt.js;
    this._code = evt.ts

    this.elementRef.nativeElement.value = JSON.stringify(this.monacoData)
    this.elementRef.nativeElement.dispatchEvent(new Event('change', { 'bubbles': true }))
  }

  get code() {
    if (!this._code) {
      const def = this.definition

      if (def.type == "monaco" && def.default) {
        return def.default
      }
    }

    return this._code || "test"
  }



  private _additionalVal: string;
  private _code: string;

  public get additionalVal(): string {
    return this._additionalVal;
  }

  typeDefinition = new BehaviorSubject<string>(undefined)

  ngOnChanges(changes: SimpleChanges): void {
    if (this.definition.type === "monaco" && ("value" in changes || "node" in changes)) {
      try {
        if (this.value) {
          const monacoData = JSON.parse(this.value) as typeof this.monacoData
          if (monacoData.timestamp && monacoData.timestamp > this.monacoData.timestamp) {
            this.monacoData = monacoData
            this._code = this.monacoData.tsCode
            this._additionalVal = this.monacoData.jsCode
          } else {
            console.log("skipped update due to timing")
          }

        }
      } catch (e) {
        debugger
      }


      const inputs = this.con.getInputConnections(this.node.uuid)
        .filter(s => !!s.node?.runtimeContext?.outputSchema?.jsonSchema)

      const schemas = Promise.all(inputs
        .map(async (inp, indx) => {
          const uuid = inp.node.uuid.replace(/-/g, "");



          return `
namespace _${uuid} {
    ${inp.node.runtimeContext.outputSchema.dts}
}`


        })).then(schemas => {

          const inputTypeStr = inputs
            .map(inp => `_${inp.node.uuid.replace(/-/g, "")}.Main`)
            .join(" | ")

          const typeDefinition = `
          ${schemas.join("\n\n")}

          ${expansionType}

          namespace EditorSChema {
          ${this.node.runtimeContext?.editorSchema?.dts ?? ''}
          }

          \ntype InputType= ExpandRecursively<${inputTypeStr}> ;
          \n;
        `

          this.typeDefinition.next(typeDefinition)
        })


    } else if (this.definition.type == "iframe") {

    }
  }
}