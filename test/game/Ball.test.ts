import {beforeAll, describe, it} from 'vitest';

import {Ball, Brick} from '../../src/game';

const parent = document.createElement('div');
const makeBall = (angle: number, x: number, y: number) => {
  const b = new Ball({x, y, radius: 2, parent, idx: 0, angle, speed: 1});
  b.updatePosition();
  return b;
};

describe.concurrent('breakthrough brick', () => {
  let bb: Brick;

  beforeAll(async () => {
    bb = new Brick({x: 50, y: 50, width: 20, height: 20, parent, elementId: `bb`, hp: 1, breakthrough: true});
    bb.updatePosition();
  });

  it('from top - deep collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 40);
    expect(ball.isColliding(bb)).toBeTruthy();
    ball.handleBrickCollision(bb);
    expect(ball.angle).toBeCloseTo(-Math.PI / 2);
    expect(ball.x).toBeCloseTo(50);
    expect(ball.y).toBeCloseTo(40);
  });
});

describe.concurrent('ball brick collision', () => {
  let square: Brick;
  let tall: Brick;
  let wide: Brick;

  beforeAll(async () => {
    square = new Brick({x: 50, y: 50, width: 20, height: 20, parent, elementId: `sbrick`, hp: 100});
    square.updatePosition();
    tall = new Brick({x: 50, y: 50, width: 5, height: 20, parent, elementId: `tbrick`, hp: 100});
    tall.updatePosition();
    wide = new Brick({x: 50, y: 50, width: 20, height: 5, parent, elementId: `wbrick`, hp: 100});
    wide.updatePosition();
  });

  // top
  it('from top - no collision', async ({expect}) => {
    const ball = makeBall(-Math.PI / 2, 50, 37);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(tall)).toBeFalsy();

    ball.y = 45;
    ball.updatePosition();
    expect(ball.isColliding(wide)).toBeFalsy();
  });
  it('from top - minimal collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 2, 50, 38);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 2, 50, 38);
    expect(b2.isColliding(tall)).toBeTruthy();
    b2.handleBrickCollision(tall);
    expect(b2.angle).toBeCloseTo(Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 2, 50, 45.5);
    expect(b3.isColliding(wide)).toBeTruthy();
    b3.handleBrickCollision(wide);
    expect(b3.angle).toBeCloseTo(Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(45.5);
  });
  it('from top - deep collision', async ({expect}) => {
    const b1 = makeBall(-Math.PI / 2, 50, 41);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 2, 50, 41);
    expect(b2.isColliding(tall)).toBeTruthy();
    b2.handleBrickCollision(tall);
    expect(b2.angle).toBeCloseTo(Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(38);

    const b3 = makeBall(-Math.PI / 2, 50, 48);
    expect(b3.isColliding(wide)).toBeTruthy();
    b3.handleBrickCollision(wide);
    expect(b3.angle).toBeCloseTo(Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(45.5);
  });

  // bottom
  it('from bottom - no collision', async ({expect}) => {
    const ball = makeBall(Math.PI / 2, 50, 63);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(tall)).toBeFalsy();

    ball.y = 55;
    ball.updatePosition();
    expect(ball.isColliding(wide)).toBeFalsy();
  });
  it('from bottom - minimal collision', async ({expect}) => {
    const b1 = makeBall(Math.PI / 2, 50, 62);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(-Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(62);

    const b2 = makeBall(Math.PI / 2, 50, 62);
    expect(b2.isColliding(tall)).toBeTruthy();
    b2.handleBrickCollision(tall);
    expect(b2.angle).toBeCloseTo(-Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(62);

    const b3 = makeBall(Math.PI / 2, 50, 54.5);
    expect(b3.isColliding(wide)).toBeTruthy();
    b3.handleBrickCollision(wide);
    expect(b3.angle).toBeCloseTo(-Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(54.5);
  });
  it('from bottom - deep collision', async ({expect}) => {
    const b1 = makeBall(Math.PI / 2, 50, 59);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(-Math.PI / 2);
    expect(b1.x).toBeCloseTo(50);
    expect(b1.y).toBeCloseTo(62);

    const b2 = makeBall(Math.PI / 2, 50, 59);
    expect(b2.isColliding(tall)).toBeTruthy();
    b2.handleBrickCollision(tall);
    expect(b2.angle).toBeCloseTo(-Math.PI / 2);
    expect(b2.x).toBeCloseTo(50);
    expect(b2.y).toBeCloseTo(62);

    const b3 = makeBall(Math.PI / 2, 50, 52);
    expect(b3.isColliding(wide)).toBeTruthy();
    b3.handleBrickCollision(wide);
    expect(b3.angle).toBeCloseTo(-Math.PI / 2);
    expect(b3.x).toBeCloseTo(50);
    expect(b3.y).toBeCloseTo(54.5);
  });

  // left
  it('from left - no collision', async ({expect}) => {
    const ball = makeBall(Math.PI, 37, 50);
    expect(ball.isColliding(square)).toBeFalsy();
    expect(ball.isColliding(wide)).toBeFalsy();

    ball.x = 45;
    ball.updatePosition();
    expect(ball.isColliding(tall)).toBeFalsy();
  });
  it('from left - minimal collision', async ({expect}) => {
    const b1 = makeBall(Math.PI, 38, 50);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(0);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(Math.PI, 38, 50);
    expect(b2.isColliding(wide)).toBeTruthy();
    b2.handleBrickCollision(wide);
    expect(b2.angle).toBeCloseTo(0);
    expect(b2.x).toBeCloseTo(38);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(Math.PI, 45.5, 50);
    expect(b3.isColliding(tall)).toBeTruthy();
    b3.handleBrickCollision(tall);
    expect(b3.angle).toBeCloseTo(0);
    expect(b3.x).toBeCloseTo(45.5);
    expect(b3.y).toBeCloseTo(50);
  });
  it('from left - deep collision', async ({expect}) => {
    const b1 = makeBall(Math.PI, 41, 50);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(0);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(Math.PI, 41, 50);
    expect(b2.isColliding(wide)).toBeTruthy();
    b2.handleBrickCollision(wide);
    expect(b2.angle).toBeCloseTo(0);
    expect(b2.x).toBeCloseTo(38);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(Math.PI, 48, 50);
    expect(b3.isColliding(tall)).toBeTruthy();
    b3.handleBrickCollision(tall);
    expect(b3.angle).toBeCloseTo(0);
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
    const b1 = makeBall(0, 62, 50);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(Math.PI);
    expect(b1.x).toBeCloseTo(62);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(0, 62, 50);
    expect(b2.isColliding(wide)).toBeTruthy();
    b2.handleBrickCollision(wide);
    expect(b2.angle).toBeCloseTo(Math.PI);
    expect(b2.x).toBeCloseTo(62);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(0, 54.5, 50);
    expect(b3.isColliding(tall)).toBeTruthy();
    b3.handleBrickCollision(tall);
    expect(b3.angle).toBeCloseTo(Math.PI);
    expect(b3.x).toBeCloseTo(54.5);
    expect(b3.y).toBeCloseTo(50);
  });
  it('from right - deep collision', async ({expect}) => {
    const b1 = makeBall(0, 59, 50);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(Math.PI);
    expect(b1.x).toBeCloseTo(62);
    expect(b1.y).toBeCloseTo(50);

    const b2 = makeBall(0, 59, 50);
    expect(b2.isColliding(wide)).toBeTruthy();
    b2.handleBrickCollision(wide);
    expect(b2.angle).toBeCloseTo(Math.PI);
    expect(b2.x).toBeCloseTo(62);
    expect(b2.y).toBeCloseTo(50);

    const b3 = makeBall(0, 52, 50);
    expect(b3.isColliding(tall)).toBeTruthy();
    b3.handleBrickCollision(tall);
    expect(b3.angle).toBeCloseTo(Math.PI);
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
    const b1 = makeBall(-Math.PI / 4, 38, 38);
    expect(b1.isColliding(square)).toBeTruthy();
    b1.handleBrickCollision(square);
    expect(b1.angle).toBeCloseTo(Math.PI / 4);
    expect(b1.x).toBeCloseTo(38);
    expect(b1.y).toBeCloseTo(38);

    const b2 = makeBall(-Math.PI / 4, 46, 38);
    expect(b2.isColliding(tall)).toBeTruthy();
    b2.handleBrickCollision(tall);
    expect(b2.angle).toBeCloseTo(Math.PI / 4);
    expect(b2.x).toBeCloseTo(46);
    expect(b2.y).toBeCloseTo(38);

    // deeper on x
    const b3 = makeBall(-Math.PI / 4, 38, 47);
    expect(b3.isColliding(wide)).toBeTruthy();
    b3.handleBrickCollision(wide);
    expect(b3.angle).toBeCloseTo((-3 * Math.PI) / 4);
    expect(b3.x).toBeCloseTo(38);
    expect(b3.y).toBeCloseTo(47);
  });
});
