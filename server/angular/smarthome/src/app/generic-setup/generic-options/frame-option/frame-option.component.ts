import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Frame } from '../../../settings/interfaces';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-frame-option',
  templateUrl: './frame-option.component.html',
  styleUrls: ['./frame-option.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class FrameOptionComponent implements OnInit, OnChanges {


  @Input()
  definition: Frame

  @Input()
  name: string

  @Input()
  currentValue: string

  trustedDocuemnt: SafeHtml;


  initialized = new BehaviorSubject(false)

  documentCache: string

  constructor(private sanitizer: DomSanitizer) {}


  ngOnInit() {
    this.initialized.next(true)
  }

  ngOnChanges(changes: SimpleChanges): void {
    const currentDef = JSON.stringify({ def: this.definition, value: this.currentValue })
    if (this.documentCache !== currentDef) {

      const parsed = new DOMParser().parseFromString(this.definition.document, "text/html")
      parsed.querySelectorAll("script").forEach((scr, i) => {
        scr.textContent += `\n\n//# sourceURL=content.${this.name}.${i}.js`
      })
      this.trustedDocuemnt = this.sanitizer.bypassSecurityTrustHtml(`<html style="overflow: hidden">${parsed.head.outerHTML}\n${parsed.body.outerHTML}</html>`)
      this.documentCache = currentDef
    }

  }
  frameMessage(event) {
    debugger
    //this.elementRef.nativeElement.value = JSON.stringify(this.monacoData)
    //this.elementRef.nativeElement.dispatchEvent(new Event('change', { 'bubbles': true }))
  }

  frameLoad(frame: HTMLIFrameElement, valueElement: HTMLTextAreaElement) {
    this.initialized.pipe(filter(b => !!b)).subscribe(() => {
      const channel = new MessageChannel()
      channel.port1.start()
      channel.port2.start()

      frame.contentWindow.postMessage(JSON.stringify({
        type: "data",
        data: this.definition.data,
        current: this.currentValue
      }), "*", [channel.port1]);


      channel.port2.addEventListener("message", e => {
        const evt = JSON.parse(e.data)
        if (evt.type === "size") {
          const size = evt.size as { width: number, height: number }

          frame.style.width = size.width + 4 + "px"
          frame.style.height = size.height + 4 + "px"
        } else if (evt.type == "change") {
          valueElement.value = evt.data
          valueElement.dispatchEvent(new Event('change', { 'bubbles': true }))
        }
      })
    })

  }

}
