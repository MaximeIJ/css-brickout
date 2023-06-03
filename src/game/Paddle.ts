import {GameObject, GameObjectConfig} from './GameObject';

export class Paddle extends GameObject {
  // How much ball angle is modified when it hits the paddle further from the center
  gripFactor = 0.05;

  constructor(config: GameObjectConfig) {
    super({...config, className: [...(config.className ?? []), 'paddle'].join(' '), showTitle: true});
    this.applyBonuses();
    this.parent.addEventListener('mousemove', this.handleMouseMove);
    this.parent.addEventListener('touchmove', this.handleTouchMove, {passive: true});
  }

  handleMouseMove = ({clientX, currentTarget}: MouseEvent) => {
    if (currentTarget instanceof HTMLElement) {
      const rect = currentTarget.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const paddleX = (mouseX / this.parent.offsetWidth) * 100;
      this.updatePosition(paddleX);
    }
  };

  handleTouchMove = (e: TouchEvent) => {
    // Get the first touch event in the touches list
    const touch = e.touches[0];

    // Calculate the touch position relative to the window width
    const touchX = touch.clientX;
    const paddleX = (touchX / window.innerWidth) * 100;

    // Update the paddle position
    this.updatePosition(paddleX);
  };

  destroy(): void {
    this.parent.removeEventListener('mouseover', this.handleMouseMove);
    this.parent.removeEventListener('touchmove', this.handleTouchMove);
    super.destroy();
  }
}
