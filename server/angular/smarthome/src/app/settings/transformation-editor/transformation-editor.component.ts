import { Component, Input, OnInit } from '@angular/core';
import { TransformFe } from '../interfaces';

@Component({
  selector: 'app-transformation-editor',
  templateUrl: './transformation-editor.component.html',
  styleUrls: ['./transformation-editor.component.scss']
})
export class TransformationEditorComponent implements OnInit {

  @Input()
  title: string

  @Input()
  transformer: TransformFe

  constructor() { }

  ngOnInit() {
  }

}
