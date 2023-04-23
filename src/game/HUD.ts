import GameObject, {GameObjectConfig} from './GameObject';

export default class HUD extends GameObject {
  lives: GameObject;
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
      x: 5,
      y: 33,
    });
    this.score = new GameObject({
      parent: this.element,
      elementId: 'score',
      x: 0,
      y: 33,
    });
  }

  updateLives(lives: number) {
    this.lives.element.textContent = `❤ ${lives}`;
  }
  updateScore(score: number) {
    this.score.element.textContent = score.toString();
  }

  updateElementPositions() {
    super.updateElementPosition();
    this.lives.updateElementPosition();
    this.score.updateElementPosition();
  }
}
