import Ball from '@/game/Ball';
import GameObject, {BonusConfig} from '@/game/GameObject';
import Paddle from '@/game/Paddle';

const gripFactorEffect = (amount: number) => (paddle: GameObject) => {
  (paddle as Paddle).gripFactor += amount;
  return (paddle: GameObject) => {
    (paddle as Paddle).gripFactor -= amount;
  };
};

const speedEffect = (amount: number) => (ball: GameObject) => {
  (ball as Ball).speed *= amount;
  return (ball: GameObject) => {
    (ball as Ball).speed /= amount || 1;
  };
};

export const BONUSES: Record<string, BonusConfig> = {
  // Paddle
  // Grips the edges of the paddle to the ball
  grip1: {
    cssClass: 'grip-1',
    duration: 0,
    effect: gripFactorEffect(0.4),
  },
  grip2: {
    cssClass: 'grip-2',
    duration: 0,
    effect: gripFactorEffect(0.7),
  },

  // Ball
  // Increases/Decreases the speed of the ball
  speedup1: {
    cssClass: 'speedup-1',
    duration: 0,
    effect: speedEffect(1.25),
  },
  speedup2: {
    cssClass: 'speedup-2',
    duration: 0,
    effect: speedEffect(1.5),
  },
  speeddown1: {
    cssClass: 'speeddown-1',
    duration: 0,
    effect: speedEffect(0.75),
  },
  speeddown2: {
    cssClass: 'speeddown-2',
    duration: 0,
    effect: speedEffect(0.5),
  },

  // Brick
};
