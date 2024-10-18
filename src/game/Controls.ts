import {Clickable} from './Clickable';
import {GameObject, PartialGameObjectConfig} from './GameObject';
import {Responsive} from './Responsive';

type Config = PartialGameObjectConfig & {
  handleFullscreen: () => void;
  handlePause: () => void;
  handleDebug?: () => void;
};

export class Controls extends GameObject implements Responsive {
  fullscreen: Clickable;
  pause: Clickable;
  debug?: Clickable;
  sizes = {width: 0, height: 0};

  constructor({elementId = 'controls', x = 0, y = 0, handleFullscreen, handlePause, handleDebug, ...rest}: Config) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
    this.fullscreen = new Clickable({
      game: this.game,
      parent: this,
      elementId: 'ctrl-fullscreen',
      x: 0,
      y: 0,
      onClick: handleFullscreen,
    });
    this.fullscreen.element.title = 'Toggle fullscreen [F]';
    this.fullscreen.setContent('🖥️');
    this.pause = new Clickable({
      game: this.game,
      parent: this,
      elementId: 'ctrl-pause',
      x: 20,
      y: 0,
      onClick: handlePause,
    });
    this.pause.element.title = 'Pause [SPACE] [P]';
    this.pause.setContent('⏸️');
    if (handleDebug) {
      this.debug = new Clickable({
        game: this.game,
        parent: this,
        elementId: 'ctrl-debug',
        x: 0,
        y: 0,
        onClick: handleDebug,
      });
      this.debug.element.title = 'Toggle debug mode [D]';
      this.debug.setContent('🐞');
    }
  }

  updateElementPositions() {
    // super.updateElementPosition();
    this.fullscreen.updateElementPosition();
    this.debug?.updateElementPosition();
    this.pause.updateElementPosition();
  }

  updateSizes() {
    this.sizes.width = this.element.offsetWidth;
    this.sizes.height = this.element.offsetHeight;
    this.updateElement();
  }

  destroy(): void {
    this.fullscreen.destroy();
    this.pause.destroy();
    this.debug?.destroy();
    super.destroy();
  }
}
