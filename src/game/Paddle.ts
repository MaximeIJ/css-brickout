import GameObject, {GameObjectConfig} from './GameObject';

export default class Paddle extends GameObject {
  // How much ball angle is modified when it hits the paddle further from the center
  gripFactor = 0;

  constructor(config: GameObjectConfig) {
    super({...config, className: [...(config.className ?? []), 'paddle'].join(' ')});
    this.element.title = this.element.id;
    this.applyBonuses();
    this.parent.addEventListener('mousemove', e => this.handleMouseMove(e));
    this.parent.addEventListener('touchmove', e => this.handleTouchMove(e), {passive: true});
  }

  handleMouseMove(e: MouseEvent) {
    const mouseX = e.clientX - this.parent.offsetLeft;
    const paddleX = (mouseX / this.parent.offsetWidth) * 100;
    this.updatePosition(paddleX);
  }

  handleTouchMove(e: TouchEvent) {
    // Get the first touch event in the touches list
    const touch = e.touches[0];

    // Calculate the touch position relative to the window width
    const touchX = touch.clientX;
    const paddleX = (touchX / window.innerWidth) * 100;

    // Update the paddle position
    this.updatePosition(paddleX);
  }

  destroy(): void {
    this.parent.removeEventListener('mouseover', e => this.handleMouseMove(e));
    this.parent.removeEventListener('touchmove', e => this.handleTouchMove(e));
    super.destroy();
  }
}
