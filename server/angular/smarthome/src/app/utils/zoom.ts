import { Vector2 } from '../wiring/util/vector'



export function getCumulativeTransform(el: Element) {
  let scaleX = 1
  let scaleY = 1


  while (el && el !== document.body) {
    const transform = getComputedStyle(el).transform
    if (transform !== "none") {
      const m = new DOMMatrix(transform)
      scaleX *= m.a
      scaleY *= m.d
    }
    el = el.parentElement
  }

  return new Vector2(scaleX, scaleY)
}