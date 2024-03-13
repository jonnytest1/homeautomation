import type { ElementRef } from '@angular/core';

import { DEG_2_RAD, Vector2 } from './vector';

export class BoundingBox {

  public topLeft: Vector2;
  public bottomRight: Vector2;

  constructor(topLeft: Vector2 | DOMRect | ElementRef<HTMLElement> | HTMLElement, bottomRight?: Vector2) {
    if (topLeft instanceof Vector2) {
      this.topLeft = topLeft;
      if (!bottomRight) {
        throw new Error('bottomRight is undefined');
      }
      this.bottomRight = bottomRight;
    } else {
      let clientRect: DOMRect;
      if (topLeft instanceof DOMRect) {
        clientRect = topLeft;
      } else {
        let element: HTMLElement;
        if (topLeft instanceof HTMLElement) {
          element = topLeft;
        } else {
          element = topLeft.nativeElement;
        }
        clientRect = element.getBoundingClientRect();
      }
      this.topLeft = new Vector2(clientRect);
      this.bottomRight = this.topLeft.added(new Vector2(clientRect.width, clientRect.height));
    }
  }

  static fromDiagonal(topLeft: Vector2, diagonal: Vector2) {
    return new BoundingBox(topLeft, topLeft.added(diagonal));
  }


  center() {
    return this.topLeft.added(this.bottomRight).dividedBy(2);
  }

  toRectangle() {
    let left = this.getLeft();
    let right = this.getRight();
    let top = this.getTop();
    let bottom = this.getBottom();
    if (left > right) {
      const t = left;
      left = right;
      right = t;
    }
    if (top > bottom) {
      const t = top;
      top = bottom;
      bottom = t;
    }
    return new BoundingBox(new Vector2(left, top), new Vector2(right, bottom));
  }

  axisRotation(convertToDeg = true): number {
    const diagonalVector = this.diagonal();
    const axis = new Vector2(1, 0);

    let radians = Math.acos((diagonalVector.x * axis.x + diagonalVector.y * axis.y)
      / (diagonalVector.length() * axis.length()));
    if (diagonalVector.y < 0) {
      radians *= -1;
    }
    if (convertToDeg) {
      return radians / DEG_2_RAD;
    }
    return radians;
  }

  translate(translationVector: Vector2) {
    const diagonal = this.diagonal();

    return BoundingBox.fromDiagonal(this.topLeft.added(translationVector), diagonal);
  }

  equals(other: BoundingBox | undefined) {
    if (typeof other == 'undefined') {
      return false;
    }
    return this.topLeft.equals(other.topLeft) && this.bottomRight.equals(other.bottomRight);
  }

  diff(other: BoundingBox | undefined) {
    if (!other) {
      return Infinity;
    }
    return this.topLeft.subtract(other.topLeft).length() + this.bottomRight.subtract(other.bottomRight).length();
  }

  diagonal() {
    return this.bottomRight.subtract(this.topLeft);
  }

  getBottomLeft() {
    return new Vector2(this.topLeft.x, this.bottomRight.y);
  }

  getHeight() {
    return this.diagonal().y;
  }

  getWidth() {
    return this.diagonal().x;
  }

  getBottom() {
    return this.bottomRight.y;
  }

  getTop() {
    return this.topLeft.y;
  }

  getRight() {
    return this.bottomRight.x;
  }

  getLeft() {
    return this.topLeft.x;
  }

  getTopRight() {
    return new Vector2(this.bottomRight.x, this.topLeft.y);
  }

  includes(inner: Vector2): boolean {
    let right = this.bottomRight.x
    let left = this.topLeft.x
    if (left > right) {
      left = right
      right = this.topLeft.x
    }

    let bottom = this.bottomRight.y
    let top = this.topLeft.y
    if (bottom > top) {
      top = bottom
      bottom = this.topLeft.y
    }
    return inner.x < right && inner.y < top
      && inner.x > left && inner.y > bottom;
  }

  withMargin(boxMargin: Vector2) {
    return new BoundingBox(this.topLeft.subtract(boxMargin), this.bottomRight.added(boxMargin));
  }

  rounded() {
    return new BoundingBox(this.topLeft.rounded(), this.bottomRight.rounded());
  }

  overflows(other: BoundingBox) {
    const overflowBottomRight = this.bottomRight
      .subtract(other.bottomRight)
      .atLeastAxis(0);
    const overflowTopLeft = other.topLeft
      .subtract(this.topLeft)
      .atLeastAxis(0);

    return {
      overflowLeft: overflowTopLeft.x,
      overflowRight: overflowBottomRight.x,
      overflowTop: overflowTopLeft.y,
      overflowBottom: overflowBottomRight.y
    };
  }

  intersectionAreas(contentBox: BoundingBox) {
    return [
      // top
      new BoundingBox(this.topLeft, new Vector2(this.getRight(), contentBox.getTop())),
      // bottom
      new BoundingBox(new Vector2(this.getLeft(), contentBox.getBottom()), this.bottomRight),
      // left
      new BoundingBox(new Vector2(this.getLeft(), contentBox.getTop()), contentBox.getBottomLeft()),
      // right
      new BoundingBox(contentBox.getTopRight(), new Vector2(this.getRight(), contentBox.getBottom())),
    ];
  }
}
