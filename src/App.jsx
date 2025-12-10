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
  Link as LinkIcon,
  Unlink,
  ArrowDownCircle,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  Palette
} from 'lucide-react';

/**
 * Utility: Generate unique IDs
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Constants & Defaults
 */
const COLUMN_WIDTH = 160;
const TANK_WIDTH = 144;

const DEFAULT_GROUPS = [
  { id: 'g_lt', name: 'Light Tanks', color: '#a3a3a3', icon: 'diamond' },     // Neutral/Silver
  { id: 'g_mt', name: 'Medium Tanks', color: '#4ade80', icon: 'hexagon' },    // Green
  { id: 'g_ht', name: 'Heavy Tanks', color: '#e7f84bff', icon: 'square' },      // Red
  { id: 'g_td', name: 'Tank Destroyers', color: '#38bdf8', icon: 'triangle' },// Blue
  { id: 'g_spg', name: 'SPGs', color: '#c084fc', icon: 'circle' },            // Purple
];

// Placeholder Icon Renderer (Since user has their own icons, using Lucide as placeholders)
const GroupIcon = ({ icon, color, size = 16 }) => {
  const props = { size, color, strokeWidth: 2 };
  switch (icon) {
    case 'diamond': return <Diamond {...props} />;
    case 'hexagon': return <Hexagon {...props} />;
    case 'square': return <Square {...props} />;
    case 'triangle': return <Triangle {...props} />;
    case 'circle': return <Circle {...props} />;
    default: return <Target {...props} />;
  }
};

const TankCard = ({
  tank,
  group,
  isSelected,
  isHighlighted,
  onEdit,
  onDelete,
  onMouseDown,
  isDragging,
  conflictType,
  setRef
}) => {

  // Dynamic Styles based on Group Color
  const mainColor = group?.color || '#525252';

  // Selection Logic
  let borderColor = isSelected ? '#fbbf24' : '#262626'; // Default border neutral-800
  let bgColor = '#0a0a0a'; // Default bg neutral-950

  if (isSelected) {
    borderColor = '#fbbf24'; // Amber-400
    bgColor = '#171717';
  } else if (isHighlighted) {
    borderColor = mainColor;
    bgColor = `${mainColor}10`; // Low opacity hex
  } else {
    // Idle state: Use group color as a subtle bottom border or accent
    borderColor = '#262626';
  }

  // Conflict Overrides
  if (conflictType === 'overlap') {
    borderColor = '#dc2626';
    bgColor = '#450a0a';
  } else if (conflictType === 'blocker') {
    borderColor = '#ea580c';
    bgColor = '#431407';
  }

  const style = {
    gridColumnStart: (tank.columnIndex || 0) + 1,
    gridRowStart: 1,
    zIndex: isSelected ? 20 : (isHighlighted ? 15 : 10),
    borderColor: borderColor,
    backgroundColor: bgColor
  };

  // Dragging overrides
  if (isDragging) {
    style.position = 'fixed';
    style.zIndex = 1000;
    style.pointerEvents = 'none';
    style.width = `${TANK_WIDTH}px`;
    style.opacity = 0.9;
  }

  return (
    <div
      ref={setRef}
      onMouseDown={(e) => onMouseDown(e, tank)}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(tank); }}
      style={style}
      className={`
        relative group flex flex-col items-center w-36 transition-none ease-out justify-self-center select-none
        border rounded-sm
        ${!isDragging ? 'hover:scale-[1.02] cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* Conflict Badge */}
      {conflictType && !isDragging && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-[9px] font-bold px-2 rounded-sm flex items-center gap-1 z-50 whitespace-nowrap border
          ${conflictType === 'overlap' ? 'bg-black border-red-500 text-red-500' : 'bg-black border-orange-500 text-orange-500'}
        `}>
          <AlertTriangle size={8} />
          {conflictType === 'overlap' ? 'OVERLAP' : 'BLOCK'}
        </div>
      )}

      {/* Image Area */}
      <div className="h-20 w-full relative border-b border-neutral-800 bg-black/40">
        {tank.image ? (
          <img src={tank.image} alt={tank.name} className="w-full h-full object-cover pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <GroupIcon icon={group?.icon} color={mainColor} size={32} />
          </div>
        )}

        {/* Class Icon Badge */}
        <div className="absolute top-0 right-0 bg-neutral-900 border-l border-b border-neutral-800 p-1.5">
          <GroupIcon icon={group?.icon} color={mainColor} size={12} />
        </div>
      </div>

      {/* Info Area */}
      <div className="p-2 text-center w-full">
        <h3
          className="text-xs font-medium truncate w-full font-mono mb-1"
          style={{ color: isSelected ? '#fbbf24' : (isHighlighted ? mainColor : '#d4d4d4') }}
        >
          {tank.name || 'Unnamed'}
        </h3>
        <p className="text-[10px] text-neutral-600 font-mono">XP: {tank.xpCost || 0}</p>
      </div>

      {!isDragging && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(tank.id); }}
          className="absolute -top-2 -right-2 p-1 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-500 hover:border-red-900 opacity-0 group-hover:opacity-100 transition-all rounded-sm z-30"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

const TierRow = ({ tier, tanks, groups, onSelectTank, onEditTank, selectedTankId, highlightedIds, onAddTank, onDeleteTank, onDeleteTier, registerTankRef, gridColumns, dragHandler, draggingState, conflicts }) => {
  const isTargetTier = draggingState.currentTierId === tier.id;

  return (
    <div
      id={`tier-${tier.id}`}
      data-tier-id={tier.id}
      className={`flex relative min-h-[160px] border-b border-neutral-800/50 last:border-0 group/tier transition-colors duration-200
        ${isTargetTier && draggingState.isDragging ? 'bg-neutral-900/30' : 'hover:bg-neutral-900/10'}
      `}
    >
      {/* Tier Label */}
      <div className="w-16 flex-shrink-0 bg-neutral-950 border-r border-neutral-800/50 flex flex-col items-center pt-6 z-10 sticky left-0">
        <span className="text-xl font-bold text-neutral-700 font-serif mb-3">{tier.roman}</span>
        <div className="flex flex-col gap-1 opacity-0 group-hover/tier:opacity-100 transition-opacity">
          <button onClick={() => onAddTank(tier.id)} className="p-1 text-neutral-600 hover:text-green-500 transition-colors" title="Add Tank">
            <Plus size={14} />
          </button>
          <button onClick={() => onDeleteTier(tier.id)} className="p-1 text-neutral-600 hover:text-red-500 transition-colors" title="Delete Tier">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="relative flex-1">
        <div
          className="grid items-center p-4 h-full relative"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, ${COLUMN_WIDTH}px)`,
            width: 'max-content',
            gap: '0'
          }}
        >
          {draggingState.isDragging && isTargetTier && (
            <div
              className="absolute border border-dashed border-neutral-600 rounded-sm w-36 h-32 flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase"
              style={{
                left: `${(draggingState.targetCol * COLUMN_WIDTH) + 16 + (COLUMN_WIDTH - TANK_WIDTH) / 2}px`,
                top: '16px'
              }}
            >
              Move Here
            </div>
          )}

          {tanks.map(tank => {
            const isDraggingThis = draggingState.isDragging && draggingState.tankId === tank.id;
            const isHighlighted = highlightedIds && highlightedIds.has(tank.id);
            const tankGroup = groups.find(g => g.id === tank.groupId) || groups[0];

            return (
              <TankCard
                key={tank.id}
                tank={tank}
                group={tankGroup}
                isSelected={selectedTankId === tank.id}
                isHighlighted={isHighlighted}
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

// ... Intersect Helper Functions (Same as before) ...
const isBetween = (c, a, b) => (c >= a && c <= b) || (c >= b && c <= a);
const doSegmentsIntersect = (p0, p1, p2, p3) => {
  const minX1 = Math.min(p0.x, p1.x), maxX1 = Math.max(p0.x, p1.x);
  const minY1 = Math.min(p0.y, p1.y), maxY1 = Math.max(p0.y, p1.y);
  const minX2 = Math.min(p2.x, p3.x), maxX2 = Math.max(p2.x, p3.x);
  const minY2 = Math.min(p2.y, p3.y), maxY2 = Math.max(p2.y, p3.y);
  if (maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2) return false;
  const isHorz1 = p0.y === p1.y;
  const isHorz2 = p2.y === p3.y;
  if (isHorz1 === isHorz2) return false;
  if (isHorz1) return isBetween(p2.x, p0.x, p1.x) && isBetween(p0.y, p2.y, p3.y);
  else return isBetween(p0.x, p2.x, p3.x) && isBetween(p2.y, p0.y, p1.y);
};

const ConnectionLines = ({ tanks, groups, tankRefs, containerRef, draggingState, highlightedIds }) => {
  const [lines, setLines] = useState([]);
  const [crossingIds, setCrossingIds] = useState(new Set());
  const [retry, setRetry] = useState(0);

  useLayoutEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const rawLines = [];
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;
      const tankMap = new Map(tanks.map(t => [t.id, t]));

      let missingRefs = false;

      // 1. Generate Raw Lines (Center to Center initially)
      tanks.forEach(tank => {
        if (!tank.parentIds || tank.parentIds.length === 0) return;
        tank.parentIds.forEach(parentId => {
          if (draggingState.isDragging && (tank.id === draggingState.tankId || parentId === draggingState.tankId)) return;

          const parentEl = tankRefs.current[parentId];
          const childEl = tankRefs.current[tank.id];
          const parentTank = tankMap.get(parentId);

          if (parentEl && childEl && parentTank) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();

            const startX = (parentRect.left + parentRect.width / 2) - containerRect.left + scrollLeft;
            const startY = (parentRect.bottom) - containerRect.top + scrollTop;

            // Initial EndX is center, we will shift this later
            const baseEndX = (childRect.left + childRect.width / 2) - containerRect.left + scrollLeft;
            const endY = (childRect.top) - containerRect.top + scrollTop;
            const midY = (startY + endY) / 2;

            rawLines.push({
              id: `${parentId}-${tank.id}`,
              parentId: parentId,
              childId: tank.id,
              startX,
              startY,
              endX: baseEndX, // Will be modified
              baseEndX,       // Keep ref to center
              endY,
              midY,
              tierGapId: parentTank.tierId,
              group: groups.find(g => g.id === parentTank.groupId)
            });
          } else {
            missingRefs = true;
          }
        });
      });

      // 2. Horizontal Separation (Prevent overlapping horizontal bars)
      const gapGroups = {};
      rawLines.forEach(line => {
        if (!gapGroups[line.tierGapId]) gapGroups[line.tierGapId] = [];
        gapGroups[line.tierGapId].push(line);
      });

      const processedLines = [];
      const HORIZONTAL_GAP_OFFSET = 12;

      Object.values(gapGroups).forEach(group => {
        const parentBundles = {};
        group.forEach(line => {
          if (!parentBundles[line.parentId]) parentBundles[line.parentId] = [];
          parentBundles[line.parentId].push(line);
        });

        const bundles = Object.values(parentBundles);
        // Sort bundles left-to-right based on parent position
        bundles.sort((a, b) => a[0].startX - b[0].startX);
        const bundleCount = bundles.length;

        bundles.forEach((bundle, index) => {
          let offset = 0;
          if (bundleCount > 1) {
            offset = (index - (bundleCount - 1) / 2) * HORIZONTAL_GAP_OFFSET;
          }

          bundle.forEach(line => {
            line.midY += offset;
            processedLines.push(line);
          });
        });
      });

      // 3. Child Input Separation (Prevent overlapping vertical entry lines)
      // This is the fix for "Separate arrows/lines if card has 2 parents"
      const incomingGroups = {};
      processedLines.forEach(line => {
        if (!incomingGroups[line.childId]) incomingGroups[line.childId] = [];
        incomingGroups[line.childId].push(line);
      });

      const ENTRY_GAP_OFFSET = 20; // Distance between arrows entering the same tank

      Object.values(incomingGroups).forEach(incomingLines => {
        // Sort lines based on the PARENT'S X position.
        // Leftmost parent connects to the leftmost side of the child.
        incomingLines.sort((a, b) => a.startX - b.startX);

        const count = incomingLines.length;
        if (count > 1) {
          incomingLines.forEach((line, index) => {
            // Calculate offset from center
            const offset = (index - (count - 1) / 2) * ENTRY_GAP_OFFSET;
            line.endX = line.baseEndX + offset;
          });
        }
      });

      // 4. Generate Segments & Check Intersections
      const finalLines = [];
      const crossings = new Set();

      processedLines.forEach(line => {
        // Create the 3-segment path
        line.segments = [
          { p1: { x: line.startX, y: line.startY }, p2: { x: line.startX, y: line.midY } },
          { p1: { x: line.startX, y: line.midY }, p2: { x: line.endX, y: line.midY } },
          { p1: { x: line.endX, y: line.midY }, p2: { x: line.endX, y: line.endY } }
        ];
        finalLines.push(line);
      });

      for (let i = 0; i < finalLines.length; i++) {
        for (let j = i + 1; j < finalLines.length; j++) {
          const lineA = finalLines[i];
          const lineB = finalLines[j];
          if (lineA.parentId === lineB.parentId) continue;
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

      setLines(finalLines);
      setCrossingIds(crossings);
      if (missingRefs && retry < 3) setTimeout(() => setRetry(r => r + 1), 100);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [tanks, tankRefs, containerRef, draggingState.isDragging, retry, draggingState.tankId, groups]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
      {lines.map(line => {
        const isCrossed = crossingIds.has(line.id);
        const isHighlighted = highlightedIds && highlightedIds.has(line.parentId) && highlightedIds.has(line.childId);

        const baseColor = line.group?.color || '#525252';
        let color = isHighlighted ? baseColor : '#404040';
        let opacity = isHighlighted ? "1" : "0.4";
        let strokeWidth = isHighlighted ? "2" : "1.5";
        let strokeDash = "0";

        if (highlightedIds && !isHighlighted) {
          opacity = "0.1";
        }

        if (isCrossed) {
          color = "#991b1b";
          strokeDash = "4,4";
          opacity = "0.8";
        }

        const path = `M ${line.startX} ${line.startY} V ${line.midY} H ${line.endX} V ${line.endY}`;

        return (
          <g key={line.id}>
            {/* Hit area */}
            <path d={path} stroke="#0a0a0a" strokeWidth="5" fill="none" />

            {/* Visible Line */}
            <path
              d={path}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDash}
              opacity={opacity}
              shapeRendering="geometricPrecision"
              className="transition-colors duration-300"
            />

            {/* Arrowhead - Follows the new endX */}
            <polygon
              points={`${line.endX},${line.endY} ${line.endX - 3},${line.endY - 6} ${line.endX + 3},${line.endY - 6}`}
              fill={color}
              opacity={opacity}
            />

            {/* Optional: Small Dot at entry point to emphasize separation */}
            {lines.filter(l => l.childId === line.childId).length > 1 && (
              <circle cx={line.endX} cy={line.endY} r="1.5" fill={color} opacity={opacity} />
            )}
          </g>
        );
      })}
    </svg>
  );
};

const getAllConnectedIds = (startId, allTanks) => {
  if (!startId) return new Set();
  const connected = new Set([startId]);
  const tankMap = new Map(allTanks.map(t => [t.id, t]));

  // Up
  const queueUp = [startId];
  while (queueUp.length) {
    const currentId = queueUp.pop();
    const tank = tankMap.get(currentId);
    if (tank && tank.parentIds) {
      tank.parentIds.forEach(pid => {
        if (!connected.has(pid)) {
          connected.add(pid);
          queueUp.push(pid);
        }
      });
    }
  }
  // Down
  const queueDown = [startId];
  while (queueDown.length) {
    const currentId = queueDown.pop();
    allTanks.forEach(t => {
      if (t.parentIds && t.parentIds.includes(currentId) && !connected.has(t.id)) {
        connected.add(t.id);
        queueDown.push(t.id);
      }
    });
  }
  return connected;
};

export default function TankTreeArchitect() {
  const [tiers, setTiers] = useState([
    { id: 'tier-1', roman: 'I', index: 0 },
    { id: 'tier-2', roman: 'II', index: 1 },
    { id: 'tier-3', roman: 'III', index: 2 },
  ]);

  const [groups, setGroups] = useState(DEFAULT_GROUPS);

  const [tanks, setTanks] = useState([
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentIds: [], groupId: 'g_lt', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'T-26', tierId: 'tier-2', image: null, parentIds: ['t1'], groupId: 'g_lt', xpCost: 150, columnIndex: 2 },
  ]);

  const [selectedTankId, setSelectedTankId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Menus
  const [isParentMenuOpen, setIsParentMenuOpen] = useState(false);
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);

  // Dragging
  const [draggingState, setDraggingState] = useState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const dragItemRef = useRef(null);
  const dragData = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, tankId: null, currentTierId: null, targetCol: 0, hasMoved: false });

  const maxColumnIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridColumns = Math.max(maxColumnIndex + 6, 8);

  const highlightedIds = useMemo(() => {
    return selectedTankId ? getAllConnectedIds(selectedTankId, tanks) : null;
  }, [selectedTankId, tanks]);

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
      if (!child.parentIds || child.parentIds.length === 0) return;
      child.parentIds.forEach(parentId => {
        const parent = tanks.find(t => t.id === parentId);
        if (!parent) return;
        const pIdx = getTierIdx(parent.tierId);
        const cIdx = getTierIdx(child.tierId);
        const minIdx = Math.min(pIdx, cIdx);
        const maxIdx = Math.max(pIdx, cIdx);
        const pCol = parent.columnIndex || 0;
        const cCol = child.columnIndex || 0;
        const minCol = Math.min(pCol, cCol);
        const maxCol = Math.max(pCol, cCol);
        tanks.forEach(blocker => {
          if (blocker.id === child.id || blocker.id === parent.id) return;
          const bIdx = getTierIdx(blocker.tierId);
          const bCol = blocker.columnIndex || 0;
          if (bIdx > minIdx && bIdx < maxIdx) {
            if (pCol === cCol && bCol === pCol) conflictsMap[blocker.id] = 'blocker';
            else if (bCol >= minCol && bCol <= maxCol) conflictsMap[blocker.id] = 'blocker';
          }
        });
      });
    });
    return conflictsMap;
  }, [tanks, tiers]);

  // --- Handlers ---

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
          setDraggingState(prev => ({ ...prev, currentTierId: newTierId, targetCol: newCol }));
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
    setDraggingState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
    if (dragItemRef.current) {
      dragItemRef.current.style.left = ''; dragItemRef.current.style.top = '';
      dragItemRef.current.style.position = ''; dragItemRef.current.style.zIndex = '';
      dragItemRef.current.style.width = '';
      dragItemRef.current = null;
    }
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  const handleEditTank = (tank) => { setSelectedTankId(tank.id); setIsSidebarOpen(true); };

  const handleAddTier = () => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const nextIndex = tiers.length;
    const newTier = { id: generateId(), roman: romanNumerals[nextIndex] || `T${nextIndex + 1}`, index: nextIndex };
    setTiers([...tiers, newTier]);
  };

  /**
   * SMART ADD TANK LOGIC (Separates Branches)
   */
  const handleAddTank = (tierId) => {
    const tierIndex = tiers.findIndex(t => t.id === tierId);
    let targetCol = 0;
    let parentId = null;
    let inheritedGroup = groups[0].id; // Default to LT

    // Check if we have a selected tank in the PREVIOUS tier (Parent context)
    const potentialParent = selectedTankId ? tanks.find(t => t.id === selectedTankId) : null;
    const potentialParentTierIndex = potentialParent ? tiers.findIndex(t => t.id === potentialParent.tierId) : -1;

    if (potentialParent && potentialParentTierIndex === tierIndex - 1) {
      // We are adding a child to the currently selected tank
      parentId = potentialParent.id;
      targetCol = potentialParent.columnIndex || 0;
      inheritedGroup = potentialParent.groupId; // Inherit class color/type

      // Resolve collision if that spot is taken
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) {
        targetCol++;
      }
    } else {
      // Just adding a random tank to this tier, find first empty spot
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) {
        targetCol++;
      }
    }

    const newTank = {
      id: generateId(),
      name: 'New Vehicle',
      tierId: tierId,
      image: null,
      parentIds: parentId ? [parentId] : [],
      groupId: inheritedGroup,
      xpCost: 0,
      columnIndex: targetCol
    };
    setTanks([...tanks, newTank]);
    handleEditTank(newTank);
  };

  const handleDeleteTank = (id) => {
    setTanks(tanks.filter(t => t.id !== id).map(t => ({ ...t, parentIds: t.parentIds.filter(pid => pid !== id) })));
    if (selectedTankId === id) setSelectedTankId(null);
    delete tankRefs.current[id];
  };
  const handleDeleteTier = (tierId) => {
    if (tanks.some(t => t.tierId === tierId)) { alert("Remove tanks first."); return; }
    setTiers(tiers.filter(t => t.id !== tierId));
  };
  const updateTank = (id, field, value) => {
    setTanks(tanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const updateGroupColor = (groupId, color) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, color } : g));
  };

  const toggleParent = (tankId, parentId) => {
    setTanks(currTanks => currTanks.map(t => {
      if (t.id !== tankId) return t;
      const currentParents = t.parentIds || [];
      return { ...t, parentIds: currentParents.includes(parentId) ? currentParents.filter(id => id !== parentId) : [...currentParents, parentId] };
    }));
    setIsParentMenuOpen(false);
  };
  const toggleChild = (currentTankId, targetChildId) => {
    setTanks(currTanks => currTanks.map(t => {
      if (t.id !== targetChildId) return t;
      const currentParents = t.parentIds || [];
      return { ...t, parentIds: currentParents.includes(currentTankId) ? currentParents.filter(id => id !== currentTankId) : [...currentParents, currentTankId] };
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
  const availableParents = selectedTank ? tanks.filter(t => tiers.find(tier => tier.id === t.tierId)?.index < tiers.find(tier => tier.id === selectedTank.tierId)?.index) : [];
  const currentChildren = selectedTank ? tanks.filter(t => t.parentIds && t.parentIds.includes(selectedTank.id)) : [];
  const availableChildren = selectedTank ? tanks.filter(t => tiers.find(tier => tier.id === t.tierId)?.index > tiers.find(tier => tier.id === selectedTank.tierId)?.index) : [];
  const conflictCount = Object.keys(conflicts).length;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans overflow-hidden select-none">

      {/* Sidebar */}
      <div className={`flex-shrink-0 bg-neutral-900 border-r border-neutral-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Settings size={16} /> Properties
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-neutral-500 hover:text-neutral-200">
            <ChevronDown className="transform rotate-90" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {selectedTank ? (
            <>
              {/* Image Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Preview</label>
                <div className="h-32 w-full border border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group" onClick={() => document.getElementById('tank-image-upload').click()}>
                  {selectedTank.image ? <img src={selectedTank.image} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-neutral-600"><Upload size={20} className="mb-2" /><span className="text-xs">Upload Image</span></div>}
                  <input id="tank-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {selectedTank.image && <button onClick={(e) => { e.stopPropagation(); updateTank(selectedTank.id, 'image', null); }} className="absolute top-2 right-2 p-1 bg-neutral-900 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"><Trash2 size={12} /></button>}
                </div>
              </div>

              {/* Name & Class */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Name</label>
                  <input type="text" value={selectedTank.name} onChange={(e) => updateTank(selectedTank.id, 'name', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Class Group</label>
                    <div className="relative">
                      <button
                        onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groups.find(g => g.id === selectedTank.groupId)?.color }}></div>
                          {groups.find(g => g.id === selectedTank.groupId)?.name.split(' ')[0]}
                        </span>
                        <ChevronDown size={12} />
                      </button>

                      {isGroupMenuOpen && (
                        <div className="absolute top-full left-0 w-full bg-neutral-900 border border-neutral-700 z-50 mt-1 shadow-xl">
                          {groups.map(g => (
                            <button key={g.id} onClick={() => { updateTank(selectedTank.id, 'groupId', g.id); setIsGroupMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-800">
                              <GroupIcon icon={g.icon} color={g.color} size={12} />
                              {g.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">XP Cost</label>
                    <input type="number" value={selectedTank.xpCost} onChange={(e) => updateTank(selectedTank.id, 'xpCost', parseInt(e.target.value) || 0)} className="w-full bg-neutral-950 border border-neutral-700 rounded-sm p-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Grid Pos */}
              <div className="p-3 bg-neutral-800/30 rounded-sm border border-neutral-800">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-2">
                  <MoveHorizontal size={12} /> Grid Position
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateTank(selectedTank.id, 'columnIndex', Math.max(0, (selectedTank.columnIndex || 0) - 1))} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronLeft size={14} /></button>
                  <span className="text-sm font-mono text-neutral-400 w-8 text-center">{selectedTank.columnIndex || 0}</span>
                  <button onClick={() => updateTank(selectedTank.id, 'columnIndex', (selectedTank.columnIndex || 0) + 1)} className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-sm text-xs flex items-center justify-center gap-1"><ChevronRight size={14} /></button>
                </div>
              </div>

              {/* Parents */}
              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                  <Network size={12} /> Parents
                </label>
                <div className="space-y-1 mb-3">
                  {selectedTank.parentIds && selectedTank.parentIds.length > 0 ? (
                    selectedTank.parentIds.map(pid => {
                      const pTank = tanks.find(t => t.id === pid);
                      if (!pTank) return null;
                      return (
                        <div key={pid} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-sm border border-neutral-800 text-xs">
                          <span className="text-neutral-300">{pTank.name}</span>
                          <button onClick={() => toggleParent(selectedTank.id, pid)} className="text-neutral-600 hover:text-neutral-300"><Unlink size={12} /></button>
                        </div>
                      );
                    })
                  ) : <div className="text-xs text-neutral-600 italic">No parents linked.</div>}
                </div>
                <div className="relative">
                  <button onClick={() => { setIsParentMenuOpen(!isParentMenuOpen); setIsChildMenuOpen(false); }} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-sm border border-neutral-700 text-xs flex items-center justify-center gap-2">
                    <LinkIcon size={12} /> Link Parent
                  </button>
                  {isParentMenuOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                      {availableParents.map(p => (
                        <button key={p.id} onClick={() => toggleParent(selectedTank.id, p.id)} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 ${selectedTank.parentIds.includes(p.id) ? 'bg-neutral-800' : ''}`}>
                          <span>{p.name} <span className="text-neutral-500">- T{tiers.find(tr => tr.id === p.tierId)?.roman}</span></span>
                          {selectedTank.parentIds.includes(p.id) && <span className="text-neutral-500 text-[10px]">LINKED</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Children */}
              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                  <ArrowDownCircle size={12} /> Children
                </label>
                <div className="space-y-1 mb-3">
                  {currentChildren.length > 0 ? (
                    currentChildren.map(child => (
                      <div key={child.id} className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-sm border border-neutral-800 text-xs">
                        <span className="text-neutral-300">{child.name}</span>
                        <button onClick={() => toggleChild(selectedTank.id, child.id)} className="text-neutral-600 hover:text-neutral-300"><Unlink size={12} /></button>
                      </div>
                    ))
                  ) : <div className="text-xs text-neutral-600 italic">No children linked.</div>}
                </div>
                <div className="relative">
                  <button onClick={() => { setIsChildMenuOpen(!isChildMenuOpen); setIsParentMenuOpen(false); }} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-sm border border-neutral-700 text-xs flex items-center justify-center gap-2">
                    <LinkIcon size={12} /> Link Child
                  </button>
                  {isChildMenuOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 shadow-xl z-50">
                      {availableChildren.map(c => (
                        <button key={c.id} onClick={() => toggleChild(selectedTank.id, c.id)} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 ${c.parentIds.includes(selectedTank.id) ? 'bg-neutral-800' : ''}`}>
                          <span>{c.name} <span className="text-neutral-500">- T{tiers.find(tr => tr.id === c.tierId)?.roman}</span></span>
                          {c.parentIds.includes(selectedTank.id) && <span className="text-neutral-500 text-[10px]">LINKED</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <button onClick={() => handleDeleteTank(selectedTank.id)} className="w-full py-2 bg-transparent hover:bg-red-950/30 text-neutral-600 hover:text-red-500 rounded-sm border border-neutral-800 hover:border-red-900 transition-colors text-xs flex items-center justify-center gap-2">
                  <Trash2 size={12} /> Delete Tank
                </button>
              </div>
            </>
          ) : (
            // Settings / Group Manager when no tank selected
            <div className="space-y-6">
              <div className="text-center text-neutral-700 mt-4 mb-8">
                <Layout size={32} className="mx-auto mb-4 opacity-50" />
                <p className="text-xs">Select a node to edit, or configure groups below.</p>
              </div>

              <div className="border-t border-neutral-800 pt-6">
                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-4">
                  <Palette size={12} /> Class Manager
                </label>
                <div className="space-y-2">
                  {groups.map(g => (
                    <div key={g.id} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-2 rounded-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative group/color cursor-pointer">
                          <div className="w-4 h-4 rounded-sm border border-white/10" style={{ backgroundColor: g.color }}></div>
                          <input
                            type="color"
                            value={g.color}
                            onChange={(e) => updateGroupColor(g.id, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <GroupIcon icon={g.icon} color={g.color} size={14} />
                          <span className="text-xs font-mono text-neutral-400">{g.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-sm hover:bg-neutral-800"><Settings size={16} /></button>}
            <h1 className="text-sm font-bold tracking-[0.2em] text-neutral-400 flex items-center gap-2 uppercase">
              <Shield size={16} className="text-neutral-600" /> Tank Tree Architect
            </h1>
          </div>
          {conflictCount > 0 && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-red-900 rounded-sm">
              <AlertTriangle size={12} /> {conflictCount} ISSUES
            </div>
          )}
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950">
          <div className="min-w-full inline-block pb-20 relative">
            <ConnectionLines
              tanks={tanks}
              groups={groups}
              tankRefs={tankRefs}
              containerRef={containerRef}
              draggingState={draggingState}
              highlightedIds={highlightedIds}
            />

            <div className="flex flex-col relative z-10 pt-4">
              {tiers.map((tier) => (
                <TierRow
                  key={tier.id}
                  tier={tier}
                  tanks={tanks.filter(t => t.tierId === tier.id)}
                  groups={groups}
                  onSelectTank={(t) => setSelectedTankId(t.id)}
                  onEditTank={handleEditTank}
                  onAddTank={handleAddTank}
                  selectedTankId={selectedTankId}
                  highlightedIds={highlightedIds}
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
                <button onClick={handleAddTier} className="group flex items-center gap-2 px-6 py-2 bg-neutral-950 border border-dashed border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 rounded-sm transition-all">
                  <Plus size={14} className="text-neutral-600 group-hover:text-neutral-300" />
                  <span className="text-xs text-neutral-600 font-medium group-hover:text-neutral-300 uppercase tracking-wide">Add Tier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}