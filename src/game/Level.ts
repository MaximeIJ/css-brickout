import Brick from './Brick';

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
type BrickProps = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LevelConfig = {
  parent: HTMLDivElement;
  layout: EvenLayoutDefinition | CustomLayoutDefinition;
};

type InternalLevelConfig = LevelConfig & {
  onBallLost: () => void;
  onBrickDestroyed: (brick: Brick) => void;
};

export default class Level {
  bricks: Array<Brick>;
  left: number;
  onBallLost: () => void;
  onBrickDestroyed: (brick: Brick) => void;

  constructor({layout, parent, onBallLost, onBrickDestroyed}: InternalLevelConfig) {
    this.bricks = [];
    let total = 0;
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
              elementId: `brick-${i * cols + j}`,
            }),
          );
          total++;
        }
      }
    } else if (layout.type === 'custom') {
      layout.bricks.forEach((brick, idx) => {
        this.bricks.push(new Brick({...brick, parent, elementId: `brick-${idx}`}));
        total++;
      });
    }

    this.left = total;
    this.onBallLost = onBallLost;
    this.onBrickDestroyed = (brick: Brick) => {
      this.left--;
      onBrickDestroyed(brick);
    };
  }

  updateElementPositions() {
    this.bricks.forEach(brick => {
      brick.updateElementPosition();
    });
  }

  isDone() {
    return this.left === 0;
  }

  destroy() {
    this.bricks.forEach(brick => brick.destroy());
  }
}
