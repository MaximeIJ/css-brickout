import {AxisOverlap, Vector, a, clamp, createEvent, getOverlapsAndAxes, normalizeAngle, overlapOnAxis} from '../util';

import {Brick, CompositeBrick, GameObject, Level, MovingGameObject, MovingGameObjectConfig, Paddle} from './';

export type BallConfig = Omit<MovingGameObjectConfig, 'elementId'> & {
  idx: number;
  // % of the game's height (see updateElementSize)
  radius: number;
  // damage inflicted on bricks
  damage?: number;
  // whether the ball should be able to tunnel through bricks
  antiTunneling?: boolean;
};

const MAX_ANGLE = 0.9 * Math.PI;
const MIN_ANGLE = 0.1 * Math.PI;

export class Ball extends MovingGameObject {
  destroyed = false;
  radius = 0;
  damage = 1;
  rx = 0;
  antiTunneling = false;
  // Prevents the ball from hitting the same object twice in a row
  antiJuggling: string | false = false;

  constructor({idx, radius, movement, damage = 1, antiTunneling = false, ...objConfig}: BallConfig) {
    super({
      ...objConfig,
      className: [...(objConfig.className?.split(' ') ?? []), 'ball'].join(' '),
      elementId: `ball-${idx}`,
      movement,
      showTitle: true,
    });
    this.radius = radius;
    this.damage = damage;
    this.antiTunneling = antiTunneling;
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
        // todo: remove swept shape collision?
        if (this.sweptShapeCollision(brick, frameFraction)) {
          hitBrick = true;
          this.handleBrickCollision(brick);
        }
      } else {
        // check if the brick has hitboxParts, if so, check collision with each part
        const partsToCheck = brick.hitboxParts ?? [brick];
        partsToCheck.some(part => {
          if (this.isColliding(part)) {
            // todo: identify which brick got hit if there are hitbox parts
            hitBrick = true;
            this.handleBrickCollision(part, brick);
          }
        });
      }
    }

    return true;
  }

  handleBoundaryCollision() {
    const hitTop = this.y - this.radius <= 0;
    if (this.x - this.rx <= 0 || this.x + this.rx >= 100) {
      if (hitTop) {
        // Corner collision
        this.movementAngle = this.movementAngle - Math.PI;
        this.y = this.radius;
      } else {
        this.movementAngle = Math.PI - this.movementAngle;
      }
      // Correct positions
      if (this.x - this.rx <= 0) {
        this.x = this.rx;
      } else {
        this.x = 100 - this.rx;
      }
      this.antiJuggling = false;
      return true;
    } else if (hitTop) {
      this.movementAngle = -this.movementAngle;
      if (this.y - this.radius < 0) {
        this.y = this.radius;
      }
      this.antiJuggling = false;
      return true;
    }

    if (this.y + this.radius >= 100) {
      this.speed = 0;
      this.destroy(false);
      return true;
    }
  }

  handleBrickCollision(brick: Brick, composite?: CompositeBrick) {
    const parentBrick = composite ?? brick;
    if (brick.breakthrough) {
      parentBrick.takeHit(this);
      this.dispatchCollisionEvent(parentBrick);
      return;
    }

    const overlapsAndAxes = getOverlapsAndAxes(brick, this);
    const {axis: maxOverlapAxis} = overlapsAndAxes[1];
    const collisionAngle = -Math.atan2(maxOverlapAxis.y, maxOverlapAxis.x);

    // Calculate the new angle after reflection
    const reflectedAngle = normalizeAngle(2 * collisionAngle - this.movementAngle);

    this.movementAngle = reflectedAngle;
    // todo: correct position with min overlap
    this.correctPostion(overlapsAndAxes[0], brick);

    this.dispatchCollisionEvent(brick);
    parentBrick.takeHit(this);
  }

  handlePaddleCollision(paddle: Paddle, frameFraction = 1) {
    const isColliding = this.antiTunneling ? this.sweptShapeCollision(paddle, frameFraction) : this.isColliding(paddle);

    if (isColliding) {
      // Ball is coming from above the paddle, bounce it up
      // Calculate the hit position on the paddle
      const hitPosition = this.x - paddle.x;
      const hitPositionNormalized = hitPosition / (paddle.width / 2);

      // Calculate the incoming angle of the ball
      const incomingAngle =
        (this.movementAngle > Math.PI ? (this.movementAngle % (2 * Math.PI)) - 2 * Math.PI : this.movementAngle) %
        (2 * Math.PI);

      // Calculate the new angle with skewness towards more vertical angles
      const angleMultiplier = paddle.gripFactor; // Adjust this value to control the skewness
      const hitPositionSkewness = hitPositionNormalized * angleMultiplier;

      const nextAngle = normalizeAngle(-paddle.angle * 2 - incomingAngle) - hitPositionSkewness;
      this.movementAngle = clamp(nextAngle, MAX_ANGLE - paddle.angle, MIN_ANGLE - paddle.angle);
      this.correctPostion(getOverlapsAndAxes(paddle, this)[0], paddle);

      this.dispatchCollisionEvent(paddle);
      return true;
    }
  }

  isColliding(object: GameObject) {
    if (this.antiJuggling === object.element.id) {
      return false;
    }
    const cos = Math.cos(object.angle);
    const sin = Math.sin(object.angle);

    const axes: Vector[] = [
      {x: cos, y: sin},
      {x: -sin, y: cos},
    ];

    // Check for overlap on all axes
    for (const axis of axes) {
      if (!overlapOnAxis(this, axis, object.boundingBox)) {
        return false; // No overlap on this axis, no collision
      }
    }

    this.antiJuggling = object.element.id;
    return true; // Overlapping on all axes, collision detected
  }

  correctPostion(axisOverlaps: AxisOverlap, object: GameObject): void {
    const {overlap, axis} = axisOverlaps;
    if (overlap !== 0) {
      if (object.x > this.x) {
        axis.x *= -1;
      }
      if (object.y < this.y) {
        axis.y *= -1;
      }
      this.x += axis.x * overlap;
      this.y += axis.y * overlap;
    }
  }

  /**
   * Uses swept collision to detect collision with a rectangle with anti tunneling
   * Does NOT work with angled objects
   * @param object GameObject to check collision with
   * @param frameFraction duration of the interval (in frames)
   * @returns whether objects are colliding
   */
  sweptShapeCollision(object: GameObject, frameFraction = 1): boolean {
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
    if (!this.active) return;
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
  }

  dispatchCollisionEvent(object: GameObject) {
    const event: BallCollisionEvent = createEvent<{ball: Ball; object: GameObject}>('ballcollision', {
      ball: this,
      object,
    });
    this.parent.dispatchEvent(event);
  }

  destroy(forReal = true) {
    this.element.classList.add('ball--destroyed');
    this.destroyed = true;
    const event: BallDestroyedEvent = createEvent<Ball>('balldestroyed', this);
    this.parent.dispatchEvent(event);
    if (forReal) {
      super.destroy();
    }
  }
}

export type BallDestroyedEvent = CustomEvent<Ball>;
export type BallCollisionEvent = CustomEvent<{ball: Ball; object: GameObject}>;
