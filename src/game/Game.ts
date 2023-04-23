import Ball, {BallConfig} from './Ball';
import Brick from './Brick';
import Clickable from './Clickable';
import Debug from './Debug';
import {GameObjectConfig} from './GameObject';
import Level, {LevelConfig} from './Level';
import Paddle from './Paddle';
import Pause from './Pause';

type GameParams = {
  ballConfigs: Array<Omit<BallConfig, 'idx' | 'parent'>>;
  levelConfig: Omit<LevelConfig, 'parent'>;
  paddleConfig: Partial<GameObjectConfig>;
  parentId?: string;
};

type State = 'paused' | 'playing' | 'debug' | 'won' | 'lost' | 'away' | 'starting';
const PAUSABLE: Array<State> = ['playing', 'debug'];
const RESUMABLE: Array<State> = ['paused', 'away'];

// GameLoop class
export default class Game {
  element: HTMLDivElement;
  state: State = 'starting';
  lastFrameTime: number = Date.now();
  lastFpsUpdate: number = Date.now();
  balls: Ball[] = [];
  level: Level;
  paddle: Paddle;
  debug: Debug | null;
  paused: Pause | null;
  resumeLink: Clickable | null;
  debounceTimer: NodeJS.Timeout | undefined = undefined;

  constructor(params: GameParams) {
    this.element = document.getElementById(params.parentId ?? 'game') as HTMLDivElement;

    this.paddle = new Paddle({
      ...params.paddleConfig,
      parent: this.element,
      elementId: 'paddle',
      x: 50,
      y: 89,
    });
    this.debug = null;
    this.paused = null;
    this.resumeLink = null;
    this.level = new Level({
      ...params.levelConfig,
      parent: this.element,
      onBallLost: () => this.onBallLost(),
      onBrickDestroyed: (brick: Brick) => this.onBrickDestroyed(brick),
    });

    // Create Ball objects based on ballConfig
    params.ballConfigs.forEach((ballConfig, idx) => {
      const ball = new Ball({...ballConfig, idx, parent: this.element});
      this.balls.push(ball);
    });

    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    document.addEventListener('keydown', e => this.handleKeyPress(e));
    this.element.addEventListener('mouseenter', () => this.handleMouseEnter());
    this.element.addEventListener('mouseleave', () => this.handleMouseLeave());
    new ResizeObserver(() => this.handleResize()).observe(this.element);
  }

  debounce(func: () => void, timeout = 500) {
    return () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        func.apply(this);
      }, timeout);
    };
  }

  start() {
    this.createdPausedElement('Start');
  }

  update() {
    if (PAUSABLE.includes(this.state)) {
      if (this.debug) {
        this.updateDebug();
      }

      this.paddle.updateElementPosition();

      for (const ball of this.balls) {
        ball.handleLevelCollision(this.level, this.paddle);
        // autoplay lol
        if (this.debug && ball.y > this.paddle.y - this.paddle.height && ball.y < this.paddle.y) {
          console.log(ball.element.id + ' is near paddle');
          const semiR = Math.round(ball.x - this.paddle.width / 2 + (Math.random() * this.paddle.width) / 2);
          this.paddle.updatePosition(semiR);
        }
      }

      requestAnimationFrame(() => this.update());
    }
  }

  onBallLost() {
    this.balls = this.balls.filter(ball => !ball.destroyed);
    if (this.balls.length === 0) {
      this.state = 'lost';
      this.createdPausedElement('Game Over', 'final');
    }
  }

  onBrickDestroyed(brick: Brick) {
    // console.log(brick, 'destroyed, level done:', this.level.isDone());
    if (this.level.isDone()) {
      this.state = 'won';
      this.createdPausedElement('Victory!', 'final');
    }
  }

  updateDebug() {
    const now = Date.now();
    const fps = 1000 / (now - this.lastFrameTime);
    this.lastFrameTime = now;
    if (now > this.lastFpsUpdate + 1000) {
      this.debug?.setContent(`FPS: ${fps.toFixed(0)} | ${this.state}`);
      this.lastFpsUpdate = now;
    }
  }

  handleResize() {
    this.paddle.updateElementPosition();
    this.balls.forEach(ball => ball.updateElementPosition());
    this.level.updateElementPositions();
    this.paused?.updateElementPosition();
    this.resumeLink?.updateElementPosition();
    this.debug?.updateElementPosition();
    console.log('resize');
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pause('away');
    } else {
      this.resume('away');
    }
  }

  handleKeyPress(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyP':
      case 'Space':
        if (this.state === 'starting') {
          this.resume('starting');
        } else if (this.paused) {
          this.resume();
        } else {
          this.pause();
        }
        break;
      case 'KeyD':
        if (this.debug) {
          this.debug.destroy();
          this.debug = null;
          if (this.state === 'debug') {
            this.state = 'playing';
          }
        } else {
          this.debug = new Debug({
            parent: this.element,
          });
          this.state = 'debug';
        }
        break;
      default:
        break;
    }
  }

  handleMouseEnter() {
    if (this.debounceTimer) {
      this.debounce(() => this.resume('away'), 1000)();
    }
  }

  handleMouseLeave() {
    this.debounce(() => {
      this.pause('away');
    })();
  }

  createdPausedElement(content: string, classes = '') {
    this.paused?.destroy();
    this.resumeLink?.destroy();
    this.paused = new Pause({
      parent: this.element,
      className: classes,
    });
    this.resumeLink = new Clickable({
      parent: this.paused.element,
      className: 'resume-link',
      onClick: () => this.resume(this.state === 'starting' ? 'starting' : undefined),
    });
    this.resumeLink.setContent(content);
  }

  pause(to?: State) {
    if (PAUSABLE.includes(this.state)) {
      this.createdPausedElement(to === 'away' ? 'Away' : `Resume`);
      this.state = to ?? 'paused';
      this.debug?.setContent(this.state);
    }
  }

  resume(from?: State) {
    if (from ? from === this.state : RESUMABLE.includes(this.state)) {
      this.paused?.destroy();
      this.paused = null;
      this.state = this.debug ? 'debug' : 'playing';
      this.update();
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
    document.removeEventListener('keydown', e => this.handleKeyPress(e));
    this.element.removeEventListener('mouseenter', () => this.handleMouseEnter());
    this.element.removeEventListener('mouseleave', () => this.handleMouseLeave());
  }
}
