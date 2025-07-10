import React, { useRef, useState, useEffect, useCallback } from 'react';
import { shapeTypes, Shape, Point, HANDLE_SIZE, isInsideShape, getHandles, ShapeType, Style } from './CanvasUtils';
import Tools from './Tools';

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
  const [style, setStyle] = useState(Style);

    // This function is created for draw the shapes
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
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeStyle = 'blue';

      if (shape.type === shapeTypes.CIRCLE) {
        const rx = Math.abs(w / 2);
        const ry = Math.abs(h / 2);
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2);
      } else {
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      }

      ctx.stroke();
      ctx.closePath();
    }

    if (shape.id === selectedShapeId && (shape.type === shapeTypes.RECT || shape.type === shapeTypes.CIRCLE || shape.type === shapeTypes.LINE)) {
      const handles = getHandles(shape);
      ctx.fillStyle = 'blue';
      Object.values(handles).forEach(point => {
        ctx.fillRect(point.x - HANDLE_SIZE / 2, point.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  }, [selectedShapeId]);

  // This function is created for redraw shapes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => drawShape(ctx, shape));
  }, [shapes, drawShape]);


  // This function is created for perform actions on shapes
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

  // This function is created for perform actions on shapes
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
        type: currentTool as ShapeType,
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
            Math.abs(x - handlePos.x) < (HANDLE_SIZE / 2) &&
            Math.abs(y - handlePos.y) < (HANDLE_SIZE / 2)
          ) {
            canvas.style.cursor = 'nwse-resize';
            break;
          }
        }
      }
    }

    // Resizing logic
    if (resizing && selectedShapeId && resizeHandle) {
      setShapes(prev =>
        prev.map(shape => {
          if (shape.id !== selectedShapeId) return shape;
          const newW = x - shape.x;
          const newH = y - shape.y;
          
          if (shape.type === shapeTypes.LINE) {
            const { x: x1, y: y1, w, h } = shape;
            const x2 = x1 + w;
            const y2 = y1 + h;

            switch (resizeHandle) {
              case 'start':
                return {
                  ...shape,
                  x: x,
                  y: y,
                  w: x2 - x,
                  h: y2 - y,
                };
              case 'end':
                return {
                  ...shape,
                  w: x - x1,
                  h: y - y1,
                };
            }
          }
          return { ...shape, w: newW, h: newH };
        })
      );
      return;
    }


  };

  // This function is created for perform actions on shapes
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

  // This function is created for perform click actions on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedShape = shapes.find(shape => isInsideShape(shape, x, y));
    setSelectedShapeId(clickedShape?.id || null);
  };

  // This function is created for change shape style
  const handleStyleChange = (field: string, value: any) => {
    setStyle(prev => ({ ...prev, [field]: value }));
    if (selectedShapeId) {
      setShapes(prev => prev.map(shape =>
        shape.id === selectedShapeId ? { ...shape, style: { ...shape.style, [field]: value } } : shape
      ));
    }
  };

  // This function is created for save drawing
  const saveDrawing = () => {
    localStorage.setItem('drawing', JSON.stringify(shapes));
    alert('Drawing saved in your browser cache!');
  };

  // This function is created for reset drawing
  const resetDrawing = () => {
   localStorage.removeItem('drawing');
    setShapes([]);
  };

  // This function is created for delete shape
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
        <Tools
        currentTool={currentTool}
        shapeTypes={shapeTypes}
        setCurrentTool={setCurrentTool}
        style={style}
        setStyle={handleStyleChange}
        selectedShapeId={selectedShapeId}
        saveDrawing={saveDrawing}
        resetDrawing={resetDrawing}
        deleteSelectedShape={deleteSelectedShape}
        shapesLength={shapes.length}
      />

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
