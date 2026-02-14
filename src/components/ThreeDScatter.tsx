import React, { useRef, useEffect, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  id?: number | string; // Optional ID for matching points during animation
}

interface Props {
  points: Point3D[];
  range: number;
  title: string;
  functionType?: 'Sphere' | 'Ackley';
}

const ThreeDScatter: React.FC<Props> = ({ points, range, title, functionType = 'Sphere' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: -0.5, y: 0.5 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const isDragging = useRef(false);
  const dragType = useRef<'rotate' | 'pan' | 'pan-zoom' | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation state for smooth point transitions
  const previousPointsRef = useRef<Point3D[]>(points.map(p => ({ ...p })));
  const animatedPointsRef = useRef<Point3D[]>(points.map(p => ({ ...p })));
  const animationStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [animationTick, setAnimationTick] = useState(0); // Trigger re-render during animation
  const ANIMATION_DURATION = 800; // milliseconds

  const getZ = (x: number, y: number) => {
      if (functionType === 'Ackley') {
          const a = 20, b = 0.2, c = 2 * Math.PI;
          const sumSq = x*x + y*y;
          const sumCos = Math.cos(c*x) + Math.cos(c*y);
          const term1 = -a * Math.exp(-b * Math.sqrt(sumSq / 2));
          const term2 = -Math.exp(sumCos / 2);
          return term1 + term2 + a + Math.E;
      }
      return x*x + y*y;
  };

  // Convert function value to heatmap color with transparency
  const valueToColor = (value: number, minVal: number, maxVal: number, alpha: number = 0.7) => {
      // Normalize value to 0-1 range
      const normalized = (value - minVal) / (maxVal - minVal);
      
      // Create gradient: blue (low) -> cyan -> green -> yellow -> red (high)
      let r = 0, g = 0, b = 0;
      
      if (normalized < 0.25) {
          // Blue to cyan
          const t = normalized / 0.25;
          r = 0;
          g = Math.floor(t * 255);
          b = 255;
      } else if (normalized < 0.5) {
          // Cyan to green
          const t = (normalized - 0.25) / 0.25;
          r = 0;
          g = 255;
          b = Math.floor((1 - t) * 255);
      } else if (normalized < 0.75) {
          // Green to yellow
          const t = (normalized - 0.5) / 0.25;
          r = Math.floor(t * 255);
          g = 255;
          b = 0;
      } else {
          // Yellow to red
          const t = (normalized - 0.75) / 0.25;
          r = 255;
          g = Math.floor((1 - t) * 255);
          b = 0;
      }
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Animation effect - interpolate between previous and current points
  useEffect(() => {
    // Create a map of previous points by ID for efficient lookup
    const prevPointsMap = new Map<string | number, Point3D>();
    previousPointsRef.current.forEach(p => {
      if (p.id !== undefined) {
        prevPointsMap.set(p.id, p);
      }
    });
    
    // Check if points have actually changed
    const pointsChanged = previousPointsRef.current.length !== points.length ||
      points.some((newPoint, i) => {
        if (newPoint.id === undefined) {
          // If no ID, compare by index
          const prevPoint = previousPointsRef.current[i];
          return !prevPoint || 
            prevPoint.x !== newPoint.x || 
            prevPoint.y !== newPoint.y || 
            prevPoint.z !== newPoint.z;
        } else {
          // Compare by ID
          const prevPoint = prevPointsMap.get(newPoint.id);
          return !prevPoint || 
            prevPoint.x !== newPoint.x || 
            prevPoint.y !== newPoint.y || 
            prevPoint.z !== newPoint.z;
        }
      });

    // Always animate if we have previous points (even if count differs)
    if (pointsChanged && previousPointsRef.current.length > 0) {
      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Start animation
      animationStartTimeRef.current = performance.now();
      
      const animate = (currentTime: number) => {
        if (!animationStartTimeRef.current) return;
        
        const elapsed = currentTime - animationStartTimeRef.current;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate each point by matching ID or index
        animatedPointsRef.current = points.map((newPoint, i) => {
          let prevPoint: Point3D | undefined;
          
          if (newPoint.id !== undefined) {
            // Try to find previous point by ID
            prevPoint = prevPointsMap.get(newPoint.id);
          }
          
          // Fallback to index if no ID match (for same-sized arrays)
          if (!prevPoint && i < previousPointsRef.current.length) {
            prevPoint = previousPointsRef.current[i];
            // Only use if IDs match or both are undefined
            if (prevPoint && prevPoint.id !== undefined && newPoint.id !== undefined && prevPoint.id !== newPoint.id) {
              prevPoint = undefined;
            }
          }
          
          // If still no previous point, start from current position (no animation)
          if (!prevPoint) {
            return { ...newPoint };
          }
          
          return {
            x: prevPoint.x + (newPoint.x - prevPoint.x) * easeOutCubic,
            y: prevPoint.y + (newPoint.y - prevPoint.y) * easeOutCubic,
            z: prevPoint.z + (newPoint.z - prevPoint.z) * easeOutCubic,
            color: newPoint.color,
            id: newPoint.id
          };
        });
        
        // Trigger re-render to update canvas
        setAnimationTick(prev => prev + 1);
        
        // Continue animation if not complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete, set to final positions
          animatedPointsRef.current = points.map(p => ({ ...p }));
          animationStartTimeRef.current = null;
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // No previous points or no change, set immediately
      animatedPointsRef.current = points.map(p => ({ ...p }));
    }
    
    // Update previous points for next animation
    previousPointsRef.current = points.map(p => ({ ...p }));
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [points]);

  // Draw function and Event Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI and resizing
    const handleResize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            const dpr = window.devicePixelRatio || 1;
            const rect = parent.getBoundingClientRect();
            
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
    };
    
    handleResize();

    const width = parseFloat(canvas.style.width);
    const height = parseFloat(canvas.style.height);
    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;

    ctx.clearRect(0, 0, width, height);
    const scale = (Math.min(width, height) / (range * 2)) * zoom; 
    
    const project = (x: number, y: number, z: number) => {
        const x1 = x * Math.cos(rotation.y) - z * Math.sin(rotation.y);
        const z1 = x * Math.sin(rotation.y) + z * Math.cos(rotation.y);
        const y2 = y * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
        const z2 = y * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);
        return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2 };
    };

    const transform = (dx: number, dy: number, dz: number) => {
        const wx = dx;
        const wz = dy; 
        const wy = -dz * 0.2;
        return project(wx, wy, wz);
    };

    // Calculate min/max values for color mapping
    const steps = 50; // Higher resolution for smoother heatmap
    const stepSize = (range * 2) / steps;
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    // Sample function values to find min/max
    for (let x = -range; x <= range; x += stepSize) {
        for (let y = -range; y <= range; y += stepSize) {
            const z = getZ(x, y);
            minVal = Math.min(minVal, z);
            maxVal = Math.max(maxVal, z);
        }
    }

    // Draw heatmap surface with filled quads
    const quadSize = stepSize;
    const quads: Array<{ points: Array<{ x: number, y: number, z: number }>, color: string, avgZ: number }> = [];
    
    for (let x = -range; x < range; x += quadSize) {
        for (let y = -range; y < range; y += quadSize) {
            // Get four corners of the quad
            const z1 = getZ(x, y);
            const z2 = getZ(x + quadSize, y);
            const z3 = getZ(x + quadSize, y + quadSize);
            const z4 = getZ(x, y + quadSize);
            
            const avgZ = (z1 + z2 + z3 + z4) / 4;
            
            const p1 = transform(x, y, z1);
            const p2 = transform(x + quadSize, y, z2);
            const p3 = transform(x + quadSize, y + quadSize, z3);
            const p4 = transform(x, y + quadSize, z4);
            
            // Calculate center point for better depth sorting
            const centerX = (x + x + quadSize) / 2;
            const centerY = (y + y + quadSize) / 2;
            const centerZ = getZ(centerX, centerY);
            const centerP = transform(centerX, centerY, centerZ);
            
            // Use center z for depth sorting (more accurate)
            const depthZ = centerP.z;
            
            quads.push({
                points: [p1, p2, p3, p4],
                color: valueToColor(avgZ, minVal, maxVal, 1.0),
                avgZ: depthZ
            });
        }
    }
    
    // Sort quads by depth (back to front) - more accurate sorting
    quads.sort((a, b) => b.avgZ - a.avgZ);
    
    // Draw quads - colors already have transparency built in
    quads.forEach(quad => {
        ctx.fillStyle = quad.color;
        ctx.beginPath();
        ctx.moveTo(quad.points[0].x, quad.points[0].y);
        ctx.lineTo(quad.points[1].x, quad.points[1].y);
        ctx.lineTo(quad.points[2].x, quad.points[2].y);
        ctx.lineTo(quad.points[3].x, quad.points[3].y);
        ctx.closePath();
        ctx.fill();
    });

    // Draw wireframe grid on top for better visibility
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    const gridSteps = 10;
    const gridStepSize = (range * 2) / gridSteps;
    
    ctx.beginPath();
    for (let x = -range; x <= range; x += gridStepSize) {
        for (let y = -range; y <= range; y += gridStepSize/5) {
            const z = getZ(x, y);
            const p = transform(x, y, z);
            if (y === -range) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
    }
    for (let y = -range; y <= range; y += gridStepSize) {
        for (let x = -range; x <= range; x += gridStepSize/5) {
             const z = getZ(x, y);
             const p = transform(x, y, z);
             if (x === -range) ctx.moveTo(p.x, p.y);
             else ctx.lineTo(p.x, p.y);
        }
    }
    ctx.stroke();

    // 2. Draw Points with contrasting colors and outline (using animated positions)
    animatedPointsRef.current.forEach(pt => {
        const p = transform(pt.x, pt.y, pt.z);
        const radius = 3 * Math.sqrt(zoom);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        // Draw outline for better visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Draw filled point
        ctx.fillStyle = pt.color;
        ctx.fill();
    });

    // 3. Draw Target
    const center = transform(0, 0, 0);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4 * Math.sqrt(zoom), 0, Math.PI * 2);
    ctx.fill();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [points, range, rotation, zoom, pan, functionType, animationTick]);

  // Native wheel listener to prevent default scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const factor = 0.001;
        const delta = -e.deltaY * factor;
        setZoom(prev => Math.max(0.1, Math.min(10, prev + delta * 5)));
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Mouse Interactivity
  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (e.button === 2 || e.shiftKey) {
          dragType.current = 'pan';
      } else {
          dragType.current = 'rotate';
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      
      if (dragType.current === 'rotate') {
        setRotation(prev => ({
            x: prev.x + dy * 0.01,
            y: prev.y + dx * 0.01
        }));
      } else if (dragType.current === 'pan') {
          setPan(prev => ({
              x: prev.x + dx,
              y: prev.y + dy
          }));
      }
      lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      dragType.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  // Touch Handling
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      // Prevent default to avoid some browser weirdness, though touch-none handles most
      // e.preventDefault(); 
      
      if (e.touches.length === 1) {
          dragType.current = 'rotate';
          lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
          dragType.current = 'pan-zoom';
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          
          const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          initialPinchDistanceRef.current = dist;
          
          lastPinchCenterRef.current = {
              x: (t1.clientX + t2.clientX) / 2,
              y: (t1.clientY + t2.clientY) / 2
          };
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      // Stop propagation to prevent page scrolling if touch-none isn't enough (it usually is)
      // e.stopPropagation(); 
      
      if (dragType.current === 'rotate' && e.touches.length === 1 && lastTouchRef.current) {
          const t = e.touches[0];
          const dx = t.clientX - lastTouchRef.current.x;
          const dy = t.clientY - lastTouchRef.current.y;
          
          setRotation(prev => ({
              x: prev.x + dy * 0.01,
              y: prev.y + dx * 0.01
          }));
          
          lastTouchRef.current = { x: t.clientX, y: t.clientY };
          
      } else if (dragType.current === 'pan-zoom' && e.touches.length === 2 && initialPinchDistanceRef.current && lastPinchCenterRef.current) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          
          // 1. Zoom (Pinch)
          const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
          const distDelta = dist - initialPinchDistanceRef.current;
          
          // Sensitivity for zoom
          const zoomFactor = 0.005;
          setZoom(prev => Math.max(0.1, Math.min(10, prev + distDelta * zoomFactor)));
          
          initialPinchDistanceRef.current = dist; // Reset for incremental change

          // 2. Pan (Two-finger drag)
          const cx = (t1.clientX + t2.clientX) / 2;
          const cy = (t1.clientY + t2.clientY) / 2;
          
          const dx = cx - lastPinchCenterRef.current.x;
          const dy = cy - lastPinchCenterRef.current.y;
          
          setPan(prev => ({
              x: prev.x + dx,
              y: prev.y + dy
          }));
          
          lastPinchCenterRef.current = { x: cx, y: cy };
      }
  };

  const handleTouchEnd = () => {
      dragType.current = null;
      lastTouchRef.current = null;
      initialPinchDistanceRef.current = null;
      lastPinchCenterRef.current = null;
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full flex flex-col overflow-hidden">
      <h3 className="text-xs uppercase text-slate-400 mb-2 select-none flex justify-between">
          <span>{title}</span>
          <span className="text-[10px] opacity-50">L-Click: Rotate | R-Click/Shift: Pan | Scroll: Zoom</span>
      </h3>
      <div ref={containerRef}
           className="flex-1 min-h-0 relative cursor-move touch-none"
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
           onContextMenu={handleContextMenu}
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}
           onTouchCancel={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};


export default ThreeDScatter;
