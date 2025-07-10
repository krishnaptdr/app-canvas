// This file is created for manage UTILS

export const shapeTypes = {
  RECT: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
} as const;

export const Style = {
    stroke: '#000000',
    fill: '#cccccc',
    lineWidth: 2,
    lineStyle: 'solid',
  };

export type ShapeType = typeof shapeTypes[keyof typeof shapeTypes];

export type Shape = {
  id: string | number;
  type: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  style: {
    stroke: string;
    fill: string;
    lineWidth: number;
    lineStyle: string;
  };
};

export type Point = {
  x: number;
  y: number;
};

export const HANDLE_SIZE = 8;

// This function is created for perform actions inside shapes
export const isInsideShape = (shape: Shape, x: number, y: number): boolean => {
  if (shape.type === shapeTypes.LINE) {
    const x1 = shape.x;
    const y1 = shape.y;
    const x2 = shape.x + shape.w;
    const y2 = shape.y + shape.h;
    const distance = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
      Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
    return distance < 5;
  } else if (shape.type === shapeTypes.CIRCLE) {
    const centerX = shape.x + shape.w / 2;
    const centerY = shape.y + shape.h / 2;
    const radiusX = Math.abs(shape.w / 2);
    const radiusY = Math.abs(shape.h / 2);
    const dx = x - centerX;
    const dy = y - centerY;
    return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
  } else {
    const left = Math.min(shape.x, shape.x + shape.w);
    const right = Math.max(shape.x, shape.x + shape.w);
    const top = Math.min(shape.y, shape.y + shape.h);
    const bottom = Math.max(shape.y, shape.y + shape.h);
    return x >= left && x <= right && y >= top && y <= bottom;
  }
};

// This function is created for get resize handle
export const getHandles = (shape: Shape): Record<string, Point> => {
  const { x, y, w, h } = shape;
  if (shape.type === shapeTypes.CIRCLE) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const angle = Math.atan2(h, w);
    const radiusX = Math.abs(w / 2);
    const radiusY = Math.abs(h / 2);
    const handleX = centerX + radiusX * Math.cos(angle);
    const handleY = centerY + radiusY * Math.sin(angle);
    return { edge: { x: handleX, y: handleY } };
  }
  if (shape.type === shapeTypes.LINE) {
    return {
      start: { x: x, y: y },
      end: { x: x + w, y: y + h },
    };
  }
  return {
    bottomRight: { x: x + w, y: y + h },
  };
};
