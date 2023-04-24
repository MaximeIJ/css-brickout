export type GameObjectConfig = {
  parent: HTMLDivElement;
  elementId?: string;
  className?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  startingBonuses?: Array<BonusConfig>;
};

export type BonusConfig = {
  cssClass: string;
  duration: number;
  effect: (object: GameObject) => (object: GameObject) => void;
};

type StyleKey = 'top' | 'left' | 'transform';

export default class GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  bonuses: Array<BonusConfig>;
  element: HTMLDivElement;
  parent: HTMLDivElement;

  constructor({parent, elementId, className, x, y, width = 0, height = 0, startingBonuses = []}: GameObjectConfig) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.bonuses = startingBonuses;
    this.element = document.createElement('div');
    if (elementId) {
      this.element.id = elementId;
    }
    if (width) {
      this.element.style.width = `${width}%`;
    }
    if (height) {
      this.element.style.height = `${height}%`;
    }
    if (className) {
      this.element.classList.add(...className.split(' '));
    }
    parent.appendChild(this.element);
    this.updateElementPosition();
  }

  applyBonuses() {
    this.bonuses.forEach(bonus => {
      this.element.classList.add(bonus.cssClass);
      const undo = bonus.effect(this);
      if (bonus.duration) {
        // todo: track timeout and pause it when needed?
        setTimeout(() => {
          undo(this);
          this.element.classList.remove(bonus.cssClass);
          this.bonuses.splice(this.bonuses.indexOf(bonus), 1);
        }, bonus.duration);
      }
      // bonus.effect(this);
    });
  }

  updatePosition(x?: number, y?: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
  }

  updateElementPosition() {
    const {offsetWidth, offsetHeight} = this.parent;
    const absX = Math.round((this.x / 100.0) * offsetWidth);
    const absY = Math.round((this.y / 100.0) * offsetHeight);
    this.element.style.transform = `translateX(calc(${absX}px - 50%)) translateY(calc(${absY}px - 50%))`;
  }

  setStyle(style: StyleKey, value: string) {
    this.element.style[style] = value;
  }

  setContent(content: string) {
    this.element.innerHTML = content;
  }

  destroy() {
    this.element.remove();
  }
}
