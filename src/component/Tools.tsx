// This component file is created for manage drawing tools
import React from 'react';

interface ToolsProps {
  currentTool: string;
  shapeTypes: Record<string, string>;
  setCurrentTool: (tool: string) => void;
  style: {
    stroke: string;
    fill: string;
    lineWidth: number;
    lineStyle: string;
  };
  setStyle: (field: string, value: any) => void;
  selectedShapeId: string | number | null;
  saveDrawing: () => void;
  resetDrawing: () => void;
  deleteSelectedShape: () => void;
  shapesLength: number;
}

const Tools: React.FC<ToolsProps> = ({
  currentTool,
  shapeTypes,
  shapesLength,
  style,
  selectedShapeId,
  setCurrentTool,
  setStyle,
  saveDrawing,
  resetDrawing,
  deleteSelectedShape
}) => {
   const isEmpty = shapesLength === 0;
  return (
    <>
      <div className="flex flex-wrap gap-2 space-x-4 py-3 align-center justify-center">
        {Object.values(shapeTypes).map(type => (
          <button
            key={type}
            className={`px-4 py-2 rounded capitalize ${currentTool === type ? 'bg-gray-900 text-white' : 'bg-gray-200'}`}
            onClick={() => setCurrentTool(type)}
          >
            {type}
          </button>
        ))}
        <button
            className={`px-4 py-2 rounded ${!isEmpty ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            onClick={saveDrawing}
            disabled={isEmpty}
            >
            Save
        </button>

        <button
            className={`px-4 py-2 rounded ${!isEmpty ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            onClick={resetDrawing}
            disabled={isEmpty}
            >
            Reset
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedShapeId ? 'bg-red-500 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={deleteSelectedShape}
          disabled={!selectedShapeId}
        >
          Delete
        </button>
      </div>
      <div className="space-x-2 pb-3 flex justify-center align-center">
        <input type="color" value={style.stroke} onChange={e => setStyle('stroke', e.target.value)} />
        <input type="color" value={style.fill} onChange={e => setStyle('fill', e.target.value)} />
        <input
          type="number"
          min="1"
          max="10"
          value={style.lineWidth}
          onChange={e => setStyle('lineWidth', +e.target.value)}
        />
        <select value={style.lineStyle} onChange={e => setStyle('lineStyle', e.target.value)}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>
      </div>
    </>
  );
};

export default Tools;
