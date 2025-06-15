import {describe, it} from 'vitest';

import {getCCCollisionPosition, getCRCollisionPosition, Circle, Rectangle} from '../../src/util/geometry';

describe('getCCCollisionPosition', () => {
  it('detects a direct hit with static circle', ({expect}) => {
    const lead: Circle = {x: 0, y: 0, dx: 1, dy: 0, radius: 1};
    const other: Circle = {x: 3, y: 0, dx: 0, dy: 0, radius: 1};

    const result = getCCCollisionPosition(lead, other);

    expect(result).not.toBeNull();
    expect(result?.normal).toMatchObject({x: -1, y: 0});
    expect(result?.position.x).toBeCloseTo(2);
    expect(result?.tmin).toBeCloseTo(1);
  });

  it('returns null for near miss', ({expect}) => {
    const lead: Circle = {x: 0, y: 0, dx: 1, dy: 0, radius: 1};
    const other: Circle = {x: 3, y: 2.1, dx: 0, dy: 0, radius: 1};

    const result = getCCCollisionPosition(lead, other);
    expect(result).toBeNull();
  });

  it('detects oblique hit', ({expect}) => {
    const lead: Circle = {x: 0, y: 0, dx: 1, dy: 1, radius: 1};
    const other: Circle = {x: 2, y: 2, dx: 0, dy: 0, radius: 1};

    const result = getCCCollisionPosition(lead, other);
    expect(result).not.toBeNull();
    expect(result?.normal.x).toBeCloseTo(-Math.SQRT1_2, 1); // ≈ 0.707
    expect(result?.normal.y).toBeCloseTo(-Math.SQRT1_2, 1);
  });

  it('detects collision when both circles are moving', ({expect}) => {
    const lead: Circle = {x: 0, y: 0, dx: 2, dy: 0, radius: 1};
    const other: Circle = {x: 5, y: 0, dx: -1, dy: 0, radius: 1};

    const result = getCCCollisionPosition(lead, other);
    expect(result).not.toBeNull();
    expect(result?.normal.x).toBeCloseTo(-1);
    expect(result?.position.x).toBeCloseTo(3);
  });

  it('returns null if moving away from each other', ({expect}) => {
    const lead: Circle = {x: 0, y: 0, dx: -1, dy: 0, radius: 1};
    const other: Circle = {x: 3, y: 0, dx: 1, dy: 0, radius: 1};

    const result = getCCCollisionPosition(lead, other);
    expect(result).toBeNull();
  });
});

describe('getCRCollisionPosition', () => {
  const baseRect: Rectangle = {
    x: 0,
    y: 0,
    width: 4,
    height: 2,
    angle: 0,
    boundingBox: {
      topL: {x: -2, y: -1},
      topR: {x: 2, y: -1},
      bottomL: {x: -2, y: 1},
      bottomR: {x: 2, y: 1},
    },
  };

  it('detects head-on hit', ({expect}) => {
    const circle: Circle = {x: -3, y: 0, dx: 1, dy: 0, radius: 1};

    const result = getCRCollisionPosition(baseRect, circle);
    expect(result).not.toBeNull();
    expect(result?.normal.x).toBeCloseTo(-1);
    expect(result?.position.x).toBeCloseTo(-3); // edge of rectangle - radius
  });

  it('misses when not intersecting', ({expect}) => {
    const circle: Circle = {x: -5, y: 5, dx: 1, dy: 0, radius: 1};
    const result = getCRCollisionPosition(baseRect, circle);
    expect(result).toBeNull();
  });

  it('detects hit from rotated rectangle', ({expect}) => {
    const rect = {
      ...baseRect,
      angle: Math.PI / 2, // vertical
    };
    const circle: Circle = {x: 0, y: -3, dx: 0, dy: 1, radius: 1};

    const result = getCRCollisionPosition(rect, circle);
    expect(result).not.toBeNull();
    expect(result?.normal.x).toBeCloseTo(0, 2);
    expect(result?.normal.y).toBeCloseTo(-1, 2);

    rect.angle = Math.PI / 4; // diagonal
    const resultDiagonal = getCRCollisionPosition(rect, circle);
    expect(resultDiagonal).not.toBeNull();
    expect(resultDiagonal?.normal.x).toBeCloseTo(Math.SQRT1_2, 2); // ≈ 0.707
    expect(resultDiagonal?.normal.y).toBeCloseTo(-Math.SQRT1_2, 2); // ≈ -0.707
  });

  it('respects relative velocity (moving rect)', ({expect}) => {
    const rect = {
      ...baseRect,
      dx: -0.5,
    };
    const circle: Circle = {x: -3.5, y: 0, dx: 0.5, dy: 0, radius: 1};

    const result = getCRCollisionPosition(rect, circle);
    expect(result).not.toBeNull();
    expect(result?.tmin).toBeLessThan(1);
  });

  it('returns null if moving apart (rect vs circle)', ({expect}) => {
    const circle: Circle = {x: -5, y: 0, dx: -1, dy: 0, radius: 1};
    const result = getCRCollisionPosition(baseRect, circle);
    expect(result).toBeNull();
  });
});
