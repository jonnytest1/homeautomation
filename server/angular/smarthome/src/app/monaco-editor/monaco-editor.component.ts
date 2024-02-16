import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Injector, Input, Output } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { SandBox, AST, SandboxFactory, Main, MonacoGlobal, Decoration, MonacoModel } from './editor';
import { AST_KIND } from './editor';
import { ResolvablePromise } from '../utils/resolvable-promise';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';


declare let monaco: MonacoGlobal;

interface IMports {
  main: Main; sandboxFactory: SandboxFactory;
}
let importsPromise: Promise<IMports>

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MonacoEditorComponent),
    multi: true
  }],
  imports: [MatIconModule, CommonModule],
  standalone: true
})
export class MonacoEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {


  static editorArgs: { main: Main; sandboxFactory: SandboxFactory; };

  onChange: (value: string) => void;

  onTouch;

  sandbox: SandBox;

  cachedText?: string;


  @Input()
  definition: string;

  @Input()
  readonly = false

  ngModel: NgModel;


  @Input()
  jsCode: string;

  @Output()
  jsCodeChange = new EventEmitter<string>();


  @Output()
  code = new EventEmitter<{
    js: string,
    ts: string
  }>();

  recentlySaved = false;

  decorators: Array<Decoration> = [];

  ast: AST;
  previousText: string;


  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {
    if (!importsPromise) {
      importsPromise = this.getSandBox()
    }
    importsPromise.then(args => {
      this.initializeEditor(args)
    });
  }

  async getSandBox(): Promise<IMports> {
    if (window.require) {
      return this.setupRequire();
    } else {
      return new Promise(res => setTimeout(res, 100))
        .then(() => this.getSandBox());
    }
  }

  async setupRequire() {
    const requireFnc = (window.require as any);
    requireFnc.config({
      paths: {
        vs: 'https://typescript.azureedge.net/cdn/5.0.2/monaco/min/vs',
        sandbox: 'https://www.typescriptlang.org/js/sandbox',
      },
      ignoreDuplicateModules: ['vs/editor/editor.main'],
    });
    return new Promise<IMports>(resolver => {
      requireFnc(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], (
        main: Main, _tsWorker, sandboxFactory: SandboxFactory
      ) => {
        resolver({ main, sandboxFactory });
      });
    });
  }

  private async initializeEditor(args: IMports) {
    const { main, sandboxFactory } = args;
    document.getElementById('loader')?.parentNode?.removeChild(document.getElementById('loader'));
    const models = monaco.editor.getModels();

    let hasModels = false;
    if (models.length) {
      hasModels = true;
      await Promise.all(models.map(async model => model.dispose()));
    }
    if (hasModels) {
      setTimeout(() => {
        this.createEditor(sandboxFactory, main);
      }, 500);
    } else {
      this.createEditor(sandboxFactory, main);
    }
  }

  private async createEditor(sandboxFactory: SandboxFactory, main: Main) {
    this.createTheme();
    this.setupGlobalTypes();

    const sandboxConfig = {
      text: this.cachedText || `({\n\n}) as TransformationResponse`,
      domID: 'monaco-editor-embed',
      monacoSettings: {
        theme: 'vs-dark-e',
        lineHeight: 18,
        readOnly: this.readonly
      }
    };
    window['ts'].Debug.setAssertionLevel(3)

    while (!document.querySelector("#" + sandboxConfig.domID)) {
      await ResolvablePromise.delayed(10);
    }
    this.sandbox = sandboxFactory.createTypeScriptSandbox(sandboxConfig, main, window['ts']);

    this.sandbox.updateCompilerSettings({
      alwaysStrict: false,
      noImplicitUseStrict: true,
    });
    let saveTimeout: NodeJS.Timeout | undefined = undefined

    this.sandbox.editor.onDidChangeModelDecorations(async e => {

      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      saveTimeout = setTimeout(async () => {
        saveTimeout = undefined
        const model = this.sandbox.getModel();
        if (!model) {
          return
        }
        const text = model.getValue();
        const errors = model.getAllDecorations()
          .filter(dec => dec.options.className === 'squiggly-error');

        if (text !== this.previousText) {
          this.previousText = text;
          if (!this.ast) {
            this.ast = await this.sandbox.getAST();
          }
          // debugger
          this.decorators = [];
          // this.checkFnc(this.ast);

          if (!errors.length) {
            this.saveCode(text)
          }
        }

      }, 500)


    })
    /*  this.sandbox.editor.onDidChangeModelDecorations((e) => {
        setTimeout(async () => {
        }, 200)
  
      });*/
    this.sandbox.editor.focus();

  }

  private async saveCode(text: string) {

    const js = await this.sandbox.getRunnableJS();
    if (text !== `({\n\n}) as TransformationResponse` && !this.readonly) {

      this.jsCodeChange.emit(js);
      this.onChange(text);

      this.code.emit({
        js: js,
        ts: text
      })
    }
  }

  async checkFnc(element: AST) {
    if (element.kind === AST_KIND.CLASS_INSTANCE) {
      return //new Date()
    }

    if (element.parent?.kind == AST_KIND.CLASS_INSTANCE_CALL) {
      this.addFunctionHighlighting(element);
    }

    if (element.expression) {
      this.addFunctionHighlighting(element.expression);
    }

    if (element.arguments) {
      await Promise.all(element.arguments.map(child => this.checkFnc(child)));
    }
    if (element.expression) {
      await Promise.all(element.expression.getChildren().map(child => this.checkFnc(child)));
    }

    await Promise.all(element.getChildren().map(child => this.checkFnc(child)));
  }

  addFunctionHighlighting(element: AST) {
    const test = element.getText()
    if (element.kind === 198
      || element.kind == AST_KIND.BRACKETS || element.kind == AST_KIND.BRACKETS_2
      || element.kind == AST_KIND.STATEMENT
      || element.kind == AST_KIND.OBJECT_CREATION
      || element.kind == AST_KIND.CLASS_INSTANCE) {
      return
    }
    // debugger;
    console.log(test, element.kind)

    const start = this.sandbox.getModel().getPositionAt(element.pos);
    const end = this.sandbox.getModel().getPositionAt(element.end);
    /* this.decorators = this.sandbox.editor.deltaDecorations([], [
       {
         range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
         options: {
           inlineClassName: 'is-function',
         }
       }
     ]);*/


  }

  private setupGlobalTypes() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2016,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ['file:///global']
    });
    monaco.languages.typescript.typescriptDefaults.addExtraLib(this.definition, 'file:///global/global.d.ts');
  }

  private createTheme() {
    monaco.editor.defineTheme('vs-dark-e', {
      base: 'vs-dark',
      inherit: true,
      rules: [

      ],
      colors: {

      }
    });


    //debugger
    // monaco.editor.createModel(, "typescript")

  }

  ngOnInit(): void {
    this.ngModel = this.injector.get(NgModel);
    this.ngModel.statusChanges.subscribe(change => {
      if (change === 'VALID' && this.ngModel.control.value) {
        this.recentlySaved = true;
        setTimeout(() => {
          this.recentlySaved = false;
          this.cdr.detectChanges();
        }, 500);
      }

      // this.generalErrors = [];
      this.cdr.markForCheck();
      if (this.ngModel.errors) {
        // this.setErrors();
      }
    });
  }
  writeValue(obj: string): void {
    if (typeof obj == "string") {
      if (!this.sandbox) {
        this.cachedText = obj;
      } else {
        this.sandbox.getModel().setValue(obj);
        this.ast = undefined
      }
    }
  }
  registerOnChange(fn): void {
    this.onChange = fn;
  }
  registerOnTouched(fn): void {
    this.onTouch = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    //
  }
  ngOnDestroy() {
    if (this.sandbox && this.sandbox.getModel()) {
      this.sandbox.getModel().dispose();
    }
  }
}
