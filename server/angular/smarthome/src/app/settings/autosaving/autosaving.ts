import { HttpClient } from '@angular/common/http';
import { Directive, ElementRef, Host, HostBinding, Inject, InjectionToken, Input, Optional, Self, TemplateRef } from '@angular/core';
import { ControlValueAccessor, NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutosavingDirectiveProvider } from './autosaveProvider';
export const ROOT_AUTOSAVE_PATH = new InjectionToken<string>('AUTO_SAVE_PATH');
@Directive({
  selector: '[autosaving]',
})
export class AutosavingDirective {

  @Input()
  resource: string;

  @Input()
  dataRef: string | number;

  @Input()
  ngModel: any;

  @Input()
  name: string;

  @Input()
  dataRefName;

  @Input()
  debounce = 1000;

  private timeoutId;
  constructor(
    @Inject(ROOT_AUTOSAVE_PATH) private rootPath: string,

    @Optional() private itemProvider: AutosavingDirectiveProvider,
    private elementRef: ElementRef,
    private ngModelRef: NgModel,

    @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) private asd: ControlValueAccessor[],
    private http: HttpClient) {
    ngModelRef.valueChanges.subscribe(newValue => {
      if (this.ngModel === newValue) {
        return;
      }


      if (this.itemProvider) {
        if (this.itemProvider.dataRef && !this.dataRef) {
          this.dataRef = this.itemProvider.dataRef;
        }
        if (this.itemProvider.dataRefName && !this.dataRefName) {
          this.dataRefName = this.itemProvider.dataRefName;
        }
        if (this.itemProvider.resource && !this.resource) {
          this.resource = this.itemProvider.resource;
        }
      }
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        this.timeoutId = undefined;
        fetch(rootPath + this.resource, {
          method: 'PUT',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            [this.name]: newValue,
            [this.dataRefName]: this.dataRef
          })
        }).then(res => {
          if (res.status === 400) {
            res.json().then(err => {
              ngModelRef.control.setErrors(err);
            });

          }
        })
          .catch(error => { debugger; });
      }, this.debounce);


    });
  }
}
