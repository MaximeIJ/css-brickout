import {pythagoras} from '../util';

import {Ball, BrickConfig, CompositeBrick, CompositeBrickConfig, Game, Responsive} from './';

export type BrickProps = Omit<CompositeBrickConfig, 'game' | 'parent' | 'hitboxParts'> & {
  hitboxParts?: Array<Omit<BrickConfig, 'game' | 'parent'>>;
};

type LayoutDefinitionType = 'even' | 'custom';
type LayoutDefinition = {
  type: LayoutDefinitionType;
};
/**
 * Lays bricks out evenly in a grid starting from x = 0 and y = y
 */
export type EvenLayoutDefinition = LayoutDefinition & {
  type: 'even';
  // Starting y position of the grid
  y: number;
  // Height of each brick
  height: number;
  // Number of rows
  rows: number;
  // Number of columns
  cols: number;
  hp?: number;
};
/**
 * Lays bricks out in a custom grid
 */
export type CustomLayoutDefinition = LayoutDefinition & {
  type: 'custom';
  // Array of bricks definitions with custom x, y, width, and height
  bricks: Array<BrickProps>;
};

export type LayoutDefinitionConfig = EvenLayoutDefinition | CustomLayoutDefinition;

export type LevelConfig = {
  game: Game;
  /**
   * Layout(s) of the bricks, types can be mixed. Will be laid out in order.
   */
  layout: LayoutDefinitionConfig | Array<LayoutDefinitionConfig>;
  /**
   * Number of zones to divide the level into for collision detection
   * @default 10
   */
  divisionFactor?: number;
};

export class Level implements Responsive {
  element: HTMLDivElement;
  game: Game;
  bricks: Array<CompositeBrick>;
  mobileBricks: Array<CompositeBrick>;
  left = 0;
  _divisionFactor: number;
  _hitZones: Array<Array<Array<CompositeBrick>>>;
  fx = 1;
  fy = 1;
  sizes = {width: 0, height: 0};
  particles: Array<HTMLElement> = [];
  totalParticles = 0;

  constructor({divisionFactor, layout, game}: LevelConfig) {
    this.bricks = [];
    this.mobileBricks = [];
    this._hitZones = [];
    this.game = game;
    this._divisionFactor = divisionFactor ?? 10;
    if (document.getElementById('level')) {
      this.element = document.getElementById('level') as HTMLDivElement;
    } else {
      this.element = document.createElement('div');
      this.game.element.appendChild(this.element);
    }
    this.element.classList.add('level');

    if (layout instanceof Array) {
      layout.forEach(l => this.layBricks(l, this.game));
    } else {
      this.layBricks(layout, this.game);
    }
    this.left = this.bricks.length;

    for (let divRow = 0; divRow < this._divisionFactor; divRow++) {
      this._hitZones.push([]);
      for (let divCol = 0; divCol < this._divisionFactor; divCol++) {
        this._hitZones[divRow].push([]);
      }
    }

    // Assign bricks to strips and _hitZones
    this.bricks.forEach(brick => {
      if (brick.speed || brick.hitboxParts?.some(p => p.speed)) {
        this.mobileBricks.push(brick);
      } else {
        const cbb = brick.compositeBoundingBox;
        for (let divRow = 0; divRow < this._divisionFactor; divRow++) {
          for (let divCol = 0; divCol < this._divisionFactor; divCol++) {
            const x = divCol * (100 / this._divisionFactor);
            const y = divRow * (100 / this._divisionFactor);
            if (
              cbb.topL.x < x + 100 / this._divisionFactor &&
              cbb.topR.x > x &&
              cbb.topL.y < y + 100 / this._divisionFactor &&
              cbb.bottomL.y > y
            ) {
              this._hitZones[divRow][divCol].push(brick);
            }
          }
        }
      }
    });

    this.updateSizes();

    this.element.addEventListener('brickdestroyed', this.handleBrickDestroyed);
  }

  handleBrickDestroyed = () => {
    this.left--;
  };

  getNearbyBricks(ball: Ball): Array<CompositeBrick> {
    const res = new Set<CompositeBrick>();
    // find all the zones the ball collides with, using the ball radius
    const minDivRow = Math.max(0, Math.floor((ball.y - ball.radius) / (100 / this._divisionFactor)));
    const maxDivRow = Math.min(
      this._divisionFactor - 1,
      Math.floor((ball.y + ball.radius) / (100 / this._divisionFactor)),
    );
    const minDivCol = Math.max(0, Math.floor((ball.x - ball.radius) / (100 / this._divisionFactor)));
    const maxDivCol = Math.min(
      this._divisionFactor - 1,
      Math.floor((ball.x + ball.radius) / (100 / this._divisionFactor)),
    );
    for (let divRow = minDivRow; divRow <= maxDivRow; divRow++) {
      for (let divCol = minDivCol; divCol <= maxDivCol; divCol++) {
        this._hitZones[divRow][divCol].forEach(brick => res.add(brick));
      }
    }

    // any mobile brick may be nearby
    this.mobileBricks.forEach(brick => res.add(brick));
    return Array.from(res);
  }

  updateElements() {
    this.bricks.forEach(brick => {
      brick.updateElement();
    });
  }

  updateSizes() {
    this.sizes.width = this.element.offsetWidth;
    this.sizes.height = this.element.offsetHeight;
    this.updateSpeedRatios();
    this.updateElements();
  }

  updateSpeedRatios() {
    const hypo = pythagoras(this.sizes.width, this.sizes.height);
    // Account for aspect ratio
    this.fx = this.sizes.width / hypo;
    this.fy = this.sizes.height / hypo;
  }

  layBricks(layout: LayoutDefinitionConfig, game: Game) {
    if (layout instanceof Array) {
      layout.forEach(layout => this.layBricks(layout, game));
    }
    if (layout.type === 'even') {
      const {y, height, rows, cols, hp = 1} = layout;
      for (let i = 0; i < rows; i++) {
        const width = 100.0 / cols;
        for (let j = 0; j < cols; j++) {
          this.bricks.push(
            new CompositeBrick({
              game,
              parent: this,
              width,
              height,
              x: width * (j + 0.5),
              y: y + height * i,
              hp,
              elementId: `brick-${this.bricks.length}`,
            }),
          );
        }
      }
    } else if (layout.type === 'custom') {
      layout.bricks.forEach(brick => {
        this.bricks.push(
          new CompositeBrick({
            ...brick,
            game,
            parent: this,
            elementId: brick.elementId ?? `brick-${this.bricks.length}`,
          } as CompositeBrickConfig),
        );
      });
    }
  }

  recycleParticle(particle: HTMLElement): () => void {
    return () => {
      particle.className = 'particle';
      particle.style.cssText = '';
      particle.style.opacity = '0';
      particle.innerHTML = '';
      this.particles.push(particle);
    };
  }

  // pops a particle from the particle pool, creates one if none exist
  getParticleElement(recycleCondition: 'animationend' | 'transitionend' | number = 'animationend'): HTMLElement {
    let nextParticle = this.particles.pop();
    if (!nextParticle) {
      nextParticle = document.createElement('particle');
      nextParticle.classList.add('particle');
      this.totalParticles++;
      nextParticle.id = `${this.element.id}-particle-${this.totalParticles}`;
    }
    this.element.appendChild(nextParticle);
    const recycler = this.recycleParticle(nextParticle);
    if (typeof recycleCondition === 'number') {
      setTimeout(recycler, recycleCondition);
    } else {
      nextParticle.addEventListener(recycleCondition, recycler, {once: true});
    }

    return nextParticle;
  }

  isDone() {
    return !this.bricks.some(b => !b.permanent && !b.destroyed);
  }

  destroy() {
    this.element.removeEventListener('brickdestroyed', this.handleBrickDestroyed);
    this.bricks.forEach(brick => brick.destroy());
    this.particles.forEach(particle => particle.remove());
  }
}
