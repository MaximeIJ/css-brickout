import Ball, {BallConfig} from './Ball';
import Brick from './Brick';
import Clickable from './Clickable';
import Debug from './Debug';
import {GameObjectConfig} from './GameObject';
import HUD from './HUD';
import Level, {LevelConfig} from './Level';
import Paddle from './Paddle';
import Pause from './Pause';

export type GameParams = {
  ballConfigs: Array<Omit<BallConfig, 'idx' | 'parent'>>;
  levelConfig: Omit<LevelConfig, 'parent'>;
  paddleConfig: Partial<GameObjectConfig>;
  playerConfig?: PlayerParams;
  parentId?: string;
  fps?: number;
  capFps?: boolean;
};

type PlayerParams = {
  lives: number;
};

type State = 'paused' | 'playing' | 'debug' | 'won' | 'lost' | 'away' | 'starting';
const PAUSABLE: Array<State> = ['playing', 'debug'];
const RESUMABLE: Array<State> = ['paused', 'away'];

// GameLoop class
export default class Game {
  // Internals
  element: HTMLDivElement;
  state: State = 'starting';
  debounceTimer: NodeJS.Timeout | undefined = undefined;
  ogParams: GameParams;
  // Debug
  debug: Debug | null;
  lastFrameTime: number = Date.now();
  lastFpsUpdate: number = Date.now();
  // Gameplay
  fpsInterval: number;
  fpsCap: number;
  balls: Ball[] = [];
  level: Level;
  paddle: Paddle;
  hud: HUD | null;
  lives = 0;
  score = 0;
  // Pause
  paused: Pause | null;
  resumeLink: Clickable | null;

  constructor(params: GameParams) {
    this.ogParams = {...params};
    this.element = document.getElementById(params.parentId ?? 'game') as HTMLDivElement;
    this.element.classList.add('game');

    this.paddle = new Paddle({
      ...params.paddleConfig,
      parent: this.element,
      elementId: 'paddle',
      x: params.paddleConfig?.x ?? 50,
      y: params.paddleConfig?.y ?? 83,
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

    this.setBalls();

    // Set up player
    if (params.playerConfig) {
      this.lives = params.playerConfig.lives;
    }
    this.hud = new HUD({parent: this.element});
    this.updateHUDLives();
    this.updateHUDScore();

    // Event listeners
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    document.addEventListener('keydown', e => this.handleKeyPress(e));
    this.element.addEventListener('mouseenter', () => this.handleMouseEnter());
    this.element.addEventListener('mouseleave', () => this.handleMouseLeave());
    new ResizeObserver(() => this.handleResize()).observe(this.element);

    this.fpsInterval = Math.floor(1000.0 / (params.fps || 60)) || 1;
    this.fpsCap = params.capFps ? this.fpsInterval : 1;
  }

  // Create Ball objects based on ballConfig
  setBalls() {
    this.balls.forEach(ball => ball.destroy());
    this.balls = [];
    this.ogParams.ballConfigs.forEach((ballConfig, idx) => {
      const ball = new Ball({...ballConfig, idx, parent: this.element});
      this.balls.push(ball);
    });
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
    this.element.classList.add('paused');
  }

  update() {
    const now = Date.now();
    const msSinceLastFrame = now - this.lastFrameTime;
    if (PAUSABLE.includes(this.state)) {
      if (msSinceLastFrame >= this.fpsCap) {
        this.lastFrameTime = now;
        if (this.debug && now > this.lastFpsUpdate + 1000) {
          const fps = 1 + Math.round(1000.0 / msSinceLastFrame);
          this.debug?.setContent(`FPS: ${fps.toFixed(0)} | ${this.state}`);
          this.lastFpsUpdate = now;
        }

        this.paddle.updateElementPosition();

        for (const ball of this.balls) {
          ball.update(msSinceLastFrame / this.fpsInterval);
          ball.handleLevelCollision(this.level, this.paddle);
          // autoplay lol
          if (this.debug && ball.y > this.paddle.y - this.paddle.height && ball.y < this.paddle.y) {
            const semiR = Math.round(ball.x - this.paddle.width / 2 + (Math.random() * this.paddle.width) / 2);
            this.paddle.updatePosition(semiR);
          }
        }
      } else {
        console.debug('skipping frame', msSinceLastFrame, this.fpsCap);
      }

      requestAnimationFrame(() => this.update());
    }
  }

  onBallLost() {
    this.balls = this.balls.filter(ball => !ball.destroyed);
    if (this.balls.length === 0) {
      this.lives--;
      if (this.lives >= 0) {
        this.updateHUDLives();
        this.setBalls();
      } else {
        this.state = 'lost';
        this.createdPausedElement('Game Over', 'final');
      }
    }
  }

  onBrickDestroyed(brick: Brick) {
    // todo: add score from brick params if they exist
    this.score += 1;
    this.updateHUDScore();
    if (this.level.isDone()) {
      this.state = 'won';
      this.createdPausedElement('Victory!', 'final');
    }
  }

  updateHUDLives() {
    this.hud?.updateLives(this.lives);
  }

  updateHUDScore() {
    this.hud?.updateScore(this.score);
  }

  handleResize() {
    this.paddle.updateElement();
    this.balls.forEach(ball => ball.updateElement());
    this.level.updateElements();
    this.paused?.updateElementPosition();
    this.resumeLink?.updateElementPosition();
    this.debug?.updateElementPosition();
    this.hud?.updateElementPosition();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.debounce(() => {
        this.pause('away');
      })();
    } else {
      this.debounce(() => this.resume('away'), 1000)();
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
        } else if (this.state === 'playing') {
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
    this.debounce(() => this.resume('away'), 1000)();
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
    this.resumeLink.updateElementPosition();
  }

  pause(to?: State) {
    if (PAUSABLE.includes(this.state)) {
      this.createdPausedElement(to === 'away' ? 'Away' : `Resume`);
      this.state = to ?? 'paused';
      this.debug?.setContent(this.state);
      this.element.classList.add('paused');
    }
  }

  resume(from?: State) {
    if (from ? from === this.state : RESUMABLE.includes(this.state)) {
      this.paused?.destroy();
      this.paused = null;
      this.state = this.debug ? 'debug' : 'playing';
      this.element.classList.remove('paused');
      this.lastFrameTime = Date.now();
      this.update();
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', () => this.handleVisibilityChange());
    document.removeEventListener('keydown', e => this.handleKeyPress(e));
    this.element.removeEventListener('mouseenter', () => this.handleMouseEnter());
    this.element.removeEventListener('mouseleave', () => this.handleMouseLeave());
    this.element.innerHTML = '';
    this.state = 'lost';
    this.debug?.destroy();
    this.paused?.destroy();
    this.resumeLink?.destroy();
    this.paddle.destroy();
    this.balls.forEach(ball => ball.destroy());
    this.level.destroy();
    this.hud?.destroy();
  }
}
