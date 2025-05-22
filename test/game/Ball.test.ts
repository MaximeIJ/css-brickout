import {beforeAll, describe, it} from 'vitest';

import {Ball, Brick, Game, Paddle} from '../../src/game';

global.ResizeObserver = class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
};

const parent = document.createElement('div');
document.body.appendChild(parent);
parent.id = 'game';
const game = new Game({ballConfigs: [], levelConfig: {layout: []}, paddleConfig: {}});

const makeBall = (angle: number, x: number, y: number) => {
  const b = new Ball({x, y, radius: 2, game, idx: 0, movement: {angle, speed: 1}});
  b.updateElement();
  b.rx = b.radius;
  return b;
};

describe.concurrent('paddle no curve', () => {
  let p: Paddle;

  beforeAll(async () => {
    p = new Paddle({x: 50, y: 50, width: 20, height: 5, game, elementId: `paddle`, curveFactor: 0});
    p.updatePosition();
  });

  it('from top center - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 39, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(ball.x).toBeCloseTo(39);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 61, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(ball.x).toBeCloseTo(61);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top center - diagonal collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 4, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(ball.x).toBeCloseTo(49.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left - diagonal collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 6, 39, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 6);
    expect(ball.x).toBeCloseTo(38.13);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right - diagonal collision', async ({expect}) => {
    const ball = makeBall((-3 * Math.PI) / 4, 61, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((3 * Math.PI) / 4);
    expect(ball.x).toBeCloseTo(61.5);
    expect(ball.y).toBeCloseTo(45.5);
  });
});

describe.concurrent('paddle heavy curve', () => {
  let p: Paddle;

  beforeAll(async () => {
    p = new Paddle({x: 50, y: 50, width: 20, height: 5, game, elementId: `paddle`, curveFactor: 1});
    p.updatePosition();
  });

  it('from top center - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left mid - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 45, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((3 * Math.PI) / 4);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left edge - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 39, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI);
    expect(ball.x).toBeCloseTo(39);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right mid - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 55, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right edge - deep vertical collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 61, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(0);
    expect(ball.x).toBeCloseTo(61);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top center - diagonal collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 4, 50, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(ball.x).toBeCloseTo(49.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left mid - diagonal collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 4, 45, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((1 * Math.PI) / 2);
    expect(ball.x).toBeCloseTo(44.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top left edge - diagonal collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 4, 39, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((3 * Math.PI) / 4);
    expect(ball.x).toBeCloseTo(38.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right mid - diagonal collision', async ({expect}) => {
    const ball = makeBall((-3 * Math.PI) / 4, 55, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(ball.x).toBeCloseTo(55.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top right edge - diagonal collision', async ({expect}) => {
    const ball = makeBall((-3 * Math.PI) / 4, 61, 46);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(ball.x).toBeCloseTo(61.5);
    expect(ball.y).toBeCloseTo(45.5);
  });

  it('from top center - horizontal collision', async ({expect}) => {
    const ball = makeBall(0, 50, 45.5);

    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(0);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(45.5);

    const b2 = makeBall(Math.PI, 50, 45.5);
    b2.handlePaddleCollision(p);
    expect(b2.movement.angle).toBeCloseTo(Math.PI);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(45.5);
  });
});

describe.concurrent('paddle angle PI / 4', () => {
  let p: Paddle;

  beforeAll(async () => {
    p = new Paddle({
      x: 50,
      y: 50,
      width: 20,
      height: 5,
      game,
      elementId: `paddle`,
      curveFactor: 0,
      angle: -Math.PI / 4,
      angleLimit: Math.PI / 2,
    });
    p.updatePosition();
  });

  it('from everywhere - deep vertical collision', async ({expect}) => {
    // center
    let ball = makeBall(-Math.PI / 2, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall(-Math.PI / 2, 45, 51);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(51);
    // right
    ball = makeBall(-Math.PI / 2, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });

  it('from everywhere - deep same direction diagonal collision', async ({expect}) => {
    // center
    let ball = makeBall((-2 * Math.PI) / 3, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall((-2 * Math.PI) / 3, 45, 50);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(50);
    // right
    ball = makeBall((-2 * Math.PI) / 3, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });

  it('from everywhere - deep opposite direction diagonal collision', async ({expect}) => {
    // center
    let ball = makeBall(-Math.PI / 3, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall(-Math.PI / 3, 45, 50);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(50);
    // right
    ball = makeBall(-Math.PI / 3, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });
});

describe.concurrent('paddle angle PI / 4 + heavy curve', () => {
  let p: Paddle;

  beforeAll(async () => {
    p = new Paddle({
      x: 50,
      y: 50,
      width: 20,
      height: 5,
      game,
      elementId: `paddle`,
      curveFactor: 1,
      angle: -Math.PI / 4,
      angleLimit: Math.PI / 2,
    });
    p.updatePosition();
  });

  it('from everywhere - deep vertical collision', async ({expect}) => {
    // center
    let ball = makeBall(-Math.PI / 2, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo(Math.PI);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall(-Math.PI / 2, 45, 51);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(51);
    // right
    ball = makeBall(-Math.PI / 2, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((3 * Math.PI) / 4);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });

  it('from everywhere - deep same direction diagonal collision', async ({expect}) => {
    // center
    let ball = makeBall((-2 * Math.PI) / 3, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall((-2 * Math.PI) / 3, 45, 50);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-7 * Math.PI) / 12);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(50);
    // right
    ball = makeBall((-2 * Math.PI) / 3, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((11 * Math.PI) / 12);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });

  it('from everywhere - deep opposite direction diagonal collision', async ({expect}) => {
    // center
    let ball = makeBall(-Math.PI / 3, 50, 46);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((5 * Math.PI) / 6);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(46);
    // left
    ball = makeBall(-Math.PI / 3, 45, 50);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((-11 * Math.PI) / 12);
    expect(ball.x).toBeCloseTo(45);
    expect(ball.y).toBeCloseTo(50);
    // right
    ball = makeBall(-Math.PI / 3, 55, 41);
    ball.handlePaddleCollision(p);
    expect(ball.movement.angle).toBeCloseTo((7 * Math.PI) / 12);
    expect(ball.x).toBeCloseTo(55);
    expect(ball.y).toBeCloseTo(41);
  });
});

describe.concurrent('breakthrough brick', () => {
  let bb: Brick;

  beforeAll(async () => {
    bb = new Brick({x: 50, y: 50, width: 20, height: 20, game, elementId: `bb`, hp: 1, breakthrough: true});
    bb.updatePosition();
  });

  it('from top - deep collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 40);
    expect(ball.isColliding(bb)).toBeTruthy();
    ball.handleBrickCollision(bb);
    expect(ball.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(40);
  });
});

describe.concurrent('ball brick collision', () => {
  let square: Brick;
  let tall: Brick;
  let wide: Brick;

  beforeAll(async () => {
    square = new Brick({x: 50, y: 50, width: 20, height: 20, game, elementId: `sbrick`, hp: 100});
    square.updatePosition();
    tall = new Brick({x: 50, y: 50, width: 5, height: 20, game, elementId: `tbrick`, hp: 100});
    tall.updatePosition();
    wide = new Brick({x: 50, y: 50, width: 20, height: 5, game, elementId: `wbrick`, hp: 100});
    wide.updatePosition();
  });

  // top
  it('from top - no collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 37);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(tall)).toBeFalsy();

    ball.y = 45;
    ball.processFrame(-1);
    ball.processFrame(1);
    expect(ball.isColliding(wide)).toBeFalsy();
  });
  it('from top - minimal collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 2, 50, 38);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 2, 50, 38);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 2, 50, 45.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(45.5);
  });
  it('from top - deep collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 2, 50, 41);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 2, 50, 41);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 2, 50, 48);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo(Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(45.5);
  });

  // bottom
  it('from bottom - no collision', async ({expect}) => {
    const ball = makeBall(Math.PI / 2, 50, 63);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(tall)).toBeFalsy();

    ball.y = 55;
    ball.processFrame(-1);
    ball.processFrame(1);
    expect(ball.isColliding(wide)).toBeFalsy();
  });
  it('from bottom - minimal collision', async ({expect}) => {
    const b1 = makeBall(Math.PI / 2, 50, 62);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(62);

    const b2 = makeBall(Math.PI / 2, 50, 62);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(62);

    const b3 = makeBall(Math.PI / 2, 50, 54.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(54.5);
  });
  it('from bottom - deep collision', async ({expect}) => {
    const b1 = makeBall(Math.PI / 2, 50, 59);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(62);

    const b2 = makeBall(Math.PI / 2, 50, 59);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(62);

    const b3 = makeBall(Math.PI / 2, 50, 52);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(54.5);
  });

  // left
  it('from left - no collision', async ({expect}) => {
    const ball = makeBall(0, 36, 50);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(wide)).toBeFalsy();

    ball.x = 43;
    ball.updatePosition();
    expect(ball.isColliding(tall)).toBeFalsy();
  });
  it('from left - minimal collision', async ({expect}) => {
    const b1 = makeBall(0, 38, 50);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(Math.PI);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(0, 38, 50);
    b2.handleBrickCollision(wide);
    expect(b2.movement.angle).toBeCloseTo(Math.PI);
    expect(b2.x).toBeCloseTo(38);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(0, 45.5, 50);
    b3.handleBrickCollision(tall);
    expect(b3.movement.angle).toBeCloseTo(Math.PI);
    expect(b3.x).toBeCloseTo(45.5);
    expect(b3.y).toBeCloseTo(50);
  });
  it('from left - deep collision', async ({expect}) => {
    const b1 = makeBall(0, 41, 50);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(Math.PI);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(0, 41, 50);
    b2.handleBrickCollision(wide);
    expect(b2.movement.angle).toBeCloseTo(Math.PI);
    expect(b2.x).toBeCloseTo(38);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(0, 48, 50);
    b3.handleBrickCollision(tall);
    expect(b3.movement.angle).toBeCloseTo(Math.PI);
    expect(b3.x).toBeCloseTo(45.5);
    expect(b3.y).toBeCloseTo(50);
  });

  // right
  it('from right - no collision', async ({expect}) => {
    const ball = makeBall(0, 63, 50);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(wide)).toBeFalsy();

    ball.x = 55;
    ball.updatePosition();
    expect(ball.isColliding(tall)).toBeFalsy();
  });
  it('from right - minimal collision', async ({expect}) => {
    const b1 = makeBall(Math.PI, 62, 50);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(0);
    expect(b1.x).toBeCloseTo(62);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(Math.PI, 62, 50);
    b2.handleBrickCollision(wide);
    expect(b2.movement.angle).toBeCloseTo(0);
    expect(b2.x).toBeCloseTo(62);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(Math.PI, 54.5, 50);
    b3.handleBrickCollision(tall);
    expect(b3.movement.angle).toBeCloseTo(0);
    expect(b3.x).toBeCloseTo(54.5);
    expect(b3.y).toBeCloseTo(50);
  });
  it('from right - deep collision', async ({expect}) => {
    const b1 = makeBall(Math.PI, 59, 50);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(0);
    expect(b1.x).toBeCloseTo(62);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(Math.PI, 59, 50);
    b2.handleBrickCollision(wide);
    expect(b2.movement.angle).toBeCloseTo(0);
    expect(b2.x).toBeCloseTo(62);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(Math.PI, 52, 50);
    b3.handleBrickCollision(tall);
    expect(b3.movement.angle).toBeCloseTo(0);
    expect(b3.x).toBeCloseTo(54.5);
    expect(b3.y).toBeCloseTo(50);
  });

  // corners
  it('from top left - no collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 4, 37, 37);
    expect(ball.isColliding(square)).toBeFalsy();

    ball.x = 46;
    ball.updatePosition();
    expect(ball.isColliding(tall)).toBeFalsy();

    ball.x = 37;
    ball.y = 46;
    ball.updatePosition();
    expect(ball.isColliding(wide)).toBeFalsy();
  });
  it('from top left - minimal collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 4, 38.75, 38.75);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 4, 47, 39.5);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b2.x).toBeCloseTo(45.5);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 4, 39, 46.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b3.x).toBeCloseTo(38);
    expect(b3.y).toBeCloseTo(45.5);
  });
  it('from top left - deep collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 4, 40, 40);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 4, 47.5, 40);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b2.x).toBeCloseTo(45.5);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 4, 40, 47.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b3.x).toBeCloseTo(38);
    expect(b3.y).toBeCloseTo(45.5);
  });

  // Favoring left
  it('from top left left - deep collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 4, 38, 40);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(40);

    const b2 = makeBall(-Math.PI / 4, 45.5, 40);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b2.x).toBeCloseTo(45.5);
    expect(b2.y).toBeCloseTo(40);

    const b3 = makeBall(-Math.PI / 4, 38, 47.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b3.x).toBeCloseTo(38);
    expect(b3.y).toBeCloseTo(47.5);
  });
  // Favoring top
  it('from top top left - deep collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 4, 40, 38);
    b1.handleBrickCollision(square);
    expect(b1.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(b1.x).toBeCloseTo(40);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 4, 47.5, 38);
    b2.handleBrickCollision(tall);
    expect(b2.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(b2.x).toBeCloseTo(47.5);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 4, 40, 45.5);
    b3.handleBrickCollision(wide);
    expect(b3.movement.angle).toBeCloseTo(Math.PI / 4);
    expect(b3.x).toBeCloseTo(40);
    expect(b3.y).toBeCloseTo(45.5);
  });

  // Inside bounce correction
  it('corner bounce correction - top left', async ({expect}) => {
    const f = 1.01;
    const ball = makeBall((f * -Math.PI) / 2, 41, 41);
    ball.handleBrickCollision(square);
    expect(ball.movement.angle).toBeCloseTo((f * Math.PI) / 2);
    expect(ball.x).toBeCloseTo(41.05);
    expect(ball.y).toBeCloseTo(38);
  });
});

describe.concurrent('boundary collision - 1:1 ratio', () => {
  // beforeAll(async () => {});

  it('to top center - minimal vertical collision', async ({expect}) => {
    const ball = makeBall(Math.PI / 2, 50, 2);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(2);
  });

  it('to top center - deep vertical collision', async ({expect}) => {
    const ball = makeBall(Math.PI / 2, 50, 1);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(-Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(2);
  });

  it('to top left - minimal diagonal collision', async ({expect}) => {
    const ball = makeBall((3 * Math.PI) / 4, 2, 2);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(-Math.PI / 4);
    expect(ball.x).toBeCloseTo(2);
    expect(ball.y).toBeCloseTo(2);
  });

  it('to top left - deep diagonal collision', async ({expect}) => {
    const ball = makeBall((3 * Math.PI) / 4, 1, 1);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(-Math.PI / 4);
    expect(ball.x).toBeCloseTo(2);
    expect(ball.y).toBeCloseTo(2);
  });

  it('to center left - minimal horizontal collision', async ({expect}) => {
    const ball = makeBall(Math.PI, 1.9, 50);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(0);
    expect(ball.x).toBeCloseTo(2);
    expect(ball.y).toBeCloseTo(50);
  });

  it('to center left - deep horizontal collision', async ({expect}) => {
    const ball = makeBall(Math.PI, 1, 50);
    expect(ball.handleBoundaryCollision()).toBeTruthy();
    expect(ball.movement.angle).toBeCloseTo(0);
    expect(ball.x).toBeCloseTo(2);
    expect(ball.y).toBeCloseTo(50);
  });
});
