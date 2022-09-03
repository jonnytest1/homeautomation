import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, EventEmitter, forwardRef, Injector, Input, Output } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { SandBox, AST, SandboxFactory, Main, MonacoGlobal, Decoration } from './editor';


declare let monaco: MonacoGlobal;

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MonacoEditorComponent),
    multi: true
  }]
})
export class MonacoEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {

  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {
    this.getSandBox().then(this.initializeEditor.bind(this));
  }
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

  recentlySaved = false;

  decorators: Array<Decoration> = [];

  ast: AST;
  previousText: string;


  async getSandBox() {
    if (window.require && 'ts' in window) {
      return;
    }

    if (window.require) {
      return this.setupRequire();
    } else {
      return new Promise(res => setTimeout(res, 100)).then(this.getSandBox.bind(this));
    }
  }

  async setupRequire() {
    const requireFnc = (window.require as any);
    requireFnc.config({
      paths: {
        vs: 'https://typescript.azureedge.net/cdn/4.0.5/monaco/min/vs',
        sandbox: 'https://www.typescriptlang.org/js/sandbox',
      },
      ignoreDuplicateModules: ['vs/editor/editor.main'],
    });
    return new Promise<void>(resolver => {
      requireFnc(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], (
        main: Main, _tsWorker, sandboxFactory: SandboxFactory
      ) => {
        MonacoEditorComponent.editorArgs = { main, sandboxFactory };
        resolver();
      });
    });

  }

  private async initializeEditor() {
    const { main, sandboxFactory } = MonacoEditorComponent.editorArgs;
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

  private createEditor(sandboxFactory: SandboxFactory, main: Main) {
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
    this.sandbox = sandboxFactory.createTypeScriptSandbox(sandboxConfig, main, window['ts']);

    this.sandbox.updateCompilerSettings({
      alwaysStrict: false,
      noImplicitUseStrict: true,
    });
    this.sandbox.editor.onDidChangeModelDecorations(async (e) => {
      const model = this.sandbox.getModel();
      const errors = model.getAllDecorations()
        .filter(dec => dec.options.className === 'squiggly-error');

      const text = model.getValue();
      this.saveCode(errors, text);
      if (text !== this.previousText) {
        this.previousText = text;
        if (!this.ast) {
          this.ast = await this.sandbox.getAST();
        }
        // debugger
        this.decorators = [];
        this.checkFnc(this.ast);
      }
    });
    this.sandbox.editor.focus();

  }

  private async saveCode(errors: Array<Decoration>, text: string) {
    if (!errors.length) {
      const js = await this.sandbox.getRunnableJS();
      if (text !== `({\n\n}) as TransformationResponse` && !this.readonly) {

        this.jsCodeChange.emit(js);
        this.onChange(text);
      }
    }
  }

  async checkFnc(element: AST) {
    if (element.arguments) {
      this.addFunctionHighlighting(element.expression);
      await Promise.all(element.arguments.map(child => this.checkFnc(child)));
      return;
    }

    await Promise.all(element.getChildren().map(child => this.checkFnc(child)));
  }

  addFunctionHighlighting(element: AST) {
    const test = element.getText()
    console.log(test, element.kind)
    if (element.kind === 198) {
      return
    }

    const start = this.sandbox.getModel().getPositionAt(element.pos);
    const end = this.sandbox.getModel().getPositionAt(element.end);
    this.decorators = this.sandbox.editor.deltaDecorations([], [
      {
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
        options: {
          inlineClassName: 'is-function',
        }
      }
    ]);
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
        {

        }
      ]
    });
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
    if (!this.sandbox) {
      this.cachedText = obj;
    } else {
      this.sandbox.getModel().setValue(obj);
      this.ast = undefined
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
