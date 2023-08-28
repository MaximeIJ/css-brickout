import {a, clamp, createEvent} from '../util';

import {Brick, GameObject, Level, MovingGameObject, MovingGameObjectConfig, Paddle} from './';

const MAX_ANGLE = 0.9 * Math.PI;
const MIN_ANGLE = 0.1 * Math.PI;

export type BallConfig = Omit<MovingGameObjectConfig, 'elementId'> & {
  idx: number;
  // % of the game's height (see updateElementSize)
  radius: number;
  // damage inflicted on bricks
  damage?: number;
};

export class Ball extends MovingGameObject {
  destroyed = false;
  radius = 0;
  damage = 1;
  rx = 0;
  antiTunneling = false;

  constructor({idx, radius, movement, damage = 1, ...objConfig}: BallConfig) {
    super({
      ...objConfig,
      className: [...(objConfig.className?.split(' ') ?? []), 'ball'].join(' '),
      elementId: `ball-${idx}`,
      movement,
      showTitle: true,
    });
    this.radius = radius;
    this.damage = damage;
    this.antiTunneling = this.speed > this.radius * 2;
    this.applyBonuses();
    this.updateElementSize();
    this.updateTitle();
  }

  updateElementSize(): void {
    super.updateElementSize();
    // calc size based on height, adjust rx with aspect ratio
    const pxRadius = Math.round((this.radius / 100.0) * this.pHeight);

    this.rx = (this.radius * this.pHeight) / this.pWidth;
    this.width = this.rx * 2;
    this.height = this.radius * 2;
    this.element.style.setProperty('--diameter', pxRadius * 2 + 'px');
  }

  setD() {
    super.setD();
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
    const hitTop = this.y - this.radius <= 0;
    if (this.x - this.rx <= 0 || this.x + this.rx >= 100) {
      if (hitTop) {
        // Corner collision
        this.angle = this.angle - Math.PI;
        this.y = this.radius;
      } else {
        this.angle = Math.PI - this.angle;
      }
      // Correct positions
      if (this.x - this.rx <= 0) {
        this.x = this.rx;
      } else {
        this.x = 100 - this.rx;
      }
      return true;
    } else if (hitTop) {
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
      } else {
        this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));
        this.y += delta;
      }
    } else if (sidesHit.length === 2) {
      const hz = sidesHit.filter(({type}) => type === 'horizontal')[0];
      const hzBouncePossible = (this.dx > 0 && hz?.delta === deltaLeft) || (this.dx < 0 && hz?.delta === deltaRight);
      const vt = sidesHit.filter(({type}) => type === 'vertical')[0];
      const vtBouncePossible = (this.dy > 0 && vt?.delta === deltaTop) || (this.dy < 0 && vt?.delta === deltaBottom);
      if (hzBouncePossible && (!vtBouncePossible || a(hz?.delta) < a(vt?.delta))) {
        this.angle = Math.atan2(this.speed * Math.sin(this.angle), -this.speed * Math.cos(this.angle));
        this.x += hz?.delta;
      } else {
        // Default in case of tie to vertical
        this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));
        this.y += vt?.delta;
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
      if (this.y < paddleTop) {
        // Ball is coming from above the paddle, bounce it up
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

        const nextAngle = angle < -Math.PI / 2 ? Math.PI : angle;
        this.angle = clamp(nextAngle, MAX_ANGLE, MIN_ANGLE);
      }

      // Set ball right above the paddle
      this.y = paddleTop - this.radius * 1;
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
    return deltaX * deltaX + deltaY * deltaY <= this.radius * this.rx;
  }

  sweptShapeCollision(object: GameObject, frameFraction = 1) {
    const sweptVolumeX = this.x + Math.min(0, this.dx);
    const sweptVolumeY = this.y + Math.min(0, this.dy);

    // Check if swept volume intersects with the rectangle
    if (
      sweptVolumeX - this.rx < object.x + object.width / 2 &&
      sweptVolumeX + this.rx > object.x - object.width / 2 &&
      sweptVolumeY - this.radius < object.y + object.height / 2 &&
      sweptVolumeY + this.radius > object.y - object.height / 2
    ) {
      // Collision detected, resolve it
      const collisionX = this.dx > 0 ? object.x - object.width / 2 - this.rx : object.x + object.width / 2 + this.rx;
      const collisionY =
        this.dy > 0 ? object.y - object.height / 2 - this.radius : object.y + object.height / 2 + this.radius;

      const timeOfCollisionX = (collisionX - this.x) / this.dx;
      const timeOfCollisionY = (collisionY - this.y) / this.dy;

      const actualTime = Math.min(a(timeOfCollisionX), a(timeOfCollisionY), frameFraction);

      this.x += this.dx * actualTime;
      this.y += this.dy * actualTime;
      return true;
    }
    return false;
  }

  processFrame(frameFraction = 1, level?: Level, paddle?: Paddle) {
    let shouldUpdateLast = this.antiTunneling;
    if (!shouldUpdateLast) {
      this.updatePosition(undefined, undefined, frameFraction);
    }
    if (level && paddle) {
      shouldUpdateLast = !this.handleLevelCollision(level, paddle);
    }
    if (shouldUpdateLast) {
      this.updatePosition(undefined, undefined, frameFraction);
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
