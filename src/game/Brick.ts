import GameObject, {GameObjectConfig} from './GameObject';

export default class Brick extends GameObject {
  destroyed = false;

  constructor(config: GameObjectConfig) {
    super({...config, className: [config.className ?? '', 'brick'].filter(Boolean).join(' '), showTitle: true});
  }

  destroy() {
    setTimeout(() => {
      super.destroy();
    }, 300);
    this.element.classList.add('brick--destroyed');
    this.destroyed = true;
  }
}
