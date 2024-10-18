import {msToString} from '../util';

import {GameObject, PartialGameObjectConfig} from './GameObject';
import {Responsive} from './Responsive';

export class HUD extends GameObject implements Responsive {
  lives: GameObject;
  time: GameObject;
  score: GameObject;
  sizes = {width: 0, height: 0};

  constructor({elementId = 'hud', x = 0, y = 0, ...rest}: PartialGameObjectConfig) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
    this.lives = new GameObject({
      game: this.game,
      parent: this,
      elementId: 'lives',
      x: 0,
      y: 0,
    });
    this.time = new GameObject({
      game: this.game,
      parent: this,
      elementId: 'time',
      x: 0,
      y: 0,
    });
    this.score = new GameObject({
      game: this.game,
      parent: this,
      elementId: 'score',
      x: 0,
      y: 0,
    });
  }

  updateLives(lives: number) {
    this.lives.element.textContent = `🤍${lives}`;
  }
  updateScore(score: number) {
    this.score.element.textContent = '💎' + score.toString();
  }
  updateTime(ms: number) {
    this.time.element.textContent = '⏳' + msToString(ms);
  }

  updateElementPositions() {
    super.updateElementPosition();
    this.lives.updateElementPosition();
    this.score.updateElementPosition();
    this.time.updateElementPosition();
  }

  updateSizes() {
    this.sizes.width = this.element.offsetWidth;
    this.sizes.height = this.element.offsetHeight;
    this.updateElement();
  }

  destroy(): void {
    this.lives.destroy();
    this.time.destroy();
    this.score.destroy();
    super.destroy();
  }
}
