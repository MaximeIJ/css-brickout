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
  radius: number;
};

export type AxisOverlap = {overlap: number; axis: Vector};

export function rotatePoint(x: number, y: number, originX: number, originY: number, angle: number): Vector {
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  const newX = cosTheta * (x - originX) - sinTheta * (y - originY) + originX;
  const newY = sinTheta * (x - originX) + cosTheta * (y - originY) + originY;

  return {x: newX, y: newY};
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
/**
 * Calculates the overlap between a circle and a rectangle on each axis, accounting for rotation
 * @param rect the possibly rotated rectangle
 * @param circle the moving ball
 * @returns the overlap on each axis in ascending order
 */
export function getOverlapsAndAxes(rect: Rectangle, circle: Circle): Array<AxisOverlap> {
  return [
    {x: 1, y: 0}, // X-axis
    {x: 0, y: 1}, // Y-axis
  ]
    .map(baseAxis => {
      const signX = Math.sign(rect.x - circle.x) || 1;
      const signY = Math.sign(rect.y - circle.y) || 1;
      const rotatedAxis = rotatePoint(signX * baseAxis.x, signY * baseAxis.y, 0, 0, rect.angle);
      const axis: Vector = {x: rotatedAxis.x, y: rotatedAxis.y};
      // Normalize the axis
      const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
      axis.x /= length;
      axis.y /= length;
      return {
        overlap: overlapOnAxis(circle, axis, rect.boundingBox),
        axis,
      };
    })
    .sort((a, b) => a.overlap - b.overlap);
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
