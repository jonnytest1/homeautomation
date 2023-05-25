import type { CodeEditor } from './code-editor';
import type { AfterViewInit, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component, ElementRef, forwardRef, Injector, Input, ViewChild } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as CodeMirror from 'codemirror';

const customcss = require('./custom.css?raw');
const css = require('codemirror/lib/codemirror.css?raw');
const hintCss = require('codemirror/addon/hint/show-hint.css?raw');

const csss = [customcss, hintCss];

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CodeEditorComponent),
  multi: true
};
@Component({
  selector: 'code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.less'],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
})
export class CodeEditorComponent implements OnInit, ControlValueAccessor, AfterViewInit {

  substitute;

  @ViewChild('codeEditor')
  elementRef: ElementRef<HTMLElement>;


  @Input()
  codetitle: string;

  onChange: any;

  onTouched: any;

  codeMirror: CodeEditor;


  cachedValue;
  ngModel: NgModel;
  generalErrors: Array<string>;

  recentlySaved = false;
  constructor(private injector: Injector, private cdr: ChangeDetectorRef) {}
  writeValue(obj: string): void {
    if (!this.codeMirror) {
      this.cachedValue = obj;
    } else {
      this.codeMirror.setValue(this.toDisplayCode(obj));
    }
  }
  registerOnChange(fn): void {
    this.onChange = fn;
  }
  registerOnTouched(fn): void {
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

  isFullscreeen(ref) {
    return document.fullscreenElement == ref
  }

  fs(ref) {
    if (this.isFullscreeen(ref)) {
      document.exitFullscreen()
    } else {
      ref.requestFullscreen();
    }
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

    let beforeValidation = false;

    this.codeMirror.on('change', (e, change) => {
      beforeValidation = true;
      this.ngModel.control.markAsTouched({ onlySelf: true })
      this.ngModel.control.setErrors(null);
      this.codeMirror.getAllMarks()
        .forEach(mark => { mark.clear(); });
      this.onChange(this.toStorageCode(this.codeMirror.getValue()));
      beforeValidation = false;
    });

    this.ngModel.statusChanges.subscribe(change => {
      if (change == "VALID" && this.ngModel.control.value && !beforeValidation) {
        this.recentlySaved = true
        setTimeout(() => {
          this.recentlySaved = false;
          this.cdr.detectChanges()
        }, 500)
      }

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
        hasGeneralError = this.setError(errorKey, errors) || hasGeneralError;
      });


    this.cdr.markForCheck();
  }

  private setError(errorKey: string, errors: any): boolean {
    const foundLine = false;
    try {
      const pos = JSON.parse(errorKey);
      const token = this.codeMirror.getTokenAt({ line: pos.row - 1, ch: pos.character })

      const marker = this.codeMirror.markText(
        { line: pos.row - 1, ch: token.start },
        { line: pos.row - 1, ch: token.end }, {
        attributes: {
          title: errors[errorKey],
        },
        css: 'text-decoration: underline red;'
      });
      return false;
    } catch (e) {
      this.generalErrors.push(errors[errorKey].replace('\n', '<br>'));
      return true;
    }
  }

  toDisplayCode(code: string) {
    return `${code || '(NULL)'}`;
  }

  toStorageCode(code: string) {
    return code;
  }
}
