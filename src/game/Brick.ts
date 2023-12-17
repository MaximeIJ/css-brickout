import {createEvent} from '../util';

import {Ball, MovingGameObjectConfig, MovingGameObject} from './';

export type BrickConfig = MovingGameObjectConfig & {
  hp?: number;
  breakthrough?: boolean;
  ignoreMobile?: boolean;
};

export class Brick extends MovingGameObject {
  breakthrough: boolean;
  ignoreMobile: boolean;
  destroyed = false;
  hp: number;
  maxHp: number;

  constructor({hp = 1, breakthrough = false, ignoreMobile = false, ...config}: BrickConfig) {
    super({...config, className: [config.className ?? '', 'brick'].filter(Boolean).join(' '), showTitle: true});
    this.hp = hp;
    this.maxHp = hp;
    this.breakthrough = breakthrough;
    this.ignoreMobile = ignoreMobile;
    this.applyBonuses();
    this.updateTitle();
  }

  takeHit(ball: Ball) {
    this.hp -= ball.damage;
    if (this.hp <= 0) {
      this.destroy(false);
    }
  }

  updateTitle(): void {
    super.updateTitle();
    // Update only if it exists
    if (this.element.title) {
      this.element.title =
        this.element.title + ' ' + this.hp + '/' + this.maxHp + ' HP' + (this.breakthrough ? ' (breakthrough)' : '');
    }
  }

  destroy(forReal = true) {
    this.element.classList.add('brick--destroyed');
    this.destroyed = true;
    const event: BrickDestroyedEvent = createEvent<Brick>('brickdestroyed', this);
    this.parent.dispatchEvent(event);
    if (forReal) {
      super.destroy();
    }
  }

  restore() {
    this.element.classList.remove('brick--destroyed');
    this.destroyed = false;
    this.hp = this.maxHp;
  }
}

export type BrickDestroyedEvent = CustomEvent<Brick>;
