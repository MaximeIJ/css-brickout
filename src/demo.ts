import Game, {GameParams} from '../src/game/Game';

import '../src/style.css';
import {BONUSES, LAYOUTS} from './util/presets';

// Start the game loop
const ng = -Math.PI / 2;
const ballBase = {x: 50, y: 20, radius: 0.75, speed: 0.7, startingBonuses: [BONUSES.speedup1]};
const paddleConfig = {
  width: 8.9,
  height: 1.8,
  startingBonuses: [BONUSES.grip1],
};
const playerConfig = {
  lives: 3,
};
const inputMap: Record<'hello' | 'even' | 'random' | 'mixed', GameParams> = {
  hello: {
    ballConfigs: [
      {
        ...ballBase,
        angle: ng,
      },
    ],
    levelConfig: {layout: LAYOUTS.hello},
    paddleConfig,
    playerConfig,
  },
  even: {
    ballConfigs: [
      {
        ...ballBase,
        angle: ng,
      },
    ],
    levelConfig: {layout: LAYOUTS.evenHighSmall},
    paddleConfig,
    playerConfig,
  },
  random: {
    ballConfigs: [
      {
        ...ballBase,
        x: 15,
        y: 50,
        angle: ng / 2,
      },
    ],
    levelConfig: {layout: LAYOUTS.random},
    paddleConfig,
    playerConfig,
  },
  mixed: {
    ballConfigs: [
      {
        ...ballBase,
        x: 50,
        y: 45,
        angle: (3 * ng) / 4,
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        angle: (3.05 * ng) / 4,
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        angle: (3.1 * ng) / 4,
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        angle: (3.15 * ng) / 4,
      },
    ],
    levelConfig: {
      layout: [
        LAYOUTS.evenHighSmall,
        LAYOUTS.evenMidBig,
        LAYOUTS.evenLowSmall,
        LAYOUTS.evenBottomSingle,
        LAYOUTS.hello,
      ],
    },
    paddleConfig,
    playerConfig,
  },
};

// Create game loop instance and start the game
let gameLoop = new Game(inputMap.hello);
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
  } else if (layout === 'random') {
    gameLoop = new Game(inputMap.random);
  } else if (layout === 'mixed') {
    gameLoop = new Game(inputMap.mixed);
  } else if (layout === 'hello') {
    gameLoop = new Game(inputMap.hello);
  }
  gameLoop.start();
}

document.getElementById('layout-type')?.addEventListener('change', onLayoutChange);
