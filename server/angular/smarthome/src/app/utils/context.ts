

interface Vector {
  x: number | 'center';
  y: number | 'center';
}
interface LineOptinos {
  from: Vector;
  to: Vector;

  click?: (event: MouseEvent) => void;
}

interface Lsitener {
  click;
  mosueover;
}

const eventListeners: Array<Lsitener> = [];

export class CanvasUtil {

  context: CanvasRenderingContext2D;

  width: number;
  height: number;

  handlers: Array<LineOptinos> = [];

  constructor(public canvas: HTMLCanvasElement) {
    this.context = this.canvas.getContext('2d');
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 4;

    this.height = this.canvas.height;
    this.width = this.canvas.width;

    this.canvas.addEventListener('click', this.clickHandler.bind(this));
    this.canvas.addEventListener('mousemove', this.moveHandler.bind(this));
  }

  reset() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.handlers.splice(0, this.handlers.length);
  }

  clickHandler(event: MouseEvent) {
    for (const option of this.handlers) {
      const position = this.computeRelative(option);
      if (closeEnough(event, position)) {
        option.click(event);
      }

    }
  }

  moveHandler(event: MouseEvent) {
    for (const option of this.handlers) {
      this.context.strokeStyle = '#000000';
      const position = this.computeRelative(option);
      if (closeEnough(event, position)) {
        this.context.strokeStyle = '#adadad';
      }
      this.context.beginPath();

      this.context.moveTo(position.from.x, position.from.y);
      this.context.lineTo(position.to.x, position.to.y);
      this.context.stroke();
    }
  }


  line(optionsObj: LineOptinos) {
    this.context.beginPath();
    const options = this.computeRelative(optionsObj);
    this.context.moveTo(options.from.x, options.from.y);
    this.context.lineTo(options.to.x, options.to.y);
    this.context.stroke();

    if (optionsObj.click) {
      this.handlers.push(optionsObj);
    }
  }


  computeRelative(options: LineOptinos) {
    let fromX = options.from.x;
    if (fromX === 'center') {
      fromX = this.width / 2;
    }
    let toX = options.to.x;
    if (toX === 'center') {
      toX = this.width / 2;
    }
    let fromY = options.from.y;
    if (fromY === 'center') {
      fromY = this.height / 2;
    }
    let toY = options.to.y;
    if (toY === 'center') {
      toY = this.height / 2;
    }
    return {
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY }
    };

  }
}

function closeEnough(event: MouseEvent, options: LineOptinos) {
  const distance = 8;
  const evX = event.offsetX;
  const evY = event.offsetY;

  if (evX - distance > +(options.to.x)) {
    return false;
  }
  if (evY - distance > (+options.to.y)) {
    return false;
  }
  if (evX + distance < (+options.from.x)) {
    return false;
  }
  if (evY + distance < (+options.from.y)) {
    return false;
  }
  return true;
}
