import GameObject, {GameObjectConfig} from './GameObject';

export default class Debug extends GameObject {
  constructor({
    elementId = 'debug',
    x = 4,
    y = 97,
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
