import {createEvent} from '../util';

import {Ball, GameObject, GameObjectConfig} from './';

export type BrickConfig = GameObjectConfig & {
  hp?: number;
  breakthrough?: boolean;
};

export class Brick extends GameObject {
  breakthrough;
  destroyed = false;
  hp: number;

  constructor({hp = 1, breakthrough = false, ...config}: BrickConfig) {
    super({...config, className: [config.className ?? '', 'brick'].filter(Boolean).join(' '), showTitle: true});
    this.hp = hp;
    this.breakthrough = breakthrough;
  }

  takeHit(ball: Ball) {
    this.hp -= ball.damage;
    if (this.hp <= 0) {
      this.destroy();
    }
  }

  updateTitle(): void {
    super.updateTitle();
    // Update only if it exists
    if (this.element.title) {
      this.element.title = this.element.title + ' ' + this.hp + ' HP' + (this.breakthrough ? ' (breakthrough)' : '');
    }
  }

  destroy() {
    setTimeout(() => {
      super.destroy();
    }, 300);
    this.element.classList.add('brick--destroyed');
    this.destroyed = true;
    const event: BrickDestroyedEvent = createEvent<Brick>('brickdestroyed', this);
    this.parent.dispatchEvent(event);
  }
}

export type BrickDestroyedEvent = CustomEvent<Brick>;
