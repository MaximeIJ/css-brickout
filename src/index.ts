import Game from './game/Game';
import './style.css';

// Start the game loop
const ng = -Math.PI / 2.001;
const ballBase = {x: 50, y: 35, radius: 0.5, speed: 0.45};
const input = {
  ballConfigs: [
    {
      ...ballBase,
      angle: ng,
    },
  ],
  levelConfig: {
    y: 10,
    rows: 4,
    cols: 20,
    height: 3,
  },
  paddleConfig: {
    width: 8.9,
    height: 1,
  },
};

// Create game loop instance and start the game
const gameLoop = new Game(input);
gameLoop.start();
