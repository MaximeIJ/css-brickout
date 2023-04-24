import Game, {GameParams} from '../src/game/Game';

import '../src/style.css';
import GameObject from './game/GameObject';
import Paddle from './game/Paddle';
import {BONUSES} from './util/presets';

const exampleEvenLayout: GameParams['levelConfig'] = {
  layout: {
    type: 'even',
    y: 10,
    rows: 3,
    cols: 13,
    height: 4,
  },
};

const exampleCustomLayout: GameParams['levelConfig'] = {
  layout: {
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
};

// Start the game loop
const ng = -Math.PI / 1.5;
const ballBase = {x: 75, y: 35, radius: 0.75, speed: 1, startingBonuses: [BONUSES.speedup1]};
const paddleConfig = {
  width: 8.9,
  height: 1.8,
  startingBonuses: [BONUSES.grip1],
};
const playerConfig = {
  lives: 3,
};
const inputMap: Record<'even' | 'custom', GameParams> = {
  even: {
    ballConfigs: [
      {
        ...ballBase,
        angle: ng,
      },
    ],
    levelConfig: exampleEvenLayout,
    paddleConfig,
    playerConfig,
  },
  custom: {
    ballConfigs: [
      {
        ...ballBase,
        x: 15,
        y: 50,
        angle: ng / 2,
      },
    ],
    levelConfig: exampleCustomLayout,
    paddleConfig,
    playerConfig,
  },
};

// Create game loop instance and start the game
let gameLoop = new Game(inputMap.even);
gameLoop.start();

function onDisplayChange(e: any) {
  const className = e.target.value;
  gameLoop.pause();
  const gameScreenElement = document.getElementById('demo-screen');
  if (gameScreenElement) {
    gameScreenElement.className = className;
  }
  gameLoop.start();
}

document.getElementById('display')?.addEventListener('change', onDisplayChange);

function onLayoutChange(e: any) {
  const layout = e.target.value;
  gameLoop.pause();
  gameLoop.destroy();
  if (layout === 'even') {
    gameLoop = new Game(inputMap.even);
  } else if (layout === 'custom') {
    gameLoop = new Game(inputMap.custom);
  }
  gameLoop.start();
}

document.getElementById('layout-type')?.addEventListener('change', onLayoutChange);
