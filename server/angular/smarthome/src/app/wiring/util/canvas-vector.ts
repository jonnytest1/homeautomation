import { Vector2 } from './vector';






export function extendCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  const extendedContext = {
    ...context,
    vecMoveTo: (to: Vector2) => {
      context.moveTo(to.x, to.y);
    },
    vecLineTo: (to: Vector2) => {
      context.lineTo(to.x, to.y);
    },
    vecStrokeText(text: string, pos: Vector2) {
      context.strokeText(text, pos.x, pos.y)
    },
    vecFillText(text: string, pos: Vector2) {
      context.fillText(text, pos.x, pos.y)
    },
    vecFillRect(source: Vector2, target: Vector2) {
      const dim = target.subtract(source)
      context.fillRect(source.x, source.y, dim.x, dim.y)
    },
    vecFillDim(source: Vector2, dim: Vector2) {
      context.fillRect(source.x, source.y, dim.x, dim.y)
    }
  };
  for (const prop of Object.getOwnPropertyNames(context.constructor.prototype)) {
    if (typeof context[prop] == "function") {
      extendedContext[prop] = context[prop].bind(context)
    } else {
      Object.defineProperty(extendedContext, prop, {
        set(val) {
          context[prop] = val
        }
      })
    }

  }
  return extendedContext as CanvasRenderingContext2D & typeof extendedContext
}
