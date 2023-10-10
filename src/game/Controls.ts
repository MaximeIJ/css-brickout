import {Clickable} from './Clickable';
import {GameObject, PartialGameObjectConfig} from './GameObject';

type Config = PartialGameObjectConfig & {
  handleFullscreen: () => void;
  handlePause: () => void;
  handleDebug?: () => void;
};

export class Controls extends GameObject {
  fullscreen: Clickable;
  pause: Clickable;
  debug?: Clickable;

  constructor({elementId = 'controls', x = 0, y = 0, handleFullscreen, handlePause, handleDebug, ...rest}: Config) {
    super({
      elementId,
      x,
      y,
      ...rest,
    });
    this.fullscreen = new Clickable({
      parent: this.element,
      elementId: 'ctrl-fullscreen',
      x: 0,
      y: 0,
      onClick: handleFullscreen,
    });
    this.fullscreen.element.title = 'Toggle fullscreen [F]';
    this.fullscreen.setContent('🖥️');
    this.pause = new Clickable({
      parent: this.element,
      elementId: 'ctrl-pause',
      x: 20,
      y: 0,
      onClick: handlePause,
    });
    this.pause.element.title = 'Pause [SPACE] [P]';
    this.pause.setContent('⏸️');
    if (handleDebug) {
      this.debug = new Clickable({
        parent: this.element,
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

  destroy(): void {
    this.fullscreen.destroy();
    this.pause.destroy();
    this.debug?.destroy();
    super.destroy();
  }
}
