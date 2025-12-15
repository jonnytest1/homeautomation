import { Component, EventEmitter, forwardRef, OnInit, Output, ViewChild, type AfterViewInit, type ElementRef, type OnChanges, type OnDestroy, type SimpleChanges } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { Main, SandBox } from './editor';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { editor, languages } from 'monaco-editor';
import { ResolvablePromise } from '../utils/resolvable-promise';

interface Imports {
  main: Main;
}


let importsPromise: Promise<Imports>

@Component({
  selector: 'app-monaco-html',
  templateUrl: './monaco-html.component.html',
  styleUrls: ['./monaco-html.component.scss'],
  imports: [CommonModule, MatIconModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MonacoHtmlComponent),
    multi: true
  }],
  standalone: true
})
export class MonacoHtmlComponent implements OnInit, OnDestroy, ControlValueAccessor, OnChanges, AfterViewInit {

  onChange: (value: string) => void;
  recentlySaved = false;

  @ViewChild("monacoEditor")
  monacoEditor: ElementRef<HTMLElement>


  editor: editor.IStandaloneCodeEditor

  @Output()
  code = new EventEmitter<{
    html: string,
  }>();
  cachedText: string;

  static async setupRequire() {
    const requireFnc = (window.require as any);
    requireFnc.config({
      paths: {
        vs: 'https://typescript.azureedge.net/cdn/5.0.4/monaco/min/vs'
      }
    });
    return new Promise<Imports>(resolver => {
      requireFnc(['vs/editor/editor.main'], (
        main: Main,
      ) => {
        resolver({ main });
      });
    });
  }
  static async getSandBox(): Promise<Imports> {
    if (window.require) {
      return MonacoHtmlComponent.setupRequire();
    } else {
      return new Promise(res => setTimeout(res, 100))
        .then(() => MonacoHtmlComponent.getSandBox());
    }
  }

  constructor() {}


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.createEditor(this);

    /*this.editor = editor.create(this.monacoEditor.nativeElement, {
      language: "html"
    })*/
  }
  private async createEditor(ref: MonacoHtmlComponent) {
    await importsPromise;

    while (!window.monaco) {
      await ResolvablePromise.delayed(6)
    }
    ref.createTheme()
    monaco.languages.html.htmlDefaults.setOptions({
      validate: true,
      suggest: {
        html5: true,
        angular1: false,
        ionic: false,
        javascript: true,
        typescript: true
      },
      format: true as any,
      hover: true,
      // This is the important part:
      script: {
        // enable JavaScript support inside <script>
        embedded: true
      }
    } as languages.html.Options);


    ref.editor = monaco.editor.create(ref.monacoEditor.nativeElement, {
      language: "html",
      value: ref.cachedText || "",
      theme: "vs-code-dark-e"
    });
    ref.editor.onDidChangeModelContent(e => {


      const value = ref.editor.getValue()
      ref.saveCode(value)
    })
  }

  private async saveCode(text: string) {

    this.onChange(text);

    this.code.emit({
      html: text
    })

  }
  private createTheme() {

    monaco.editor.defineTheme("vs-code-dark-e", {
      "base": "vs-dark",
      "inherit": true,
      "rules": [
        {
          "background": "002240",
          "token": ""
        },
        {
          "foreground": "e1efff",
          "token": "punctuation - (punctuation.definition.string || punctuation.definition.comment)"
        },
        {
          "foreground": "ff628c",
          "token": "constant"
        },
        {
          "foreground": "ffdd00",
          "token": "entity"
        },
        {
          "foreground": "ff9d00",
          "token": "keyword"
        },
        {
          "foreground": "ffee80",
          "token": "storage"
        },
        {
          "foreground": "3ad900",
          "token": "string -string.unquoted.old-plist -string.unquoted.heredoc"
        },
        {
          "foreground": "3ad900",
          "token": "string.unquoted.heredoc string"
        },
        {
          "foreground": "0088ff",
          "fontStyle": "italic",
          "token": "comment"
        },
        {
          "foreground": "80ffbb",
          "token": "support"
        },
        {
          "foreground": "cccccc",
          "token": "variable"
        },
        {
          "foreground": "ff80e1",
          "token": "variable.language"
        },
        {
          "foreground": "ffee80",
          "token": "meta.function-call"
        },
        {
          "foreground": "f8f8f8",
          "background": "800f00",
          "token": "invalid"
        },
        {
          "foreground": "ffffff",
          "background": "223545",
          "token": "text source"
        },
        {
          "foreground": "ffffff",
          "background": "223545",
          "token": "string.unquoted.heredoc"
        },
        {
          "foreground": "ffffff",
          "background": "223545",
          "token": "source source"
        },
        {
          "foreground": "80fcff",
          "fontStyle": "italic",
          "token": "entity.other.inherited-class"
        },
        {
          "foreground": "9eff80",
          "token": "string.quoted source"
        },
        {
          "foreground": "80ff82",
          "token": "string constant"
        },
        {
          "foreground": "80ffc2",
          "token": "string.regexp"
        },
        {
          "foreground": "edef7d",
          "token": "string variable"
        },
        {
          "foreground": "ffb054",
          "token": "support.function"
        },
        {
          "foreground": "eb939a",
          "token": "support.constant"
        },
        {
          "foreground": "ff1e00",
          "token": "support.type.exception"
        },
        {
          "foreground": "8996a8",
          "token": "meta.preprocessor.c"
        },
        {
          "foreground": "afc4db",
          "token": "meta.preprocessor.c keyword"
        },
        {
          "foreground": "73817d",
          "token": "meta.sgml.html meta.doctype"
        },
        {
          "foreground": "73817d",
          "token": "meta.sgml.html meta.doctype entity"
        },
        {
          "foreground": "73817d",
          "token": "meta.sgml.html meta.doctype string"
        },
        {
          "foreground": "73817d",
          "token": "meta.xml-processing"
        },
        {
          "foreground": "73817d",
          "token": "meta.xml-processing entity"
        },
        {
          "foreground": "73817d",
          "token": "meta.xml-processing string"
        },
        {
          "foreground": "9effff",
          "token": "meta.tag"
        },
        {
          "foreground": "9effff",
          "token": "meta.tag entity"
        },
        {
          "foreground": "9effff",
          "token": "meta.selector.css entity.name.tag"
        },
        {
          "foreground": "ffb454",
          "token": "meta.selector.css entity.other.attribute-name.id"
        },
        {
          "foreground": "5fe461",
          "token": "meta.selector.css entity.other.attribute-name.class"
        },
        {
          "foreground": "9df39f",
          "token": "support.type.property-name.css"
        },
        {
          "foreground": "f6f080",
          "token": "meta.property-group support.constant.property-value.css"
        },
        {
          "foreground": "f6f080",
          "token": "meta.property-value support.constant.property-value.css"
        },
        {
          "foreground": "f6aa11",
          "token": "meta.preprocessor.at-rule keyword.control.at-rule"
        },
        {
          "foreground": "edf080",
          "token": "meta.property-value support.constant.named-color.css"
        },
        {
          "foreground": "edf080",
          "token": "meta.property-value constant"
        },
        {
          "foreground": "eb939a",
          "token": "meta.constructor.argument.css"
        },
        {
          "foreground": "f8f8f8",
          "background": "000e1a",
          "token": "meta.diff"
        },
        {
          "foreground": "f8f8f8",
          "background": "000e1a",
          "token": "meta.diff.header"
        },
        {
          "foreground": "f8f8f8",
          "background": "4c0900",
          "token": "markup.deleted"
        },
        {
          "foreground": "f8f8f8",
          "background": "806f00",
          "token": "markup.changed"
        },
        {
          "foreground": "f8f8f8",
          "background": "154f00",
          "token": "markup.inserted"
        },
        {
          "background": "8fddf630",
          "token": "markup.raw"
        },
        {
          "background": "004480",
          "token": "markup.quote"
        },
        {
          "background": "130d26",
          "token": "markup.list"
        },
        {
          "foreground": "c1afff",
          "fontStyle": "bold",
          "token": "markup.bold"
        },
        {
          "foreground": "b8ffd9",
          "fontStyle": "italic",
          "token": "markup.italic"
        },
        {
          "foreground": "c8e4fd",
          "background": "001221",
          "fontStyle": "bold",
          "token": "markup.heading"
        }
      ],
      "colors": {
        "editor.foreground": "#FFFFFF",
        "editor.background": "#002240",
        "editor.selectionBackground": "#B36539BF",
        "editor.lineHighlightBackground": "#00000059",
        "editorCursor.foreground": "#FFFFFF",
        "editorWhitespace.foreground": "#FFFFFF26"
      }
    })
  }
  ngOnChanges(changes: SimpleChanges): void {
    debugger
  }
  writeValue(obj: any): void {
    if (typeof obj == "string") {
      if (!this.editor) {
        this.cachedText = obj;
      } else {
        this.editor.getModel().setValue(obj);
      }
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    //
  }
  setDisabledState?(isDisabled: boolean): void {
    //
  }



  ngOnDestroy(): void {
    this.editor.getModel().dispose()
    this.editor.dispose()
  }
}
