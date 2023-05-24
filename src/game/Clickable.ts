import {GameObject, GameObjectConfig} from './GameObject';

type Config = Required<Pick<GameObjectConfig, 'parent'>> &
  Partial<GameObjectConfig> & {
    onClick: () => void;
  };

export class Clickable extends GameObject {
  onClick: () => void;

  constructor({x = 50, y = 50, onClick, ...rest}: Config) {
    super({
      ...rest,
      x,
      y,
      className: [...[rest.className ?? ''], 'clickable'].join(' '),
    });
    this.onClick = onClick;
    this.element.addEventListener('click', () => this.onClick());
  }

  destroy(): void {
    this.parent.removeEventListener('click', () => this.onClick());
    super.destroy();
  }
}
