import {AxisOverlap, Vector, createEvent, getOverlapsAndAxes, normalizeAngle, overlapOnAxis} from '../util';

import {Brick, CompositeBrick, GameObject, Level, MovingGameObject, MovingGameObjectConfig, Paddle} from './';

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
  // Prevents the ball from hitting the same object twice in a row
  antiJuggling: string | false = false;
  // expose some internals as readonly
  declare readonly dx: number;
  declare readonly dy: number;

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
    this.applyBonuses();
    this.updateElementSize();
    this.updateTitle();
  }

  updateElementSize(): void {
    super.updateElementSize();
    // calc size based on height, adjust rx with aspect ratio
    const pxRadius = Math.round((this.radius / 100.0) * this.parent.sizes.height);

    this.rx = (this.radius * this.parent.sizes.height) / this.parent.sizes.width;
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
  handleLevelCollision(level: Level, paddle: Paddle) {
    const hitBoundary = this.handleBoundaryCollision();
    if (hitBoundary) {
      return false;
    } else if (this.handlePaddleCollision(paddle)) {
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
      this.dispatchCollisionEvent();
      return true;
    } else if (hitTop) {
      this.movementAngle = -this.movementAngle;
      if (this.y - this.radius <= 0) {
        this.y = this.radius;
      }
      this.antiJuggling = false;
      this.dispatchCollisionEvent();
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
    const collisionAngle = Math.atan2(maxOverlapAxis.y, maxOverlapAxis.x);

    // Calculate the new angle after reflection
    const reflectedAngle = normalizeAngle(2 * collisionAngle - this.movementAngle);

    this.movementAngle = reflectedAngle;
    this.correctPostion(overlapsAndAxes[0]);

    this.dispatchCollisionEvent(brick);
    parentBrick.takeHit(this);
  }

  handlePaddleCollision(paddle: Paddle) {
    const isColliding = this.isColliding(paddle);

    if (isColliding) {
      // Ball is coming from above the paddle, bounce it up
      // Calculate the hit position on the paddle
      const hitPosition = this.x - paddle.x;
      const hitPositionNormalized = Math.min(1, Math.max(-1, hitPosition / (paddle.width / 2)));

      const angleMultiplier = paddle.curveFactor ?? 0; // Adjust this value to control the skewness
      const hitPositionSkewness = hitPositionNormalized * angleMultiplier * (Math.PI / 2);

      const overlapsAndAxes = getOverlapsAndAxes(paddle, this);
      const {axis: maxOverlapAxis} = overlapsAndAxes[1];
      const collisionAngle = -Math.atan2(maxOverlapAxis.y, maxOverlapAxis.x);

      // Calculate the new angle after reflection
      const nextAngle = normalizeAngle(2 * collisionAngle - this.movementAngle - hitPositionSkewness);
      this.movementAngle = nextAngle;
      this.correctPostion(overlapsAndAxes[0]);

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

  correctPostion(axisOverlaps: AxisOverlap): void {
    const {overlap, axis} = axisOverlaps;
    if (overlap !== 0) {
      this.x -= axis.x * overlap;
      this.y -= axis.y * overlap;
    }
  }

  processFrame(frameFraction = 1, level?: Level, paddle?: Paddle) {
    if (!this.active) return;
    this.updatePosition(undefined, undefined, frameFraction);

    if (level && paddle) {
      !this.handleLevelCollision(level, paddle);
    }
  }

  dispatchCollisionEvent(object?: GameObject) {
    const event: BallCollisionEvent = createEvent<{ball: Ball; object?: GameObject}>('ballcollision', {
      ball: this,
      object,
    });
    this.parent.element.dispatchEvent(event);
  }

  destroy(forReal = true) {
    this.element.classList.add('ball--destroyed');
    this.destroyed = true;
    const event: BallDestroyedEvent = createEvent<Ball>('balldestroyed', this);
    this.parent.element.dispatchEvent(event);
    if (forReal) {
      super.destroy();
    }
  }

  toString(): string {
    return `${super.toString()}
${this.damage ? `Damage: ${this.damage}` : ''}`;
  }
}

export type BallDestroyedEvent = CustomEvent<Ball>;
export type BallCollisionEvent = CustomEvent<{ball: Ball; object?: GameObject}>;
