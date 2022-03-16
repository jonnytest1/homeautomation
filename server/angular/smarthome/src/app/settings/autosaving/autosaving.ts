import { AutosavingDirectiveProviderDirective } from './autosaveProvider';
import type { OnInit } from '@angular/core';
import { Directive, ElementRef, Inject, InjectionToken, Input, Optional, Self } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NgModel, NG_VALUE_ACCESSOR } from '@angular/forms';
export const ROOT_AUTOSAVE_PATH = new InjectionToken<string>('AUTO_SAVE_PATH');
@Directive({
  selector: '[autosaving]',
})
export class AutosavingDirective implements OnInit {
  constructor(
    @Inject(ROOT_AUTOSAVE_PATH) rootPath: string,

    @Optional() private itemProvider: AutosavingDirectiveProviderDirective,
    elementRef: ElementRef,
    private ngModelRef: NgModel,

    @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) private asd: ControlValueAccessor[]) {
    ngModelRef.control.setAsyncValidators(async (control) => {
      if (this.value === control.value || this.duringConstructor || control.pristine) {
        return null;
      }
      this.value = control.value;
      let dataRef = this.dataRef;
      let dataRefName = this.dataRefName;
      let resource = this.resource;
      if (this.itemProvider) {

        if (this.itemProvider.dataRef && !this.dataRef) {
          dataRef = this.itemProvider.dataRef;
        }
        if (this.itemProvider.dataRefName && !this.dataRefName) {
          dataRefName = this.itemProvider.dataRefName;
        }
        if (this.itemProvider.resource && !this.resource) {
          resource = this.itemProvider.resource;
        }
      }
      if (dataRef === undefined) {
        return;
      }


      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      control.markAsPending();
      return new Promise(res => {
        this.timeoutId = setTimeout(async () => {
          try {
            this.timeoutId = undefined;
            const id = this.getDataRef();
            const requestKey = resource + 'PUT' + dataRef;
            const pending = AutosavingDirective.RequestMap.get(requestKey);
            if (pending) {
              pending.abort();
            }
            const controller = new AbortController();
            AutosavingDirective.RequestMap.set(requestKey, controller);
            this.ngModelRef.control.markAsPending();
            const response = await fetch(rootPath + resource, {
              method: 'PUT',
              headers: {
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                [this.name]: control.value,
                [dataRefName]: dataRef
              }),
              signal: controller.signal
            });
            if (response.status === 400) {
              const errs = await response.json();
              if (this.getDataRef() === id) {
                res(errs);
              }

            }

          } catch (e) {
            console.error(e);
          }
          res(null);
        }, this.debounce);
      });

    });

    this.duringConstructor = false;
  }

  private static RequestMap = new Map<string, AbortController>();

  @Input()
  resource: string;

  @Input()
  dataRef: string | number;

  @Input()
  name: string;

  @Input()
  dataRefName;

  @Input()
  debounce = 1000;

  private timeoutId;

  duringConstructor = true;

  private value;
  ngOnInit(): void {
    this.value = this.ngModelRef.value;
  }


  getDataRef() {
    let dataRef = this.dataRef;
    if (this.itemProvider) {
      if (this.itemProvider.dataRef && !this.dataRef) {
        dataRef = this.itemProvider.dataRef;
      }
    }
    return dataRef;
  }
}
