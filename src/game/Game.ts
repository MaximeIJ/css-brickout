import {createEvent} from '../util';

import {
  Ball,
  BallCollisionEvent,
  BallConfig,
  BallDestroyedEvent,
  Brick,
  BrickDestroyedEvent,
  Clickable,
  Controls,
  Debug,
  HUD,
  Level,
  LevelConfig,
  Paddle,
  PaddleConfig,
  Pause,
} from './';

type GameOptions = {
  fps: number;
  capFps: boolean;
  allowDebug: boolean;
  nextLifeDelayMs: number;
  // disabled if 0
  mouseoutPauseDelayMs: number;
  mouseoverResumeDelayMs: number;
  showCursorInPlay: boolean;
  demoMode: boolean;
  updatesPerFrame: number;
};

const DEFAULT_OPTIONS: GameOptions = {
  fps: 60,
  capFps: false,
  allowDebug: false,
  nextLifeDelayMs: 500,
  mouseoutPauseDelayMs: 1000,
  mouseoverResumeDelayMs: 1000,
  showCursorInPlay: false,
  demoMode: false,
  updatesPerFrame: 1,
};

export type GameParams = {
  ballConfigs: Array<Omit<BallConfig, 'idx' | 'parent'>>;
  levelConfig: Omit<LevelConfig, 'parent'>;
  paddleConfig: Partial<PaddleConfig>;
  playerConfig?: PlayerParams;
  parentId?: string;
  options?: Partial<GameOptions>;
};

type PlayerParams = {
  lives: number;
  score?: number;
};

type State = 'paused' | 'playing' | 'debug' | 'won' | 'lost' | 'away' | 'starting';
const PAUSABLE: Array<State> = ['playing', 'debug']; // todo: add 'demo' state where update can be called to kick off the loop. Possibly disable timer during that mode. Set state to get out of it.
const RESUMABLE: Array<State> = ['paused', 'away'];

// GameLoop class
export class Game {
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
  options: GameOptions;
  fpsInterval: number;
  fpsCap: number;
  msSinceStart = 0;
  balls: Ball[] = [];
  level: Level;
  paddle: Paddle;
  hud: HUD | null;
  controls: Controls | null;
  lives = 0;
  score = 0;
  // Pause
  paused: Pause | null;
  resumeLink: Clickable | null;

  constructor(params: GameParams) {
    this.ogParams = {...params};
    this.element = document.getElementById(params.parentId ?? 'game') as HTMLDivElement;
    this.element.classList.add('game');
    if (!params.options?.showCursorInPlay) {
      this.element.classList.add('hide-cursor');
    }

    // Set up level
    this.level = new Level({
      ...params.levelConfig,
      parent: this.element,
    });

    this.paddle = new Paddle({
      ...params.paddleConfig,
      parent: this.level.element,
      elementId: 'paddle',
      x: params.paddleConfig?.x ?? 50,
      y: params.paddleConfig?.y ?? 83,
    });
    this.debug = null;
    this.paused = null;
    this.resumeLink = null;

    this.options = {...DEFAULT_OPTIONS, ...params.options};

    // Set up player
    if (params.playerConfig) {
      this.lives = params.playerConfig.lives;
      this.score = params.playerConfig.score ?? 0;
    }
    this.controls = new Controls({
      parent: this.element,
      handleFullscreen: () => this.toggleFullscreen(),
      handlePause: () => this.togglePause(),
      handleDebug: this.options.allowDebug ? () => this.toggleDebug() : undefined,
    });
    this.controls.updateElementPosition();
    this.hud = new HUD({parent: this.element});
    this.updateHUDLives();
    this.updateHUDScore();
    this.updateHUDTime();

    this.setBalls();
    this.responsive(true);

    // Event listeners
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.element.addEventListener('balldestroyed', this.handleBallLost);
    this.element.addEventListener('ballcollision', this.handleBallCollision);
    this.element.addEventListener('brickdestroyed', this.handleBrickDestroyed);
    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
    new ResizeObserver(this.handleResize).observe(this.element);
    if (!this.options.demoMode) {
      document.addEventListener('keyup', this.handleKeyPress);
    } else {
      this.element.classList.add('demo');
    }

    this.fpsInterval = Math.floor(1000.0 / (this.options.fps || 60)) || 1;
    this.fpsCap = this.options.capFps ? this.fpsInterval : 1;
  }

  // Create Ball objects based on ballConfig
  setBalls = () => {
    this.balls.filter(b => b.active).forEach(ball => ball.destroy());
    this.balls = this.balls.filter(b => !b.active);
    this.ogParams.ballConfigs.forEach((ballConfig, idx) => {
      const ball = new Ball({...ballConfig, idx, parent: this.level.element});
      this.balls.push(ball);
    });
  };

  debounce = (func: () => void, timeout = 500) => {
    return () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        func.apply(this);
      }, timeout);
    };
  };

  start = () => {
    this.createdPausedElement('Start');
    this.element.classList.add('paused');
    this.dispatchGameEvent('gamestarted');
  };

  update = () => {
    const now = Date.now();
    const msSinceLastFrame = now - this.lastFrameTime;
    if (PAUSABLE.includes(this.state)) {
      if (msSinceLastFrame >= this.fpsCap) {
        this.msSinceStart += msSinceLastFrame;
        this.updateHUDTime();
        this.lastFrameTime = now;
        if (this.debug && now > this.lastFpsUpdate + 1000) {
          const fps = 1 + Math.round(1000.0 / msSinceLastFrame);
          this.debug?.setContent(`FPS: ${fps.toFixed(0)} | ${this.state}`);
          this.lastFpsUpdate = now;
        }

        this.paddle.updateElementPosition();
        const frameFraction = msSinceLastFrame / (this.fpsInterval * this.options.updatesPerFrame);

        // update numbers
        for (let i = 0; i < this.options.updatesPerFrame; i++) {
          this.level.mobileBricks.forEach(brick => brick.processFrame(frameFraction));
          for (const ball of this.balls) {
            if (ball.destroyed) {
              continue;
            }
            ball.processFrame(frameFraction, this.level, this.paddle);
          }
        }

        // update visuals
        this.level.mobileBricks.forEach(brick => brick.updateElementPosition());
        for (const ball of this.balls) {
          if (ball.destroyed) {
            continue;
          }
          ball.updateElementPosition();

          // autoplay lol
          if (this.debug && ball.y > this.paddle.maxY - this.paddle.height && ball.y < this.paddle.maxY) {
            const semiR = Math.round(ball.x - this.paddle.width / 2 + (Math.random() * this.paddle.width) / 2);
            this.paddle.handleMove(
              (semiR * this.paddle.parent.offsetWidth) / 100,
              ((this.paddle.maxY ?? this.paddle.y) * this.paddle.parent.offsetHeight) / 100,
            );
          }
        }
      } else {
        console.debug('skipping frame', msSinceLastFrame, this.fpsCap);
      }

      requestAnimationFrame(() => this.update());
    }
  };

  handleBallLost = (event: Event) => {
    console.debug('BallLost', (event as BallDestroyedEvent).detail);
    this.balls = this.balls.filter(ball => !ball.destroyed);
    if (this.balls.filter(b => b.active).length === 0) {
      setTimeout(() => {
        this.lives--;
        if (this.lives >= 0) {
          this.updateHUDLives();
          this.setBalls();
        } else {
          this.state = 'lost';
          this.createdPausedElement('Game Over', 'final');
          this.dispatchGameEvent('gamelost');
        }
      }, this.options.nextLifeDelayMs || 20);
    }
  };

  handleBallCollision = (event: Event) => {
    const {ball, object} = (event as BallCollisionEvent).detail;
    let type = 'BallCollision';
    if (object instanceof Brick) {
      type = 'BallBrickCollision';
    } else if (object instanceof Paddle) {
      type = 'BallPaddleCollision';
    }
    console.debug(type, object?.constructor?.name, ball, object);
  };

  handleBrickDestroyed = (event: Event) => {
    console.debug('BrickDestroyed', (event as BrickDestroyedEvent).detail);
    if (this.level.isDone()) {
      this.win();
    }
  };

  win = () => {
    this.state = 'won';
    this.createdPausedElement('Victory!', 'final');
    this.dispatchGameEvent('gamewon');
  };

  updateHUDLives = () => {
    this.hud?.updateLives(this.lives);
  };

  updateHUDScore = () => {
    this.hud?.updateScore(this.score);
  };

  updateHUDTime = () => {
    this.hud?.updateTime(this.msSinceStart);
  };

  toggleDebug = () => {
    if (!this.options.allowDebug) {
      return;
    }
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
      if (this.state === 'playing') {
        this.state = 'debug';
      }
      this.debug.setContent(this.state);
      this.debug.updateElement();
    }
  };

  toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (this.element.requestFullscreen) {
      await this.element.requestFullscreen();
    }
    this.handleResize();
  };

  togglePause = () => {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  };

  responsive = (callResize = false) => {
    // if ratio is more vertical, apply the column class to this.element, otherwise remove it
    const {width, height} = this.element.getBoundingClientRect();
    if (width / height < 1) {
      this.element.classList.add('column');
    } else {
      this.element.classList.remove('column');
    }
    if (callResize) {
      this.handleResize();
    }
  };

  handleResize = () => {
    this.responsive();
    this.level.updateElements();
    this.paddle.updateElement();
    this.balls.forEach(ball => ball.updateElement());
    this.paused?.updateElement();
    this.resumeLink?.updateElement();
    this.debug?.updateElement();
    this.controls?.updateElement();
    this.hud?.updateElement();
  };

  handleVisibilityChange = () => {
    if (document.hidden) {
      this.debounce(() => {
        this.pause('away');
      })();
    } else {
      this.debounce(() => this.resume('away'), 1000)();
    }
  };

  handleKeyPress = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyP':
      case 'Space':
        if (this.state === 'starting') {
          this.resume('starting');
        } else {
          this.togglePause();
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyD':
        this.toggleDebug();
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
      default:
        break;
    }
  };

  handleMouseEnter = () => {
    this.debounce(() => this.resume('away'), this.options.mouseoverResumeDelayMs)();
  };

  handleMouseLeave = () => {
    if (this.options.mouseoutPauseDelayMs) {
      this.debounce(() => this.pause('away'), this.options.mouseoutPauseDelayMs)();
    }
  };

  createdPausedElement = (content: string, classes = '') => {
    this.resumeLink?.destroy();
    this.paused?.destroy();
    this.paused = new Pause({
      parent: this.level.element,
      className: classes,
    });
    this.resumeLink = new Clickable({
      parent: this.paused.element,
      className: 'resume-link',
      onClick: () => this.resume(this.state === 'starting' ? 'starting' : undefined),
    });
    this.resumeLink.setContent(content);
    this.resumeLink.updateElementPosition();
    this.element.classList.add('paused');
  };

  pause = (to?: State) => {
    if (PAUSABLE.includes(this.state)) {
      this.createdPausedElement(to === 'away' ? 'Away' : `Resume`);
      this.state = to ?? 'paused';
      this.debug?.setContent(this.state);
      this.balls.forEach(ball => ball.updateTitle());
      this.paddle.updateTitle();
      this.level.bricks.forEach(brick => brick.updateTitle());
      this.dispatchGameEvent('gamepaused');
    }
  };

  resume = (from?: State) => {
    if (from ? from === this.state : RESUMABLE.includes(this.state)) {
      this.paused?.destroy();
      this.paused = null;
      this.state = this.debug ? 'debug' : 'playing';
      this.element.classList.remove('paused');
      this.lastFrameTime = Date.now();
      this.dispatchGameEvent('gameresumed');
      this.update();
    }
  };

  dispatchGameEvent = (name: string) => {
    const event = createEvent<Game>(name, this);
    this.element.dispatchEvent(event);
  };

  destroy = () => {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('keyup', this.handleKeyPress);
    this.element.removeEventListener('balldestroyed', this.handleBallLost);
    this.element.removeEventListener('ballcollision', this.handleBallCollision);
    this.element.removeEventListener('brickdestroyed', this.handleBrickDestroyed);
    this.element.removeEventListener('mouseenter', this.handleMouseEnter);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
    this.paddle.destroy();
    this.level.destroy();
    this.hud?.destroy();
    this.controls?.destroy();
    this.state = 'lost';
    this.lives = 0;
    this.balls.forEach(ball => ball.destroy());
    this.debug?.destroy();
    this.resumeLink?.destroy();
    this.paused?.destroy();
  };
}

export type GamePausedEvent = CustomEvent<Game>;
export type GameResumedEvent = CustomEvent<Game>;
export type GameLostEvent = CustomEvent<Game>;
export type GameStartedEvent = CustomEvent<Game>;
export type GameWonEvent = CustomEvent<Game>;
