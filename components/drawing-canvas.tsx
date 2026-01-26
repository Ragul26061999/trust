'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  IconButton, 
  Slider, 
  Button, 
  Paper,
  Toolbar,
  Typography,
  Divider
} from '@mui/material';
import {
  Brush as BrushIcon,
  Eraser as EraserIcon,
  Palette as PaletteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Trash2 as TrashIcon,
  Save as SaveIcon,
  Circle as CircleIcon,
  Square as SquareIcon,
  Minus as LineWeightIcon
} from 'lucide-react';
import LucideIcon from './icon-wrapper';

interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}

interface DrawingStroke {
  points: DrawingPoint[];
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onSave?: (imageData: string, thumbnailData: string) => void;
  initialData?: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  width = 600, 
  height = 400,
  onSave,
  initialData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
    '#A52A2A', '#808080', '#FFFFFF'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear and set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    } else {
      // Redraw all strokes
      redrawCanvas();
    }
  }, [width, height, initialData]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const newStroke: DrawingStroke = {
      points: [{ x, y, color: currentColor, size: brushSize, tool: currentTool }],
      tool: currentTool,
      color: currentColor,
      size: brushSize
    };
    setCurrentStroke(newStroke);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint = { x, y, color: currentColor, size: brushSize, tool: currentTool };
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, newPoint]
    };
    setCurrentStroke(updatedStroke);

    // Draw the current stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke && currentStroke.points.length > 0) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setUndoStack([...undoStack, strokes]);
      setRedoStack([]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const newUndoStack = [...undoStack];
    const previousState = newUndoStack.pop()!;
    setUndoStack(newUndoStack);
    setRedoStack([...redoStack, strokes]);
    setStrokes(previousState);
    setTimeout(redrawCanvas, 0);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop()!;
    setRedoStack(newRedoStack);
    setUndoStack([...undoStack, strokes]);
    setStrokes(nextState);
    setTimeout(redrawCanvas, 0);
  };

  const handleClear = () => {
    setUndoStack([...undoStack, strokes]);
    setStrokes([]);
    setRedoStack([]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get full image data
    const imageData = canvas.toDataURL('image/png');

    // Create thumbnail
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    if (!thumbnailCtx) return;

    const thumbnailSize = 150;
    thumbnailCanvas.width = thumbnailSize;
    thumbnailCanvas.height = thumbnailSize;

    thumbnailCtx.fillStyle = 'white';
    thumbnailCtx.fillRect(0, 0, thumbnailSize, thumbnailSize);
    thumbnailCtx.drawImage(canvas, 0, 0, thumbnailSize, thumbnailSize);

    const thumbnailData = thumbnailCanvas.toDataURL('image/png');

    if (onSave) {
      onSave(imageData, thumbnailData);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Drawing Canvas
      </Typography>
      
      {/* Drawing Tools */}
      <Toolbar variant="dense" sx={{ mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <IconButton
          onClick={() => setCurrentTool('pen')}
          color={currentTool === 'pen' ? 'primary' : 'default'}
          size="small"
        >
          <LucideIcon icon={BrushIcon} size={20} />
        </IconButton>
        
        <IconButton
          onClick={() => setCurrentTool('eraser')}
          color={currentTool === 'eraser' ? 'primary' : 'default'}
          size="small"
        >
          <LucideIcon icon={EraserIcon} size={20} />
        </IconButton>

        <Divider orientation="vertical" flexItem />

        <IconButton onClick={handleUndo} disabled={undoStack.length === 0} size="small">
          <LucideIcon icon={UndoIcon} size={20} />
        </IconButton>
        
        <IconButton onClick={handleRedo} disabled={redoStack.length === 0} size="small">
          <LucideIcon icon={RedoIcon} size={20} />
        </IconButton>
        
        <IconButton onClick={handleClear} size="small">
          <LucideIcon icon={TrashIcon} size={20} />
        </IconButton>

        <Divider orientation="vertical" flexItem />

        <IconButton onClick={handleSave} color="success" size="small">
          <LucideIcon icon={SaveIcon} size={20} />
        </IconButton>
      </Toolbar>

      {/* Color Palette */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1 }}>Colors:</Typography>
        {colors.map((color) => (
          <Box
            key={color}
            onClick={() => setCurrentColor(color)}
            sx={{
              width: 24,
              height: 24,
              backgroundColor: color,
              border: currentColor === color ? '2px solid #1976d2' : '1px solid #ddd',
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: 1
              }
            }}
          />
        ))}
      </Box>

      {/* Brush Size */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
          <LucideIcon icon={LineWeightIcon} size={16} />
          <Typography variant="body2">
            Size: {brushSize}px
          </Typography>
        </Box>
        <Slider
          value={brushSize}
          onChange={(_, value) => setBrushSize(value as number)}
          min={1}
          max={50}
          sx={{ flexGrow: 1, maxWidth: 200 }}
        />
      </Box>

      {/* Canvas */}
      <Box sx={{ border: '2px solid #ddd', borderRadius: 1, overflow: 'hidden', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ cursor: currentTool === 'eraser' ? 'crosshair' : 'crosshair' }}
        />
      </Box>
    </Paper>
  );
};

export default DrawingCanvas;
