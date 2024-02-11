import type { ElementRef, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Component, Input, ViewChild } from '@angular/core';
import { ElementNode, NodeOptionTypes } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { MonacoEditorComponent } from '../../../monaco-editor/monaco-editor.component';
import { FormsModule } from '@angular/forms';
import { ConnectionLines } from '../../connection-lines';
import { FetchingJSONSchemaStore, InputData, JSONSchemaInput, quicktype } from 'quicktype-core'
import { BehaviorSubject } from 'rxjs';

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
  imports: [CommonModule, MonacoEditorComponent, FormsModule],
  standalone: true
})
export class GenOptionComponent implements OnInit, OnChanges {

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
    jsCode: string
  }

  set code(val: string) {
    this._code = val
    this.monacoData = {
      tsCode: val,
      jsCode: this.monacoData?.jsCode ?? ''
    }
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
  public set additionalVal(value: string) {
    this._additionalVal = value;

    this.monacoData = {
      jsCode: value,
      tsCode: this.monacoData?.tsCode ?? ''
    }
    this.elementRef.nativeElement.value = JSON.stringify(this.monacoData)
    this.elementRef.nativeElement.dispatchEvent(new Event('change', { 'bubbles': true }))

  }

  typeDefinition = new BehaviorSubject<string>(undefined)

  constructor(private con: ConnectionLines) {

  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.definition.type === "monaco" && "value" in changes) {
      try {
        this.monacoData = JSON.parse(this.value)
        this._code = this.monacoData.tsCode
        this._additionalVal = this.monacoData.jsCode
      } catch (e) {
        debugger
      }
    }
  }
  ngOnInit() {



    const inputs = this.con.getInputConnections(this.node.uuid)
      .filter(s => !!s.node?.runtimeContext?.outputSchema?.jsonSChema)

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
         

          \ntype InputType= ExpandRecursively<${inputTypeStr}> ;
          \n;
        `

        this.typeDefinition.next(typeDefinition)
      })



  }
}