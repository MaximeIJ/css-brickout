import {GameObject, GameObjectConfig} from './GameObject';
import {Responsive} from './Responsive';

export class Pause extends GameObject implements Responsive {
  sizes = {width: 0, height: 0};
  constructor({
    elementId = 'pause',
    x = 50,
    y = 50,
    ...rest
  }: Required<Pick<GameObjectConfig, 'game'>> & Partial<GameObjectConfig>) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
  }

  updateSizes() {
    this.sizes.width = this.element.offsetWidth;
    this.sizes.height = this.element.offsetHeight;
    this.updateElement();
  }
}
