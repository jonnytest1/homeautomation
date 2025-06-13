import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, type OnChanges, type SimpleChanges } from '@angular/core';
import { AutosavingDirective } from '../../autosaving/autosaving';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';



export interface EditingConfig<T> {
  /**
   * the type of resource to save
   */
  resource: string;
  /**
   * should always be 'itemRef'
   */
  dataRefName?: string;
  /**
   * the resources primary key
   */
  dataRef: string | number;
  /**
   * the property name
   */
  name: keyof T;
}

@Component({
  selector: 'app-text-display',
  templateUrl: './text-display.component.html',
  styleUrls: ['./text-display.component.scss'],
  standalone: true,
  imports: [CommonModule, AutosavingDirective, FormsModule]
})
export class TextDisplayComponent implements OnChanges {

  @Input()
  text: string

  @Input()
  parseUrls = false


  @Input()
  urlTarget: "_self" | "_blank" = "_blank"


  @Input()
  editable: EditingConfig<unknown>


  parsedText: Array<{ type: "text" | "url" | "break" | "space", value: string }>

  @ViewChild("textref", { read: NgModel })
  textRefModel: NgModel

  constructor() {}


  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.parsedText = this.text.replace("\r", "").split(/([ \n])/).map(word => {
      if (word == " ") {
        return {
          type: "space",
          value: " "
        }
      } else if (word === "\n") {
        return {
          type: "break",
          value: "\n"
        }
      }

      if (this.parseUrls) {
        try {
          let url = new URL(word)
          if (url && url.hostname.length) {
            return {
              type: "url",
              value: word
            }
          }
        } catch (e) {
          return {
            type: "text",
            value: word
          }
        }
      }
      return {
        type: "text",
        value: word
      }
    })
  }

  edited(event: Event, index: number, textAreaRef?: HTMLTextAreaElement) {
    const target = event.target as HTMLSpanElement
    let text = target.innerText.replace("\n\n", "\n")
    const newText = this.parsedText.map((parsed, indx) => {
      if (indx === index) {

        parsed.value = text
        return text
      } else {
        return parsed.value
      }
    }).join("")

    this.text = newText
    textAreaRef.innerText = newText
    textAreaRef.dispatchEvent(new Event("change"))
    this.textRefModel.control.setValue(newText)
    this.textRefModel.control.markAsDirty()
    this.textRefModel.control.updateValueAndValidity();
    //update.emit(newText)
    console.log(this.textRefModel)
  }

}
