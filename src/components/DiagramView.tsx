import React, { useState, useMemo, useRef } from 'react';
import { StoryNode, Connection } from '../types';

interface DiagramViewProps {
  projectName: string;
  nodes: StoryNode[];
  connections: Connection[];
  theme: 'cosmic' | 'warm';
}

export default function DiagramView({ projectName, nodes, connections, theme }: DiagramViewProps) {
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState({ x: 60, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Mobile finger touch state
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Geometry dimensions
  const COLUMN_WIDTH = 340;
  const ROW_HEIGHT = 180;
  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 140;

  // 1. Establish node types accurately
  const getNodeType = (node: StoryNode): 'start' | 'end' | 'variation' | 'description' => {
    if (node.nodeType) return node.nodeType;
    const color = (node.borderColor || '').toLowerCase();
    if (color === '#10b981' || color.includes('green')) return 'start';
    if (color === '#ef4444' || color.includes('red')) return 'end';
    if (color === '#f97316' || color.includes('orange')) return 'variation';
    return 'description';
  };

  const TYPE_COLORS: Record<string, string> = {
    start: '#10b981',
    end: '#ef4444',
    variation: '#f97316',
    description: '#3b82f6',
  };

  // 2. Build a Left-to-Right dynamic layout positioning tree
  const layoutNodes = useMemo(() => {
    if (nodes.length === 0) return [];

    // Find all starting nodes (either typed as 'start', or having 0 incoming connections)
    const incomingCount: Record<string, number> = {};
    nodes.forEach(n => { incomingCount[n.id] = 0; });
    connections.forEach(conn => {
      if (incomingCount[conn.toId] !== undefined) {
        incomingCount[conn.toId]++;
      }
    });

    const startNodes = nodes.filter(n => getNodeType(n) === 'start' || incomingCount[n.id] === 0);
    if (startNodes.length === 0 && nodes.length > 0) {
      startNodes.push(nodes[0]);
    }

    // Assign column levels to nodes usingBFS tracing
    const computedPositions: Record<string, { x: number; y: number; col: number; row: number }> = {};
    const colLists: Record<number, string[]> = {};

    const queue: { id: string; col: number }[] = startNodes.map(n => ({ id: n.id, col: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) {
        if (computedPositions[current.id].col < current.col) {
          computedPositions[current.id].col = current.col;
        }
        continue;
      }
      visited.add(current.id);

      computedPositions[current.id] = { x: 0, y: 0, col: current.col, row: 0 };

      // Find children
      const childrenConns = connections.filter(c => c.fromId === current.id);
      childrenConns.forEach(conn => {
        queue.push({ id: conn.toId, col: current.col + 1 });
      });
    }

    // Add any remaining unvisited nodes as default col 0
    nodes.forEach(n => {
      if (!computedPositions[n.id]) {
        computedPositions[n.id] = { x: 0, y: 0, col: 0, row: 0 };
      }
    });

    // Group nodes by columns
    Object.keys(computedPositions).forEach(id => {
      const pos = computedPositions[id];
      if (!colLists[pos.col]) {
        colLists[pos.col] = [];
      }
      colLists[pos.col].push(id);
    });

    // Position nodes to distribute vertically
    Object.keys(colLists).forEach(colKey => {
      const col = parseInt(colKey);
      const items = colLists[col];
      items.forEach((id, rowIdx) => {
        computedPositions[id].row = rowIdx;
        computedPositions[id].x = col * COLUMN_WIDTH;
        
        const verticalCenterOffset = (items.length - 1) * ROW_HEIGHT / 2;
        computedPositions[id].y = (rowIdx * ROW_HEIGHT) - verticalCenterOffset;
      });
    });

    return nodes.map(n => {
      const layout = computedPositions[n.id] || { x: 0, y: 0, col: 0, row: 0 };
      return {
        ...n,
        layoutX: layout.x,
        layoutY: layout.y,
        col: layout.col,
        row: layout.row
      };
    });
  }, [nodes, connections]);

  // Map to easily retrieve node layouts by id
  const layoutMap = useMemo(() => {
    const map: Record<string, typeof layoutNodes[0]> = {};
    layoutNodes.forEach(ln => {
      map[ln.id] = ln;
    });
    return map;
  }, [layoutNodes]);

  // Clamp function to prevent panning/dragging beyond boundaries
  const clampPan = (x: number, y: number, currentZoom: number) => {
    if (layoutNodes.length === 0) return { x, y };
    
    // Fallbacks if container has not rendered yet or has 0 measurements
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const xs = layoutNodes.map(n => n.layoutX);
    const ys = layoutNodes.map(n => n.layoutY);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + CARD_WIDTH;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + CARD_HEIGHT;

    // Margin buffer to always allow seeing the boundaries clearly
    const marginX = Math.max(160, containerWidth * 0.4);
    const marginY = Math.max(160, containerHeight * 0.4);

    const minPanX = -maxX * currentZoom + marginX;
    const maxPanX = containerWidth - minX * currentZoom - marginX;
    const minPanY = -maxY * currentZoom + marginY;
    const maxPanY = containerHeight - minY * currentZoom - marginY;

    return {
      x: Math.max(minPanX, Math.min(maxPanX, x)),
      y: Math.max(minPanY, Math.min(maxPanY, y)),
    };
  };

  // 3. Desktop Drag Zoom / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPan(clampPan(newX, newY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 4. Mobile Finger Touch Handlers for panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsTouching(true);
    setTouchStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - touchStart.x;
    const newY = touch.clientY - touchStart.y;
    setPan(clampPan(newX, newY, zoom));
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  // Desktop Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = e.deltaY < 0 ? 1.05 : 0.95;
    const nextZoom = Math.min(1.3, Math.max(0.6, zoom * scaleFactor));
    setZoom(nextZoom);
    setPan(p => clampPan(p.x, p.y, nextZoom));
  };

  // Determine line color rules
  const getConnectionColor = (conn: Connection) => {
    const fromNode = layoutMap[conn.fromId];
    const toNode = layoutMap[conn.toId];
    if (!fromNode || !toNode) return '#3b82f6';
    
    const fromType = getNodeType(fromNode);
    const toType = getNodeType(toNode);

    if (fromType === 'start') {
      return '#10b981'; // Green
    }
    
    return TYPE_COLORS[toType] || '#3b82f6';
  };

  // Trailing paths forward & helper highlighting selection
  const highlightSet = useMemo(() => {
    if (!selectedNodeId) return null;
    const set = new Set<string>();
    set.add(selectedNodeId);

    let changed = true;
    while(changed) {
      const sizeBefore = set.size;
      connections.forEach(conn => {
        if (set.has(conn.fromId)) set.add(conn.toId);
        if (set.has(conn.toId)) set.add(conn.fromId);
      });
      if (set.size === sizeBefore) changed = false;
    }
    return set;
  }, [selectedNodeId, connections]);

  return (
    <div id="diagram-view-tab" className="absolute inset-0 w-full h-full flex flex-col bg-[#020305] text-slate-200 overflow-hidden select-none">
      
      {/* Workspace Area with mouse & touch drag capabilities */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 relative overflow-hidden bg-[#020406] cursor-all-scroll active:cursor-grabbing"
      >
        {/* Dynamic viewport */}
        <div 
          className="absolute inset-0 origin-center pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: (isDragging || isTouching) ? 'none' : 'transform 0.15s cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
        >
          {/* Outlined System of connecting lines */}
          <svg className="absolute overflow-visible pointer-events-none w-1 h-1">
            <defs>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#10b981" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#3b82f6" />
              </marker>
              <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#f97316" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#1c253d" />
              </marker>
            </defs>

            {connections.map((conn) => {
              const fromLayout = layoutMap[conn.fromId];
              const toLayout = layoutMap[conn.toId];
              if (!fromLayout || !toLayout) return null;

              const fromType = getNodeType(fromLayout);
              const pathColor = getConnectionColor(conn);
              
              const isFocused = highlightSet === null || (highlightSet.has(conn.fromId) && highlightSet.has(conn.toId));
              const strokeOpacity = highlightSet === null || isFocused ? 1 : 0.15;
              const strokeWidth = highlightSet === null || isFocused ? 4 : 2; // Wide, thick straight lines!

              // Calculate linear straight/orthogonal pipe routes
              if (fromType === 'start') {
                // Comes out of the green block's top center
                const startX = fromLayout.layoutX + CARD_WIDTH / 2;
                const startY = fromLayout.layoutY;

                // Dotted at 45 degrees
                const angleDelta = 35;
                const midX = startX + angleDelta;
                const midY = startY - angleDelta;

                const endX = toLayout.layoutX;
                const endY = toLayout.layoutY + CARD_HEIGHT / 2;

                // Step continuing orthogonally to target input
                const stepX = endX - 45;

                return (
                  <g key={conn.id}>
                    {/* Glowing highlight under path */}
                    {isFocused && highlightSet !== null && (
                      <>
                        <path d={`M ${startX} ${startY} L ${midX} ${midY}`} fill="none" stroke={pathColor} strokeWidth={8} strokeOpacity={0.12} />
                        <path d={`M ${midX} ${midY} H ${stepX} V ${endY} H ${endX}`} fill="none" stroke={pathColor} strokeWidth={8} strokeOpacity={0.12} />
                      </>
                    )}
                    {/* 45 degree dotted green gradient launcher segment */}
                    <path
                      d={`M ${startX} ${startY} L ${midX} ${midY}`}
                      fill="none"
                      stroke={pathColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray="4 4"
                      className="transition-all duration-300"
                    />
                    {/* Thick solid wide green line representing pipeline */}
                    <path
                      d={`M ${midX} ${midY} H ${stepX} V ${endY} H ${endX}`}
                      fill="none"
                      stroke={pathColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      markerEnd="url(#arrow-green)"
                      className="transition-all duration-300"
                    />
                  </g>
                );
              } else {
                // Straight pipelines for blue, orange, red blocks
                const startX = fromLayout.layoutX + CARD_WIDTH;
                const startY = fromLayout.layoutY + CARD_HEIGHT / 2;

                const endX = toLayout.layoutX;
                const endY = toLayout.layoutY + CARD_HEIGHT / 2;

                const stepX = startX + (endX - startX) * 0.45;
                
                let markerSuffix = 'blue';
                if (pathColor === '#f97316') markerSuffix = 'orange';
                else if (pathColor === '#ef4444') markerSuffix = 'red';

                return (
                  <g key={conn.id}>
                    {/* Glowing path */}
                    {isFocused && highlightSet !== null && (
                      <path
                        d={`M ${startX} ${startY} H ${stepX} V ${endY} H ${endX}`}
                        fill="none"
                        stroke={pathColor}
                        strokeWidth={10}
                        strokeOpacity={0.12}
                        className="transition-all duration-300"
                      />
                    )}
                    {/* Thick straight lines */}
                    <path
                      d={`M ${startX} ${startY} H ${stepX} V ${endY} H ${endX}`}
                      fill="none"
                      stroke={isFocused ? pathColor : '#182035'}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      markerEnd={`url(#arrow-${isFocused ? markerSuffix : 'gray'})`}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              }
            })}
          </svg>

          {/* Cards & Blocks Group */}
          <div className="absolute overflow-visible pointer-events-auto">
            {layoutNodes.map((ln) => {
              const nodeType = getNodeType(ln);
              const hasImage = ln.media && ln.media.length > 0;
              const baseColor = TYPE_COLORS[nodeType] || '#3b82f6';
              const imageUrl = hasImage ? ln.media[0].dataUrl : null;
              
              const isFocused = highlightSet === null || highlightSet.has(ln.id);
              const isDirectlySelected = selectedNodeId === ln.id;
              const isDirectlyHovered = hoveredNodeId === ln.id;

              // Emerald green, royal blue, warm orange, and fiery red gradients
              let gradientClasses = 'from-[#0a1832] via-[#050e1e] to-[#01060c]'; // Blue
              if (nodeType === 'start') {
                gradientClasses = 'from-[#0b3c2e] via-[#041d16] to-[#010907]'; // Emerald Green
              } else if (nodeType === 'end') {
                gradientClasses = 'from-[#3a0d11] via-[#1c0608] to-[#0b0203]'; // Red
              } else if (nodeType === 'variation') {
                gradientClasses = 'from-[#35190b] via-[#190c05] to-[#090401]'; // Orange
              }

              return (
                <div
                  key={ln.id}
                  id={`diagram-node-${ln.id}`}
                  onClick={() => setSelectedNodeId(selectedNodeId === ln.id ? null : ln.id)}
                  onMouseEnter={() => setHoveredNodeId(ln.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="absolute rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 select-none group"
                  style={{
                    left: `${ln.layoutX}px`,
                    top: `${ln.layoutY}px`,
                    width: `${CARD_WIDTH}px`,
                    height: `${CARD_HEIGHT}px`,
                    borderColor: isDirectlySelected 
                      ? '#ffffff' 
                      : isDirectlyHovered 
                        ? baseColor 
                        : `${baseColor}60`,
                    borderWidth: isDirectlySelected ? '2.5px' : '1.5px',
                    boxShadow: isDirectlySelected 
                      ? `0 0 25px ${baseColor}40` 
                      : isFocused 
                        ? `0 6px 20px rgba(0,0,0,0.5)` 
                        : 'none',
                    opacity: isFocused ? 1 : 0.2,
                    transform: isDirectlyHovered ? 'translateY(-3px)' : 'translateY(0)',
                  }}
                >
                  {/* Background attached image if exists, else beautiful gradient */}
                  {imageUrl ? (
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={imageUrl}
                        alt="Block Art"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark overlay for rich script readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#010305]/95 via-[#010305]/70 to-[#010305]/30 backdrop-blur-[0.5px]" />
                    </div>
                  ) : (
                    // Pure gorgeous gradient aligning with block types
                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${gradientClasses}`}>
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `radial-gradient(${baseColor} 1.5px, transparent 1.5px)`,
                        backgroundSize: '14px 14px'
                      }} />
                    </div>
                  )}

                  {/* Read-Only text content - Header name and Scenario dialogue text *only* */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div>
                      {/* Name of the node */}
                      <h4 className="text-xs font-bold text-slate-100 tracking-tight line-clamp-1 font-sans">
                        {ln.title || 'Untitled Cell'}
                      </h4>
                    </div>

                    {/* Dialogue narrative text */}
                    <p className="text-[10px] text-slate-350 leading-relaxed font-sans line-clamp-4 italic mb-1">
                      {ln.script ? `"${ln.script}"` : '(Описание / сюжетный скрипт отсутствует)'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
