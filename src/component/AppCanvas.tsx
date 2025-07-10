import React, { useRef, useState, useEffect, useCallback } from 'react';

const shapeTypes = {
  RECT: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
};

type Shape = {
  id: string | number;
  type: string;
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

type Point = {
  x: number;
  y: number;
};

export default function DrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | number | null>(null);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentTool, setCurrentTool] = useState<string>(shapeTypes.RECT);
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const HANDLE_SIZE = 8;
  const [style, setStyle] = useState({
    stroke: '#000000',
    fill: '#cccccc',
    lineWidth: 2,
    lineStyle: 'solid',
  });

const getHandles = (shape: Shape) => {
  const { x, y, w, h } = shape;
  return {
    bottomRight: { x: x + w, y: y + h },
  };
};

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
  ctx.beginPath();
  ctx.lineWidth = shape.style.lineWidth;
  ctx.setLineDash(shape.style.lineStyle === 'dashed' ? [5, 3] : []);
  ctx.strokeStyle = shape.style.stroke;
  ctx.fillStyle = shape.style.fill;

  const { x, y, w, h } = shape;

  if (shape.type === shapeTypes.RECT) {
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
  } else if (shape.type === shapeTypes.CIRCLE) {
    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);
    ctx.ellipse(x + w / 2, y + h / 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (shape.type === shapeTypes.LINE) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  }

  ctx.closePath();

  if (shape.id === selectedShapeId) {
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.strokeStyle = 'blue';
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.closePath();
  }
  if (shape.id === selectedShapeId && (shape.type === shapeTypes.RECT || shape.type === shapeTypes.CIRCLE)) {
    const handles = getHandles(shape);
    ctx.fillStyle = 'blue';
    Object.values(handles).forEach(point => {
      ctx.fillRect(point.x - HANDLE_SIZE / 2, point.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });
  }
}, [selectedShapeId]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => drawShape(ctx, shape));
  }, [shapes, drawShape]);

  const isInsideShape = (shape: Shape, x: number, y: number) => {
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
      // rectangle
      const left = Math.min(shape.x, shape.x + shape.w);
      const right = Math.max(shape.x, shape.x + shape.w);
      const top = Math.min(shape.y, shape.y + shape.h);
      const bottom = Math.max(shape.y, shape.y + shape.h);
      return x >= left && x <= right && y >= top && y <= bottom;
    }
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedShape = shapes
  .filter(shape => shape.id !== 'preview')
  .reverse()  
  .find(shape => isInsideShape(shape, x, y));

  console.log('Clicked:', clickedShape?.type, 'ID:', clickedShape?.id);
    // Handle resize first (highest priority)
    if (clickedShape && clickedShape.id === selectedShapeId) {
      const handles = getHandles(clickedShape);
      for (const [name, point] of Object.entries(handles)) {
        const isNearHandle =
          Math.abs(x - point.x) < HANDLE_SIZE &&
          Math.abs(y - point.y) < HANDLE_SIZE;

        if (isNearHandle) {
          // ✅ Toggle resize on same handle
          if (resizing && resizeHandle === name) {
            setResizing(false);
            setResizeHandle(null);
            return;
          } else {
            setResizing(true);
            setResizeHandle(name);
            return;
          }
        }
      }
    }

    // If clicked inside a shape (not on resize box)
    if (clickedShape) {
      setSelectedShapeId(clickedShape.id);
      setDragging(true);
      setDragOffset({ x: x - clickedShape.x, y: y - clickedShape.y });
    } else {
      // Else start drawing
      setStartPoint({ x, y });
      setDrawing(true);
      setSelectedShapeId(null);
      setResizing(false);
      setResizeHandle(null);
    }
  };


  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isHovering = shapes.some(shape => isInsideShape(shape, x, y));
    canvas.style.cursor = isHovering ? 'move' : 'default';

    if (dragging && selectedShapeId && dragOffset) {
      setShapes(prev => prev.map(shape =>
        shape.id === selectedShapeId
          ? { ...shape, x: x - dragOffset.x, y: y - dragOffset.y }
          : shape
      ));
    } else if (drawing && startPoint) {
      const w = x - startPoint.x;
      const h = y - startPoint.y;
      const newShape: Shape = {
        id: 'preview',
        type: currentTool,
        x: startPoint.x,
        y: startPoint.y,
        w,
        h,
        style: { ...style },
      };
      const updatedShapes = shapes.filter(s => s.id !== 'preview');
      setShapes([...updatedShapes, newShape]);
    }

    // Cursor update
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape) {
        const handles = getHandles(selectedShape);
        for (const [, handlePos] of Object.entries(handles)) {
          if (
            Math.abs(x - handlePos.x) < HANDLE_SIZE &&
            Math.abs(y - handlePos.y) < HANDLE_SIZE
          ) {
            canvas.style.cursor = 'nwse-resize';
            break;
          }
        }
      }
    }

    // Resizing logic
    if (resizing && selectedShapeId && resizeHandle === 'bottomRight') {
      setShapes(prev =>
        prev.map(shape => {
          if (shape.id !== selectedShapeId) return shape;
          const newW = x - shape.x;
          const newH = y - shape.y;
          return { ...shape, w: newW, h: newH };
        })
      );
      return;
    }


  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      setDragOffset(null);
      return;
    }

  if (resizing) {
      setResizing(false);
      setResizeHandle(null);
      return;
    }


    if (!drawing) return;
    const preview = shapes.find(s => s.id === 'preview');
    if (preview) {
      const finalizedShape = { ...preview, id: Date.now() };
      setShapes([...shapes.filter(s => s.id !== 'preview'), finalizedShape]);
    }
    setDrawing(false);
    setStartPoint(null);

  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedShape = shapes.find(shape => isInsideShape(shape, x, y));
    setSelectedShapeId(clickedShape?.id || null);
  };

  const handleStyleChange = (field: string, value: any) => {
    setStyle(prev => ({ ...prev, [field]: value }));
    if (selectedShapeId) {
      setShapes(prev => prev.map(shape =>
        shape.id === selectedShapeId ? { ...shape, style: { ...shape.style, [field]: value } } : shape
      ));
    }
  };

  const saveDrawing = () => {
    localStorage.setItem('drawing', JSON.stringify(shapes));
    alert('Drawing saved in your browser cache!');
  };


  // const loadDrawing = () => {
  //   const data = localStorage.getItem('drawing');
  //   if (data) setShapes(JSON.parse(data));
  // };
  const resetDrawing = () => {
   localStorage.removeItem('drawing');
    setShapes([]);
  };

  const deleteSelectedShape = () => {
    if (selectedShapeId === null) return;
    const confirmed = window.confirm("Are you sure you want to delete this shape?");
    if (!confirmed) return;
    setShapes(prev => prev.filter(shape => shape.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [selectedShapeId, redraw]);


  useEffect(() => {
    const saved = localStorage.getItem('drawing');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setShapes(parsed);
      } catch (e) {
        console.error('Failed to parse saved drawing:', e);
      }
    }
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2 space-x-4 py-3 align-center justify-center">
        {Object.values(shapeTypes).map(type => (
          <button
            key={type}
            className={` px-4 py-2 rounded capitalize ${currentTool === type ? ' bg-gray-900 text-white' : 'bg-gray-200'}`}
            onClick={() => setCurrentTool(type)}
          >
            {type}
          </button>
        ))}
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={saveDrawing}>Save</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={resetDrawing}>Reset</button>
        <button className={`px-4 py-2 rounded ${selectedShapeId ? 'bg-red-500 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} onClick={deleteSelectedShape} disabled={!selectedShapeId}>Delete</button>
      </div>
      <div className="space-x-2 pb-3 flex justify-center align-center">
        <input type="color" value={style.stroke} onChange={e => handleStyleChange('stroke', e.target.value)} />
        <input type="color" value={style.fill} onChange={e => handleStyleChange('fill', e.target.value)} />
        <input type="number" min="1" max="10" value={style.lineWidth} onChange={e => handleStyleChange('lineWidth', +e.target.value)} />
        <select value={style.lineStyle} onChange={e => handleStyleChange('lineStyle', e.target.value)}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>
      </div>
      <div className='text-center'>
        <div className="relative w-full max-w-4xl mx-auto">
          <canvas
            ref={canvasRef}
            className="border border-gray-500 w-full max-w-4xl mx-auto aspect-[16/10]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
}
