import {msToString} from '../util';

import {GameObject, PartialGameObjectConfig} from './GameObject';

export class HUD extends GameObject {
  lives: GameObject;
  time: GameObject;
  score: GameObject;

  constructor({elementId = 'hud', x = 0, y = 0, ...rest}: PartialGameObjectConfig) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
    this.lives = new GameObject({
      parent: this.element,
      elementId: 'lives',
      x: 0,
      y: 0,
    });
    this.time = new GameObject({
      parent: this.element,
      elementId: 'time',
      x: 0,
      y: 0,
    });
    this.score = new GameObject({
      parent: this.element,
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
  }

  destroy(): void {
    this.lives.destroy();
    this.time.destroy();
    this.score.destroy();
    super.destroy();
  }
}
