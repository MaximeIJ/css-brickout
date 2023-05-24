import {GameObject, GameObjectConfig} from './GameObject';

export class Pause extends GameObject {
  constructor({
    elementId = 'pause',
    x = 50,
    y = 50,
    ...rest
  }: Required<Pick<GameObjectConfig, 'parent'>> & Partial<GameObjectConfig>) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
  }
}
