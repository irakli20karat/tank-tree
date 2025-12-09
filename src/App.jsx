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
  Link as LinkIcon,
  Unlink,
  ArrowDownCircle
} from 'lucide-react';

/**
 * Utility: Generate unique IDs
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Constants
 */
const COLUMN_WIDTH = 160;
const TANK_WIDTH = 144; // w-36

const TankCard = ({
  tank,
  isSelected,
  onEdit,
  onDelete,
  onMouseDown,
  isDragging,
  conflictType,
  setRef
}) => {

  // Conflict Styles
  let borderClass = isSelected ? 'border-yellow-500 shadow-yellow-500/20' : 'border-gray-600 hover:border-gray-400';
  let bgClass = "bg-gray-800";

  if (conflictType === 'overlap') {
    borderClass = 'border-red-500 shadow-red-500/40 animate-pulse';
    bgClass = "bg-red-900/20";
  } else if (conflictType === 'blocker') {
    borderClass = 'border-orange-500 shadow-orange-500/40';
    bgClass = "bg-orange-900/10";
  }

  // Styles
  const style = {
    gridColumnStart: (tank.columnIndex || 0) + 1,
    gridRowStart: 1,
    zIndex: isSelected ? 20 : 10,
  };

  // If Dragging: Fixed position, high Z-index, ignore pointer events
  if (isDragging) {
    style.position = 'fixed';
    style.zIndex = 1000;
    style.pointerEvents = 'none';
    style.width = `${TANK_WIDTH}px`;
  }

  return (
    <div
      ref={setRef}
      onMouseDown={(e) => onMouseDown(e, tank)}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(tank); }}
      style={style}
      className={`
        relative group flex flex-col items-center w-36 transition-none ease-out justify-self-center select-none
        ${isDragging ? 'scale-110 opacity-90 shadow-2xl' : 'hover:scale-105 cursor-grab active:cursor-grabbing'}
      `}
    >
      {/* Conflict Indicator Badge */}
      {conflictType && !isDragging && (
        <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-50 whitespace-nowrap
          ${conflictType === 'overlap' ? 'bg-red-600' : 'bg-orange-600'}
        `}>
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
      id={`tier-${tier.id}`}
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
          className="grid items-center p-4 h-full relative"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, ${COLUMN_WIDTH}px)`,
            width: 'max-content',
            gap: '0'
          }}
        >
          {/* GHOST CELL */}
          {draggingState.isDragging && isTargetTier && (
            <div
              className="absolute border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 rounded-lg w-36 h-32 flex items-center justify-center text-yellow-500/50 font-bold text-xs uppercase animate-pulse transition-all duration-100 ease-linear"
              style={{
                left: `${(draggingState.targetCol * COLUMN_WIDTH) + 16 + (COLUMN_WIDTH - TANK_WIDTH) / 2}px`,
                top: '16px'
              }}
            >
              Drop Here
            </div>
          )}

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
                setRef={(el) => registerTankRef(tank.id, el)}
                onMouseDown={dragHandler}
                isDragging={isDraggingThis}
                conflictType={conflicts[tank.id]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ... [Intersect Helper Functions] ...
const isBetween = (c, a, b) => {
  return (c >= a && c <= b) || (c >= b && c <= a);
};

const doSegmentsIntersect = (p0, p1, p2, p3) => {
  const minX1 = Math.min(p0.x, p1.x), maxX1 = Math.max(p0.x, p1.x);
  const minY1 = Math.min(p0.y, p1.y), maxY1 = Math.max(p0.y, p1.y);
  const minX2 = Math.min(p2.x, p3.x), maxX2 = Math.max(p2.x, p3.x);
  const minY2 = Math.min(p2.y, p3.y), maxY2 = Math.max(p2.y, p3.y);

  if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) return false;

  const isHorz1 = p0.y === p1.y;
  const isHorz2 = p2.y === p3.y;

  if (isHorz1 === isHorz2) return false;

  if (isHorz1) {
    return isBetween(p2.x, p0.x, p1.x) && isBetween(p0.y, p2.y, p3.y);
  } else {
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

      tanks.forEach(tank => {
        if (!tank.parentIds || tank.parentIds.length === 0) return;

        tank.parentIds.forEach(parentId => {
          if (draggingState.isDragging && (tank.id === draggingState.tankId || parentId === draggingState.tankId)) {
            return;
          }

          const parentEl = tankRefs.current[parentId];
          const childEl = tankRefs.current[tank.id];

          if (parentEl && childEl) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();

            const startX = (parentRect.left + parentRect.width / 2) - containerRect.left + scrollLeft;
            const startY = (parentRect.bottom) - containerRect.top + scrollTop;

            const endX = (childRect.left + childRect.width / 2) - containerRect.left + scrollLeft;
            const endY = (childRect.top) - containerRect.top + scrollTop;

            const midY = (startY + endY) / 2;

            const segments = [
              { p1: { x: startX, y: startY }, p2: { x: startX, y: midY } },
              { p1: { x: startX, y: midY }, p2: { x: endX, y: midY } },
              { p1: { x: endX, y: midY }, p2: { x: endX, y: endY } }
            ];

            newLines.push({
              id: `${parentId}-${tank.id}`,
              parentId: parentId,
              childId: tank.id, // Store childId to detect convergence
              startX, startY, endX, endY, midY,
              segments
            });
          } else {
            missingRefs = true;
          }
        });
      });

      const crossings = new Set();
      for (let i = 0; i < newLines.length; i++) {
        for (let j = i + 1; j < newLines.length; j++) {
          const lineA = newLines[i];
          const lineB = newLines[j];

          // 1. Ignore if they share a Parent (diverging lines)
          if (lineA.parentId === lineB.parentId) continue;

          // 2. Ignore if they share a Child (converging lines - merged endpoints)
          if (lineA.childId === lineB.childId) continue;

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
        const color = isCrossed ? "#EF4444" : "#4B5563";
        const marker = isCrossed ? "url(#arrowhead-red)" : "url(#arrowhead-gray)";
        const width = isCrossed ? "3" : "2";
        const path = `M ${line.startX} ${line.startY} V ${line.midY} H ${line.endX} V ${line.endY}`;

        return (
          <g key={line.id}>
            <path d={path} stroke="#111827" strokeWidth="4" fill="none" opacity="0.5" />
            <path
              d={path}
              stroke={color}
              strokeWidth={width}
              fill="none"
              markerEnd={marker}
              strokeDasharray={isCrossed ? "5,3" : "0"}
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
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentIds: [], classType: 'LT', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'T-26', tierId: 'tier-2', image: null, parentIds: ['t1'], classType: 'LT', xpCost: 150, columnIndex: 2 },
  ]);

  const [selectedTankId, setSelectedTankId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sidebar Menu States
  const [isParentMenuOpen, setIsParentMenuOpen] = useState(false);
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);

  const [draggingState, setDraggingState] = useState({
    isPressed: false,
    isDragging: false,
    tankId: null,
    currentTierId: null,
    targetCol: 0
  });

  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const dragItemRef = useRef(null);

  const dragData = useRef({
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    tankId: null,
    currentTierId: null,
    targetCol: 0,
    hasMoved: false
  });

  const maxColumnIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridColumns = Math.max(maxColumnIndex + 6, 8);

  // --- Real-time Conflict Detection (Including Horizontal Line Obscurity) ---
  const conflicts = useMemo(() => {
    const conflictsMap = {};
    const posMap = new Map();

    // 1. Detect Direct Overlaps (Same cell)
    tanks.forEach(t => {
      const key = `${t.tierId}-${t.columnIndex}`;
      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(t.id);
    });

    posMap.forEach(ids => {
      if (ids.length > 1) ids.forEach(id => conflictsMap[id] = 'overlap');
    });

    // 2. Detect Line Blockers
    const getTierIdx = (tid) => tiers.find(x => x.id === tid)?.index ?? -1;

    tanks.forEach(child => {
      if (!child.parentIds || child.parentIds.length === 0) return;

      child.parentIds.forEach(parentId => {
        const parent = tanks.find(t => t.id === parentId);
        if (!parent) return;

        const pIdx = getTierIdx(parent.tierId);
        const cIdx = getTierIdx(child.tierId);
        const minIdx = Math.min(pIdx, cIdx);
        const maxIdx = Math.max(pIdx, cIdx);

        // Grid coordinates for the connection
        const pCol = parent.columnIndex || 0;
        const cCol = child.columnIndex || 0;
        const minCol = Math.min(pCol, cCol);
        const maxCol = Math.max(pCol, cCol);

        // Find potential blockers
        tanks.forEach(blocker => {
          if (blocker.id === child.id || blocker.id === parent.id) return;

          const bIdx = getTierIdx(blocker.tierId);
          const bCol = blocker.columnIndex || 0;

          // Only check if blocker is in a tier STRICTLY between parent and child
          // because the horizontal connection line runs through the "middle" of the intermediate tiers
          if (bIdx > minIdx && bIdx < maxIdx) {

            // Vertical Segment Block (same column as Parent OR Child, and line is vertical-ish there)
            // But simplifying: A tank blocks if it is in the range of columns spanned by the line.

            // Case A: Vertical Line (Parent and Child in same column)
            if (pCol === cCol && bCol === pCol) {
              conflictsMap[blocker.id] = 'blocker';
            }

            // Case B: Horizontal Segment Block
            // The horizontal segment runs at the midpoint between tiers.
            // In a visual grid, this effectively "cuts through" the tanks in the intermediate tiers.
            // If the blocker is in a column strictly between start and end column, it blocks the horizontal line.
            else if (bCol >= minCol && bCol <= maxCol) {
              conflictsMap[blocker.id] = 'blocker';
            }
          }
        });
      });
    });

    return conflictsMap;
  }, [tanks, tiers]);

  // --- Logic ---

  const handleDragStart = (e, tank) => {
    e.stopPropagation();

    const el = tankRefs.current[tank.id];
    if (!el) return;

    const rect = el.getBoundingClientRect();

    dragData.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      tankId: tank.id,
      currentTierId: tank.tierId,
      targetCol: tank.columnIndex,
      hasMoved: false
    };

    dragItemRef.current = el;

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragData.current.hasMoved) {
      const dist = Math.hypot(e.clientX - dragData.current.startX, e.clientY - dragData.current.startY);
      if (dist < 5) return;

      dragData.current.hasMoved = true;

      if (dragItemRef.current) {
        dragItemRef.current.style.position = 'fixed';
        dragItemRef.current.style.zIndex = 1000;
        dragItemRef.current.style.pointerEvents = 'none';
        dragItemRef.current.style.width = `${TANK_WIDTH}px`;
        const initialX = e.clientX - dragData.current.offsetX;
        const initialY = e.clientY - dragData.current.offsetY;
        dragItemRef.current.style.left = `${initialX}px`;
        dragItemRef.current.style.top = `${initialY}px`;
      }

      setDraggingState({
        isPressed: true,
        isDragging: true,
        tankId: dragData.current.tankId,
        currentTierId: dragData.current.currentTierId,
        targetCol: dragData.current.targetCol
      });
    }

    if (dragData.current.hasMoved && dragItemRef.current) {
      const x = e.clientX - dragData.current.offsetX;
      const y = e.clientY - dragData.current.offsetY;

      dragItemRef.current.style.left = `${x}px`;
      dragItemRef.current.style.top = `${y}px`;

      if (containerRef.current) {
        let newTierId = dragData.current.currentTierId;
        let newCol = dragData.current.targetCol;

        const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
        const tierEl = elementsUnderCursor.find(el => el.getAttribute && el.getAttribute('data-tier-id'));
        if (tierEl) newTierId = tierEl.getAttribute('data-tier-id');

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const itemCenterX = (e.clientX - dragData.current.offsetX) + (TANK_WIDTH / 2);
        const relativeX = itemCenterX - containerRect.left + scrollLeft;

        newCol = Math.floor(relativeX / COLUMN_WIDTH);
        if (newCol < 0) newCol = 0;

        if (newTierId !== dragData.current.currentTierId || newCol !== dragData.current.targetCol) {
          dragData.current.currentTierId = newTierId;
          dragData.current.targetCol = newCol;

          setDraggingState(prev => ({
            ...prev,
            currentTierId: newTierId,
            targetCol: newCol
          }));
        }
      }
    }
  };

  const handleDragEnd = () => {
    if (dragData.current.hasMoved) {
      setTanks(currTanks => currTanks.map(t =>
        t.id === dragData.current.tankId
          ? { ...t, columnIndex: dragData.current.targetCol, tierId: dragData.current.currentTierId }
          : t
      ));
    } else {
      setSelectedTankId(dragData.current.tankId);
      setIsSidebarOpen(true);
      setIsParentMenuOpen(false);
      setIsChildMenuOpen(false);
    }

    setDraggingState({
      isPressed: false,
      isDragging: false,
      tankId: null,
      currentTierId: null,
      targetCol: 0
    });

    if (dragItemRef.current) {
      dragItemRef.current.style.left = '';
      dragItemRef.current.style.top = '';
      dragItemRef.current.style.position = '';
      dragItemRef.current.style.zIndex = '';
      dragItemRef.current.style.width = '';
      dragItemRef.current = null;
    }

    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

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
      id: generateId(), name: 'New Tank', tierId: tierId, image: null, parentIds: [], classType: 'LT', xpCost: 0, columnIndex: col
    };
    setTanks([...tanks, newTank]);
    handleEditTank(newTank);
  };

  const handleDeleteTank = (id) => {
    setTanks(tanks.filter(t => t.id !== id).map(t => ({
      ...t,
      parentIds: t.parentIds.filter(pid => pid !== id)
    })));
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
    setTanks(tempTanks);
  };

  const toggleParent = (tankId, parentId) => {
    setTanks(currTanks => currTanks.map(t => {
      if (t.id !== tankId) return t;
      const currentParents = t.parentIds || [];
      if (currentParents.includes(parentId)) {
        return { ...t, parentIds: currentParents.filter(id => id !== parentId) };
      } else {
        return { ...t, parentIds: [...currentParents, parentId] };
      }
    }));
    setIsParentMenuOpen(false);
  };

  const toggleChild = (currentTankId, targetChildId) => {
    setTanks(currTanks => currTanks.map(t => {
      if (t.id !== targetChildId) return t;
      const currentParents = t.parentIds || [];
      if (currentParents.includes(currentTankId)) {
        return { ...t, parentIds: currentParents.filter(id => id !== currentTankId) };
      } else {
        return { ...t, parentIds: [...currentParents, currentTankId] };
      }
    }));
    setIsChildMenuOpen(false);
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

  const currentChildren = selectedTank
    ? tanks.filter(t => t.parentIds && t.parentIds.includes(selectedTank.id))
    : [];

  const availableChildren = selectedTank
    ? tanks.filter(t => {
      const currentTierIndex = tiers.find(tier => tier.id === selectedTank.tierId)?.index || 0;
      const candidateTierIndex = tiers.find(tier => tier.id === t.tierId)?.index || 0;
      return candidateTierIndex > currentTierIndex;
    })
    : [];

  const conflictCount = Object.keys(conflicts).length;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden select-none">
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
              {/* Image */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Tank Preview</label>
                <div className="h-32 w-full border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-gray-800 transition-colors relative overflow-hidden group" onClick={() => document.getElementById('tank-image-upload').click()}>
                  {selectedTank.image ? <img src={selectedTank.image} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-gray-600"><Upload size={24} className="mb-2" /><span className="text-xs">Click to Upload Image</span></div>}
                  <input id="tank-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {selectedTank.image && <button onClick={(e) => { e.stopPropagation(); updateTank(selectedTank.id, 'image', null); }} className="absolute top-2 right-2 p-1 bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>}
                </div>
              </div>

              {/* Grid Pos */}
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

              {/* Details */}
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

              {/* Parents Section */}
              <div className="space-y-2 pt-4 border-t border-gray-800">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                  <Network size={12} /> Research Parents (From)
                </label>

                <div className="space-y-2 mb-3">
                  {selectedTank.parentIds && selectedTank.parentIds.length > 0 ? (
                    selectedTank.parentIds.map(pid => {
                      const pTank = tanks.find(t => t.id === pid);
                      if (!pTank) return null;
                      return (
                        <div key={pid} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>{pTank.name}</span>
                            <span className="text-xs text-gray-500">(Tier {tiers.find(tr => tr.id === pTank.tierId)?.roman})</span>
                          </div>
                          <button onClick={() => toggleParent(selectedTank.id, pid)} className="text-gray-500 hover:text-red-400">
                            <Unlink size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-800 rounded">No parent tanks linked.</div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setIsParentMenuOpen(!isParentMenuOpen); setIsChildMenuOpen(false); }}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <LinkIcon size={12} /> Link Parent Tank
                    <ChevronDown size={12} className={`transition-transform ${isParentMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isParentMenuOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded shadow-xl z-50">
                      {availableParents.length === 0 && <div className="p-2 text-xs text-gray-500">No available parents in lower tiers.</div>}
                      {availableParents.map(p => {
                        const isLinked = selectedTank.parentIds.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggleParent(selectedTank.id, p.id)}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-800 ${isLinked ? 'bg-blue-900/20' : ''}`}
                          >
                            <span>{p.name} <span className="text-gray-500">- T{tiers.find(tr => tr.id === p.tierId)?.roman}</span></span>
                            {isLinked && <span className="text-blue-500 text-[10px]">LINKED</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Children Section */}
              <div className="space-y-2 pt-4 border-t border-gray-800">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                  <ArrowDownCircle size={12} /> Tech Tree Children (To)
                </label>

                <div className="space-y-2 mb-3">
                  {currentChildren.length > 0 ? (
                    currentChildren.map(child => (
                      <div key={child.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>{child.name}</span>
                          <span className="text-xs text-gray-500">(Tier {tiers.find(tr => tr.id === child.tierId)?.roman})</span>
                        </div>
                        <button onClick={() => toggleChild(selectedTank.id, child.id)} className="text-gray-500 hover:text-red-400">
                          <Unlink size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-800 rounded">No children (end of line).</div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setIsChildMenuOpen(!isChildMenuOpen); setIsParentMenuOpen(false); }}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <LinkIcon size={12} /> Link Child Tank
                    <ChevronDown size={12} className={`transition-transform ${isChildMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isChildMenuOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded shadow-xl z-50">
                      {availableChildren.length === 0 && <div className="p-2 text-xs text-gray-500">No available children in higher tiers.</div>}
                      {availableChildren.map(c => {
                        const isLinked = c.parentIds && c.parentIds.includes(selectedTank.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleChild(selectedTank.id, c.id)}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-800 ${isLinked ? 'bg-green-900/20' : ''}`}
                          >
                            <span>{c.name} <span className="text-gray-500">- T{tiers.find(tr => tr.id === c.tierId)?.roman}</span></span>
                            {isLinked && <span className="text-green-500 text-[10px]">LINKED</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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