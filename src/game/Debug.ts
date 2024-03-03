import {GameObject, GameObjectConfig} from './GameObject';

export class Debug extends GameObject {
  constructor({
    elementId = 'debug',
    x = 50,
    y = 5,
    ...rest
  }: Required<Pick<GameObjectConfig, 'parent'>> & Partial<GameObjectConfig>) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
  }

  updateElementPosition(): void {
    return;
  }

  setContent(content: string): void {
    let fixed = content;
    if (!content.includes('\n')) {
      fixed += '\n&nbsp;';
    }
    super.setContent(fixed);
  }
}
