import {BoundingBox, Vector, formatObjectTitle, pythagoras, rotatePoint} from '../util';

export type GameObjectConfig = Vector & {
  parent: HTMLDivElement;
  elementId?: string;
  className?: string;
  width?: number;
  height?: number;
  angle?: number;
  startingBonuses?: Array<BonusConfig>;
  showTitle?: boolean;
  permanent?: boolean;
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
  private _angle: number;
  bonuses: Array<BonusConfig>;
  element: HTMLDivElement;
  parent: HTMLDivElement;
  boundingBox: BoundingBox = {
    topL: {x: 0, y: 0},
    topR: {x: 0, y: 0},
    bottomL: {x: 0, y: 0},
    bottomR: {x: 0, y: 0},
  };
  permanent = false;
  particles: Array<HTMLElement> = [];
  totalParticles = 0;

  constructor({
    parent,
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
  }: GameObjectConfig) {
    this.width = width;
    this.height = height;
    this._angle = angle;
    this.parent = parent;
    this.bonuses = startingBonuses;
    this.element = document.createElement('div');
    this.permanent = permanent;
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
    const {offsetWidth, offsetHeight} = this.parent;
    const absX = (this.x / 100.0) * offsetWidth;
    const absY = (this.y / 100.0) * offsetHeight;
    this.setStyle(
      'transform',
      `translateX(calc(${absX}px - 50%)) translateY(calc(${absY}px - 50%)) rotate(var(--angle, 0rad))`,
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

  // pops a particle from the particle pool, creates one if none exist
  getParticleElement(recycleCondition: 'animationend' | 'transitionend' | number = 'animationend'): HTMLElement {
    const nextParticle = this.particles.pop();
    if (nextParticle) {
      nextParticle.style.setProperty('transform', this.element.style.transform);
      return nextParticle;
    } else {
      const particle = document.createElement('particle');
      particle.classList.add('particle');
      this.parent.appendChild(particle);
      if (typeof recycleCondition === 'number') {
        setTimeout(() => {
          particle.className = 'particle';
          this.particles.push(particle);
        }, recycleCondition);
      } else {
        particle.addEventListener(recycleCondition, () => {
          particle.className = 'particle';
          this.particles.push(particle);
        });
      }
      this.totalParticles++;
      particle.id = `${this.element.id}-particle-${this.totalParticles}`;
      return particle;
    }
  }

  emitParticles(
    count: number,
    classNames?: Array<string>,
    recycleCondition: 'animationend' | 'transitionend' | number = 'animationend',
    inheriteSize = false,
  ): Array<HTMLElement> {
    const particles: Array<HTMLElement> = [];
    for (let i = 0; i < count; i++) {
      const particle = this.getParticleElement(recycleCondition);
      if (classNames?.length) {
        particle.classList.add(...classNames);
      }
      if (inheriteSize) {
        particle.style.setProperty('width', this.element.clientWidth + 'px');
        particle.style.setProperty('height', this.element.clientHeight + 'px');
      }
      particle.style.setProperty('transform', this.element.style.transform);
      particles.push(particle);
    }
    return particles;
  }

  _emitParticles(
    count: number,
    classNames?: Array<string>,
    durationMs = 500,
    inheriteSize = false,
  ): Array<HTMLElement> {
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
    this.particles.forEach(particle => particle.remove());
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
  protected turnSteps: Array<TurnStep> = [];
  protected dx = 0;
  protected dy = 0;
  protected fx = 0;
  protected fy = 0;
  protected pHeight = 100;
  protected pWidth = 100;
  active = true;
  syncAngles = false;

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

  updateSpeedRatios() {
    const hypo = pythagoras(this.pWidth, this.pHeight);
    // Account for aspect ratio
    this.fx = this.pWidth / hypo;
    this.fy = this.pHeight / hypo;
  }

  updateElementSize(): void {
    this.pHeight = this.parent.offsetHeight || 100;
    this.pWidth = this.parent.offsetWidth || 100;
    this.updateSpeedRatios();
    super.updateElementSize();
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
      this.updateElementPosition();
    }
  }
}
