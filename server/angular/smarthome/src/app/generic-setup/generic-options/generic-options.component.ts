import type { AfterViewInit, OnChanges } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ConnectionLines } from '../connection-lines';
import { CommonModule } from '@angular/common';
import type { NodeDefintion, NodeOptionTypes } from '../../settings/interfaces';
import { ElementNode } from '../../settings/interfaces';
import { GenOptionComponent } from './gen-option/gen-option.component';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-generic-options',
  templateUrl: './generic-options.component.html',
  styleUrls: ['./generic-options.component.scss'],
  imports: [CommonModule, GenOptionComponent, MatIconModule],
  standalone: true
})
export class GenericOptionsComponent implements AfterViewInit, OnChanges {


  @Input()
  node: ElementNode

  @Input()
  options: NodeDefintion

  @ViewChild("form")
  form: ElementRef<HTMLFormElement>


  @ViewChild("formglob")
  formGlob: ElementRef<HTMLFormElement>

  public entries: Array<{ name: string, value: NodeOptionTypes }> = []

  constructor(private con: ConnectionLines, private settings: SettingsService) {}

  async ngOnChanges(): Promise<void> {
    this.entries = []
    for (const option in this.options.options ?? {}) {
      const opt = this.options.options[option]
      if (opt.type === "placeholder") {
        continue
      }
      this.entries.push({
        name: option,
        value: opt
      })
    }
    if (this.node.runtimeContext?.parameters) {
      for (const option in this.node.runtimeContext?.parameters) {
        const opt = this.node.runtimeContext?.parameters[option]
        if (opt.type === "placeholder") {
          continue
        }
        this.entries.push({
          name: option,
          value: opt
        })
      }
    }
    this.entries.sort((a, b) => {
      return (b.value.order ?? 1) - (a.value.order ?? 1)
    })
  }


  ngAfterViewInit(): void {
    this.form.nativeElement.addEventListener("change", e => {
      const options = Object.fromEntries(new FormData(this.form.nativeElement).entries())
      for (const key in options) {
        const val = options[key]
        if (typeof val == "string") {
          this.node.parameters ??= {}

          this.node.parameters[key] = val
        }
      }
      this.con.store(this.node.uuid)
    })

    this.formGlob.nativeElement.addEventListener("change", e => {
      const options = Object.fromEntries(new FormData(this.formGlob.nativeElement).entries())

      this.settings.mergeGlobals(options)
      for (const key in options) {
        const val = options[key]
        if (typeof val == "string") {
          this.node.parameters ??= {}

          this.node.parameters[key] = val
        }
      }
      this.con.store(this.node.uuid)
    })

    this.form.nativeElement.addEventListener("submit", e => {
      e.preventDefault()
      return false
    })
  }

  entryName(i, entry) {
    return entry.name
  }

}
