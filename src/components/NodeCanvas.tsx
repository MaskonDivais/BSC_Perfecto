import React, { useState, useRef, useEffect } from 'react';
import { StoryNode, Connection, MediaFile, Group } from '../types';
import StoryNodeComponent from './StoryNode';
import { 
  Plus, 
  RotateCcw, 
  Download, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  X, 
  ExternalLink, 
  FolderClosed, 
  FolderOpen,
  Folder,
  Image,
  ArrowLeft,
  Upload, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Settings,
  Check,
  Undo,
  Redo,
  Square,
  Menu,
  ChevronRight,
  Crosshair,
  Grid,
  Search
} from 'lucide-react';

interface NodeCanvasProps {
  nodes: StoryNode[];
  connections: Connection[];
  setNodes: React.Dispatch<React.SetStateAction<StoryNode[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  theme: 'classic' | 'cosmic';
}

export default function NodeCanvas({
  nodes,
  connections,
  setNodes,
  setConnections,
  groups = [],
  setGroups,
  theme = 'classic',
}: NodeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 100 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [globalBorderColor, setGlobalBorderColor] = useState<string>('#10b981'); 
  const [globalLineColor, setGlobalLineColor] = useState<string>('#10b981'); 
  const [globalBorderThickness, setGlobalBorderThickness] = useState<number>(2); 
  const [globalLineThickness, setGlobalLineThickness] = useState<number>(2.5); 
  const [globalLineDashed, setGlobalLineDashed] = useState<boolean>(false); 

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [spawnConfirm, setSpawnConfirm] = useState<{ fromId: string } | null>(null);

  const [moveMode, setMoveMode] = useState(false);

  const [showAutosaveToast, setShowAutosaveToast] = useState(false);

  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [activeDrag, setActiveDrag] = useState<{
    fromId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fromId?: string;
  } | null>(null);

  const [openDirNode, setOpenDirNode] = useState<StoryNode | null>(null);
  const [virtualExplorerFolderOpened, setVirtualExplorerFolderOpened] = useState<boolean>(false);
  const [currentSubfolder, setCurrentSubfolder] = useState<'root' | 'text' | 'images'>('root');

  const NODE_WIDTH = 288;
  const NODE_APPROX_HEIGHT = 270;
  const SOCKET_Y_OFFSET = NODE_APPROX_HEIGHT / 2;

  const [showHelp, setShowHelp] = useState(false);

  const [groupMode, setGroupMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isDrawingGroup, setIsDrawingGroup] = useState(false);
  const [groupStartPos, setGroupStartPos] = useState({ x: 0, y: 0 });
  const [groupDragCurrent, setGroupDragCurrent] = useState({ x: 0, y: 0 });

  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [groupDragOffset, setGroupDragOffset] = useState({ x: 0, y: 0 });
  const [originalNodePositions, setOriginalNodePositions] = useState<{ [nodeId: string]: { x: number; y: number } }>({});

  const [resizingGroupId, setResizingGroupId] = useState<string | null>(null);
  const [resizeStartCoords, setResizeStartCoords] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });

  const [activeGroupSettingsId, setActiveGroupSettingsId] = useState<string | null>(null);

  const [showDrawer, setShowDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [past, setPast] = useState<{ nodes: StoryNode[]; connections: Connection[]; groups: Group[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: StoryNode[]; connections: Connection[]; groups: Group[] }[]>([]);

  const saveToPast = (
    nodesState: StoryNode[] = nodes, 
    connectionsState: Connection[] = connections,
    groupsState: Group[] = groups
  ) => {
    const nodesClone = JSON.parse(JSON.stringify(nodesState));
    const connectionsClone = JSON.parse(JSON.stringify(connectionsState));
    const groupsClone = JSON.parse(JSON.stringify(groupsState));
    setPast((prev) => {
      const nextPast = [...prev, { nodes: nodesClone, connections: connectionsClone, groups: groupsClone }];
      if (nextPast.length > 3) {
        return nextPast.slice(nextPast.length - 3);
      }
      return nextPast;
    });
    setFuture([]);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previousState = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    const currentNodesClone = JSON.parse(JSON.stringify(nodes));
    const currentConnectionsClone = JSON.parse(JSON.stringify(connections));
    const currentGroupsClone = JSON.parse(JSON.stringify(groups));
    setFuture((prev) => [{ nodes: currentNodesClone, connections: currentConnectionsClone, groups: currentGroupsClone }, ...prev]);

    setPast(newPast);
    setNodes(previousState.nodes);
    setConnections(previousState.connections);
    setGroups(previousState.groups || []);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[0];
    const newFuture = future.slice(1);

    const currentNodesClone = JSON.parse(JSON.stringify(nodes));
    const currentConnectionsClone = JSON.parse(JSON.stringify(connections));
    const currentGroupsClone = JSON.parse(JSON.stringify(groups));
    setPast((prev) => [...prev, { nodes: currentNodesClone, connections: currentConnectionsClone, groups: currentGroupsClone }]);

    setFuture(newFuture);
    setNodes(nextState.nodes);
    setConnections(nextState.connections);
    setGroups(nextState.groups || []);
  };

  const centerOnElement = (x: number, y: number, width: number, height: number) => {
    let containerWidth = 800;
    let containerHeight = 600;
    if (canvasRef.current) {
      containerWidth = canvasRef.current.clientWidth || 800;
      containerHeight = canvasRef.current.clientHeight || 600;
    }

    const targetCenterX = x + width / 2;
    const targetCenterY = y + height / 2;

    const paddingMultiplier = 0.70;
    const zoomX = (containerWidth * paddingMultiplier) / width;
    const zoomY = (containerHeight * paddingMultiplier) / height;

    const targetZoom = Math.min(1.1, Math.max(0.3, Math.min(zoomX, zoomY)));

    const newPanX = containerWidth / 2 - targetCenterX * targetZoom;
    const newPanY = containerHeight / 2 - targetCenterY * targetZoom;

    setZoom(targetZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const [nodeToDeleteId, setNodeToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      let filesSaved = false;
      setNodes((prevNodes) => {
        const anyUnsaved = prevNodes.some((n) => !n.isSaved);
        if (anyUnsaved) {
          filesSaved = true;
          return prevNodes.map((n) => ({ ...n, isSaved: true }));
        }
        return prevNodes;
      });

      if (filesSaved) {
        setShowAutosaveToast(true);
        const hideTimer = setTimeout(() => setShowAutosaveToast(false), 3000);
        return () => clearTimeout(hideTimer);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [nodes]);

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    saveToPast();

    const adj: { [key: string]: string[] } = {};
    const incomingCount: { [key: string]: number } = {};

    nodes.forEach((n) => {
      adj[n.id] = [];
      incomingCount[n.id] = 0;
    });

    connections.forEach((conn) => {
      if (adj[conn.fromId] && adj[conn.toId]) {
        adj[conn.fromId].push(conn.toId);
        incomingCount[conn.toId] = (incomingCount[conn.toId] || 0) + 1;
      }
    });

    let roots = nodes.filter((n) => (incomingCount[n.id] || 0) === 0);
    if (roots.length === 0) {
      let maxOutgoing = -1;
      let bestNode = nodes[0];
      nodes.forEach((n) => {
        const outSize = adj[n.id]?.length || 0;
        if (outSize > maxOutgoing) {
          maxOutgoing = outSize;
          bestNode = n;
        }
      });
      roots = [bestNode];
    }

    const level: { [key: string]: number } = {};
    const visited = new Set<string>();

    const assignDepths = (startNodes: StoryNode[]) => {
      const queue: { id: string; depth: number }[] = startNodes.map((n) => ({ id: n.id, depth: 0 }));

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) {
          if (current.depth > (level[current.id] || 0)) {
            level[current.id] = current.depth;
            const children = adj[current.id] || [];
            children.forEach((child) => {
              queue.push({ id: child, depth: current.depth + 1 });
            });
          }
          continue;
        }

        visited.add(current.id);
        level[current.id] = Math.max(level[current.id] || 0, current.depth);

        const children = adj[current.id] || [];
        children.forEach((child) => {
          queue.push({ id: child, depth: current.depth + 1 });
        });
      }
    };

    assignDepths(roots);

    let unvisitedNodes = nodes.filter((n) => !visited.has(n.id));
    while (unvisitedNodes.length > 0) {
      assignDepths([unvisitedNodes[0]]);
      unvisitedNodes = nodes.filter((n) => !visited.has(n.id));
    }

    const columns: { [level: number]: string[] } = {};
    nodes.forEach((n) => {
      const dp = level[n.id] || 0;
      if (!columns[dp]) {
        columns[dp] = [];
      }
      columns[dp].push(n.id);
    });

    const HORIZONTAL_GAP = 360;
    const VERTICAL_GAP = 300;
    const START_X = 150;
    const CENTER_Y = 320;

    const newPositions: { [key: string]: { x: number; y: number } } = {};

    Object.keys(columns).forEach((colKey) => {
      const colDepth = parseInt(colKey, 10);
      const nodeIds = columns[colDepth];
      const count = nodeIds.length;

      nodeIds.forEach((id, index) => {
        const x = START_X + colDepth * HORIZONTAL_GAP;
        const totalHeight = (count - 1) * VERTICAL_GAP;
        const y = CENTER_Y - totalHeight / 2 + index * VERTICAL_GAP;
        newPositions[id] = { x, y };
      });
    });

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: newPositions[n.id] ? newPositions[n.id].x : n.x,
        y: newPositions[n.id] ? newPositions[n.id].y : n.y,
      }))
    );
  };

  const handleAddNewNode = (x: number, y: number, connectedFromId?: string) => {
    saveToPast();
    const newId = `node_${Math.random().toString(36).substring(2, 7)}`;
    const count = nodes.length + 1;

    let bColor = globalBorderColor;
    let lColor = globalLineColor;
    let bThickness = globalBorderThickness;
    let lThickness = globalLineThickness;
    let lDashed = globalLineDashed;

    if (connectedFromId) {
      const parentNode = nodes.find((p) => p.id === connectedFromId);
      if (parentNode) {
        bColor = parentNode.borderColor || parentNode.lineColor || globalBorderColor;
        lColor = parentNode.lineColor || globalLineColor;
        bThickness = parentNode.borderThickness !== undefined ? parentNode.borderThickness : globalBorderThickness;
        lThickness = parentNode.lineThickness !== undefined ? parentNode.lineThickness : globalLineThickness;
        lDashed = parentNode.lineDashed !== undefined ? parentNode.lineDashed : globalLineDashed;
        
        setGlobalBorderColor(bColor);
        setGlobalLineColor(lColor);
        setGlobalBorderThickness(bThickness);
        setGlobalLineThickness(lThickness);
        setGlobalLineDashed(lDashed);
      }
    }

    const newNode: StoryNode = {
      id: newId,
      title: '',
      x: x,
      y: y,
      script: '',
      tag: 'dialogue',
      media: [],
      isSaved: false,
      borderColor: bColor,
      lineColor: lColor,
      borderThickness: bThickness,
      lineThickness: lThickness,
      lineDashed: lDashed,
    };

    setNodes((prev) => [...prev, newNode]);

    if (connectedFromId) {
      const newConnection: Connection = {
        id: `conn_${Math.random().toString(36).substring(2, 7)}`,
        fromId: connectedFromId,
        toId: newId,
        color: lColor,
      };
      setConnections((prev) => [...prev, newConnection]);
    }

    setContextMenu(null);
  };

  const findFreeSpace = (fromNodeX: number, fromNodeY: number) => {
    let candidateX = fromNodeX + 340;
    let candidateY = fromNodeY;
    let overlapFound = true;
    let attempts = 0;

    while (overlapFound && attempts < 25) {
      overlapFound = false;
      for (const n of nodes) {
        const dist = Math.hypot(n.x - candidateX, n.y - candidateY);
        if (dist < 185) {
          overlapFound = true;
          candidateY += 130;
          candidateX += 50;
          break;
        }
      }
      attempts++;
    }
    return { x: candidateX, y: candidateY };
  };

  const getClientCoords = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;
    return { x, y };
  };

  const handleGroupMouseDown = (e: React.MouseEvent, group: Group) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('[id^="story-node-card-"]')) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDraggingGroupId(group.id);
    setGroupDragOffset({ x: coords.x - group.x, y: coords.y - group.y });

    const nodesInGroup = nodes.filter((n) => {
      return (
        n.x >= group.x &&
        n.x <= group.x + group.width &&
        n.y >= group.y &&
        n.y <= group.y + group.height
      );
    });

    const offsets: { [nodeId: string]: { x: number; y: number } } = {};
    nodesInGroup.forEach((n) => {
      offsets[n.id] = {
        x: n.x - group.x,
        y: n.y - group.y,
      };
    });
    setOriginalNodePositions(offsets);
    saveToPast();
  };

  const handleGroupResizeMouseDown = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    e.preventDefault();
    saveToPast();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setResizingGroupId(group.id);
    setResizeStartCoords({ x: coords.x, y: coords.y });
    setResizeStartSize({ width: group.width, height: group.height });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (groupMode) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setIsDrawingGroup(true);
      setGroupStartPos({ x: coords.x, y: coords.y });
      setGroupDragCurrent({ x: coords.x, y: coords.y });
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (target.closest('.nodrag') || target.closest('[id^="story-node-card-"]') || target.closest('[id^="story-group-box-"]')) {
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setContextMenu(null);
      setSelectedConnectionId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDrawingGroup) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setGroupDragCurrent({ x: coords.x, y: coords.y });
      return;
    }

    if (resizingGroupId !== null) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const dx = coords.x - resizeStartCoords.x;
      const dy = coords.y - resizeStartCoords.y;

      const newWidth = Math.max(100, resizeStartSize.width + dx);
      const newHeight = Math.max(80, resizeStartSize.height + dy);

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === resizingGroupId) {
            return { ...g, width: newWidth, height: newHeight };
          }
          return g;
        })
      );
      return;
    }

    if (draggingGroupId !== null) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const nextGroupX = coords.x - groupDragOffset.x;
      const nextGroupY = coords.y - groupDragOffset.y;

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === draggingGroupId) {
            return { ...g, x: nextGroupX, y: nextGroupY };
          }
          return g;
        })
      );

      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (originalNodePositions[n.id] !== undefined) {
            const offset = originalNodePositions[n.id];
            return {
              ...n,
              x: nextGroupX + offset.x,
              y: nextGroupY + offset.y,
            };
          }
          return n;
        })
      );
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNodeId !== null) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const rawX = coords.x - dragOffset.x;
      const rawY = coords.y - dragOffset.y;
      const finalX = snapToGrid ? Math.round(rawX / 20) * 20 : rawX;
      const finalY = snapToGrid ? Math.round(rawY / 20) * 20 : rawY;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: finalX, y: finalY }
            : n
        )
      );
      return;
    }

    if (activeDrag) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const snapped = getSnappedCoords(coords.x, coords.y, activeDrag.fromId);
      setActiveDrag({
        ...activeDrag,
        currentX: snapped.x,
        currentY: snapped.y,
      });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isDrawingGroup) {
      setIsDrawingGroup(false);
      const x = Math.min(groupStartPos.x, groupDragCurrent.x);
      const y = Math.min(groupStartPos.y, groupDragCurrent.y);
      const width = Math.max(20, Math.abs(groupStartPos.x - groupDragCurrent.x));
      const height = Math.max(20, Math.abs(groupStartPos.y - groupDragCurrent.y));
      if (width > 30 && height > 30) {
        saveToPast();
        const newGroup: Group = {
          id: `group_${Math.random().toString(36).substring(2, 7)}`,
          title: `Group ${groups.length + 1}`,
          x,
          y,
          width,
          height,
          color: '#3b82f6',
        };
        setGroups((prev) => [...prev, newGroup]);
      }
      setGroupMode(false);
      return;
    }

    if (resizingGroupId !== null) {
      setResizingGroupId(null);
      return;
    }

    if (draggingGroupId !== null) {
      setDraggingGroupId(null);
      setOriginalNodePositions({});
      return;
    }

    setIsPanning(false);
    setDraggingNodeId(null);

    if (activeDrag) {
      const duration = Date.now() - dragStartTime;
      const currentCoords = getClientCoords(e);
      const dist = Math.hypot(currentCoords.clientX - dragStartPos.x, currentCoords.clientY - dragStartPos.y);

      if (duration < 240 && dist < 12) {
        const fromNode = nodes.find((n) => n.id === activeDrag.fromId);
        if (fromNode) {
          setSpawnConfirm({ fromId: activeDrag.fromId });
        }
        setActiveDrag(null);
        return;
      }

      const snapped = getSnappedCoords(activeDrag.currentX, activeDrag.currentY, activeDrag.fromId);
      const hoverNode = snapped.snappedNodeId
        ? nodes.find((n) => n.id === snapped.snappedNodeId) || null
        : findSocketUnderCoords(activeDrag.currentX, activeDrag.currentY);

      if (hoverNode && hoverNode.id !== activeDrag.fromId) {
        const connectionExists = connections.some(
          (c) => c.fromId === activeDrag.fromId && c.toId === hoverNode.id
        );

        if (!connectionExists) {
          const newConnection: Connection = {
            id: `conn_${Math.random().toString(36).substring(2, 7)}`,
            fromId: activeDrag.fromId,
            toId: hoverNode.id,
          };
          saveToPast();
          setConnections((prev) => [...prev, newConnection]);
        }
      } else {
        handleAddNewNode(activeDrag.currentX - NODE_WIDTH / 2, activeDrag.currentY - 135, activeDrag.fromId);
      }
      setActiveDrag(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.nodrag') || target.closest('[id^="story-node-card-"]')) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    handleAddNewNode(coords.x - NODE_WIDTH / 2, coords.y - 120);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      if (target.closest('.nodrag') || target.closest('[id^="story-node-card-"]')) {
        return;
      }
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      setContextMenu(null);
      setSelectedConnectionId(null);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDist;
      setZoom(Math.min(Math.max(touchStartZoom * ratio, 0.2), 2));
      e.preventDefault();
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isPanning) {
        setPanOffset({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
      } else if (draggingNodeId !== null) {
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        const rawX = coords.x - dragOffset.x;
        const rawY = coords.y - dragOffset.y;
        const finalX = snapToGrid ? Math.round(rawX / 20) * 20 : rawX;
        const finalY = snapToGrid ? Math.round(rawY / 20) * 20 : rawY;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId
              ? { ...n, x: finalX, y: finalY }
              : n
          )
        );
      } else if (activeDrag) {
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        const snapped = getSnappedCoords(coords.x, coords.y, activeDrag.fromId);
        setActiveDrag({
          ...activeDrag,
          currentX: snapped.x,
          currentY: snapped.y,
        });
      }
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    setTouchStartDist(null);
    setIsPanning(false);
    setDraggingNodeId(null);

    if (activeDrag) {
      const duration = Date.now() - dragStartTime;
      const currentCoords = getClientCoords(e);
      const dist = Math.hypot(currentCoords.clientX - dragStartPos.x, currentCoords.clientY - dragStartPos.y);

      if (duration < 240 && dist < 12) {
        const fromNode = nodes.find((n) => n.id === activeDrag.fromId);
        if (fromNode) {
          setSpawnConfirm({ fromId: activeDrag.fromId });
        }
        setActiveDrag(null);
        return;
      }

      const snapped = getSnappedCoords(activeDrag.currentX, activeDrag.currentY, activeDrag.fromId);
      const hoverNode = snapped.snappedNodeId
        ? nodes.find((n) => n.id === snapped.snappedNodeId) || null
        : findSocketUnderCoords(activeDrag.currentX, activeDrag.currentY);

      if (hoverNode && hoverNode.id !== activeDrag.fromId) {
        const connectionExists = connections.some(
          (c) => c.fromId === activeDrag.fromId && c.toId === hoverNode.id
        );
        if (!connectionExists) {
          const newConnection: Connection = {
            id: `conn_${Math.random().toString(36).substring(2, 7)}`,
            fromId: activeDrag.fromId,
            toId: hoverNode.id,
          };
          saveToPast();
          setConnections((prev) => [...prev, newConnection]);
        }
      } else {
        handleAddNewNode(activeDrag.currentX - NODE_WIDTH / 2, activeDrag.currentY - 135, activeDrag.fromId);
      }
      setActiveDrag(null);
    }
  };

  const getSnappedCoords = (rawX: number, rawY: number, fromId: string) => {
    const snapRadius = 120;
    let bestNode: StoryNode | null = null;
    let minDist = snapRadius;

    for (const node of nodes) {
      if (node.id === fromId) continue;
      const sx = node.x;
      const sy = node.y + SOCKET_Y_OFFSET;
      const dist = Math.hypot(rawX - sx, rawY - sy);
      if (dist < minDist) {
        minDist = dist;
        bestNode = node;
      }
    }

    if (bestNode) {
      return {
        x: bestNode.x,
        y: bestNode.y + SOCKET_Y_OFFSET,
        snappedNodeId: bestNode.id
      };
    }

    return { x: rawX, y: rawY, snappedNodeId: null };
  };

  const findSocketUnderCoords = (cx: number, cy: number): StoryNode | null => {
    const threshold = 34;
    for (const node of nodes) {
      const sx = node.x;
      const sy = node.y + SOCKET_Y_OFFSET;
      const dist = Math.hypot(cx - sx, cy - sy);
      if (dist < threshold) return node;
    }
    return null;
  };

  const handleNodeUpdate = (id: string, updates: Partial<StoryNode>) => {
    if (updates.fields || updates.media || updates.title !== undefined || updates.tag !== undefined || updates.borderColor || updates.lineColor) {
      saveToPast();
    }
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    if (updates.borderColor) {
      setGlobalBorderColor(updates.borderColor);
    }
    if (updates.lineColor) {
      setGlobalLineColor(updates.lineColor);
    }
    if (updates.borderThickness !== undefined) {
      setGlobalBorderThickness(updates.borderThickness);
    }
    if (updates.lineThickness !== undefined) {
      setGlobalLineThickness(updates.lineThickness);
    }
    if (updates.lineDashed !== undefined) {
      setGlobalLineDashed(updates.lineDashed);
    }
  };

  const handleDeleteNode = (id: string) => {
    setNodeToDeleteId(id);
  };

  const handleStartConnectionDrag = (fromNodeId: string, e: React.MouseEvent | React.TouchEvent) => {
    const node = nodes.find((n) => n.id === fromNodeId);
    if (!node) return;

    const startX = node.x + NODE_WIDTH;
    const startY = node.y + SOCKET_Y_OFFSET;

    const coords = getClientCoords(e);
    setDragStartTime(Date.now());
    setDragStartPos({ x: coords.clientX, y: coords.clientY });

    setActiveDrag({
      fromId: fromNodeId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
  };

  const getCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const controlOffset = Math.max(Math.abs(dx) * 0.5, 40);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.2), 2));
  };

  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('textarea') || target.closest('button') || target.closest('select') || target.closest('.nodrag')) {
      return;
    }

    const factor = e.deltaY < 0 ? 1.05 : 0.95;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(prevZoom * factor, 0.25), 2.5);
        setPanOffset((prevPan) => {
          const dx = mouseX - prevPan.x;
          const dy = mouseY - prevPan.y;
          return {
            x: mouseX - dx * (nextZoom / prevZoom),
            y: mouseY - dy * (nextZoom / prevZoom),
          };
        });
        return nextZoom;
      });
    }
  };

  const fitAllNodes = () => {
    if (!nodes || nodes.length === 0) {
      setPanOffset({ x: 120, y: 120 });
      setZoom(1);
      return;
    }

    let containerWidth = 800;
    let containerHeight = 600;
    if (canvasRef.current) {
      containerWidth = canvasRef.current.clientWidth || 800;
      containerHeight = canvasRef.current.clientHeight || 600;
    }

    const nodeWidth = 288;
    const nodeHeight = 350;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + nodeWidth);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + nodeHeight);
    });

    const padding = 80;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;

    const zoomX = (containerWidth * 0.85) / contentWidth;
    const zoomY = (containerHeight * 0.85) / contentHeight;
    let targetZoom = Math.min(zoomX, zoomY);

    if (nodes.length === 1) {
      targetZoom = 0.95;
    } else {
      targetZoom = Math.min(Math.max(targetZoom, 0.35), 1.25);
    }

    const newPanX = containerWidth / 2 - centerX * targetZoom;
    const newPanY = containerHeight / 2 - centerY * targetZoom;

    setZoom(targetZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleResetGrid = () => {
    fitAllNodes();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fitAllNodes();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const getMarkerId = (colorHex?: string) => {
    if (colorHex === '#ea580c') return 'arrow-orange';
    if (colorHex === '#8b5cf6') return 'arrow-purple';
    if (colorHex === '#0284c7') return 'arrow-blue';
    if (colorHex === '#d97706') return 'arrow-yellow';
    if (colorHex === '#dc2626') return 'arrow-red';
    if (colorHex === '#64748b') return 'arrow-slate';
    return 'arrow-emerald';
  };

  const handleDeleteConnection = (connId: string) => {
    saveToPast();
    setConnections((prev) => prev.filter((c) => c.id !== connId));
  };

  const handleDownloadStructuredZip = (nodeToDl: StoryNode) => {
    const flds = nodeToDl.fields && nodeToDl.fields.length > 0 ? nodeToDl.fields : [
      { id: 'f-fallback-media', type: 'media' as const, name: 'Media Files', mediaValue: nodeToDl.media || [] },
      { id: 'f-fallback-text', type: 'text' as const, name: 'Plot Script', textValue: nodeToDl.script || '' }
    ];

    flds.forEach((f) => {
      if (f.type === 'text') {
        const titleSafe = (f.name || 'text_section').trim().replace(/[^a-z0-9_\-\(\)]/gi, '_');
        const txtContent = f.textValue || 'No script writing inside cell.';
        const element = document.createElement("a");
        const file = new Blob([txtContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${titleSafe}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else if (f.type === 'media' && f.mediaValue) {
        f.mediaValue.forEach((m) => {
          const dler = document.createElement("a");
          dler.href = m.dataUrl;
          dler.download = m.name;
          document.body.appendChild(dler);
          dler.click();
          document.body.removeChild(dler);
        });
      }
    });
  };

  const isNodeInGroup = (node: StoryNode, group: Group) => {
    return (
      node.x >= group.x &&
      node.x <= group.x + group.width &&
      node.y >= group.y &&
      node.y <= group.y + group.height
    );
  };

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (g.title.toLowerCase().includes(query)) return true;
    
    const hasMatchingNode = nodes.some((node) => {
      const isInside = isNodeInGroup(node, g);
      const fieldMatch = node.fields?.some((f) => f.textValue?.toLowerCase().includes(query));
      return isInside && (
        node.title.toLowerCase().includes(query) ||
        node.script.toLowerCase().includes(query) ||
        (fieldMatch ?? false)
      );
    });
    
    return hasMatchingNode;
  });

  const filteredNodes = [...nodes].filter((node) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (node.title.toLowerCase().includes(query)) return true;
    
    const isInMatchingGroup = groups.some((g) => {
      return isNodeInGroup(node, g) && g.title.toLowerCase().includes(query);
    });
    if (isInMatchingGroup) return true;
    
    if (node.script.toLowerCase().includes(query)) return true;
    if (node.fields?.some((field) => field.textValue?.toLowerCase().includes(query))) return true;
    
    return false;
  }).sort((a, b) => {
    if (!searchQuery) return 0;
    const query = searchQuery.toLowerCase();
    
    const getScore = (node: StoryNode) => {
      let score = 0;
      const titleLower = node.title.toLowerCase();
      
      if (titleLower.startsWith(query)) score += 100;
      else if (titleLower.includes(query)) score += 50;
      
      if (node.script.toLowerCase().startsWith(query)) score += 30;
      else if (node.script.toLowerCase().includes(query)) score += 15;
      
      const fieldMatch = node.fields?.some((f) => f.textValue?.toLowerCase().includes(query));
      if (fieldMatch) score += 15;
      
      const inMatchingGroup = groups.some((g) => {
        return isNodeInGroup(node, g) && g.title.toLowerCase().includes(query);
      });
      if (inMatchingGroup) score += 10;
      
      return score;
    };
    
    return getScore(b) - getScore(a);
  });

  return (
    <div className="relative w-full h-full bg-[#08090d] select-none overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <button
          id="btn-undo"
          onClick={handleUndo}
          disabled={past.length === 0}
          className={`p-1.5 rounded-lg border shadow-xl transition-all flex items-center justify-center shrink-0 ${
            past.length > 0
              ? 'bg-[#131622] hover:bg-[#1f2538] border-[#2c334e] text-slate-200 hover:text-white cursor-pointer active:scale-95'
              : 'bg-[#090a10] border-[#161a29] text-slate-700 cursor-not-allowed'
          }`}
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          id="btn-redo"
          onClick={handleRedo}
          disabled={future.length === 0}
          className={`p-1.5 rounded-lg border shadow-xl transition-all flex items-center justify-center shrink-0 ${
            future.length > 0
              ? 'bg-[#131622] hover:bg-[#1f2538] border-[#2c334e] text-slate-200 hover:text-white cursor-pointer active:scale-95'
              : 'bg-[#090a10] border-[#161a29] text-slate-700 cursor-not-allowed'
          }`}
        >
          <Redo className="w-4 h-4" />
        </button>

        <button
          id="btn-sidebar-burger"
          onClick={() => setShowDrawer(!showDrawer)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-xs font-semibold rounded-lg shadow-xl cursor-pointer transition-all border ${
            showDrawer
              ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold active:scale-95'
              : 'bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300'
          }`}
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Navigator</span>
        </button>

        <div className="h-5 w-[1px] bg-[#1d2238] mx-0.5 shrink-0" />

        <button
          id="btn-toggle-move-mode"
          onClick={() => {
            setMoveMode(!moveMode);
            setSelectedConnectionId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-lg shadow-xl cursor-pointer transition-all border ${
            moveMode
              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold active:scale-95'
              : 'bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300'
          }`}
        >
          <span>Move</span>
        </button>

        <button
          id="btn-toggle-group-mode"
          onClick={() => {
            setGroupMode(!groupMode);
            setMoveMode(false);
            setSelectedConnectionId(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-lg shadow-xl cursor-pointer transition-all border ${
            groupMode
              ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold active:scale-95'
              : 'bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Group</span>
        </button>

        <button
          id="btn-node-auto-layout"
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-lg shadow-xl cursor-pointer transition-all border bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300 active:scale-95"
          title="Auto-align and organize all cards hierarchically"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>auto</span>
        </button>

        <button
          id="btn-toggle-snap-grid"
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold rounded-lg shadow-xl cursor-pointer transition-all border ${
            snapToGrid
              ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 font-bold active:scale-95'
              : 'bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300'
          }`}
          title="Toggle alignment to 20px grid"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>grid</span>
        </button>

        <button
          id="btn-settings-toggle"
          onClick={() => {
            setShowSettings(!showSettings);
            setOpenDirNode(null);
            setShowHelp(false);
          }}
          className={`px-2.5 py-1.5 rounded-lg border shadow-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-semibold ${
            showSettings
              ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold active:scale-95'
              : 'bg-[#131622] hover:bg-[#1f2538] border-slate-800 text-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      <div
        id="infinite-grid-base"
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
        className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing outline-none overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.18) 1.5px, transparent 1.5px)',
          backgroundSize: `${(snapToGrid ? 20 : 24) * zoom}px ${(snapToGrid ? 20 : 24) * zoom}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      >
        <div
          id="canvas-nodes-container"
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate3d(${Math.round(panOffset.x)}px, ${Math.round(panOffset.y)}px, 0) scale(${zoom})`,
          }}
        >
          {groups.map((group) => {
            const isDraggingThisGroup = draggingGroupId === group.id;
            const borderThickVal = group.borderWidth !== undefined ? group.borderWidth : 2;
            const borderStyleVal = group.borderStyle || 'dashed';
            const groupColorVal = group.color || '#3b82f6';
            
            return (
              <div
                key={group.id}
                id={`story-group-box-${group.id}`}
                className={`absolute rounded-2xl transition-all ${
                  isDraggingThisGroup ? 'shadow-[0_20px_50px_rgba(59,130,246,0.2)] ring-2 ring-blue-500/10' : 'shadow-lg'
                } pointer-events-auto select-none bg-slate-950/5 hover:bg-slate-900/[0.01]`}
                style={{
                  left: group.x,
                  top: group.y,
                  width: group.width,
                  height: group.height,
                  borderWidth: `${borderThickVal}px`,
                  borderColor: groupColorVal,
                  borderStyle: borderStyleVal,
                  zIndex: 2,
                }}
                onMouseDown={(e) => handleGroupMouseDown(e, group)}
              >
                <div 
                  className="absolute top-3 left-3 flex items-center gap-1.5 max-w-full nodrag z-20"
                  onMouseDown={(e) => e.stopPropagation()} 
                >
                  <input
                    type="text"
                    value={group.title}
                    onChange={(e) => {
                      setGroups((prev) =>
                        prev.map((g) => (g.id === group.id ? { ...g, title: e.target.value } : g))
                      );
                    }}
                    className="bg-[#0b0e17]/95 border border-[#1e233b] hover:border-slate-700 focus:border-blue-500 rounded px-2.5 py-1 text-xs font-mono font-extrabold text-blue-400 focus:text-white focus:bg-[#080a10] focus:outline-none w-36 truncate transition-all shadow-md"
                    placeholder="Rename Group..."
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGroupSettingsId(activeGroupSettingsId === group.id ? null : group.id);
                    }}
                    className={`p-1 hover:bg-slate-900 text-slate-400 hover:text-white bg-[#0b0e17]/95 rounded-lg border border-[#1e233b] transition-colors cursor-pointer flex items-center justify-center`}
                    style={{ width: '26px', height: '26px' }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveToPast();
                      setGroups((prev) => prev.filter((g) => g.id !== group.id));
                    }}
                    className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-400 bg-[#0b0e17]/95 rounded-lg border border-[#1e233b] transition-colors cursor-pointer flex items-center justify-center"
                    style={{ width: '26px', height: '26px' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {activeGroupSettingsId === group.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={(e) => { e.stopPropagation(); setActiveGroupSettingsId(null); }} 
                      />
                      
                      <div className="absolute top-full left-0 mt-2 w-64 bg-[#0a0d17] border border-[#21283d] rounded-xl shadow-2xl p-3.5 z-50 animate-fade-in flex flex-col gap-3 text-[11px] select-none text-slate-300">
                        <div className="flex items-center justify-between border-b border-[#21283d] pb-1.5">
                          <span className="font-mono font-bold text-blue-400 tracking-wider">GROUP STYLING</span>
                          <button 
                            onClick={() => setActiveGroupSettingsId(null)}
                            className="text-slate-500 hover:text-white text-[10px] font-mono cursor-pointer"
                          >
                            Close
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500">BORDER COLOR</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: 'Blue', hex: '#3b82f6' },
                              { label: 'Emerald', hex: '#10b981' },
                              { label: 'Amber', hex: '#f59e0b' },
                              { label: 'Crimson', hex: '#ef4444' },
                              { label: 'Pink', hex: '#ec4899' },
                              { label: 'Indigo', hex: '#6366f1' },
                              { label: 'Slate', hex: '#64748b' }
                            ].map((clr) => (
                              <button
                                key={clr.hex}
                                onClick={() => {
                                  setGroups((prev) =>
                                    prev.map((g) => (g.id === group.id ? { ...g, color: clr.hex } : g))
                                  );
                                }}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95`}
                                style={{ 
                                  backgroundColor: clr.hex, 
                                  borderColor: groupColorVal === clr.hex ? '#ffffff' : 'rgba(255,255,255,0.1)' 
                                }}
                                title={clr.label}
                              >
                                {groupColorVal === clr.hex && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500">LINE DEF</span>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 'solid', label: 'Solid' },
                              { id: 'dashed', label: 'Dashed' },
                              { id: 'dotted', label: 'Dotted' }
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={() => {
                                  setGroups((prev) =>
                                    prev.map((g) => (g.id === group.id ? { ...g, borderStyle: st.id as any } : g))
                                  );
                                }}
                                className={`py-1 text-[10px] font-mono rounded cursor-pointer border transition-colors ${
                                  borderStyleVal === st.id 
                                    ? 'bg-blue-600/20 text-white border-blue-500/40' 
                                    : 'bg-slate-950/40 text-slate-400 hover:text-white border-slate-800/80'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500">BORDER WIDTH</span>
                          <div className="flex items-center gap-1 bg-slate-950/40 border border-slate-800/80 rounded p-0.5">
                            {[1, 2, 3, 4, 6].map((thick) => (
                              <button
                                key={thick}
                                onClick={() => {
                                  setGroups((prev) =>
                                    prev.map((g) => (g.id === group.id ? { ...g, borderWidth: thick } : g))
                                  );
                                }}
                                className={`flex-1 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                                  borderThickVal === thick
                                    ? 'bg-blue-600/30 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {thick}px
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className="absolute bottom-1 right-1 w-5 h-5 flex items-center justify-center cursor-se-resize hover:scale-110 active:scale-95 text-slate-500 hover:text-blue-400 select-none z-30 transition-transform nodrag"
                  onMouseDown={(e) => handleGroupResizeMouseDown(e, group)}
                  title="Drag corner to stretch or scale this group frame"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="4" y1="10" x2="10" y2="4" />
                    <line x1="7" y1="10" x2="10" y2="7" />
                  </svg>
                </div>
              </div>
            );
          })}

          {isDrawingGroup && (
            <div
              className="absolute bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-2xl pointer-events-none z-10"
              style={{
                left: Math.min(groupStartPos.x, groupDragCurrent.x),
                top: Math.min(groupStartPos.y, groupDragCurrent.y),
                width: Math.abs(groupStartPos.x - groupDragCurrent.x),
                height: Math.abs(groupStartPos.y - groupDragCurrent.y),
              }}
            />
          )}

          <svg className="absolute overflow-visible pointer-events-auto" style={{ left: '-4000px', top: '-4000px', width: '8000px', height: '8000px' }} viewBox="-4000 -4000 8000 8000">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker id="arrow-selected" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ffffff" />
              </marker>
              <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ea580c" />
              </marker>
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b5cf6" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
              </marker>
              <marker id="arrow-yellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626" />
              </marker>
              <marker id="arrow-slate" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
              </marker>
            </defs>

            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.fromId);
              const toNode = nodes.find((n) => n.id === conn.toId);

              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + NODE_WIDTH;
              const y1 = fromNode.y + SOCKET_Y_OFFSET;
              const x2 = toNode.x;
              const y2 = toNode.y + SOCKET_Y_OFFSET;

              const pathString = getCurvePath(x1, y1, x2, y2);
              const isHovered = hoveredConnectionId === conn.id;
              const isSelected = selectedConnectionId === conn.id;

              const connColor = fromNode.lineColor || conn.color || '#10b981';
              const markerId = getMarkerId(connColor);

              return (
                <g 
                  key={conn.id} 
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredConnectionId(conn.id)}
                  onMouseLeave={() => setHoveredConnectionId(null)}
                >
                  <path
                    d={pathString}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnectionId(conn.id);
                    }}
                  />
                  
                  <path
                    d={pathString}
                    fill="none"
                    stroke={isHovered || isSelected ? '#ffffff' : connColor}
                    strokeWidth={isHovered || isSelected ? ((fromNode.lineThickness !== undefined ? fromNode.lineThickness : 2.5) + 1.5) : (fromNode.lineThickness !== undefined ? fromNode.lineThickness : 2.5)}
                    strokeDasharray={fromNode.lineDashed ? "6 4" : undefined}
                    markerEnd={isHovered || isSelected ? 'url(#arrow-selected)' : `url(#${markerId})`}
                    className="transition-all duration-150"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConnectionId(conn.id);
                    }}
                  />

                  <foreignObject
                    x={(x1 + x2) / 2 - 46}
                    y={(y1 + y2) / 2 - 14}
                    width="100"
                    height="32"
                    className={`transition-all duration-150 ${
                      isHovered || isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                    }`}
                  >
                    <button
                      id={`btn-delete-conn-${conn.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConnection(conn.id);
                        setSelectedConnectionId(null);
                        setHoveredConnectionId(null);
                      }}
                      className="h-7 px-2.5 rounded bg-red-650 hover:bg-red-600 border border-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center gap-1 shadow-xl select-all select-none cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" /> SEVER LINK
                    </button>
                  </foreignObject>
                </g>
              );
            })}

            {activeDrag && (
              <path
                d={getCurvePath(activeDrag.startX, activeDrag.startY, activeDrag.currentX, activeDrag.currentY)}
                fill="none"
                stroke={globalLineColor || '#38bdf8'}
                strokeWidth={globalLineThickness !== undefined ? globalLineThickness : 2.5}
                strokeDasharray={globalLineDashed ? "6 4" : undefined}
                markerEnd="url(#arrow-selected)"
              />
            )}
          </svg>

          {nodes.map((n) => (
            <div
              key={n.id}
              className="absolute pointer-events-auto"
              style={{
                left: n.x,
                top: n.y,
                zIndex: 4,
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (!moveMode && (target.closest('button') || target.closest('textarea') || target.closest('select') || target.closest('input'))) {
                  return;
                }
                const coords = getCanvasCoords(e.clientX, e.clientY);
                saveToPast();
                setDraggingNodeId(n.id);
                setDragOffset({ x: coords.x - n.x, y: coords.y - n.y });
                setContextMenu(null);
                setSelectedConnectionId(null);
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                const target = e.target as HTMLElement;
                if (!moveMode && (target.closest('button') || target.closest('textarea') || target.closest('select') || target.closest('input'))) {
                  return;
                }
                const touch = e.touches[0];
                const coords = getCanvasCoords(touch.clientX, touch.clientY);
                saveToPast();
                setDraggingNodeId(n.id);
                setDragOffset({ x: coords.x - n.x, y: coords.y - n.y });
                setContextMenu(null);
                setSelectedConnectionId(null);
                e.stopPropagation();
              }}
            >
              <StoryNodeComponent
                node={n}
                onUpdate={handleNodeUpdate}
                onOpenDirectory={setOpenDirNode}
                onStartConnection={handleStartConnectionDrag}
                onDelete={handleDeleteNode}
                moveMode={moveMode}
                theme={theme}
              />
            </div>
          ))}
        </div>

        {contextMenu && (
          <div
            id="spawn-context-menu"
            className="absolute z-30 bg-[#121522] border border-emerald-500/40 rounded-lg p-2.5 shadow-2xl flex flex-col gap-1 font-mono text-xs scale-100 transition-transform origin-top-left"
            style={{
              left: contextMenu.x * zoom + panOffset.x,
              top: contextMenu.y * zoom + panOffset.y,
            }}
          >
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 border-b border-[#21273e] pb-1 mb-1 whitespace-nowrap">
              ⚓ BRANCH ACTION PENDING
            </span>
            <button
              id="btn-spawn-cell-option"
              onClick={() => {
                handleAddNewNode(contextMenu.x, contextMenu.y, contextMenu.fromId);
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-600/10 hover:text-emerald-400 rounded-md text-left text-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Spawn Connected Node Here
            </button>
            <button
              id="btn-cancel-spawn-option"
              onClick={() => setContextMenu(null)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-md text-left text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Dismiss Menu
            </button>
          </div>
        )}
      </div>

      {openDirNode && (() => {
        const openDirFields = openDirNode.fields && openDirNode.fields.length > 0
          ? openDirNode.fields
          : [
              { id: 'f-fallback-media', type: 'media' as const, name: 'Media Files', mediaValue: openDirNode.media || [] },
              { id: 'f-fallback-text', type: 'text' as const, name: 'Plot Script', textValue: openDirNode.script || '' }
            ];

        const textFields = openDirFields.filter(f => f.type === 'text');
        const openDirMediaFiles = openDirFields
          .filter(f => f.type === 'media')
          .flatMap(f => f.mediaValue || []);

        return (
          <div id="virtual-folder-modal" className="absolute top-0 right-0 z-40 w-full sm:w-96 h-full bg-[#0a0c13] border-l border-[#21283d] shadow-2xl flex flex-col font-sans animate-slide-in">
            <div className={`p-4 bg-[#111422] border-b border-[#21283d] flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <FolderOpen className={`w-5 h-5 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                <div>
                  <span className="text-xs text-slate-500 font-mono font-bold tracking-wider uppercase block">Windows Workspace Mock</span>
                  <span className="font-mono text-xs text-slate-200 font-semibold truncate max-w-[200px] block">
                    C:\ScenarioProject{!virtualExplorerFolderOpened ? '' : `\\${openDirNode.title.trim() || 'unnamed-block'}`}{virtualExplorerFolderOpened && currentSubfolder !== 'root' ? `\\${currentSubfolder}` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-close-virtual-dir"
                  onClick={() => {
                    setOpenDirNode(null);
                    setVirtualExplorerFolderOpened(false);
                    setCurrentSubfolder('root');
                  }}
                  className="px-2 py-1 bg-red-650/15 hover:bg-red-655 text-red-400 hover:text-white rounded border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-slate-300">
              <div className="bg-[#141829]/60 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Directory Structure Client
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Each story cell has dual structured subfolders: <strong className="text-blue-400">text/</strong> to persist dialogue and script parameters, and <strong className="text-emerald-400">images/</strong> storing assets.
                </p>
              </div>

              {!virtualExplorerFolderOpened && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Workspace Directory</span>
                                   <div 
                    onClick={() => setVirtualExplorerFolderOpened(true)}
                    className={`bg-[#0f111a]/95 border p-4 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-900/30 transition-all group shadow-md ${
                      theme === 'cosmic' ? 'border-cyan-500/15 hover:border-cyan-500/40' : 'border-orange-500/15 hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder className={`w-9 h-9 shrink-0 group-hover:scale-105 transition-transform ${
                        theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                      }`} />
                      <div className="min-w-0">
                        <span className="font-mono text-xs text-slate-100 font-extrabold block truncate">{openDirNode.title.trim() || 'unnamed-block'}</span>
                        <span className="text-[10px] text-slate-550 font-mono block">Double-click or open directory</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setVirtualExplorerFolderOpened(true); }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 border ${
                        theme === 'cosmic' 
                          ? 'bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 border-blue-500/25' 
                          : 'bg-orange-600/10 hover:bg-orange-600 hover:text-white text-orange-400 border-orange-500/20'
                      }`}
                    >
                      Open
                    </button>
                  </div>
                </div>
              )}

              {virtualExplorerFolderOpened && currentSubfolder === 'root' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setVirtualExplorerFolderOpened(false)}
                    className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 hover:bg-slate-850 rounded border border-slate-800 text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
                  >
                    <ArrowLeft className={`w-3 h-3 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>Go Up 1 Level</span>
                  </button>

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Subfolders</span>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div 
                      onClick={() => setCurrentSubfolder('text')}
                      className={`bg-[#0f111a]/85 border p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-900/20 transition-all group ${
                        theme === 'cosmic' ? 'border-[#21283d] hover:border-cyan-500/30' : 'border-[#21283d] hover:border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className={`w-7 h-7 shrink-0 group-hover:scale-105 transition-transform ${
                          theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                        }`} />
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-slate-200 font-bold block">text</span>
                          <span className="text-[10px] text-slate-550 font-mono block">Stores element text files</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-600 transition-all shrink-0 ${
                        theme === 'cosmic' ? 'group-hover:text-cyan-400' : 'group-hover:text-orange-400'
                      }`} />
                    </div>

                    <div 
                      onClick={() => setCurrentSubfolder('images')}
                      className={`bg-[#0f111a]/85 border p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-900/20 transition-all group ${
                        theme === 'cosmic' ? 'border-[#21283d] hover:border-cyan-500/30' : 'border-[#21283d] hover:border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className={`w-7 h-7 shrink-0 group-hover:scale-105 transition-transform ${
                          theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                        }`} />
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-slate-200 font-bold block">images</span>
                          <span className="text-[10px] text-slate-550 font-mono block">Stores element media items</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-600 transition-all shrink-0 ${
                        theme === 'cosmic' ? 'group-hover:text-cyan-400' : 'group-hover:text-orange-400'
                      }`} />
                    </div>
                  </div>
                </div>
              )}

              {virtualExplorerFolderOpened && currentSubfolder === 'text' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setCurrentSubfolder('root')}
                    className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 hover:bg-slate-850 rounded border border-slate-800 text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
                  >
                    <ArrowLeft className={`w-3 h-3 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>Go Up 1 Level</span>
                  </button>

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Plot Story scripts</span>

                  <div className="space-y-3">
                    {textFields.length === 0 ? (
                      <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 text-slate-500 font-mono text-[11px] bg-[#0c0d16]/30">
                        text subfolder is empty
                      </div>
                    ) : (
                      textFields.map((f) => {
                        const fileName = `${(f.name || 'Text Field').trim()}.txt`;
                        return (
                          <div key={f.id} className="bg-[#0f111a]/95 border border-[#21283d] p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="font-mono text-xs text-slate-200 truncate font-semibold">{fileName}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const element = document.createElement("a");
                                  const file = new Blob([f.textValue || ''], { type: 'text/plain' });
                                  element.href = URL.createObjectURL(file);
                                  element.download = fileName;
                                  document.body.appendChild(element);
                                  element.click();
                                  document.body.removeChild(element);
                                }}
                                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer shrink-0"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="bg-[#07080d] p-3 rounded text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap border border-slate-950/80">
                              {f.textValue || <span className="text-slate-600 block">(No text writing inside section)</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {virtualExplorerFolderOpened && currentSubfolder === 'images' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setCurrentSubfolder('root')}
                    className="flex items-center gap-2 px-2 py-1 bg-slate-900/60 hover:bg-slate-850 rounded border border-slate-800 text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
                  >
                    <ArrowLeft className={`w-3 h-3 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>Go Up 1 Level</span>
                  </button>

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Media uploads</span>

                  <div className="space-y-2.5">
                    {openDirMediaFiles.length === 0 ? (
                      <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 text-slate-500 font-mono text-[11px] bg-[#0c0d16]/30">
                        images subfolder is empty
                      </div>
                    ) : (
                      openDirMediaFiles.map((media) => (
                        <div key={media.id} className="bg-[#0f111a]/95 border border-[#21283d] p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-start gap-3 min-w-0">
                            {media.type.startsWith('image/') ? (
                              <div className="w-8 h-8 rounded bg-[#171a29] border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={media.dataUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#171a29] border border-slate-800 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-mono text-xs text-slate-200 block truncate font-semibold">{media.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono block">Attached file asset</span>
                            </div>
                          </div>
                          <a
                            href={media.dataUrl}
                            download={media.name}
                            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 hover:text-emerald-400 rounded-lg text-slate-400 transition-colors flex items-center justify-center shadow-sm shrink-0"
                            title="Download Asset"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#21283d] bg-[#0c0e17] flex flex-col gap-2">
              <button
                id="btn-download-full-bundle"
                onClick={() => handleDownloadStructuredZip(openDirNode)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] active:scale-100 text-white font-mono text-xs font-semibold rounded-lg shadow-lg cursor-pointer transition-all"
                title="Download all element text fields and media folder files together"
              >
                <Download className="w-4 h-4" /> Download Files Bundle
              </button>

              <button
                id="btn-exit-folder-explorer-bottom"
                onClick={() => {
                  setOpenDirNode(null);
                  setVirtualExplorerFolderOpened(false);
                  setCurrentSubfolder('root');
                }}
                className="w-full py-2 bg-[#121522] hover:bg-slate-800 text-slate-400 hover:text-white border border-[#21283d] rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Exit Folder Explorer
              </button>
            </div>
          </div>
        );
      })()}

      {showSettings && (
        <div id="design-settings-drawer" className="absolute top-0 right-0 z-40 w-full sm:w-80 h-full bg-[#0a0c13] border-l border-[#21283d] shadow-2xl flex flex-col font-sans animate-slide-in">
          <div className="p-4 bg-[#111422] border-b border-[#21283d] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-blue-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
              <div>
                <span className="font-mono text-xs text-slate-200 font-bold tracking-wider block">CANVAS DESIGN</span>
                <span className="text-[10px] text-slate-500 font-mono block">Node & Line Colors Settings</span>
              </div>
            </div>
            <button
              id="btn-close-settings"
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-6 text-slate-300">
            <div className="bg-[#141829] rounded-xl border border-slate-800/80 p-3.5 space-y-1.5">
              <h5 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Color Propagation Mode
              </h5>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                Subsequent blocks and connection lines will propagate with these selected border and line template colors.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Cell Border Color</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { hex: '#475569', label: 'Slate' },
                  { hex: '#10b981', label: 'Emerald' },
                  { hex: '#ea580c', label: 'Orange' },
                  { hex: '#8b5cf6', label: 'Purple' },
                  { hex: '#0284c7', label: 'Blue' },
                  { hex: '#d97706', label: 'Yellow' },
                  { hex: '#dc2626', label: 'Red' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => setGlobalBorderColor(col.hex)}
                    className="relative p-2 rounded-xl border border-[#21283d] bg-[#0c0e16] hover:bg-[#151927] transition-all flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: col.hex }}
                    >
                      {globalBorderColor === col.hex && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 group-hover:text-slate-200 truncate max-w-full">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Lines & Sockets Color</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { hex: '#10b981', label: 'Emerald' },
                  { hex: '#ea580c', label: 'Orange' },
                  { hex: '#8b5cf6', label: 'Purple' },
                  { hex: '#0284c7', label: 'Blue' },
                  { hex: '#d97706', label: 'Yellow' },
                  { hex: '#dc2626', label: 'Red' },
                  { hex: '#64748b', label: 'Slate' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => setGlobalLineColor(col.hex)}
                    className="relative p-2 rounded-xl border border-[#21283d] bg-[#0c0e16] hover:bg-[#151927] transition-all flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: col.hex }}
                    >
                      {globalLineColor === col.hex && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 group-hover:text-slate-200 truncate max-w-full">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#1d2336]">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  <span>Default Border Thickness</span>
                  <span className="text-blue-400 font-mono text-[11px]">{globalBorderThickness}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={globalBorderThickness}
                  onChange={(e) => setGlobalBorderThickness(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  <span>Default Line Thickness</span>
                  <span className="text-blue-400 font-mono text-[11px]">{globalLineThickness}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={globalLineThickness}
                  onChange={(e) => setGlobalLineThickness(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Default Line Style</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGlobalLineDashed(false)}
                    className={`py-1.5 px-3 rounded-lg font-mono text-xs font-semibold border text-center cursor-pointer transition-all ${
                      !globalLineDashed
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                        : 'bg-[#0c0e16] text-slate-400 border-[#21283d] hover:text-slate-200'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalLineDashed(true)}
                    className={`py-1.5 px-3 rounded-lg font-mono text-xs font-semibold border text-center cursor-pointer transition-all ${
                      globalLineDashed
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-semibold'
                        : 'bg-[#0c0e16] text-slate-400 border-[#21283d] hover:text-slate-200'
                    }`}
                  >
                    Dashed
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1d2336] pt-4 text-[10px] text-slate-500 space-y-2">
              <span className="font-bold underline uppercase">Cascading Behavior:</span>
              <p className="leading-relaxed">
                If you spawn a block from a node's output port, it inherits the parent block's unique design color palette and continues that chain perfectly!
              </p>
            </div>
          </div>
        </div>
      )}

      {spawnConfirm && (
        <div id="spawn-confirm-modal" className="absolute inset-0 z-50 flex items-center justify-center bg-[#05060a]/80 backdrop-blur-md p-4 animate-fade-in pointer-events-auto">
          <div className="bg-[#121522] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Plus className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Create New Story Block?</h4>
                <p className="text-[10px] text-slate-400 font-mono">STORY SEQUENCE FORK</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Would you like to spawn an additional, connected window to the right of your previous block? A branching line will connect them automatically.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                id="btn-confirm-spawn"
                onClick={() => {
                  const fromNode = nodes.find((n) => n.id === spawnConfirm.fromId);
                  if (fromNode) {
                    const freePos = findFreeSpace(fromNode.x, fromNode.y);
                    handleAddNewNode(freePos.x, freePos.y, spawnConfirm.fromId);
                  }
                  setSpawnConfirm(null);
                }}
                className="flex-1 py-2 px-4 bg-emerald-650 hover:bg-emerald-600 text-white font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg active:scale-95"
              >
                Confirm Spawn
              </button>
              <button
                id="btn-cancel-spawn"
                onClick={() => setSpawnConfirm(null)}
                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className="absolute bottom-6 z-40 flex items-center gap-1.5 bg-[#10121d]/95 hover:bg-[#121522]/95 border border-[#21273d] p-1.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300"
        style={{
          right: openDirNode ? '410px' : '24px'
        }}
      >
        <button
          id="btn-reset-grid-canvas"
          onClick={handleResetGrid}
          className="p-2 bg-[#131622] hover:bg-[#1e2338] border border-slate-800 text-slate-300 hover:text-white rounded-full shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#21273d] mx-0.5 shrink-0" />

        <button
          id="btn-zoom-in"
          onClick={() => handleZoom(1.15)}
          className="p-2 bg-[#131622] hover:bg-[#1e2338] border border-slate-800 text-slate-300 hover:text-white rounded-full shadow-md transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-out"
          onClick={() => handleZoom(0.85)}
          className="p-2 bg-[#131622] hover:bg-[#1e2338] border border-slate-800 text-slate-300 hover:text-white rounded-full shadow-md transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {showAutosaveToast && (
        <div 
          id="autosave-indicator" 
          className="absolute bottom-20 z-50 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-emerald-400 font-mono text-xs shadow-xl animate-fade-in transition-all duration-300"
          style={{
            right: openDirNode ? '410px' : '24px'
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Autosave Complete (All Cells Saved)</span>
        </div>
      )}

      {nodeToDeleteId && (
        <div 
          id="delete-confirmation-modal" 
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#05060a]/80 backdrop-blur-md p-4 animate-fade-in pointer-events-auto"
        >
          <div className="bg-[#121522] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">Delete Story Cell?</h4>
                <p className="text-[10px] text-slate-500 font-mono">CONFIRM REMOVAL</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to delete this story block? This will erase all written dialogs and files. You can restore it later with the step backward arrow at the top left.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                id="btn-confirm-delete"
                onClick={() => {
                  saveToPast();
                  const targetId = nodeToDeleteId;
                  setNodes((prev) => prev.filter((n) => n.id !== targetId));
                  setConnections((prev) => prev.filter((c) => c.fromId !== targetId && c.toId !== targetId));
                  setNodeToDeleteId(null);
                }}
                className="flex-1 py-1.5 px-4 bg-red-650 hover:bg-red-650 text-white font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg active:scale-95"
              >
                Yes, Delete
              </button>
              <button
                id="btn-cancel-delete"
                onClick={() => setNodeToDeleteId(null)}
                className="flex-1 py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDrawer && (
        <>
          <div 
            className="absolute inset-0 bg-transparent z-40" 
            onClick={() => setShowDrawer(false)}
          />
          
          <div 
            id="outline-sliding-drawer"
            className="absolute top-0 right-0 h-full w-80 bg-[#0b0d16]/95 backdrop-blur-xl border-l border-[#1d2238] z-50 flex flex-col shadow-2xl animate-slide-in font-sans"
            style={{ animationDuration: '200ms' }}
          >
            <div className="p-4 border-b border-[#1d2238] flex items-center justify-between bg-[#101321]">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                  Scenario Navigator
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 hover:bg-[#1e233b] hover:text-white text-slate-500 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#151a2d] bg-[#0c0e18]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="nav-search-bar"
                  type="text"
                  placeholder="Search elements, groups, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 font-mono text-xs rounded-lg bg-[#05060a] border border-[#21273d] hover:border-[#313c5e] focus:border-cyan-500 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 transition-all cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              <div className="space-y-2">
                <h3 className="text-[10px] font-mono font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5 border-b border-[#151929] pb-1">
                  <Square className="w-3 h-3 text-blue-400" /> Groups ({filteredGroups.length})
                </h3>
                {filteredGroups.length === 0 ? (
                  <p className="text-[11px] text-slate-600 font-mono italic px-2 pt-1">
                    {searchQuery ? "No matching groups." : "No groups created. Enable 'Group' mode and drag a rectangle to group blocks."}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="w-full font-mono text-[11px] px-1.5 py-1 hover:bg-[#131627]/60 border border-transparent hover:border-[#1e233d] rounded-lg transition-all flex items-center justify-between group"
                      >
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => {
                            setGroups((prev) =>
                              prev.map((g) => (g.id === group.id ? { ...g, title: e.target.value } : g))
                            );
                          }}
                          className="bg-transparent border border-transparent hover:border-slate-800 focus:border-blue-500 rounded px-2 py-1 text-slate-200 focus:text-white focus:bg-slate-950/80 focus:outline-none flex-1 font-semibold truncate transition-all font-mono"
                          placeholder="Rename Group..."
                        />
                        
                        <button
                          onClick={() => {
                            centerOnElement(group.x, group.y, group.width, group.height);
                          }}
                          className="p-1 px-1.5 ml-1.5 hover:bg-blue-500/10 hover:text-blue-400 text-slate-500 bg-[#0c101d] border border-[#21273d] rounded transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Crosshair className="w-3 h-3 text-blue-400/80" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Show</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              <div className="space-y-2">
                <h3 className="text-[10px] font-mono font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5 border-b border-[#151929] pb-1">
                  <FileText className="w-3 h-3 text-emerald-450" /> Story Cells ({filteredNodes.length})
                </h3>
                {filteredNodes.length === 0 ? (
                  <p className="text-[11px] text-slate-600 font-mono italic px-2 pt-1">
                    {searchQuery ? "No matching story cells." : "No story cells present. Double-click empty board space to spawn block."}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredNodes.map((node) => {
                      const legTitle = node.title;
                      return (
                        <div
                          key={node.id}
                          className="w-full font-mono text-[11px] px-1.5 py-1 hover:bg-[#131627]/60 border border-transparent hover:border-[#1e233d] rounded-lg transition-all flex items-center justify-between group"
                        >
                          <input
                            type="text"
                            value={legTitle}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setNodes((prev) =>
                                prev.map((n) => (n.id === node.id ? { ...n, title: newVal } : n))
                              );
                            }}
                            className="bg-transparent border border-transparent hover:border-slate-800 focus:border-emerald-500 rounded px-2 py-1 text-slate-200 focus:text-white focus:bg-slate-950/80 focus:outline-none flex-1 font-semibold truncate transition-all font-mono"
                            placeholder="Unnamed Cell..."
                          />
 
                          <button
                            onClick={() => {
                              centerOnElement(node.x, node.y, 288, 300);
                            }}
                            className="p-1 px-1.5 ml-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500 bg-[#0c101d] border border-[#21273d] rounded transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Crosshair className="w-3 h-3 text-emerald-400/80" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Show</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
