import {createEvent} from '../util';

import {Ball, Composite, MovingGameObjectConfig, MovingGameObject} from './';

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
      this.destroy(!this.permanent);
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
    this.active = false;
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

export type CompositeBrickConfig = BrickConfig & {hitboxParts?: Array<Omit<BrickConfig, 'parent'>>};

export class CompositeBrick extends Brick implements Composite {
  hitboxParts?: Array<Brick>;

  constructor(config: CompositeBrickConfig) {
    super(config);
    this.hitboxParts = config.hitboxParts?.map(
      (part, idx) => new Brick({...part, parent: config.parent, elementId: `${config.elementId}-p${idx}`}),
    );
  }

  // Always axis-aligned, contains all parts of the hitbox
  get compositeBoundingBox() {
    const allPoints = (this.hitboxParts ?? [this]).reduce(
      (acc, part) => {
        const partBox = part.boundingBox;
        return {
          x: [...acc.x, partBox.topL.x, partBox.topR.x, partBox.bottomL.x, partBox.bottomR.x],
          y: [...acc.y, partBox.topL.y, partBox.topR.y, partBox.bottomL.y, partBox.bottomR.y],
        };
      },
      {x: [], y: []} as {x: number[]; y: number[]},
    );
    return {
      topL: {x: Math.min(...allPoints.x), y: Math.min(...allPoints.y)},
      topR: {x: Math.max(...allPoints.x), y: Math.min(...allPoints.y)},
      bottomL: {x: Math.min(...allPoints.x), y: Math.max(...allPoints.y)},
      bottomR: {x: Math.max(...allPoints.x), y: Math.max(...allPoints.y)},
    };
  }

  updateElement(): void {
    super.updateElement();
    this.hitboxParts?.forEach(part => part.updateElement?.());
  }

  updateElementPosition(): void {
    super.updateElementPosition();
    this.hitboxParts?.forEach(part => part.updateElementPosition?.());
  }

  updateElementSize(): void {
    super.updateElementSize();
    this.hitboxParts?.forEach(part => part.updateElementSize?.());
  }

  updateTitle(): void {
    super.updateTitle();
    this.hitboxParts?.forEach(part => part.updateTitle?.());
  }

  takeHit(ball: Ball) {
    this.hitboxParts?.forEach(part => part.takeHit(ball));
    super.takeHit(ball);
  }

  destroy(forReal = true) {
    this.hitboxParts?.forEach(part => part.destroy(forReal));
    super.destroy(forReal);
  }

  restore() {
    this.hitboxParts?.forEach(part => part.restore());
    super.restore();
  }
}

export type BrickDestroyedEvent = CustomEvent<Brick>;
