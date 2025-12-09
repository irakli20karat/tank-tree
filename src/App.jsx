import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Network,
  X,
  Target,
  Shield,
  Layout,
  MoveHorizontal,
  AlertTriangle,
  MousePointer2,
} from 'lucide-react';

/**
 * Utility: Generate unique IDs
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Constants
 */
const COLUMN_WIDTH = 160;

const TankCard = ({
  tank,
  isSelected,
  onEdit,   // Double click edit
  onDelete,
  getRef,
  onMouseDown,
  isDragging,
  dragPosition, // { x, y }
  conflictType
}) => {

  // Conflict Styles
  let borderClass = isSelected ? 'border-yellow-500 shadow-yellow-500/20' : 'border-gray-600 hover:border-gray-400';
  let bgClass = "bg-gray-800";

  if (conflictType === 'overlap') {
    borderClass = 'border-red-500 shadow-red-500/40 animate-pulse';
    bgClass = "bg-red-900/20";
  } else if (conflictType === 'blocker') {
    borderClass = 'border-orange-500 shadow-orange-500/40';
  }

  // If dragging, we use fixed positioning based on mouse coordinates
  const dragStyle = isDragging ? {
    position: 'fixed',
    left: dragPosition.x,
    top: dragPosition.y,
    zIndex: 1000,
    pointerEvents: 'none', // Critical: allows mouse events to pass through to check for tiers below
    width: '144px' // w-36
  } : {
    gridColumnStart: (tank.columnIndex || 0) + 1,
    gridRowStart: 1,
    zIndex: isSelected ? 20 : 10,
  };

  return (
    <div
      ref={(el) => getRef(tank.id, el)}
      onMouseDown={(e) => onMouseDown(e, tank)}
      onDoubleClick={() => onEdit(tank)}
      style={dragStyle}
      className={`
        relative group flex flex-col items-center w-36 transition-transform duration-75 ease-out justify-self-center select-none
        ${isDragging ? 'scale-110 opacity-90' : 'hover:scale-105 cursor-grab active:cursor-grabbing'}
      `}
    >
      {/* Conflict Indicator Badge */}
      {conflictType && !isDragging && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-50 whitespace-nowrap">
          <AlertTriangle size={10} />
          {conflictType === 'overlap' ? 'OVERLAP' : 'BLOCKING LINE'}
        </div>
      )}

      <div className={`
        relative overflow-hidden w-full border-2 rounded-lg shadow-lg transition-colors
        ${bgClass} ${borderClass}
      `}>
        <div className="h-20 w-full bg-gray-900 flex items-center justify-center relative">
          {tank.image ? (
            <img src={tank.image} alt={tank.name} className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <Target className="text-gray-700 w-8 h-8" />
          )}
          <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
            <span className="text-[10px] text-gray-300 font-bold uppercase px-1">
              {tank.classType || 'LT'}
            </span>
          </div>
        </div>
        <div className="p-2 text-center bg-gradient-to-b from-gray-800 to-gray-900">
          <h3 className="text-xs font-bold text-gray-100 truncate w-full" title={tank.name}>
            {tank.name || 'Unnamed'}
          </h3>
          <p className="text-[10px] text-gray-400">XP: {tank.xpCost || 0}</p>
        </div>

        {!isDragging && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(tank.id); }}
            className="absolute top-0 right-0 p-1 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-lg hover:bg-red-500"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const TierRow = ({ tier, tanks, onSelectTank, onEditTank, selectedTankId, onAddTank, onDeleteTank, onDeleteTier, registerTankRef, gridColumns, dragHandler, draggingState, conflicts }) => {
  const isTargetTier = draggingState.currentTierId === tier.id;

  return (
    <div
      id={`tier-${tier.id}`} // ID used for drag detection
      data-tier-id={tier.id}
      className={`flex relative min-h-[180px] border-b border-gray-800/50 last:border-0 group/tier transition-colors duration-200
        ${isTargetTier && draggingState.isDragging ? 'bg-blue-900/10' : 'hover:bg-gray-900/20'}
      `}
    >
      {/* Tier Label */}
      <div className="w-20 flex-shrink-0 bg-gray-900/90 flex flex-col items-center pt-6 border-r border-gray-800 z-10 sticky left-0 backdrop-blur-sm shadow-xl">
        <span className="text-2xl font-black text-gray-700 font-serif mb-3">{tier.roman}</span>
        <div className="flex flex-col gap-2 opacity-50 group-hover/tier:opacity-100 transition-opacity">
          <button onClick={() => onAddTank(tier.id)} className="p-1.5 bg-green-900/30 text-green-500 hover:bg-green-600 hover:text-white rounded transition-colors" title="Add Tank">
            <Plus size={16} />
          </button>
          <button onClick={() => onDeleteTier(tier.id)} className="p-1.5 bg-red-900/30 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors" title="Delete Tier">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="relative flex-1">
        <div
          className="grid items-center p-4 h-full"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, ${COLUMN_WIDTH}px)`,
            width: 'max-content',
            gap: '0'
          }}
        >
          {tanks.map(tank => {
            const isDraggingThis = draggingState.isDragging && draggingState.tankId === tank.id;

            return (
              <TankCard
                key={tank.id}
                tank={tank}
                isSelected={selectedTankId === tank.id}
                onSelect={onSelectTank}
                onEdit={onEditTank}
                onDelete={onDeleteTank}
                getRef={registerTankRef}
                onMouseDown={dragHandler}
                isDragging={isDraggingThis}
                dragPosition={draggingState.currentPos}
                conflictType={conflicts[tank.id]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper: Check if value C is between A and B
 */
const isBetween = (c, a, b) => {
  return (c >= a && c <= b) || (c >= b && c <= a);
};

/**
 * Helper: Check if two orthogonal segments intersect
 * Segment 1: p0 -> p1
 * Segment 2: p2 -> p3
 */
const doSegmentsIntersect = (p0, p1, p2, p3) => {
  // Define bounding boxes
  const minX1 = Math.min(p0.x, p1.x), maxX1 = Math.max(p0.x, p1.x);
  const minY1 = Math.min(p0.y, p1.y), maxY1 = Math.max(p0.y, p1.y);
  const minX2 = Math.min(p2.x, p3.x), maxX2 = Math.max(p2.x, p3.x);
  const minY2 = Math.min(p2.y, p3.y), maxY2 = Math.max(p2.y, p3.y);

  // Quick bounding box rejection
  if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) return false;

  // Determine orientation
  const isHorz1 = p0.y === p1.y;
  const isHorz2 = p2.y === p3.y;

  // Parallel lines overlap check (we ignore simple overlaps for "crossing", only want cuts)
  if (isHorz1 === isHorz2) return false;

  // Perpendicular check (The only case that makes a "Cross" shape)
  // One is vertical, one is horizontal
  if (isHorz1) {
    // Seg1 is Horizontal, Seg2 is Vertical
    // Intersection happens if Seg2.x is within Seg1 x-range AND Seg1.y is within Seg2 y-range
    return isBetween(p2.x, p0.x, p1.x) && isBetween(p0.y, p2.y, p3.y);
  } else {
    // Seg1 is Vertical, Seg2 is Horizontal
    return isBetween(p0.x, p2.x, p3.x) && isBetween(p2.y, p0.y, p1.y);
  }
};

const ConnectionLines = ({ tanks, tankRefs, containerRef, draggingState }) => {
  const [lines, setLines] = useState([]);
  const [crossingIds, setCrossingIds] = useState(new Set());
  const [retry, setRetry] = useState(0);

  useLayoutEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const newLines = [];
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      let missingRefs = false;

      // 1. Calculate Coordinates
      tanks.forEach(tank => {
        if (!tank.parentId) return;

        // Hide lines for dragged tank
        if (draggingState.isDragging && (tank.id === draggingState.tankId || tank.parentId === draggingState.tankId)) {
          return;
        }

        const parentEl = tankRefs.current[tank.parentId];
        const childEl = tankRefs.current[tank.id];

        if (parentEl && childEl) {
          const parentRect = parentEl.getBoundingClientRect();
          const childRect = childEl.getBoundingClientRect();

          const startX = (parentRect.left + parentRect.width / 2) - containerRect.left + scrollLeft;
          const startY = (parentRect.bottom) - containerRect.top + scrollTop;

          const endX = (childRect.left + childRect.width / 2) - containerRect.left + scrollLeft;
          const endY = (childRect.top) - containerRect.top + scrollTop;

          const midY = (startY + endY) / 2;

          // Define the 3 segments of a Tech Tree line (Vertical -> Horizontal -> Vertical)
          // Point A: Start
          // Point B: (StartX, MidY)
          // Point C: (EndX, MidY)
          // Point D: End

          const segments = [
            { p1: { x: startX, y: startY }, p2: { x: startX, y: midY } }, // Top Vertical
            { p1: { x: startX, y: midY }, p2: { x: endX, y: midY } }, // Horizontal Middle
            { p1: { x: endX, y: midY }, p2: { x: endX, y: endY } }  // Bottom Vertical
          ];

          newLines.push({
            id: `${tank.parentId}-${tank.id}`,
            startX, startY, endX, endY, midY,
            segments
          });
        } else {
          missingRefs = true;
        }
      });

      // 2. Detect Crossings (O(N^2) - cheap for <100 items)
      const crossings = new Set();

      for (let i = 0; i < newLines.length; i++) {
        for (let j = i + 1; j < newLines.length; j++) {
          const lineA = newLines[i];
          const lineB = newLines[j];

          // Don't check lines sharing a parent (they naturally overlap at the start, which is fine)
          const parentA = lineA.id.split('-')[0];
          const parentB = lineB.id.split('-')[0];
          if (parentA === parentB) continue;

          // Check intersection between any segments
          let intersected = false;
          for (let segA of lineA.segments) {
            for (let segB of lineB.segments) {
              if (doSegmentsIntersect(segA.p1, segA.p2, segB.p1, segB.p2)) {
                intersected = true;
                break;
              }
            }
            if (intersected) break;
          }

          if (intersected) {
            crossings.add(lineA.id);
            crossings.add(lineB.id);
          }
        }
      }

      setLines(newLines);
      setCrossingIds(crossings);

      if (missingRefs && retry < 3) {
        setTimeout(() => setRetry(r => r + 1), 100);
      }
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [tanks, tankRefs, containerRef, draggingState.isDragging, retry, draggingState.tankId]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <defs>
        <marker id="arrowhead-gray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
        </marker>
        <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
        </marker>
      </defs>
      {lines.map(line => {
        const isCrossed = crossingIds.has(line.id);
        const color = isCrossed ? "#EF4444" : "#4B5563"; // Red if crossed, Gray if safe
        const marker = isCrossed ? "url(#arrowhead-red)" : "url(#arrowhead-gray)";
        const width = isCrossed ? "3" : "2";

        // Orthogonal Path: Move -> Vertical -> Horizontal -> Vertical
        const path = `M ${line.startX} ${line.startY} V ${line.midY} H ${line.endX} V ${line.endY}`;

        return (
          <g key={line.id}>
            {/* Background stroke for better visibility against backgrounds */}
            <path d={path} stroke="#111827" strokeWidth="4" fill="none" opacity="0.5" />
            <path
              d={path}
              stroke={color}
              strokeWidth={width}
              fill="none"
              markerEnd={marker}
              strokeDasharray={isCrossed ? "5,3" : "0"} // Dashed line if error
              className="transition-colors duration-300"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default function TankTreeArchitect() {
  const [tiers, setTiers] = useState([
    { id: 'tier-1', roman: 'I', index: 0 },
    { id: 'tier-2', roman: 'II', index: 1 },
    { id: 'tier-3', roman: 'III', index: 2 },
  ]);

  const [tanks, setTanks] = useState([
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentId: null, classType: 'LT', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'T-26', tierId: 'tier-2', image: null, parentId: 't1', classType: 'LT', xpCost: 150, columnIndex: 2 },
  ]);

  const [selectedTankId, setSelectedTankId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Drag State
  const [draggingState, setDraggingState] = useState({
    isPressed: false, // Mouse is down but hasn't moved enough
    isDragging: false, // Mouse moved enough, dragging active
    tankId: null,
    startMouseX: 0,
    startMouseY: 0,
    elemOffsetX: 0, // Distance from mouse to top-left of element
    elemOffsetY: 0,
    currentPos: { x: 0, y: 0 },
    currentTierId: null
  });

  const tankRefs = useRef({});
  const containerRef = useRef(null);

  const maxColumnIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridColumns = Math.max(maxColumnIndex + 6, 8);

  // --- Real-time Conflict Detection (Memoized) ---
  const conflicts = useMemo(() => {
    const conflictsMap = {};
    const posMap = new Map();
    tanks.forEach(t => {
      const key = `${t.tierId}-${t.columnIndex}`;
      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(t.id);
    });

    posMap.forEach(ids => {
      if (ids.length > 1) ids.forEach(id => conflictsMap[id] = 'overlap');
    });

    const getTierIdx = (tid) => tiers.find(x => x.id === tid)?.index ?? -1;
    tanks.forEach(child => {
      if (!child.parentId) return;
      const parent = tanks.find(t => t.id === child.parentId);
      if (!parent || child.columnIndex !== parent.columnIndex) return;

      const pIdx = getTierIdx(parent.tierId);
      const cIdx = getTierIdx(child.tierId);
      const minIdx = Math.min(pIdx, cIdx);
      const maxIdx = Math.max(pIdx, cIdx);

      tanks.forEach(blocker => {
        if (blocker.id === child.id || blocker.id === parent.id) return;
        if (blocker.columnIndex !== child.columnIndex) return;
        const bIdx = getTierIdx(blocker.tierId);
        if (bIdx > minIdx && bIdx < maxIdx) conflictsMap[blocker.id] = 'blocker';
      });
    });

    return conflictsMap;
  }, [tanks, tiers]);

  // --- Drag & Drop Logic ---

  const handleDragStart = (e, tank) => {
    e.preventDefault();
    if (!tankRefs.current[tank.id]) return;

    const rect = tankRefs.current[tank.id].getBoundingClientRect();

    // Calculate the offset so the element doesn't jump to top-left
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingState({
      isPressed: true,
      isDragging: false,
      tankId: tank.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      elemOffsetX: offsetX,
      elemOffsetY: offsetY,
      currentPos: { x: rect.left, y: rect.top },
      currentTierId: tank.tierId
    });

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    setDraggingState(prev => {
      if (!prev.isPressed) return prev;

      // Check distance threshold to prevent click accidental drags
      if (!prev.isDragging) {
        const dist = Math.sqrt(
          Math.pow(e.clientX - prev.startMouseX, 2) +
          Math.pow(e.clientY - prev.startMouseY, 2)
        );
        if (dist < 5) return prev; // Ignore small movements
      }

      // Calculate exact position based on mouse - offset
      const newX = e.clientX - prev.elemOffsetX;
      const newY = e.clientY - prev.elemOffsetY;

      // Detect tier under cursor
      const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
      const tierEl = elementsUnderCursor.find(el => el.getAttribute && el.getAttribute('data-tier-id'));
      const newTierId = tierEl ? tierEl.getAttribute('data-tier-id') : prev.currentTierId;

      return {
        ...prev,
        isDragging: true,
        currentPos: { x: newX, y: newY },
        currentTierId: newTierId
      };
    });
  };

  const handleDragEnd = () => {
    setDraggingState(prev => {
      if (!prev.isPressed) return prev;

      if (!prev.isDragging) {
        // It was a simple click!
        setSelectedTankId(prev.tankId);
      } else {
        // It was a drag, execute Drop
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          // Calculate column based on relative X position + scroll
          const relativeX = (prev.currentPos.x + prev.elemOffsetX) - containerRect.left + containerRef.current.scrollLeft;
          // Center point of the dragged item for snap calculation
          const centerX = relativeX + 72; // half of w-36 (144px)

          let newCol = Math.floor(centerX / COLUMN_WIDTH);
          if (newCol < 0) newCol = 0;

          setTanks(currTanks => currTanks.map(t =>
            t.id === prev.tankId
              ? { ...t, columnIndex: newCol, tierId: prev.currentTierId }
              : t
          ));
        }
      }

      return {
        isPressed: false,
        isDragging: false,
        tankId: null,
        startMouseX: 0,
        startMouseY: 0,
        elemOffsetX: 0,
        elemOffsetY: 0,
        currentPos: { x: 0, y: 0 },
        currentTierId: null
      };
    });

    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  // --- CRUD & Helpers ---
  // Double touch/click action
  const handleEditTank = (tank) => {
    setSelectedTankId(tank.id);
    setIsSidebarOpen(true);
  };

  const handleAddTier = () => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const nextIndex = tiers.length;
    const newTier = { id: generateId(), roman: romanNumerals[nextIndex] || `T${nextIndex + 1}`, index: nextIndex };
    setTiers([...tiers, newTier]);
  };

  const handleAddTank = (tierId) => {
    let col = 0;
    while (tanks.some(t => t.tierId === tierId && t.columnIndex === col)) {
      col++;
    }
    const newTank = {
      id: generateId(), name: 'New Tank', tierId: tierId, image: null, parentId: null, classType: 'LT', xpCost: 0, columnIndex: col
    };
    setTanks([...tanks, newTank]);
    handleEditTank(newTank); // Auto open edit on create
  };

  const handleDeleteTank = (id) => {
    setTanks(tanks.filter(t => t.id !== id && t.parentId !== id));
    if (selectedTankId === id) setSelectedTankId(null);
    delete tankRefs.current[id];
  };

  const handleDeleteTier = (tierId) => {
    if (tanks.some(t => t.tierId === tierId)) {
      alert("Please remove all tanks from this tier before deleting it.");
      return;
    }
    setTiers(tiers.filter(t => t.id !== tierId));
  };

  const updateTank = (id, field, value) => {
    let tempTanks = tanks.map(t => t.id === id ? { ...t, [field]: value } : t);
    if (field === 'parentId' && value) {
      const parentTank = tanks.find(t => t.id === value);
      if (parentTank) {
        tempTanks = tempTanks.map(t => t.id === id ? { ...t, columnIndex: parentTank.columnIndex } : t);
      }
    }
    setTanks(tempTanks);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      const reader = new FileReader();
      reader.onloadend = () => updateTank(selectedTankId, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const selectedTank = tanks.find(t => t.id === selectedTankId);
  const availableParents = selectedTank
    ? tanks.filter(t => {
      const currentTierIndex = tiers.find(tier => tier.id === selectedTank.tierId)?.index || 0;
      const candidateTierIndex = tiers.find(tier => tier.id === t.tierId)?.index || 0;
      return candidateTierIndex < currentTierIndex;
    })
    : [];

  const conflictCount = Object.keys(conflicts).length;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden select-none">
      {/* Sidebar */}
      <div className={`flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-lg text-yellow-500 flex items-center gap-2">
            <Settings size={18} /> Tank Details
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white">
            <ChevronDown className="transform rotate-90" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {selectedTank ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Tank Preview</label>
                <div className="h-32 w-full border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-gray-800 transition-colors relative overflow-hidden group" onClick={() => document.getElementById('tank-image-upload').click()}>
                  {selectedTank.image ? <img src={selectedTank.image} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-gray-600"><Upload size={24} className="mb-2" /><span className="text-xs">Click to Upload Image</span></div>}
                  <input id="tank-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {selectedTank.image && <button onClick={(e) => { e.stopPropagation(); updateTank(selectedTank.id, 'image', null); }} className="absolute top-2 right-2 p-1 bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                </div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded border border-gray-800">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2">
                  <MoveHorizontal size={12} /> Grid Position
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateTank(selectedTank.id, 'columnIndex', Math.max(0, (selectedTank.columnIndex || 0) - 1))} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center gap-1"><ChevronLeft size={14} /> Left</button>
                  <span className="text-sm font-mono text-gray-400 w-8 text-center">{selectedTank.columnIndex || 0}</span>
                  <button onClick={() => updateTank(selectedTank.id, 'columnIndex', (selectedTank.columnIndex || 0) + 1)} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center justify-center gap-1">Right <ChevronRight size={14} /></button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Name</label>
                  <input type="text" value={selectedTank.name} onChange={(e) => updateTank(selectedTank.id, 'name', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm focus:border-yellow-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">XP Cost</label>
                    <input type="number" value={selectedTank.xpCost} onChange={(e) => updateTank(selectedTank.id, 'xpCost', parseInt(e.target.value) || 0)} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm focus:border-yellow-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Class</label>
                    <select value={selectedTank.classType} onChange={(e) => updateTank(selectedTank.id, 'classType', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm focus:border-yellow-500 focus:outline-none">
                      <option value="LT">Light</option>
                      <option value="MT">Medium</option>
                      <option value="HT">Heavy</option>
                      <option value="TD">Destroyer</option>
                      <option value="SPG">SPG</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-800">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><Network size={12} /> Research Path</label>
                <select value={selectedTank.parentId || ''} onChange={(e) => updateTank(selectedTank.id, 'parentId', e.target.value === '' ? null : e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm focus:border-yellow-500 focus:outline-none">
                  <option value="">-- No Parent (Root) --</option>
                  {availableParents.map(p => (
                    <option key={p.id} value={p.id}>Tier {tiers.find(tr => tr.id === p.tierId)?.roman} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 mt-auto">
                <button onClick={() => handleDeleteTank(selectedTank.id)} className="w-full py-2 bg-red-900/30 hover:bg-red-900 text-red-500 hover:text-white rounded border border-red-900 transition-colors text-sm flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Delete Tank
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 mt-20">
              <Layout size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a tank to edit its properties.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-gray-950 relative">
        <div className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-900 shadow-xl z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"><Settings size={18} /></button>}
            <h1 className="text-xl font-bold tracking-wider text-gray-100 flex items-center gap-2"><Shield className="text-yellow-500" /> TANK<span className="text-yellow-500">TREE</span> ARCHITECT</h1>
          </div>
          <div className="flex items-center gap-4">
            {conflictCount > 0 && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse px-3 py-1 bg-red-900/20 border border-red-900/50 rounded-full">
                <AlertTriangle size={14} />
                {conflictCount} CONFLICTS
              </div>
            )}
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 cursor-default">
          <div className="min-w-full inline-block pb-20 relative">

            <ConnectionLines tanks={tanks} tankRefs={tankRefs} containerRef={containerRef} draggingState={draggingState} />

            <div className="flex flex-col relative z-10 pt-4">
              {tiers.map((tier) => (
                <TierRow
                  key={tier.id}
                  tier={tier}
                  tanks={tanks.filter(t => t.tierId === tier.id)}
                  onSelectTank={(t) => setSelectedTankId(t.id)}
                  onEditTank={handleEditTank}
                  onAddTank={handleAddTank}
                  selectedTankId={selectedTankId}
                  onDeleteTank={handleDeleteTank}
                  onDeleteTier={handleDeleteTier}
                  registerTankRef={(id, el) => { tankRefs.current[id] = el; }}
                  gridColumns={gridColumns}
                  dragHandler={handleDragStart}
                  draggingState={draggingState}
                  conflicts={conflicts}
                />
              ))}

              {/* Added: 'Add Tier' Button at the bottom of the list */}
              <div className="w-full flex items-center justify-center py-6">
                <button
                  onClick={handleAddTier}
                  className="group flex items-center gap-3 px-8 py-3 bg-gray-900/50 border-2 border-dashed border-gray-800 hover:border-gray-600 hover:bg-gray-900 rounded-xl transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Plus size={16} className="text-gray-400 group-hover:text-white" />
                  </div>
                  <span className="text-gray-500 font-medium group-hover:text-gray-300">Add New Tier Level</span>
                </button>
              </div>

            </div>

            <div className="h-40 flex items-center justify-center text-gray-700 text-sm flex-col gap-2">
              <MousePointer2 className="opacity-50" />
              <span>Single Click to Select • Double Click to Edit • Drag to Move</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}