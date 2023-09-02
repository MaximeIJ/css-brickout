import {clamp} from '../util';

import {GameObject, GameObjectConfig} from './GameObject';

export type PaddleConfig = GameObjectConfig & {
  // Defaults to 0.05
  gripFactor?: number;
  // Default to y
  minY?: number;
  // Default to y
  maxY?: number;
};

export class Paddle extends GameObject {
  // How much ball angle is modified when it hits the paddle further from the center
  gripFactor = 0.05;
  minY: number;
  maxY: number;
  vtBound = true;

  constructor({gripFactor, minY, maxY, ...config}: PaddleConfig) {
    super({...config, className: [...(config.className?.split(' ') ?? []), 'paddle'].join(' '), showTitle: true});
    if (gripFactor !== undefined) {
      this.gripFactor = gripFactor;
    }
    this.minY = minY ?? this.y;
    this.maxY = maxY ?? this.y;
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
    const paddleX = (x / this.parent.offsetWidth) * 100;

    let paddleY;
    if (!this.vtBound) {
      paddleY = clamp((y / this.parent.offsetHeight) * 100, this.maxY, this.minY);
    }

    // Update the paddle position
    this.updatePosition(paddleX, paddleY);
  };

  destroy(): void {
    this.parent.removeEventListener('mousemove', this.handleMouseMove);
    this.parent.removeEventListener('touchmove', this.handleTouchMove);
    super.destroy();
  }
}
