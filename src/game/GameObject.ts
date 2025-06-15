import {BoundingBox, Vector, formatObjectTitle, rotatePoint} from '../util';

import {Game} from './Game';
import {Responsive} from './Responsive';

export type GameObjectConfig = Vector & {
  game: Game;
  parent?: Responsive;
  elementId?: string;
  className?: string;
  width?: number;
  height?: number;
  angle?: number;
  startingBonuses?: Array<BonusConfig>;
  showTitle?: boolean;
  permanent?: boolean;
  shape?: 'circle' | 'rectangle';
};

export type PartialGameObjectConfig = Required<Pick<GameObjectConfig, 'game'>> & Partial<GameObjectConfig>;

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
  area: number;
  private _angle: number;
  bonuses: Array<BonusConfig>;
  element: HTMLDivElement;
  game: Game;
  parent: Responsive;
  boundingBox: BoundingBox = {
    topL: {x: 0, y: 0},
    topR: {x: 0, y: 0},
    bottomL: {x: 0, y: 0},
    bottomR: {x: 0, y: 0},
  };
  permanent = false;
  shape = 'rectangle';
  // for circle shapes
  radius = 0;
  rx = 0;

  constructor({
    game,
    parent = game,
    elementId,
    className,
    x,
    y,
    width = 0,
    height = 0,
    angle = 0,
    startingBonuses = [],
    showTitle = false,
    permanent = false,
    shape = 'rectangle',
    ...rest // rest is used to allow for any other properties to be added to the object
  }: GameObjectConfig) {
    this.width = width;
    this.height = height;
    if (shape === 'circle') {
      this.shape = 'circle';
      this.radius = height / 2;
    }
    this.area = width * height;
    this._angle = angle;
    this.game = game;
    this.parent = parent;
    this.bonuses = startingBonuses;
    this.element = document.createElement('div');
    this.permanent = permanent;
    // if anything remains in rest, add it as properties to this object
    if (Object.keys(rest).length) {
      Object.assign(this, rest);
    }
    if (showTitle) {
      this.element.title = formatObjectTitle(this);
    }
    if (elementId) {
      this.element.id = elementId;
    }
    if (className) {
      const classNames = className.trim().split(' ').filter(Boolean);
      if (classNames.length) {
        this.element.classList.add(...classNames);
      }
    }
    this.parent.element.appendChild(this.element);
    this.updatePosition(x, y);
    this.angle = angle;
    this.updateElement();
  }

  get angle(): number {
    return this._angle;
  }

  set angle(angle: number) {
    this._angle = angle;
    this.updateBoundingBox();
    this.element.style.setProperty('--angle', `${angle}rad`);
  }

  updateCircleShape(): void {
    this.rx = this.radius;
    if (!Number.isNaN(this.parent?.sizes.width) && this.parent?.sizes.width > 0) {
      const pxRadius = Math.round((this.radius / 100.0) * this.parent.sizes.height);
      this.element.style.setProperty('--diameter', pxRadius * 2 + 'px');
      this.rx = (this.radius * this.parent.sizes.height) / this.parent.sizes.width;
    }
    this.width = this.rx * 2;
    this.height = this.radius * 2;
    this.updateBoundingBox();
  }

  updateElementSize(): void {
    const {width, height} = this.parent?.sizes ?? {width: 1, height: 1};
    if (this.shape === 'circle') {
      this.updateCircleShape();
    }
    if (this.width) {
      this.element.style.width = `${Math.round(width * (this.width / 100.0))}px`;
    }
    if (this.height) {
      this.element.style.height = `${height * (this.height / 100.0)}px`;
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
      this.updateBoundingBox();
    }
  }

  updateBoundingBox() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    const args: [number, number, number] = [this.x, this.y, this.angle];

    this.boundingBox = {
      bottomR: rotatePoint(this.x + halfWidth, this.y + halfHeight, ...args),
      bottomL: rotatePoint(this.x - halfWidth, this.y + halfHeight, ...args),
      topL: rotatePoint(this.x - halfWidth, this.y - halfHeight, ...args),
      topR: rotatePoint(this.x + halfWidth, this.y - halfHeight, ...args),
    };
  }

  updateElementPosition() {
    const {width, height} = this.parent.sizes;
    const absX = (this.x / 100.0) * width;
    const absY = (this.y / 100.0) * height;
    this.setStyle(
      'transform',
      `translateX(calc(${absX}px - 50%)) translateY(calc(${absY}px - 50%)) rotateZ(var(--angle, 0rad))`,
    );
    this.element.style.setProperty('--xp', this.x.toFixed(2));
    this.element.style.setProperty('--yp', this.y.toFixed(2));
  }

  setStyle(style: StyleKey, value: string) {
    this.element.style[style] = value;
  }

  setContent(content: string) {
    this.element.innerHTML = content;
  }

  emitParticles(
    count: number,
    classNames?: Array<string>,
    recycleCondition: 'animationend' | 'transitionend' | number = 'animationend',
    inheriteSize = false,
  ): Array<HTMLElement> {
    const particles: Array<HTMLElement> = [];
    for (let i = 0; i < count; i++) {
      const particle = this.game.level.getParticleElement(recycleCondition);
      if (classNames?.length) {
        particle.classList.add(...classNames);
      }
      if (inheriteSize) {
        particle.style.setProperty('width', this.element.clientWidth + 'px');
        particle.style.setProperty('height', this.element.clientHeight + 'px');
      }
      particle.style.setProperty('opacity', '1');
      particle.style.setProperty('transform', this.element.style.transform);
      particles.push(particle);
    }
    return particles;
  }

  destroy() {
    this.element.remove();
  }

  toString(): string {
    return `${this.constructor.name}: ${this.element.id} (${this.x?.toFixed(2) ?? '?'}, ${this.y?.toFixed(2) ?? '?'})`;
  }
}
export type MovementProps = {
  // Angle in radians
  angle: number;
  // % of the game's height per frame (see GameConfig.fps)
  speed: number;
};

export type TurnStep = {
  movement: MovementProps;
  // Checked after each frame, if true, move to next step
  condition?: (mgo: MovingGameObject) => boolean;
};

export type MovingGameObjectConfig = GameObjectConfig & {
  // Either a set direction and speed, or a series of steps to loop through
  movement?: MovementProps | Array<TurnStep>;
  // Whether to sync the angle with the movement angle
  syncAngles?: boolean;
};

export class MovingGameObject extends GameObject {
  private _speed = 0;
  private _movementAngle = 0;
  turnSteps: Array<TurnStep> = [];
  dx = 0;
  dy = 0;
  active = true;
  syncAngles = false;

  get fx(): number {
    return this.game?.level?.fx ?? 1;
  }

  get fy(): number {
    return this.game?.level?.fy ?? 1;
  }

  get speed(): number {
    return this._speed;
  }

  set speed(speed: number) {
    this._speed = speed;
    this.setD();
  }

  get movementAngle(): number {
    return this._movementAngle;
  }

  set movementAngle(angle: number) {
    this._movementAngle = angle;
    if (this.syncAngles) {
      this.angle = -angle;
    }
    this.setD();
  }

  get movement(): MovementProps {
    return {angle: this.movementAngle, speed: this.speed};
  }

  set movement(movementConfig: MovingGameObjectConfig['movement']) {
    if (Array.isArray(movementConfig)) {
      this.turnSteps = movementConfig;
      const firstStep = movementConfig[0];
      if (firstStep) {
        this.movement = firstStep.movement;
      }
    } else {
      this.movementAngle = movementConfig?.angle ?? 0;
      this.speed = movementConfig?.speed ?? 0;
      this.setD();
    }
  }

  constructor({movement = {speed: 0, angle: 0}, syncAngles, ...rest}: MovingGameObjectConfig) {
    if (Array.isArray(movement) || (movement as unknown as MovementProps)?.speed > 0) {
      super({...rest, className: `moving-object ${rest.className ?? ''}`});
      this.syncAngles = syncAngles ?? false;
      // Reupdate element to calculate necessary ratios for movement props
      this.updateElement();
      if (Array.isArray(movement)) {
        this.movement = [...movement];
      } else {
        this.movement = {...movement};
      }
    } else {
      super(rest);
      this.syncAngles = syncAngles ?? false;
    }
  }

  updatePosition(x?: number, y?: number, fraction = 1) {
    super.updatePosition(
      (x ?? this.x ?? 0) + (this.dx ?? 0) * fraction,
      (y ?? this.y ?? 0) + (this.dy ?? 0) * fraction,
    );
    // Check current turn steps

    if (this.turnSteps?.length) {
      const currentStep = this.turnSteps[0];
      if (currentStep?.condition?.(this)) {
        // Move the step to the end of the array, set the next step's movement as the object movement
        this.turnSteps.shift();
        this.turnSteps.push(currentStep);
        const nextStep = this.turnSteps[0];
        if (nextStep) {
          this.movement = nextStep.movement;
        }
      }
    }
  }

  setD() {
    // Swap the axis ratios to compensate for the aspect ratio. Without this, the ball would move faster on the Y axis when the game is wider than it is tall.
    this.dx = this.fy * this.speed * Math.cos(this.movementAngle);
    this.dy = this.fx * -this.speed * Math.sin(this.movementAngle);
  }

  processFrame(frameFraction = 1) {
    if (this.active) {
      this.updatePosition(undefined, undefined, frameFraction);
    }
  }

  toString(): string {
    if (!this.movement.speed) {
      return super.toString();
    }
    return `${super.toString()}
${(this.movement.speed * 10).toFixed(2)} knots`;
  }
}
