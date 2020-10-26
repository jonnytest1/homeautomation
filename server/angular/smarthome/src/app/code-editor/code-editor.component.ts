import { NgForOf } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, forwardRef, Host, Inject, Injector, Input, OnInit, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, NgForm, NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as CodeMirror from 'codemirror';
import { CodeEditor } from './code-editor';

const css = require('codemirror/lib/codemirror.css');
const customcss = require('./custom.css');
const hintCss = require('codemirror/addon/hint/show-hint.css');

const csss = [customcss, hintCss];
export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CodeEditorComponent),
  multi: true
};
@Component({
  selector: 'code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
})
export class CodeEditorComponent implements OnInit, ControlValueAccessor {

  substitute;

  @ViewChild('codeEditor')
  elementRef: ElementRef<HTMLElement>;


  @Input()
  codetitle: String;

  onChange: any;

  onTouched: any;

  codeMirror: CodeEditor;


  cachedValue;
  ngModel: NgModel;
  generalErrors: Array<string>;
  constructor(private injector: Injector, private cdr: ChangeDetectorRef) { }
  writeValue(obj: any): void {
    if (!this.codeMirror) {
      this.cachedValue = obj;
    } else {
      this.codeMirror.setValue(this.toDisplayCode(obj));
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.codeMirror.setOption('readonly', isDisabled);
  }

  ngOnInit() {
    const st = document.createElement('style');
    st.innerHTML = css.default.replace('height: 300px;', 'height: 100%;');
    document.head.appendChild(st);

    csss.map(c => c.default).forEach(style => {
      const st2 = document.createElement('style');
      st2.innerHTML = style;
      document.head.appendChild(st2);
    });

  }

  fs(ref) {
    ref.requestFullscreen();
  }
  ngAfterViewInit() {
    require('codemirror/mode/javascript/javascript.js');
    require('codemirror/addon/edit/matchbrackets.js');
    require('codemirror/addon/edit/closebrackets.js');
    require('codemirror/addon/edit/closebrackets.js');
    require('codemirror/addon/hint/show-hint.js');
    require('codemirror/addon/hint/javascript-hint.js');
    require('codemirror/addon/search/match-highlighter.js');
    require('codemirror/addon/selection/active-line.js');
    require('codemirror/addon/tern/tern.js');

    setTimeout(() => {
      const cp = this;
      const hintOptions = {
        get additionalContext() {
          if (!cp.codetitle) {
            return {};
          }
          const keys = cp.codetitle.split('context: ')[1].split(', ');
          const context = {};
          keys.forEach(k => {
            context[k] = 'true';
          });
          return context;
        },
        useGlobalScope: false
      };

      const oIndex = Array.prototype.indexOf;
      Array.prototype.indexOf = function (key) {
        if (oIndex.call(this, 'transformation') > -1 && !(key in hintOptions.additionalContext)) {
          // return 1;
        }
        return oIndex.call(this, key);
      };
      this.codeMirror = CodeMirror(this.elementRef.nativeElement, {
        value: '',
        mode: 'javascript',
        theme: 'vscode-dark',
        lineNumbers: true,
        cursorHeight: '16.36px',
        spellcheck: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' },
        hintOptions: hintOptions,
        highlightSelectionMatches: true,
        styleActiveLine: true
      });


      this.setControlHandler();
      setTimeout(this.initialize.bind(this), 200);


    });
  }
  initialize() {
    this.codeMirror.setValue(this.toDisplayCode(this.cachedValue));
    this.codeMirror.setSelection({
      'line': this.codeMirror.firstLine(),
      'ch': 0,
      'sticky': null
    }, {
      'line': this.codeMirror.lastLine(),
      'ch': 0,
      'sticky': null
    },
      { scroll: false });
    // auto indent the selection
    this.codeMirror.indentSelection('smart');
    this.codeMirror.setCursor({
      'line': this.codeMirror.firstLine(),
      'ch': 0,
    });
  }


  private setControlHandler() {
    this.ngModel = this.injector.get(NgModel);

    this.codeMirror.on('change', (e, change) => {
      this.ngModel.control.setErrors(null);
      this.codeMirror.getAllMarks()
        .forEach(mark => { mark.clear(); });
      this.onChange(this.toStorageCode(this.codeMirror.getValue()));
    });

    this.ngModel.statusChanges.subscribe(change => {
      this.generalErrors = [];
      this.cdr.markForCheck();
      if (this.ngModel.errors) {
        this.setErrors();
      }
    });
  }

  private setErrors() {
    const errors = this.ngModel.errors.transformation;
    let hasGeneralError = false;
    Object.keys(errors)
      .forEach(errorKey => {
        hasGeneralError = hasGeneralError || this.setError(errorKey, errors);
      });


    this.cdr.markForCheck();
  }

  private setError(errorKey: string, errors: any): boolean {
    let foundLine = false;
    this.codeMirror.eachLine((lineel) => {
      try {
        const index = lineel.text.indexOf(errorKey);
        if (index > -1) {
          foundLine = true;

          const marker = this.codeMirror.markText(
            { line: lineel.lineNo(), ch: index },
            { line: lineel.lineNo(), ch: index + errorKey.length }, {
            attributes: {
              title: errors[errorKey],
            },
            css: 'text-decoration: underline red;'
          });

        }
      } catch (e) {
        console.error(e);
      }
    });

    if (!foundLine) {
      this.generalErrors.push(errors[errorKey].replace('\n', '<br>'));
      return true;
    }
    return false;
  }

  toDisplayCode(code: string) {
    return `${code || 'function(data,transformation,receiver){\n\n// code here \n\n}'}`;
  }

  toStorageCode(code: string) {
    return code;
  }
}
