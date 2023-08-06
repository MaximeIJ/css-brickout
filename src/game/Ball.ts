import {a, clamp, createEvent, pythagoras} from '../util';

import {Brick, GameObject, GameObjectConfig, Level, Paddle} from './';

const MAX_ANGLE = 0.9 * Math.PI;
const MIN_ANGLE = 0.1 * Math.PI;

export type BallConfig = Omit<GameObjectConfig, 'elementId'> & {
  idx: number;
  // % of the game's height (see updateElementSize)
  radius: number;
  // Angle in radians
  angle: number;
  // % of the game's height per frame (see GameConfig.fps)
  speed: number;
  // damage inflicted on bricks
  damage?: number;
};

export class Ball extends GameObject {
  destroyed = false;
  radius = 0;
  speed = 0;
  angle = 0;
  damage = 1;
  dx = 0;
  dy = 0;
  hypothenuse = 1;
  fx = 0;
  fy = 0;
  antiTunneling = false;

  constructor({idx, radius, angle, speed, damage = 1, ...objConfig}: BallConfig) {
    super({
      ...objConfig,
      className: [...(objConfig.className?.split(' ') ?? []), 'ball'].join(' '),
      elementId: `ball-${idx}`,
      showTitle: true,
    });
    this.radius = radius;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.antiTunneling = this.speed > this.radius;
    // unused
    this.width = radius * 2;
    this.height = radius * 2;
    this.applyBonuses();
    this.updateSpeedRatios();
    this.updateElementSize();
    this.updateTitle();
  }

  updateSpeedRatios() {
    this.updateHypothenuse();
    // Account for aspect ratio
    this.fx = (this.parent.offsetWidth || 100) / this.hypothenuse;
    this.fy = (this.parent.offsetHeight || 100) / this.hypothenuse;
  }

  updateHypothenuse() {
    this.hypothenuse = pythagoras(this.parent.offsetWidth || 100, this.parent.offsetHeight || 100);
  }

  updateElementSize(): void {
    this.updateSpeedRatios();
    const pxRadius = Math.round((this.radius / 100.0) * this.hypothenuse);
    this.element.style.setProperty('--diameter', pxRadius * 2 + 'px');
  }

  updatePosition(x?: number, y?: number) {
    super.updatePosition((x ?? this.x ?? 0) + (this.dx ?? 0), (y ?? this.y ?? 0) + (this.dy ?? 0));
  }

  setD(fraction = 1) {
    // Swap the axis ratios to compensate for the aspect ratio. Without this, the ball would move faster on the Y axis when the game is wider than it is tall.
    this.dx = this.fy * fraction * this.speed * Math.cos(this.angle);
    this.dy = this.fx * fraction * -this.speed * Math.sin(this.angle);
    this.element.style.setProperty('--dx', this.dx + 'px');
    this.element.style.setProperty('--dy', this.dy + 'px');
  }

  /**
   * Detects collisions between this ball and the boundaries, level bricks, and paddle (in that order)
   * @param level The level with the bricks and strips
   * @param paddle The player's paddle
   * @returns true if the position has been updated already
   */
  handleLevelCollision(level: Level, paddle: Paddle, frameFraction = 1) {
    const hitBoundary = this.handleBoundaryCollision();
    if (hitBoundary) {
      return false;
    } else if (this.handlePaddleCollision(paddle, frameFraction)) {
      return true;
    }

    let hitBrick = false;
    let i = 0;
    const nearby = level.getNearbyBricks(this);

    while (i < nearby.length && !hitBrick) {
      const brick = nearby[i];
      i++;
      if (brick.destroyed) continue;

      // Check for collision
      if (this.antiTunneling) {
        // swept shape collision
        if (this.sweptShapeCollision(brick, frameFraction)) {
          hitBrick = true;
          this.handleBrickCollision(brick);
        }
      } else {
        if (this.isColliding(brick)) {
          hitBrick = true;
          this.handleBrickCollision(brick);
        }
      }
    }

    return hitBrick;
  }

  handleBoundaryCollision() {
    if (this.x - this.radius <= 0 || this.x + this.radius >= 100) {
      this.angle = Math.PI - this.angle;
      // Correct positions
      if (this.x - this.radius <= 0) {
        this.x = this.radius;
      } else {
        this.x = 100 - this.radius;
      }
      return true;
    }

    if (this.y - this.radius <= 0) {
      this.angle = -this.angle;
      if (this.y - this.radius < 0) {
        this.y = this.radius;
      }
      return true;
    }

    if (this.y + this.radius >= 100) {
      this.speed = 0;
      this.destroy();
      return true;
    }
  }

  handleBrickCollision(brick: Brick) {
    if (brick.breakthrough) {
      brick.takeHit(this);
      this.dispatchCollisionEvent(brick);
      return;
    }
    // determine delta with each side of the brick
    const {top, left, right, bottom} = brick.boundingBox;

    const d = this.width;
    const deltaLeft = left - this.boundingBox.right;
    const deltaRight = right - this.boundingBox.left;
    const deltaTop = top - this.boundingBox.bottom;
    const deltaBottom = bottom - this.boundingBox.top;
    const sidesHit = [deltaLeft, deltaRight, deltaTop, deltaBottom]
      .map((delta, idx) => {
        let type = 'vertical';
        if (idx < 2) {
          type = 'horizontal';
        }
        return {delta, type};
      })
      .filter(({delta}) => a(delta) <= d);

    if (sidesHit.length === 1) {
      // side hit
      const {delta, type} = sidesHit[0];
      if (type === 'horizontal') {
        this.angle = Math.atan2(this.speed * Math.sin(this.angle), -this.speed * Math.cos(this.angle));
        this.x += delta;
        // console.log('horizontal', this.angle, delta, this.x);
      } else {
        this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));
        this.y += delta;
        // console.log('vertical', this.angle, delta, this.y);
      }
    } else if (sidesHit.length === 2) {
      const hz = sidesHit.filter(({type}) => type === 'horizontal')[0];
      const hzBouncePossible = (this.dx > 0 && hz.delta === deltaLeft) || (this.dx < 0 && hz.delta === deltaRight);
      const vt = sidesHit.filter(({type}) => type === 'vertical')[0];
      const vtBouncePossible = (this.dy > 0 && vt.delta === deltaTop) || (this.dy < 0 && vt.delta === deltaBottom);
      if (hzBouncePossible && (!vtBouncePossible || Math.abs(hz.delta) < Math.abs(vt.delta))) {
        this.angle = Math.atan2(this.speed * Math.sin(this.angle), -this.speed * Math.cos(this.angle));
        this.x += hz.delta;
      } else {
        // Default in case of tie to vertical
        this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));
        this.y += vt.delta;
      }
    } else {
      // no hit
      console.warn('no hit', sidesHit);
    }

    this.dispatchCollisionEvent(brick);
    brick.takeHit(this);
  }

  handlePaddleCollision(paddle: Paddle, frameFraction = 1) {
    const paddleTop = paddle.boundingBox.top;
    const isColliding = this.antiTunneling ? this.sweptShapeCollision(paddle, frameFraction) : this.isColliding(paddle);

    if (isColliding) {
      // Calculate the hit position on the paddle
      const hitPosition = this.x - paddle.x;
      const hitPositionNormalized = hitPosition / (paddle.width / 2);

      // Calculate the incoming angle of the ball
      const incomingAngle =
        (this.angle > Math.PI ? (this.angle % (2 * Math.PI)) - 2 * Math.PI : this.angle) % (2 * Math.PI);

      // Calculate the new angle with skewness towards more vertical angles
      const angleMultiplier = paddle.gripFactor; // Adjust this value to control the skewness
      const hitPositionSkewness = hitPositionNormalized * angleMultiplier;
      const angle = -(incomingAngle + hitPositionSkewness) % (2 * Math.PI);

      this.y = paddleTop - this.radius;
      const nextAngle = angle < -Math.PI / 2 ? Math.PI : angle;
      this.angle = clamp(nextAngle, MAX_ANGLE, MIN_ANGLE);
      this.dispatchCollisionEvent(paddle);
      return true;
    }
  }

  isColliding(object: GameObject) {
    const {top, left, right, bottom} = object.boundingBox;

    // Check for collision between a circle and a rectangle
    // https://yal.cc/rectangle-circle-intersection-test/
    const deltaX = this.x - Math.max(left, Math.min(this.x, right));
    const deltaY = this.y - Math.max(top, Math.min(this.y, bottom));
    return deltaX * deltaX + deltaY * deltaY <= this.radius * this.radius;
  }

  sweptShapeCollision(object: GameObject, frameFraction = 1) {
    const sweptVolumeX = this.x + Math.min(0, this.dx);
    const sweptVolumeY = this.y + Math.min(0, this.dy);

    // Check if swept volume intersects with the rectangle
    if (
      sweptVolumeX - this.radius < object.x + object.width / 2 &&
      sweptVolumeX + this.radius > object.x - object.width / 2 &&
      sweptVolumeY - this.radius < object.y + object.height / 2 &&
      sweptVolumeY + this.radius > object.y - object.height / 2
    ) {
      // Collision detected, resolve it
      const collisionX =
        this.dx > 0 ? object.x - object.width / 2 - this.radius : object.x + object.width / 2 + this.radius;
      const collisionY =
        this.dy > 0 ? object.y - object.height / 2 - this.radius : object.y + object.height / 2 + this.radius;

      const timeOfCollisionX = (collisionX - this.x) / this.dx;
      const timeOfCollisionY = (collisionY - this.y) / this.dy;

      const actualTime = Math.min(Math.abs(timeOfCollisionX), Math.abs(timeOfCollisionY), frameFraction);

      if (actualTime !== frameFraction) {
        console.log('swept shape collision', actualTime, timeOfCollisionX, timeOfCollisionY, frameFraction);
        console.log(this.x, this.y, this.dx, this.dy, this.radius, object.x, object.y, object.width, object.height);
      }

      this.x += this.dx * actualTime;
      this.y += this.dy * actualTime;
      return true;
    }
    return false;
  }

  processFrame(frameFraction = 1, level?: Level, paddle?: Paddle) {
    let shouldUpdateLast = this.antiTunneling;
    if (!shouldUpdateLast) {
      this.setD(frameFraction);
      this.updatePosition();
    }
    if (level && paddle) {
      shouldUpdateLast = !this.handleLevelCollision(level, paddle);
    }
    if (shouldUpdateLast) {
      this.setD(frameFraction);
      this.updatePosition();
    }
    this.updateElementPosition();
  }

  dispatchCollisionEvent(object: GameObject) {
    const event: BallCollisionEvent = createEvent<{ball: Ball; object: GameObject}>('ballcollision', {
      ball: this,
      object,
    });
    this.parent.dispatchEvent(event);
  }

  destroy() {
    setTimeout(() => {
      super.destroy();
    }, 350);
    this.element.classList.add('ball--destroyed');
    this.destroyed = true;
    const event: BallDestroyedEvent = createEvent<Ball>('balldestroyed', this);
    this.parent.dispatchEvent(event);
  }
}

export type BallDestroyedEvent = CustomEvent<Ball>;
export type BallCollisionEvent = CustomEvent<{ball: Ball; object: GameObject}>;
