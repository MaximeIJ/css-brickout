import {Ball, BonusConfig, GameObject, LayoutDefinitionConfig, Paddle} from '../game';

const gripFactorEffect = (amount: number) => (paddle: GameObject) => {
  (paddle as Paddle).gripFactor += amount;
  return (paddle: GameObject) => {
    (paddle as Paddle).gripFactor -= amount;
  };
};

const speedEffect = (amount: number) => (ball: GameObject) => {
  (ball as Ball).speed *= amount;
  return (ball: GameObject) => {
    (ball as Ball).speed /= amount || 1;
  };
};

export const BONUSES: Record<string, BonusConfig> = {
  // Paddle
  // Grips the edges of the paddle to the ball
  grip1: {
    cssClass: 'grip-1',
    duration: 0,
    effect: gripFactorEffect(0.4),
  },
  grip2: {
    cssClass: 'grip-2',
    duration: 0,
    effect: gripFactorEffect(0.7),
  },

  // Ball
  // Increases/Decreases the speed of the ball
  speedup1: {
    cssClass: 'speedup-1',
    duration: 0,
    effect: speedEffect(1.25),
  },
  speedup2: {
    cssClass: 'speedup-2',
    duration: 0,
    effect: speedEffect(1.5),
  },
  speeddown1: {
    cssClass: 'speeddown-1',
    duration: 0,
    effect: speedEffect(0.75),
  },
  speeddown2: {
    cssClass: 'speeddown-2',
    duration: 0,
    effect: speedEffect(0.5),
  },

  // Brick
};

export const LAYOUTS: Record<string, LayoutDefinitionConfig> = {
  random: {
    type: 'custom',
    // different brick sizes
    bricks: [
      // Top
      {x: 11, y: 5, width: 20, height: 8},
      {x: 50, y: 5, width: 20, height: 8},
      {x: 89, y: 5, width: 20, height: 8},
      {x: 8, y: 12, width: 8, height: 6},
      {x: 20, y: 12, width: 8, height: 6},
      {x: 50, y: 12, width: 50, height: 6},
      {x: 80, y: 12, width: 8, height: 6},
      {x: 92, y: 12, width: 8, height: 6},

      // Mixed
      {x: 6, y: 20, width: 10, height: 10},
      {x: 6, y: 30, width: 10, height: 10},
      {x: 20, y: 25, width: 20, height: 20},
      {x: 35, y: 20, width: 10, height: 10},
      {x: 35, y: 30, width: 10, height: 10},
      {x: 50, y: 25, width: 20, height: 20},
      {x: 65, y: 20, width: 10, height: 10},
      {x: 65, y: 30, width: 10, height: 10},
      {x: 80, y: 25, width: 20, height: 20},
      {x: 94, y: 20, width: 10, height: 10},
      {x: 94, y: 30, width: 10, height: 10},

      // Bottom
      {x: 3, y: 45, width: 4, height: 3},
      {x: 7, y: 45, width: 4, height: 3},
      {x: 11, y: 45, width: 4, height: 3},
      {x: 15, y: 45, width: 4, height: 3},
      {x: 19, y: 45, width: 4, height: 3},
      {x: 23, y: 45, width: 4, height: 3},
      {x: 27, y: 45, width: 4, height: 3},
      {x: 31, y: 45, width: 4, height: 3},
      {x: 35, y: 45, width: 4, height: 3},
      {x: 39, y: 45, width: 4, height: 3},
      {x: 43, y: 45, width: 4, height: 3},
      {x: 47, y: 45, width: 4, height: 3},
      {x: 54, y: 45, width: 10, height: 3},
      {x: 64, y: 45, width: 10, height: 3},
      {x: 74, y: 45, width: 10, height: 3},
      {x: 84, y: 45, width: 10, height: 3},
      {x: 94, y: 45, width: 10, height: 3},
    ],
  },
  evenHighSmall: {
    type: 'even',
    y: 10,
    rows: 3,
    cols: 13,
    height: 4,
  },
  evenHighBig: {
    type: 'even',
    y: 14,
    rows: 1,
    cols: 7,
    height: 12,
  },
  evenMidSmall: {
    type: 'even',
    y: 22,
    rows: 3,
    cols: 13,
    height: 4,
  },
  evenMidBig: {
    type: 'even',
    y: 26,
    rows: 1,
    cols: 7,
    height: 12,
  },
  evenLowSmall: {
    type: 'even',
    y: 34,
    rows: 3,
    cols: 13,
    height: 4,
  },
  evenBottomSingle: {
    type: 'even',
    y: 91,
    rows: 1,
    cols: 13,
    height: 3,
  },
  hello: {
    type: 'custom',
    bricks: [
      // H
      {x: 20, y: 27, width: 2, height: 12, className: 'hello-h'},
      {x: 22.5, y: 27, width: 3, height: 2.5, className: 'hello-h'},
      {x: 25, y: 27, width: 2, height: 12, className: 'hello-h'},
      // E
      {x: 31, y: 24, width: 2, height: 12, className: 'hello-e'},
      {x: 34, y: 19, width: 4, height: 2, className: 'hello-e'},
      {x: 33, y: 24, width: 2, height: 2, className: 'hello-e'},
      {x: 34, y: 29, width: 4, height: 2, className: 'hello-e'},
      // L1
      {x: 42, y: 28, width: 2, height: 14, className: 'hello-l1'},
      {x: 44, y: 33.5, width: 2, height: 3, className: 'hello-l1'},
      {x: 46, y: 33.5, width: 2, height: 3, className: 'hello-l1'},
      // L2
      {x: 52, y: 21, width: 2, height: 6, className: 'hello-l2'},
      {x: 52, y: 27, width: 2, height: 6, className: 'hello-l2'},
      {x: 54, y: 31.5, width: 6, height: 3, className: 'hello-l2'},
      // O
      {x: 62, y: 28, width: 2, height: 12, className: 'hello-o'},
      {x: 65, y: 23.25, width: 4, height: 2.5, className: 'hello-o'},
      {x: 65, y: 32.5, width: 4, height: 2.5, className: 'hello-o'},
      {x: 68, y: 28, width: 2, height: 12, className: 'hello-o'},
      // !
      {
        x: 77,
        y: 25,
        width: 2.5,
        height: 12,
        className: 'hello-bang',
        movement: [
          {movement: {speed: 0.15, angle: -Math.PI / 2}, condition: mgo => mgo.y > 35},
          {movement: {speed: 0.25, angle: Math.PI / 2}, condition: mgo => mgo.y < 15},
        ],
      },
      {
        x: 77,
        y: 34,
        width: 3,
        height: 3,
        className: 'hello-bang',
        movement: [
          {movement: {speed: 0.2, angle: -Math.PI / 2}, condition: mgo => mgo.y > 45},
          {movement: {speed: 0.1, angle: Math.PI / 2}, condition: mgo => mgo.y < 27},
        ],
      },
    ],
  },
};
