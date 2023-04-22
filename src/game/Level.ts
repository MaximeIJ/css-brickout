import Brick from './Brick';

// brick are config
export type LevelConfig = {
  parent: HTMLDivElement;
  y: number;
  height: number;
  rows: number;
  cols: number;
};

type InternalLevelConfig = LevelConfig & {
  onBallLost: () => void;
  onBrickDestroyed: (brick: Brick) => void;
};

export default class Level {
  bricks: Array<Array<Brick>>;
  left: number;
  onBallLost: () => void;
  onBrickDestroyed: (brick: Brick) => void;

  constructor({cols, height, rows, y, parent, onBallLost, onBrickDestroyed}: InternalLevelConfig) {
    this.bricks = [];
    let total = 0;
    for (let i = 0; i < rows; i++) {
      const brickRow = [];
      const width = 100.0 / cols;
      for (let j = 0; j < cols; j++) {
        brickRow.push(
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
      this.bricks.push(brickRow);
    }

    this.left = total;
    this.onBallLost = onBallLost;
    this.onBrickDestroyed = (brick: Brick) => {
      this.left--;
      onBrickDestroyed(brick);
    };
  }

  isDone() {
    return this.left === 0;
  }
}
