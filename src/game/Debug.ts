import GameObject, {GameObjectConfig} from './GameObject';

export default class Debug extends GameObject {
  constructor({
    elementId = 'debug',
    x = 50,
    y = 95,
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
