import {clamp} from '../util';

import {GameObject, GameObjectConfig} from './GameObject';

export type PaddleConfig = GameObjectConfig & {
  // Defaults to 0.05
  gripFactor?: number;
  // Default to y
  minY?: number;
  // Default to y
  maxY?: number;
  // Defaults to pi / 4
  angleLimit?: number;
};

export class Paddle extends GameObject {
  // How much ball angle is modified when it hits the paddle further from the center
  gripFactor = 0.05;
  minY: number;
  maxY: number;
  cursorX: number;
  cursorY: number;
  angleLimit = 0.5;
  vtBound = true;

  constructor({gripFactor, minY, maxY, ...config}: PaddleConfig) {
    super({...config, className: [...(config.className?.split(' ') ?? []), 'paddle'].join(' '), showTitle: true});
    if (gripFactor !== undefined) {
      this.gripFactor = gripFactor;
    }
    this.minY = minY ?? this.y;
    this.maxY = maxY ?? this.y;
    this.cursorX = this.x;
    this.cursorY = this.y;
    if (this.maxY !== this.minY) {
      this.vtBound = false;
    }
    this.applyBonuses();
    this.updateTitle();
    this.parent.addEventListener('touchmove', this.handleTouchMove, {passive: true});
    this.parent.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove = ({clientX, clientY, currentTarget}: MouseEvent) => {
    if (currentTarget instanceof HTMLElement) {
      // Get a relative mouse position on the container
      const rect = currentTarget.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      this.handleMove(mouseX, mouseY);
    }
  };

  handleTouchMove = (e: TouchEvent) => {
    // Get the first touch event in the touches list
    const touch = e.touches[0];
    this.handleMove(touch.clientX, touch.clientY);
  };

  handleMove = (x: number, y: number) => {
    // Calculate the touch position relative to the window width
    const normX = (x / this.parent.offsetWidth) * 100;
    const normY = (y / this.parent.offsetHeight) * 100;

    const paddleX = normX;
    let paddleY;
    if (!this.vtBound) {
      paddleY = clamp(normY, this.maxY, this.minY);
    }
    this.updatePosition(paddleX, paddleY);

    if (this.angleLimit !== 0) {
      const dx = normX - this.cursorX;
      const dy = normY - this.cursorY;
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
        const angle = -1 * ratio * this.angleLimit;

        this.angle = angle;

        this.cursorX = normX;
        this.cursorY = normY;
      };
      if (Math.abs(dx) > 2 && Math.abs(dy) > 0) {
        setAngle();
      }
    }
  };

  destroy(): void {
    this.parent.removeEventListener('mousemove', this.handleMouseMove);
    this.parent.removeEventListener('touchmove', this.handleTouchMove);
    super.destroy();
  }
}
