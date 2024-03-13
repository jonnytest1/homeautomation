import type { OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ElementNode, NodeOptionTypes } from '../../../settings/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenericNodesDataService } from '../../generic-node-data-service';
import type { SafeHtml } from '@angular/platform-browser';
import { FrameOptionComponent } from '../frame-option/frame-option.component';
import { MonacoOptionComponent } from './monaco-option/monaco-option.component';



@Component({
  selector: 'app-gen-option',
  templateUrl: './gen-option.component.html',
  styleUrls: ['./gen-option.component.scss'],
  imports: [CommonModule, FormsModule, FrameOptionComponent, MonacoOptionComponent],
  standalone: true
})
export class GenOptionComponent implements OnChanges {


  @Input()
  name: string


  @Input()
  definition: NodeOptionTypes


  @Input()
  value


  @Input()
  node: ElementNode

  @ViewChild("hiddenValue")
  elementRef: ElementRef<HTMLTextAreaElement>

  frameProps: {
    trustedDocuemnt: SafeHtml
  }

  constructor(private con: GenericNodesDataService) {

  }

  ngOnChanges(changes: SimpleChanges): void {

  }
}