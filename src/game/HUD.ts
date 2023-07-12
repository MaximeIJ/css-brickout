import {msToString} from '../util';

import {GameObject, GameObjectConfig} from './GameObject';

export class HUD extends GameObject {
  lives: GameObject;
  time: GameObject;
  score: GameObject;

  constructor({
    elementId = 'hud',
    x = 50,
    y = 96,
    width = 100,
    height = 9,
    ...rest
  }: Required<Pick<GameObjectConfig, 'parent'>> & Partial<GameObjectConfig>) {
    super({
      elementId,
      x,
      y,
      width,
      height,
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
    this.lives.element.textContent = `🤍 ${lives}`;
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
}
