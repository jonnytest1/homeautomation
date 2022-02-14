import { Component, Input, OnInit } from '@angular/core';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { InOutComponent } from '../in-out/in-out.component';

@Component({
    selector: 'app-wire-ui',
    templateUrl: './wire-ui.component.html',
    styleUrls: ['./wire-ui.component.less']
})
export class WireUiComponent implements OnInit {

    @Input()
    fromVector: Vector2 | InOutComponent

    @Input()
    toVector: Vector2 | InOutComponent

    verticalBox: BoundingBox
    horizontalBox: BoundingBox

    dot: Vector2
    lineWidth = 2

    constructor(private data: WiringDataService) { }

    ngOnInit() {
        this.calculateWires()
    }

    ngOnChanges() {
        this.calculateWires()
    }

    calculateWires() {
        let fromVector: Vector2
        if (this.fromVector instanceof InOutComponent) {
            fromVector = this.fromVector.getOutVector()
        } else {
            fromVector = this.fromVector
        }
        let toVector: Vector2
        if (this.toVector instanceof InOutComponent) {
            toVector = this.toVector.getInVector()
        } else {
            toVector = this.toVector
        }


        const wireBox = new BoundingBox(fromVector, toVector)
        const direction = wireBox.diagonal()
        const isFalling = direction.y > 0
        const isRight = direction.x > 0

        const firstHorizontal = isFalling == isRight
        let top = wireBox.getTop()
        let bottom = wireBox.getBottom()
        let left = wireBox.getLeft()
        let right = wireBox.getRight()
        let horizonaly;
        let verticalx

        let width = 2


        if (!isRight) {
            left = wireBox.getRight()
            right = wireBox.getLeft()
        }

        if (isFalling) {
            top = wireBox.getBottom()
            bottom = wireBox.getTop()

        }

        if (isFalling != isRight) {
            horizonaly = toVector.y
            verticalx = fromVector.x
        } else {
            horizonaly = fromVector.y
            verticalx = toVector.x
        }

        this.horizontalBox = new BoundingBox(new Vector2(left, horizonaly - width), new Vector2(right, horizonaly + width))
        this.verticalBox = new BoundingBox(new Vector2(verticalx - width, bottom), new Vector2(verticalx + width, top))

        if (isFalling) {
            this.dot = new Vector2(right, horizonaly)
        } else {
            this.dot = new Vector2(left, horizonaly)
        }
    }

}
