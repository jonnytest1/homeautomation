import { TransformFe } from '../interfaces';
import type { AfterViewInit } from '@angular/core';
import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-transformation-editor',
  templateUrl: './transformation-editor.component.html',
  styleUrls: ['./transformation-editor.component.scss']
})
export class TransformationEditorComponent implements AfterViewInit {

  @Input()
  title: string;

  @Input()
  transformer: TransformFe;

  @ViewChild('jsTransform', { read: NgModel })
  jsTransform: NgModel;

  constructor(private cdr: ChangeDetectorRef) {
    //
  }
  ngAfterViewInit(): void {
    this.jsTransform.control.markAsTouched();
    this.jsTransform.control.markAsDirty();
    this.cdr.detectChanges();
  }
}
