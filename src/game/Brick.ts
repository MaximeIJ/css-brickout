import {createEvent} from '../util';

import {Ball, GameObject, GameObjectConfig} from './';

export type BrickConfig = GameObjectConfig & {
  hp?: number;
};

export class Brick extends GameObject {
  destroyed = false;
  hp: number;

  constructor({hp = 1, ...config}: BrickConfig) {
    super({...config, className: [config.className ?? '', 'brick'].filter(Boolean).join(' '), showTitle: true});
    this.hp = hp;
  }

  takeHit(ball: Ball) {
    this.hp -= ball.damage;
    if (this.hp <= 0) {
      this.destroy();
    }
  }

  destroy() {
    setTimeout(() => {
      super.destroy();
    }, 300);
    this.element.classList.add('brick--destroyed');
    this.destroyed = true;
    const event = createEvent<Brick>('brickdestroyed', this);
    this.parent.dispatchEvent(event);
  }
}
