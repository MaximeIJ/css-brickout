export type Vector = {
  x: number;
  y: number;
};

export type BoundingBox = {topL: Vector; topR: Vector; bottomL: Vector; bottomR: Vector};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  boundingBox: BoundingBox;
};

export type Circle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
};

export type AxisOverlap = {overlap: number; axis: Vector; adjustedCircle: Circle};

export function rotatePoint(x: number, y: number, originX: number, originY: number, angle: number): Vector {
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  const newX = cosTheta * (x - originX) - sinTheta * (y - originY) + originX;
  const newY = sinTheta * (x - originX) + cosTheta * (y - originY) + originY;

  return {x: newX, y: newY};
}

export function rotateVector(x: number, y: number, angle: number): Vector {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: cos * x - sin * y,
    y: sin * x + cos * y,
  };
}

function projectRectangleOntoAxis(rectangleCorners: BoundingBox, axis: Vector): {min: number; max: number} {
  const dotProduct1 = rectangleCorners.topL.x * axis.x + rectangleCorners.topL.y * axis.y;
  const dotProduct2 = rectangleCorners.topR.x * axis.x + rectangleCorners.topR.y * axis.y;
  const dotProduct3 = rectangleCorners.bottomL.x * axis.x + rectangleCorners.bottomL.y * axis.y;
  const dotProduct4 = rectangleCorners.bottomR.x * axis.x + rectangleCorners.bottomR.y * axis.y;

  const min = Math.min(dotProduct1, dotProduct2, dotProduct3, dotProduct4);
  const max = Math.max(dotProduct1, dotProduct2, dotProduct3, dotProduct4);

  return {min, max};
}

export function overlapOnAxis(circle: Circle, axis: Vector, rectangleCorners: BoundingBox): number {
  const circleProjection = circle.x * axis.x + circle.y * axis.y;
  const rectProjection = projectRectangleOntoAxis(rectangleCorners, axis);
  // Calculate the overlap value
  const overlap = Math.max(
    0,
    Math.min(rectProjection.max, circleProjection + circle.radius) -
      Math.max(rectProjection.min, circleProjection - circle.radius),
  );

  return overlap;
}

const EPSILON = 1e-8;

export function rayAABB(
  localP0: Vector,
  localVelocity: Vector,
  halfExtents: Vector,
): {tmin: number; normal: Vector} | null {
  const invD = {
    x: Infinity,
    y: Infinity,
  };
  if (Math.abs(localVelocity.x) > EPSILON) {
    invD.x = 1 / localVelocity.x;
  }
  if (Math.abs(localVelocity.y) > EPSILON) {
    invD.y = 1 / localVelocity.y;
  }

  const bounds = [
    {x: -halfExtents.x, y: -halfExtents.y},
    {x: halfExtents.x, y: halfExtents.y},
  ];

  const signX = invD.x < 0 ? 1 : 0;
  const signY = invD.y < 0 ? 1 : 0;

  let tmin = (bounds[signX].x - localP0.x) * invD.x;
  const tmax = (bounds[1 - signX].x - localP0.x) * invD.x;

  const tymin = (bounds[signY].y - localP0.y) * invD.y;
  const tymax = (bounds[1 - signY].y - localP0.y) * invD.y;

  if (tmin > tymax || tymin > tmax) return null;

  if (tymin > tmin) {
    tmin = tymin;
    // Y-axis normal
    return {
      tmin,
      normal: {x: 0, y: invD.y < 0 ? 1 : -1},
    };
  } else {
    // X-axis normal
    return {
      tmin,
      normal: {x: invD.x < 0 ? 1 : -1, y: 0},
    };
  }
}

type CollisionResult = {
  position: Vector;
  normal: Vector;
  tmin: number;
};

export function getAdjustedCollisionPosition(rect: Rectangle, circle: Circle): CollisionResult | null {
  // Rotate to the rectangle's local space
  const P0 = {x: circle.x - rect.x, y: circle.y - rect.y};
  const localP0 = rotatePoint(P0.x, P0.y, 0, 0, -rect.angle);
  const localVelocity = rotateVector(circle.dx, circle.dy, -rect.angle);
  const halfExtentsWithRadius = {x: rect.width / 2 + circle.radius, y: rect.height / 2 + circle.radius};

  const result = rayAABB(localP0, localVelocity, halfExtentsWithRadius);
  if (!result) return null;

  const {tmin, normal} = result;

  const hitPoint = {
    x: localP0.x + localVelocity.x * tmin,
    y: localP0.y + localVelocity.y * tmin,
  };

  // Transform back to world space
  const rotatedHitPoint = rotatePoint(hitPoint.x, hitPoint.y, 0, 0, rect.angle);
  const position = {
    x: rotatedHitPoint.x + rect.x,
    y: rotatedHitPoint.y + rect.y,
  };

  const collisionWorldNormal = rotateVector(normal.x, normal.y, rect.angle);

  return {position, normal: collisionWorldNormal, tmin};
}

export function normalizeAngle(angle: number) {
  let res = angle;
  while (res > Math.PI) {
    res -= 2 * Math.PI;
  }

  while (res <= -Math.PI) {
    res += 2 * Math.PI;
  }

  return res;
}
