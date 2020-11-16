/* tslint:disable */
import { ChangeDetectorRef, Component, forwardRef, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';

declare var monaco

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

  onChange;

  onTouch;

  sandbox;

  cachedText;


  @Input()
  definition;
  ngModel: NgModel;

  recentlySaved = false;
  static editorArgs: { main: any; _tsWorker: any; sandboxFactory: any; };

  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {
    this.getSandBox().then(this.initializeEditor.bind(this))
  }


  async getSandBox() {
    if (window.require && "ts" in window) {
      return;
    }

    if (window.require) {
      return this.setupRequire();
    } else {
      return new Promise(res => setTimeout(res, 100)).then(this.getSandBox.bind(this));
    }
  }

  async setupRequire() {
    (window.require as any).config({
      paths: {
        vs: 'https://typescript.azureedge.net/cdn/4.0.5/monaco/min/vs',
        sandbox: 'https://www.typescriptlang.org/js/sandbox',
      },
      ignoreDuplicateModules: ['vs/editor/editor.main'],
    });
    return new Promise(resolver => {
      (window.require as any)(['vs/editor/editor.main', 'vs/language/typescript/tsWorker', 'sandbox/index'], (
        main, _tsWorker, sandboxFactory
      ) => {
        MonacoEditorComponent.editorArgs = { main, _tsWorker, sandboxFactory }
        resolver()
      });
    })

  }

  private async initializeEditor() {
    const { main, _tsWorker, sandboxFactory } = MonacoEditorComponent.editorArgs;
    document.getElementById('loader').parentNode.removeChild(document.getElementById('loader'));
    const models = monaco.editor.getModels();

    let hasModels = false;
    if (models.length) {
      hasModels = true;
      await Promise.all(models.map(async model => model.dispose()))
    }
    if (hasModels) {
      setTimeout(() => {
        this.createEditor(sandboxFactory, main);
      }, 500)
    } else {
      this.createEditor(sandboxFactory, main);
    }
  }

  private createEditor(sandboxFactory: any, main: any) {
    this.createTheme();
    this.setupGlobalTypes();

    const sandboxConfig = {
      text: this.cachedText || `({\n\n}) as TransformationResponse`,
      domID: 'monaco-editor-embed',
      monacoSettings: {
        theme: "vs-dark-e",
        lineHeight: "18px",
      }
    };


    this.sandbox = sandboxFactory.createTypeScriptSandbox(sandboxConfig, main, window["ts"]);
    this.sandbox.updateCompilerSettings({
      alwaysStrict: false,
      noImplicitUseStrict: true,
    });
    this.sandbox.editor.onDidChangeModelDecorations(async () => {
      const model = this.sandbox.getModel();
      let errors = model.getAllDecorations()
        .filter(dec => dec.options.className == "squiggly-error");
      if (!errors.length) {
        const text = this.sandbox.getModel().getValue();
        const js = await this.sandbox.getRunnableJS();
        if (text !== `({\n\n}) as TransformationResponse`) {
          this.onChange(js);
        }
      }
    });
    this.sandbox.editor.focus();
  }

  private setupGlobalTypes() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2016,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ["file:///global"]
    });
    monaco.languages.typescript.typescriptDefaults.addExtraLib(this.definition, 'file:///global/global.d.ts');
  }

  private createTheme() {
    monaco.editor.defineTheme('vs-dark-e', {
      base: 'vs-dark',
      inherit: true,
      rules: []
    });
  }

  ngOnInit(): void {
    this.ngModel = this.injector.get(NgModel);
    this.ngModel.statusChanges.subscribe(change => {
      if (change == "VALID" && this.ngModel.control.value) {
        this.recentlySaved = true
        setTimeout(() => {
          this.recentlySaved = false;
          this.cdr.detectChanges()
        }, 500)
      }

      //this.generalErrors = [];
      this.cdr.markForCheck();
      if (this.ngModel.errors) {
        //this.setErrors();
      }
    });
  }
  writeValue(obj: any): void {
    if (!this.sandbox) {
      this.cachedText = obj;
    } else {
      this.sandbox.getModel().setValue(obj);
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    //
  }
  async ngOnDestroy() {
    if (this.sandbox && this.sandbox.getModel()) {
      await this.sandbox.getModel().dispose()
      debugger;
    }
  }
}
