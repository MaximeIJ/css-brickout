import {createEvent, pythagoras} from '../util';

import {GameObject, GameObjectConfig, Level, Paddle} from './';

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
    // unused
    this.width = radius * 2;
    this.height = radius * 2;
    this.applyBonuses();
    this.updateSpeedRatios();
    this.updateElementSize();
  }

  updateSpeedRatios() {
    this.updateHypothenuse();
    // Account for aspect ratio
    this.fx = this.parent.offsetWidth / this.hypothenuse;
    this.fy = this.parent.offsetHeight / this.hypothenuse;
  }

  updateHypothenuse() {
    this.hypothenuse = pythagoras(this.parent.offsetWidth, this.parent.offsetHeight);
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
   */
  handleLevelCollision(level: Level, paddle: Paddle) {
    const hitBoundary = this.handleBoundaryCollision();

    let hitBrick = false;
    let i = 0;
    const nearby = level.getNearbyBricks(this);

    while (i < nearby.length && !hitBrick) {
      const brick = nearby[i];
      i++;
      if (brick.destroyed) continue;

      // Check for collision
      if (this.isColliding(brick)) {
        hitBrick = true;

        // determine delta with each side of the brick
        const deltaLeft = Math.abs(brick.x - (this.x + this.radius));
        const deltaRight = Math.abs(brick.x + brick.width - (this.x + this.radius));
        const deltaTop = Math.abs(brick.y - (this.y + this.radius));
        const deltaBottom = Math.abs(brick.y + brick.height - (this.y + this.radius));

        const prevX = this.x;
        const prevY = this.y;
        const prevAngle = this.angle;

        if (Math.min(deltaLeft, deltaRight) > Math.min(deltaTop, deltaBottom)) {
          // Horizontal collision
          this.angle = Math.atan2(this.speed * Math.sin(this.angle), -this.speed * Math.cos(this.angle));

          // Update ball pos and check if it's still colliding, if yes, revert and treat as vertical collision
          this.setD();
          this.updatePosition();
          if (this.isColliding(brick)) {
            // console.warn('side hit was wrong, switching to vertical', this.angle);
            this.angle = Math.atan2(-this.speed * Math.sin(prevAngle), this.speed * Math.cos(prevAngle));
          }
          this.x = prevX;
          this.y = prevY;
        } else {
          // Vertical collision
          this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));

          this.setD();
          this.updatePosition();
          if (this.isColliding(brick)) {
            // console.warn('vertical hit was wrong, switching to side', this.angle);
            this.angle = Math.atan2(this.speed * Math.sin(prevAngle), -this.speed * Math.cos(prevAngle));
          }
          this.x = prevX;
          this.y = prevY;
        }

        this.dispatchCollisionEvent(brick);
        brick.takeHit(this);
      }
    }

    const anyCollision = hitBrick || hitBoundary || this.handlePaddleCollision(paddle) || false;
    if (anyCollision) {
      // console.count('collision on ball ' + this.idx);
      // Bounce hard!
      // this.updatePosition();
    }
  }

  handleBoundaryCollision() {
    if (this.x - this.radius <= 0 || this.x + this.radius >= 100) {
      this.angle = Math.PI - this.angle;
      // Adjust angle if it's too flat
      if (Math.abs(this.angle) < Math.PI / 6) {
        this.angle *= 2.5;
        if (this.angle === 0) {
          this.angle = Math.PI / 6;
        }
      }
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

  handlePaddleCollision(paddle: Paddle) {
    const paddleTop = paddle.boundingBox.top;

    if (this.isColliding(paddle)) {
      // Calculate the hit position on the paddle
      const hitPosition = this.x - paddle.x;
      const hitPositionNormalized = hitPosition / (paddle.width / 2);

      // Calculate the incoming angle of the ball
      const incomingAngle = this.angle;

      // Calculate the new angle with skewness towards more vertical angles
      const angleMultiplier = paddle.gripFactor; // Adjust this value to control the skewness
      const hitPositionSkewness = hitPositionNormalized * angleMultiplier;
      const angle = -(incomingAngle + hitPositionSkewness);

      this.y = paddleTop - this.radius;
      this.angle = angle;
      this.dispatchCollisionEvent(paddle);
      return true;
    }
  }

  isColliding(object: GameObject) {
    const {top, left, right, bottom} = object.boundingBox;

    // Check for collision
    return (
      this.boundingBox.right >= left &&
      this.boundingBox.left <= right &&
      this.boundingBox.bottom >= top &&
      this.boundingBox.top <= bottom
    );
  }

  update(frameFraction = 1) {
    if (frameFraction > 2 || frameFraction < 0.1) {
      console.warn('frameFraction', frameFraction);
    }
    this.setD(frameFraction);
    this.updatePosition();
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
