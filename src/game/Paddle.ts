import {clamp} from '../util';

import {MovingGameObject, MovingGameObjectConfig} from './GameObject';

export type PaddleConfig = MovingGameObjectConfig & {
  // Defaults to 0
  curveFactor?: number;
  // Defaults to 0.05
  gripFactor?: number;
  // Default to y
  minY?: number;
  // Default to y
  maxY?: number;
  // Defaults to 0
  angleLimit?: number;
};

export class Paddle extends MovingGameObject {
  // How much ball angle is modified when it hits the paddle further from the center
  curveFactor = 0;
  gripFactor = 0.05;
  minY: number;
  maxY: number;
  cursorX: number;
  cursorY: number;
  angleLimit = 0;
  vtBound = true;

  constructor({angle, angleLimit, curveFactor, gripFactor, minY, maxY, ...config}: PaddleConfig) {
    super({...config, className: [...(config.className?.split(' ') ?? []), 'paddle'].join(' '), showTitle: true});
    if (curveFactor !== undefined) {
      this.curveFactor = curveFactor;
    }
    if (gripFactor !== undefined) {
      this.gripFactor = gripFactor;
    }
    this.angleLimit = angleLimit ?? 0;
    this.angle = angle ?? 0;
    this.minY = minY ?? this.y;
    this.maxY = maxY ?? this.y;
    this.cursorX = this.x;
    this.cursorY = this.y;
    if (this.maxY !== this.minY) {
      this.vtBound = false;
    }
    this.applyBonuses();
    this.updateTitle();
    this.parent.element.addEventListener('touchmove', this.handleTouchMove, {passive: true});
    this.parent.element.addEventListener('mousemove', this.handleMouseMove);
  }

  set angle(angle: number) {
    const newAngle = clamp(angle, this.angleLimit, -this.angleLimit);
    super.angle = newAngle;
  }

  get angle() {
    return super.angle;
  }

  updateElementSize(): void {
    if (!this.curveFactor) {
      return super.updateElementSize();
    }
    const {width, height} = this.parent.sizes;
    if (this.width) {
      this.element.style.width = `${Math.round(width * (this.width / 100.0))}px`;
    }
    if (this.height) {
      // Adjust visual height to smooth out the curve
      this.element.style.height = `${1.1 * height * (this.height / 100.0)}px`;
      const radiusStr = `100% ${this.curveFactor * 100}%`;
      this.element.style.borderTopLeftRadius = radiusStr;
      this.element.style.borderTopRightRadius = radiusStr;
    }
  }

  handleMouseMove = ({clientX, clientY, currentTarget}: MouseEvent) => {
    if (this.game.state !== 'playing') {
      return;
    }
    if (currentTarget instanceof HTMLElement) {
      // Get a relative mouse position on the container
      const rect = currentTarget.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      this.handleClientMove(mouseX, mouseY);
    }
  };

  handleTouchMove = (e: TouchEvent) => {
    if (this.game.state !== 'playing') {
      return;
    }
    // Get the first touch event in the touches list
    const touch = e.touches[0];
    this.handleClientMove(touch.clientX, touch.clientY);
  };

  handleClientMove = (x: number, y: number) => {
    // Calculate the touch position relative to the window width
    const normX = (x / this.parent.sizes.width) * 100;
    const normY = (y / this.parent.sizes.height) * 100;
    this.handleMove(normX, normY);
  };

  handleMove = (x: number, y: number) => {
    const targetPaddleX = x;
    let targetPaddleY = this.y;
    if (!this.vtBound) {
      targetPaddleY = clamp(y, this.maxY, this.minY);
    }
    if (!this.speed) {
      this.updatePosition(targetPaddleX, targetPaddleY);
    } else {
      // set path
      const movement = {speed: this.speed, angle: -Math.atan2(targetPaddleY - this.y, targetPaddleX - this.x)};
      let verifyX = (mgo: MovingGameObject) => mgo.x >= targetPaddleX;
      if (this.x > targetPaddleX) {
        verifyX = (mgo: MovingGameObject) => mgo.x <= targetPaddleX;
      }
      let verifyY = (mgo: MovingGameObject) => mgo.y >= targetPaddleY;
      if (this.y > targetPaddleY) {
        verifyY = (mgo: MovingGameObject) => mgo.y <= targetPaddleY;
      }
      this.movement = [
        {
          condition: mgo => {
            if (verifyX(mgo) && verifyY(mgo)) {
              this.active = false;
              this.x = targetPaddleX;
              this.y = targetPaddleY;
            }
            return !this.active;
          },
          movement: {...movement},
        },
      ];
      this.active = true;
    }

    if (this.angleLimit !== 0) {
      const dx = x - this.cursorX;
      const dy = y - this.cursorY;
      const setAngle = () => {
        let dAngle = Math.atan2(dy, dx);
        if (dx < 0) {
          if (dAngle > 0) {
            dAngle -= Math.PI;
          } else {
            dAngle += Math.PI;
          }
        }
        dAngle *= -1;
        // Ensure angle is within the range [-PI/2, PI/2)
        dAngle = ((dAngle + Math.PI / 2) % Math.PI) - Math.PI / 2;
        // Calculate the ratio of the current angle to the maximum allowable angle
        const ratio = dAngle / (Math.PI / 2);

        // Project the angle proportionally within the specified limit
        const angle = 1 * ratio * this.angleLimit;
        const currentAngle = this.angle ?? 0;

        this.angle = currentAngle - angle / 10;

        this.cursorX = x;
        this.cursorY = y;
      };
      if (Math.abs(dx) > 2 && Math.abs(dy) > 0) {
        setAngle();
      }
    }
  };

  destroy(): void {
    this.parent.element.removeEventListener('mousemove', this.handleMouseMove);
    this.parent.element.removeEventListener('touchmove', this.handleTouchMove);
    super.destroy();
  }
}
