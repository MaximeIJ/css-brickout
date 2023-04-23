import Paddle from './Paddle';
import GameObject, {GameObjectConfig} from './GameObject';
import Level from './Level';

export type BallConfig = Omit<GameObjectConfig, 'elementId'> & {
  idx: number;
  radius: number;
  angle: number;
  speed: number;
};

export default class Ball extends GameObject {
  destroyed = false;
  radius: number;
  speed: number;
  angle: number;

  constructor({idx, radius, angle, speed, ...objConfig}: BallConfig) {
    super({...objConfig, className: [...(objConfig.className ?? []), 'ball'].join(' '), elementId: `ball-${idx}`});
    this.radius = radius;
    this.angle = angle;
    this.speed = speed;
    this.updateElementSize();
  }

  updateElement(): void {
    this.updateElementSize();
    this.updateElementPosition();
  }

  updateElementSize(): void {
    const pxRadius = Math.round((this.radius / 100.0) * this.parent.offsetHeight);
    this.element.style.setProperty('--diameter', pxRadius * 2 + 'px');
  }

  updatePosition() {
    super.updatePosition(this.x + this.speed * Math.cos(this.angle), this.y - this.speed * Math.sin(this.angle));
  }

  handleLevelCollision(level: Level, paddle: Paddle) {
    const hitBoundary = this.handleBoundaryCollision(level);
    if (hitBoundary) {
      // If no balls, lose a life (todo: destroy ball on boundary collision bottom)
      // If no lives, game over
    }

    let hitBrick = false;
    let i = 0;

    while (i < level.bricks.length && !hitBrick) {
      const brick = level.bricks[i];
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
          this.updatePosition();
          if (this.isColliding(brick)) {
            console.warn('side hit was wrong, switching to vertical', this.angle);
            this.angle = Math.atan2(-this.speed * Math.sin(prevAngle), this.speed * Math.cos(prevAngle));
          }
          this.x = prevX;
          this.y = prevY;
        } else {
          // Vertical collision
          this.angle = Math.atan2(-this.speed * Math.sin(this.angle), this.speed * Math.cos(this.angle));

          this.updatePosition();
          if (this.isColliding(brick)) {
            console.warn('vertical hit was wrong, switching to side', this.angle);
            this.angle = Math.atan2(this.speed * Math.sin(prevAngle), -this.speed * Math.cos(prevAngle));
          }
          this.x = prevX;
          this.y = prevY;
        }

        brick.destroy();
        level.onBrickDestroyed(brick);
      }
    }

    const anyCollision = hitBrick || hitBoundary || this.handlePaddleCollision(paddle) || false;
    if (anyCollision) {
      // console.count('collision on ball ' + this.idx);
      // Bounce hard!
      // this.updatePosition();
    }

    this.updatePosition();
    this.updateElementPosition();
  }

  handleBoundaryCollision(level: Level) {
    if (this.x - this.radius <= 0 || this.x + this.radius >= 100) {
      this.angle = Math.PI - this.angle;
      return true;
    }

    if (this.y - this.radius <= 0) {
      this.angle = -this.angle;
      return true;
    }

    if (this.y + this.radius >= 100) {
      this.speed /= 1.5;
      this.destroy();
      level.onBallLost();
      return true;
    }
  }

  handlePaddleCollision(paddle: Paddle) {
    const paddleTop = paddle.y - paddle.height / 2;

    if (this.isColliding(paddle)) {
      // Calculate the hit position on the paddle
      const hitPosition = this.x - paddle.x;
      const hitPositionNormalized = hitPosition / (paddle.width / 2);

      // Calculate the incoming angle of the ball
      const incomingAngle = this.angle;

      // Calculate the new angle with skewness towards more vertical angles
      const angleMultiplier = 0.4; // Adjust this value to control the skewness
      const hitPositionSkewness = hitPositionNormalized * angleMultiplier;
      const angle = -(incomingAngle + hitPositionSkewness);

      // console.log('Paddle collision new angle', this.angle, angle);
      this.y = paddleTop - this.radius;
      this.angle = angle;
      return true;
    }
  }

  isColliding(object: GameObject) {
    const top = object.y - object.height / 2;
    const bottom = object.y + object.height / 2;
    const left = object.x - object.width / 2;
    const right = object.x + object.width / 2;

    // Check for collision
    return (
      this.x + this.radius > left && // left
      this.x - this.radius < right && // right
      this.y + this.radius > top && // top
      this.y - this.radius < bottom // bottom
    );
  }

  destroy() {
    setTimeout(() => {
      super.destroy();
    }, 350);
    this.element.classList.add('ball--destroyed');
    this.destroyed = true;
  }
}
