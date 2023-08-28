import {Ball, Brick, BrickConfig} from './';

type LayoutDefinitionType = 'even' | 'custom';
type LayoutDefinition = {
  type: LayoutDefinitionType;
};
/**
 * Lays bricks out evenly in a grid starting from x = 0 and y = y
 */
type EvenLayoutDefinition = LayoutDefinition & {
  type: 'even';
  // Starting y position of the grid
  y: number;
  // Height of each brick
  height: number;
  // Number of rows
  rows: number;
  // Number of columns
  cols: number;
};
/**
 * Lays bricks out in a custom grid
 */
type CustomLayoutDefinition = LayoutDefinition & {
  type: 'custom';
  // Array of bricks definitions with custom x, y, width, and height
  bricks: Array<BrickProps>;
};

export type BrickProps = Omit<BrickConfig, 'parent'>;

export type LayoutDefinitionConfig = EvenLayoutDefinition | CustomLayoutDefinition;

export type LevelConfig = {
  parent: HTMLDivElement;
  /**
   * Layout(s) of the bricks, types can be mixed. Will be laid out in order.
   */
  layout: LayoutDefinitionConfig | Array<LayoutDefinitionConfig>;
};

export class Level {
  bricks: Array<Brick>;
  mobileBricks: Array<Brick>;
  left = 0;
  _strips: Array<Array<Brick>>;
  _stripW: number;
  // todo: add elements that can be collided with and run custom functions in response (or just emit event really)

  constructor({layout, parent}: LevelConfig) {
    this.bricks = [];
    this.mobileBricks = [];
    this._strips = [];

    if (layout instanceof Array) {
      layout.forEach(l => this.layBricks(l, parent));
    } else {
      this.layBricks(layout, parent);
    }
    this.left = this.bricks.length;

    // Use the widest brick size to determine the strip size
    let maxBrickWidth = 0;
    this.bricks.forEach(brick => {
      if (brick.width > maxBrickWidth) {
        maxBrickWidth = brick.width;
      }
      if (brick.speed) {
        this.mobileBricks.push(brick);
      }
    });
    // We want a round number of strips across the screen of width 100. What's the closest we can get?
    const stripCount = Math.floor(100 / (maxBrickWidth + 1)); // +1 buffer to be sure
    this._stripW = 100 / stripCount;
    // Create the strips
    for (let i = 0; i < stripCount; i++) {
      this._strips.push([]);
    }
    // Assign bricks to strips
    this.bricks.forEach(brick => {
      // If it's mobile, add it to all strips
      if (brick.speed) {
        this._strips.forEach(strip => strip.push(brick));
      } else {
        const leftStrip = Math.floor((brick.x - brick.width / 2) / this._stripW);
        const rightStrip = Math.floor((brick.x + brick.width / 2) / this._stripW);
        this._strips[leftStrip]?.push(brick);
        if (rightStrip !== leftStrip && rightStrip < stripCount) {
          this._strips[rightStrip]?.push(brick);
        }
      }
    });

    parent.addEventListener('brickdestroyed', this.handleBrickDestroyed);
  }

  handleBrickDestroyed = () => {
    this.left--;
  };

  getNearbyBricks(ball: Ball): Array<Brick> {
    const res = [];
    const left = Math.floor((ball.x - ball.radius) / this._stripW);
    const right = Math.floor((ball.x + ball.radius) / this._stripW);
    for (let i = left; i <= right && i < this._strips.length; i++) {
      res.push(...(this._strips[i] ?? []));
    }
    return res;
  }

  updateElements() {
    this.bricks.forEach(brick => {
      brick.updateElement();
    });
  }

  layBricks(layout: LayoutDefinitionConfig, parent: HTMLDivElement) {
    if (layout instanceof Array) {
      layout.forEach(layout => this.layBricks(layout, parent));
    }
    if (layout.type === 'even') {
      const {y, height, rows, cols} = layout;
      for (let i = 0; i < rows; i++) {
        const width = 100.0 / cols;
        for (let j = 0; j < cols; j++) {
          this.bricks.push(
            new Brick({
              parent,
              width,
              height,
              x: width * (j + 0.5),
              y: y + height * i,
              elementId: `brick-${this.left + i * cols + j}`,
            }),
          );
        }
      }
    } else if (layout.type === 'custom') {
      layout.bricks.forEach((brick, idx) => {
        this.bricks.push(new Brick({...brick, parent, elementId: brick.elementId ?? `brick-${this.left + idx}`}));
      });
    }
  }

  isDone() {
    return !this.bricks.some(b => !b.permanent && !b.destroyed);
  }

  destroy() {
    parent.removeEventListener('brickdestroyed', this.handleBrickDestroyed);
    this.bricks.forEach(brick => brick.destroy());
  }
}
