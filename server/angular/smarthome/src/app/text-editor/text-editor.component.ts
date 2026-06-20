import { Component, forwardRef, OnInit, ViewChild, type ElementRef, type ViewRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { ResolvablePromise } from '../utils/resolvable-promise';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextEditorComponent),
      multi: true
    }
  ]
})
export class TextEditorComponent implements ControlValueAccessor {

  constructor() {}


  @ViewChild("textref")
  contenteditable: ElementRef<HTMLDivElement>

  onChangeFn;
  onTouchedFn;

  contentEditableReady = new ResolvablePromise<HTMLDivElement>()

  writeValue(obj: any): void {

    this.contentEditableReady.then(el => {
      el.innerHTML = this.linkify((obj || ""))
    })

    //debugger
    //throw new Error('Method not implemented.');
  }
  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
    //throw new Error('Method not implemented.');
  }
  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    console.trace("disabled state " + isDisabled)

    //throw new Error('Method not implemented.');
  }



  ngOnInit() {

  }

  ngAfterViewInit() {
    this.contentEditableReady.resolve(this.contenteditable.nativeElement)
    this.resizeTextArea(this.contenteditable.nativeElement)
  }

  linkify(text: string): string {
    return text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    ).replace(/\n/g, "<br>");
  }

  resizeTextArea(textarea: HTMLElement) {
    textarea.style.height = 'auto';
    textarea.style.width = 'auto';

    const maxWidth = window.innerWidth - 200

    textarea.style.height = textarea.scrollHeight + 10 + 'px';
    textarea.style.width = Math.min(textarea.scrollWidth + 10, maxWidth) + 'px';
  }
  onContentInput(el: HTMLElement) {





    this.onChangeFn(el.textContent)

    //this.item.customdescription = el.innerText;
    this.resizeTextArea(el);
  }


  onBlur(el: HTMLElement) {

    const text = el.innerText;
    const html = this.linkify(text);

    el.innerHTML = html;

    this.onChangeFn(text)

    this.resizeTextArea(el);

  }


  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const text = event.clipboardData?.getData('text/plain') ?? '';

    document.execCommand('insertText', false, text);
  }

  onClick($event: Event) {
    const target = $event.target as HTMLAnchorElement;

    if (target.tagName === 'A') {
      window.open(target.href, "_blank")
      // let browser handle it normally
    }
  }

}
