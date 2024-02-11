import type { AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { BoundingBox } from '../../wiring/util/bounding-box';
import { ConnectionLines } from '../connection-lines';
import type { PendingConnection } from '../connection-lines';
import { VectorDomUtils } from '../../wiring/util/vector-dom-utils';
import { Vector2 } from '../../wiring/util/vector';
import type { Connection } from '../../settings/interfaces';






@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  standalone: true
})
export class LineComponent implements OnChanges, AfterViewChecked {

  @Input()
  line: Connection | PendingConnection

  @ViewChild("lineRef")
  elementLine: ElementRef<HTMLElement>

  @Input()
  editing: boolean

  constructor(private con: ConnectionLines) {

  }

  errorText: string | null = null

  ngAfterViewChecked(): void {
    if (this.line.target && this.elementLine.nativeElement) {
      let target: Vector2
      if (this.line.target instanceof DragEvent) {
        target = new Vector2(this.line.target)
      } else {
        const targetEl = this.con.getConnectionElement(this.line.target, "in")
        target = Vector2.fromBoundingClientRect(targetEl.getBoundingClientRect(), "center")

      }


      const sourceEl = this.con.getConnectionElement(this.line.source, "out")
      const source = Vector2.fromBoundingClientRect(sourceEl.getBoundingClientRect(), "center")

      const lineVector = target.subtract(source);
      let length = lineVector.length() - 8
      if (this.line.target instanceof DragEvent) {
        length -= 6
      }
      const sourcePadding = 4
      const scaledLine = lineVector.scaleTo(length - sourcePadding)

      const lineBox = BoundingBox.fromDiagonal(source.added(scaledLine.scaleTo(sourcePadding)), scaledLine)
      //const lineBox = new BoundingBox(this.line.source, this.line.target).withMargin(new Vector2(4, 4))

      VectorDomUtils.applyPosition(this.elementLine.nativeElement, lineBox)

      VectorDomUtils.applyRotation(this.elementLine.nativeElement, lineBox)
      VectorDomUtils.applyDimensionVector(this.elementLine.nativeElement, new Vector2(length, 4))
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.line.source.error) {
      this.errorText = this.line.source.error
    } else if (this.line.target && "error" in this.line.target) {
      this.errorText = this.line.target.error
    } else {
      this.errorText = null
    }
  }


}
