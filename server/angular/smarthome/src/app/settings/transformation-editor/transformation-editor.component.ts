import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { TransformFe } from '../interfaces';

@Component({
  selector: 'app-transformation-editor',
  templateUrl: './transformation-editor.component.html',
  styleUrls: ['./transformation-editor.component.scss']
})
export class TransformationEditorComponent implements OnInit, AfterViewInit {

  @Input()
  title: string

  @Input()
  transformer: TransformFe

  @ViewChild("jsTransform", { read: NgModel })
  jsTransform: NgModel;

  constructor() { }
  ngAfterViewInit(): void {
    this.jsTransform.control.markAsTouched();
    this.jsTransform.control.markAsDirty()
  }

  ngOnInit() {
  }

}
