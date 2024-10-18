import {Ball, BallDestroyedEvent} from '../game/Ball';
import {Game, GameParams} from '../game/Game';
import {EvenLayoutDefinition} from '../game/Level';
import '../style.css';
import './demo.css';
import {clamp} from '../util/math';

import {BONUSES, LAYOUTS} from './presets';

const startingSpeed = 100;

const ng = -Math.PI / 2;
const ballBase = {
  x: 50,
  y: 20,
  radius: 1,
  movement: {speed: 0.9},
  syncAngles: true,
  startingBonuses: [BONUSES.speedup1],
};
const paddleConfig = {
  width: 13,
  height: 2.3,
  angleLimit: Math.PI / 12,
  startingBonuses: [BONUSES.grip1],
};
const playerConfig = {
  lives: 3,
};
const commonParams = {
  options: {allowDebug: true, updatesPerFrame: startingSpeed},
  ballConfigs: [
    {
      ...ballBase,
      movement: {...ballBase.movement, angle: ng},
    },
  ],
  paddleConfig,
  playerConfig,
};
const inputMap: Record<'hello' | 'even' | 'stress' | 'random' | 'mixed', GameParams> = {
  hello: {
    ...commonParams,
    levelConfig: {layout: LAYOUTS.hello},
  },
  even: {
    ...commonParams,
    levelConfig: {layout: LAYOUTS.evenHighSmall},
  },
  stress: {
    ...commonParams,
    ballConfigs: Array.from({length: 45}, (_, i) => ({
      ...ballBase,
      radius: 0.45 + (i % 5) / 20,
      x: 5 + (i + 1) * 2,
      y: 2,
      movement: {speed: 0.45 + 0.4 / (1 + (i % 5)), angle: ng + (i % 2 === 0 ? 0.25 : -0.25) * Math.random()},
    })),
    levelConfig: {
      layout: [
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 6, cols: 25, hp: 8},
        LAYOUTS.evenStress,
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 23, cols: 60, rows: 6, hp: 5},
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 35, cols: 70},
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 42, cols: 40},
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 49, cols: 80, hp: 2},
        {...(LAYOUTS.evenStress as EvenLayoutDefinition), y: 56, cols: 60, rows: 8},
      ],
    },
    paddleConfig: {...paddleConfig, minY: 78, maxY: 97, angleLimit: 0},
  },
  random: {
    ...commonParams,
    ballConfigs: [
      {
        ...ballBase,
        x: 15,
        y: 50,
        movement: {...ballBase.movement, angle: ng / 2},
      },
    ],
    levelConfig: {layout: LAYOUTS.random},
  },
  mixed: {
    ...commonParams,
    ballConfigs: [
      {
        ...ballBase,
        x: 50,
        y: 45,
        movement: {...ballBase.movement, angle: (3 * ng) / 4},
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        movement: {...ballBase.movement, angle: (3.02 * ng) / 4},
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        movement: {...ballBase.movement, angle: (3.05 * ng) / 4},
      },
      {
        ...ballBase,
        x: 50,
        y: 45,
        movement: {...ballBase.movement, angle: (3.08 * ng) / 4},
      },
    ],
    levelConfig: {
      layout: [
        LAYOUTS.evenHighSmall,
        LAYOUTS.evenMidBig,
        LAYOUTS.evenLowSmall,
        LAYOUTS.evenBottomSingle,
        LAYOUTS.composite,
        LAYOUTS.hello,
      ],
    },
    paddleConfig: {...paddleConfig, minY: 75, maxY: 97},
  },
};

// Create game loop instance and start the game
let gameLoop = new Game(inputMap.hello);
gameLoop.start();

let lastTheme = 'classic';

function onThemeChange({target}: Event) {
  const className = (target as HTMLSelectElement)?.value;
  gameLoop.pause();
  const gameScreenElement = document.getElementById('demo-screen');
  if (gameScreenElement) {
    gameScreenElement.classList.remove(lastTheme);
    gameScreenElement.classList.add(className);
    lastTheme = className;
  }
  gameLoop.start();
}

document.getElementById('theme')?.addEventListener('change', onThemeChange);

function onLayoutChange({target}: Event) {
  const layout = (target as HTMLSelectElement)?.value;
  document.getElementById('demo-screen')?.classList.add('loading');
  // Using requestAnimationFrame to ensure the DOM update happens before the long-running process
  setTimeout(async () => {
    const promise = new Promise<void>(resolve => {
      gameLoop.destroy();
      gameLoop.element.innerHTML = '';
      const valid = Object.keys(inputMap).includes(layout);
      if (valid) {
        gameLoop = new Game(inputMap[layout as 'hello' | 'even' | 'stress' | 'random' | 'mixed']);
      }
      gameLoop.start();
      setUpdatesFrame(layout === 'stress' ? 20 : 100);
      // Introduce a delay to ensure DOM update
      setTimeout(() => {
        document.getElementById('demo-screen')?.classList.remove('loading');
        resolve();
      }, 0);
    });
    await promise;
  }, 100);
}

document.getElementById('layout-type')?.addEventListener('change', onLayoutChange);

function setUpdatesFrame(upf: number) {
  gameLoop.options.updatesPerFrame = clamp(1, upf, 1000);
  const labelElement = document.getElementById('updates-frame-label');
  if (labelElement) {
    labelElement.innerText = `${gameLoop.options.updatesPerFrame}`;
  }
  // gotta reset speed to 1
  setGameSpeed(1);
}

function onUpdatesPerFrameChange({target}: Event) {
  const upf = (target as HTMLInputElement)?.value;
  setUpdatesFrame(parseInt(upf));
}

document.getElementById('updates-frame')?.addEventListener('input', onUpdatesPerFrameChange);

function setGameSpeed(speed: number) {
  gameLoop.setOverallSpeed(clamp(0.05, speed, 3));
  const labelElement = document.getElementById('game-speed-label');
  const inputElement = document.getElementById('game-speed') as HTMLInputElement;
  if (inputElement) {
    inputElement.value = `${speed}`;
  }
  if (labelElement) {
    labelElement.innerText = `${speed.toFixed(2)}X`;
  }
}

function onGameSpeedChange({target}: Event) {
  const speed = (target as HTMLInputElement)?.value;
  setGameSpeed(parseFloat(speed));
}

document.getElementById('game-speed')?.addEventListener('input', onGameSpeedChange);

document.getElementById('game')?.addEventListener('balldestroyed', e => {
  const ball: Ball = (e as BallDestroyedEvent).detail;
  const particles = ball.emitParticles(10, ['ball--destroyed-particle'], 300, true);
  particles.forEach(particle => {
    particle.style.left = `${50 - Math.round(100 * Math.random())}px`;
    particle.style.top = `${0 - Math.round(50 * Math.random())}px`;
    particle.style.opacity = '0';
  });
});

document.getElementById('game')?.addEventListener('brickdestroyed', () => {
  gameLoop.score += 1;
  gameLoop.updateHUDScore();
});
