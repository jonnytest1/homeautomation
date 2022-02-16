import { Component, Input, OnInit } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { Wire } from '../../wirings/wire';
import { InOutComponent } from '../in-out/in-out.component';

@Component({
    selector: 'app-wire-ui',
    templateUrl: './wire-ui.component.html',
    styleUrls: ['./wire-ui.component.less']
})
export class WireUiComponent implements OnInit {

    @Input()
    fromVector: Vector2

    @Input()
    toVector: Vector2

    @Input()
    wire: Wire

    verticalBox: BoundingBox
    horizontalBox: BoundingBox

    highlighted = false

    @Input()
    below: BindingBoolean

    dot: Vector2
    lineWidth = 2

    borderWidth = 2


    tempConnectorPos: Vector2

    constructor(private data: WiringDataService) { }

    mouseEnter(event: MouseEvent) {
        this.highlighted = true
        this.tempConnectorPos = new Vector2(event)
    }

    ngOnInit() {
        this.calculateWires()
    }

    ngOnChanges() {
        this.calculateWires()
    }

    calculateWires() {
        let fromVector = this.fromVector
        const fromBox = new BoundingBox(
            fromVector.added(-this.lineWidth * 2, -this.lineWidth * 2),
            fromVector.added(this.lineWidth * 2, this.lineWidth * 2)
        )

        let toVector = this.toVector



        const wireBox = new BoundingBox(fromVector, toVector)
        const direction = wireBox.diagonal()
        const isFalling = direction.y > 0
        const isRight = direction.x > 0

        let left: number
        let right: number
        let horizonaly;

        let width = 2
        if (!isRight) {
            left = wireBox.getRight()
            right = wireBox.getLeft()
        } else {
            left = wireBox.getLeft()
            right = wireBox.getRight()
        }

        if (isFalling != isRight) {
            horizonaly = toVector.y
        } else {
            horizonaly = fromVector.y
        }
        if (isFalling) {
            this.dot = new Vector2(right, horizonaly)
        } else {
            this.dot = new Vector2(left, horizonaly)
        }

        let fromToDot = this.dot.subtract(fromVector)
        fromToDot = fromToDot.scaleTo(this.lineWidth + this.borderWidth * 2)
        const fromLine = new BoundingBox(fromVector.added(fromToDot), this.dot)
            .toRectangle()
            .withMargin(new Vector2(width, width))


        let toVtoDot = this.dot.subtract(toVector)
        toVtoDot = toVtoDot.scaleTo(this.lineWidth + this.borderWidth * 2)

        const toLine = new BoundingBox(
            toVector.added(toVtoDot), this.dot
        )
            .toRectangle()
            .withMargin(new Vector2(width, width))

        this.horizontalBox = toLine
        this.verticalBox = fromLine//




    }
    wireClick(event: MouseEvent) {
        this.tempConnectorPos = undefined
        this.highlighted = false
        if (!this.data.editingWire) {
            this.data.editingWire = {
                component: this,
                position: new Vector2(event).dividedBy(10).rounded().multipliedBy(10),
                toPosition: new Vector2(event).dividedBy(10).rounded().multipliedBy(10)
            }
        } else {
            this.data.editingWire = undefined
        }
    }
}
