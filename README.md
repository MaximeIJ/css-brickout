# css-brickout [![npm (scoped)](https://img.shields.io/npm/v/@maximeij/css-brickout?color=green&label=npm%20package&logo=logo)](https://www.npmjs.com/package/@maximeij/css-brickout)

<p align="center">
  <img src="https://github.com/MaximeIJ/css-brickout/assets/5600516/8ca67c1b-a7f6-4975-ae83-6992f616ad4b" height=250 align="center" />
</p>

## A timeless favorite...

[Demo](https://maximeij.dev/css-brickout/)

CSS Brickout (aka _CSS Breakout_) exposes a responsive, customizable, themable, extensible implementation of the beloved classic to the web. This 0 dependency library can be used in any ecosystem and framework.

### Quick start

No time to chat, here's the copy pastable stuff:

```npm
npm i @maximeij/css-brickout
```

```typescript
import '@maximeij/css-brickout/css';
import {Game} from '@maximeij/css-brickout';
```

See [demo.ts](src/demo.ts) for a quick example of how to invoke it. Either have a div with id `game` rendered, or pass a custom `parentId` to the input object to target anything else.

## ...with a twist!

Unlike other web based games, this little number renders all its graphics with good old CSS. No `canvas` were hurt (or used) during the production. While this was initially more of a personal challenge for the love of CSS-art and other related endeavors, it has proven to bring some advantages.

### Easy themes 🎨

With CSS Brickout, no need to wonder how hard it'll be to customize the feel and look of your game: it's as simple as tried and true `--css-variables`.
Anything not covered by that can be easily styled with static class names exposed by the lib:

```css
/* Example custom game container */
#custom-game {
  --ball-bg: hsl(98, 18, 89%);
  --paddle-bg: hsl(0, 0, 50%);
}

#custom-game .ball {
  border-style: double;
}
```

### Easy extension 🔨

The game emits custom events as they occur, allowing you to set up handlers that will customize the gameplay endlessly!
These events are currently available and include the GameObject emitting it unless stated otherwise:

#### Game events:

- `'gamestarted'`, `'gamepaused'`, `'gameresumed'`
- `'gamewon'`, `'gamelost'`

#### Ball events:

- `'ballcollision'` (includes both the Ball and the GameObject it collided with)
- `'balldestroyed'`

#### Brick events:

- `'brickdestroyed'`

Example use:

```typescript
// Basic
element.addEventListener('ballcollision', ({detail}) => console.log(detail.ball, 'bonk', detail.object));

/**
 * Advanced (as seen on demo.ts)
 * Basic particle effect for ball destruction using moving particles
 */
element.addEventListener('balldestroyed', ({detail: ball}) =>
  ball.emitParticles(10, ['ball--destroyed-particle'], 300, true).forEach(particle => {
    particle.style.left = `${50 - Math.round(100 * Math.random())}px`;
    particle.style.top = `${0 - Math.round(50 * Math.random())}px`;
    particle.style.opacity = '0';
  }),
);
```

```css
/** Previous example class */
.particle.ball--destroyed-particle {
  border-radius: 50%;
  background: var(--ball-bg);
  transition: all 300ms ease-out;
  top: 0px;
  left: 0px;
  opacity: 1;
}
```

### Still though... CSS for 60 FPS?

Yep! There's really only thing moving at 60FPS (the balls), and positioning them and other objects in a way consistent with the underlying model is pretty straightforward:

```typescript
this.element.style.transform = `translateX(calc(${absX}px - 50%)) translateY(calc(${absY}px - 50%))`;
```

The movement of the ball is not very smooth and the game does consume more power than it would if using optimized graphics like `canvas` and `svg`. I plan to decouple the rendering logic so we can create a more efficient rendering method to compare just exactly how big is the difference with CSS is. In the meantime this is a fun experiment.

## Recent changes

- [Changelog](CHANGELOG.md)

## Coming soon

- Bonus Drops + Effect Duration
- Object properties as CSS variables
