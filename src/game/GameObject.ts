import {formatObjectTitle} from '../util';

export type GameObjectConfig = {
  parent: HTMLDivElement;
  elementId?: string;
  className?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  startingBonuses?: Array<BonusConfig>;
  showTitle?: boolean;
};

export type PartialGameObjectConfig = Required<Pick<GameObjectConfig, 'parent'>> & Partial<GameObjectConfig>;

export type BonusConfig = {
  cssClass: string;
  duration: number;
  effect: (object: GameObject) => (object: GameObject) => void;
};

type StyleKey = 'top' | 'left' | 'transform';

export class GameObject {
  x = 0;
  y = 0;
  width: number;
  height: number;
  bonuses: Array<BonusConfig>;
  element: HTMLDivElement;
  parent: HTMLDivElement;
  boundingBox: {top: number; right: number; bottom: number; left: number} = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  constructor({
    parent,
    elementId,
    className,
    x,
    y,
    width = 0,
    height = 0,
    startingBonuses = [],
    showTitle = false,
  }: GameObjectConfig) {
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.bonuses = startingBonuses;
    this.element = document.createElement('div');
    if (showTitle) {
      this.element.title = formatObjectTitle(this);
    }
    if (elementId) {
      this.element.id = elementId;
    }
    if (className) {
      const classNames = className.split(' ');
      this.element.classList.add(...classNames);
    }
    parent.appendChild(this.element);
    this.updatePosition(x, y);
    this.updateElement();
  }

  updateElementSize(): void {
    const {offsetWidth, offsetHeight} = this.parent;
    if (this.width) {
      this.element.style.width = `${Math.round(offsetWidth * (this.width / 100.0))}px`;
    }
    if (this.height) {
      this.element.style.height = `${offsetHeight * (this.height / 100.0)}px`;
    }
  }

  updateElement(): void {
    this.updateElementSize();
    this.updateElementPosition();
  }

  updateTitle(): void {
    // Update only if it exists
    if (this.element.title) {
      this.element.title = formatObjectTitle(this);
    }
  }

  applyBonuses() {
    this.bonuses.forEach(bonus => {
      this.element.classList.add(bonus.cssClass);
      const undo = bonus.effect(this);
      if (bonus.duration) {
        // todo: use msSinceStart from game to determine this
        setTimeout(() => {
          undo(this);
          this.element.classList.remove(bonus.cssClass);
          this.bonuses.splice(this.bonuses.indexOf(bonus), 1);
        }, bonus.duration);
      }
    });
  }

  updatePosition(x?: number, y?: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    if (this.width && this.height) {
      this.boundingBox = {
        top: this.y - this.height / 2,
        right: this.x + this.width / 2,
        bottom: this.y + this.height / 2,
        left: this.x - this.width / 2,
      };
    }
  }

  updateElementPosition() {
    const {offsetWidth, offsetHeight} = this.parent;
    const absX = (this.x / 100.0) * offsetWidth;
    const absY = (this.y / 100.0) * offsetHeight;
    this.element.style.transform = `translateX(calc(${absX}px - 50%)) translateY(calc(${absY}px - 50%))`;
    this.element.style.setProperty('--xp', this.x.toFixed(2));
    this.element.style.setProperty('--yp', this.y.toFixed(2));
    this.updateTitle(); // todo move to onPause
  }

  setStyle(style: StyleKey, value: string) {
    this.element.style[style] = value;
  }

  setContent(content: string) {
    this.element.innerHTML = content;
  }

  emitParticles(count: number, classNames?: Array<string>, durationMs = 500, inheriteSize = false): Array<HTMLElement> {
    const particles: Array<HTMLElement> = [];
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('particle');
      particle.classList.add('particle');
      if (classNames?.length) {
        particle.classList.add(...classNames);
      }
      if (inheriteSize) {
        particle.style.setProperty('width', this.element.clientWidth + 'px');
        particle.style.setProperty('height', this.element.clientHeight + 'px');
      }
      particle.style.setProperty('transform', this.element.style.transform);
      this.parent.appendChild(particle);
      particles.push(particle);
      setTimeout(() => {
        particle.remove();
      }, durationMs);
    }
    return particles;
  }

  destroy() {
    this.element.remove();
  }
}
