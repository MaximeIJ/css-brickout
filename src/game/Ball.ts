import {
  Vector,
  createEvent,
  getCCCollisionPosition,
  getCRCollisionPosition,
  normalizeAngle,
  overlapOnAxis,
} from '../util';

import {Brick, CompositeBrick, GameObject, Level, MovingGameObject, MovingGameObjectConfig, Paddle} from './';

export type BallConfig = Omit<MovingGameObjectConfig, 'elementId' | 'shape'> & {
  idx: number;
  // % of the game's height (see updateElementSize)
  radius: number;
  // damage inflicted on bricks
  damage?: number;
};

export class Ball extends MovingGameObject {
  destroyed = false;
  damage = 1;
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
      shape: 'circle',
    });
    this.radius = radius;
    this.damage = damage;
    this.applyBonuses();
    this.updateElementSize();
    this.updateTitle();
  }

  // Used for cosmetics, can move to MovingGameObject
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
  handleLevelCollision(level: Level, paddle: Paddle, frameFraction: number) {
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
      // check if the brick has hitboxParts, if so, check collision with each part
      const partsToCheck = brick.hitboxParts ?? [brick];
      partsToCheck.some(part => {
        if (this.isColliding(part)) {
          hitBrick = true;
          this.handleBrickCollision(part, frameFraction, brick);
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

  resolveCollision(object: GameObject, frameFraction = 1) {
    const virtualCircle = {
      x: this.x - this.dx * frameFraction,
      y: this.y - this.dy * frameFraction,
      radius: this.radius,
      dx: this.dx * frameFraction,
      dy: this.dy * frameFraction,
    };
    const castObj = object as MovingGameObject;
    const baseVirtualObject = {
      angle: object.angle,
      boundingBox: object.boundingBox,
      width: object.width,
      height: object.height,
      radius: object.shape === 'circle' ? object.radius : 0,
    };
    const virtualObject =
      object instanceof MovingGameObject
        ? {
            ...baseVirtualObject,
            x: object.x - castObj.dx * frameFraction,
            y: object.y - castObj.dy * frameFraction,
            dx: castObj.dx * frameFraction,
            dy: castObj.dy * frameFraction,
          }
        : {
            ...baseVirtualObject,
            x: object.x,
            y: object.y,
            dx: 0,
            dy: 0,
          };
    const collision =
      object.shape === 'rectangle'
        ? getCRCollisionPosition(virtualObject, virtualCircle)
        : getCCCollisionPosition(virtualCircle, virtualObject);

    if (collision) {
      const {normal, tmin} = collision;

      const nextX = virtualCircle.x + virtualCircle.dx * tmin;
      const nextY = virtualCircle.y + virtualCircle.dy * tmin;
      if (!Number.isNaN(nextX) && !Number.isNaN(nextY)) {
        this.x = nextX;
        this.y = nextY;
      }

      const dot = virtualCircle.dx * normal.x + virtualCircle.dy * normal.y;
      const reflectedDx = virtualCircle.dx - 2 * dot * normal.x;
      const reflectedDy = virtualCircle.dy - 2 * dot * normal.y;
      // Update movementAngle based on new reflected velocity
      this.movementAngle = -Math.atan2(reflectedDy, reflectedDx);

      this.antiJuggling = object.element.id;
      return true;
    } else {
      // console.warn('No collision detected', virtualCircle, object.width, object.height, object.angle);
    }
  }

  handleBrickCollision(brick: Brick, frameFraction = 1, composite?: CompositeBrick) {
    const parentBrick = composite ?? brick;
    if (brick.breakthrough) {
      parentBrick.takeHit(this);
      this.dispatchCollisionEvent(parentBrick);
      this.antiJuggling = brick.element.id;
      return;
    }

    if (this.resolveCollision(brick, frameFraction)) {
      this.dispatchCollisionEvent(brick);
      parentBrick.takeHit(this);
      return true;
    }
  }

  handlePaddleCollision(paddle: Paddle, frameFraction = 1) {
    const isColliding = this.isColliding(paddle);

    if (isColliding) {
      if (this.resolveCollision(paddle, frameFraction)) {
        // Ball is coming from above the paddle, bounce it up
        // Calculate the hit position on the paddle
        const hitPosition = this.x - paddle.x;
        const hitPositionNormalized = Math.min(1, Math.max(-1, hitPosition / (paddle.width / 2)));

        const angleMultiplier = paddle.curveFactor ?? 0; // Adjust this value to control the skewness
        const hitPositionSkew = hitPositionNormalized * angleMultiplier * (Math.PI / 2);
        this.movementAngle = normalizeAngle(this.movementAngle - hitPositionSkew);
        this.dispatchCollisionEvent(paddle);
        return true;
      }
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

    return true; // Overlapping on all axes, collision detected
  }

  processFrame(frameFraction = 1, level?: Level, paddle?: Paddle) {
    if (!this.active) return;
    this.updatePosition(undefined, undefined, frameFraction);

    if (level && paddle) {
      !this.handleLevelCollision(level, paddle, frameFraction);
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
