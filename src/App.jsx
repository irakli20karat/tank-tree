import { useState, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Settings, Shield, AlertTriangle, Link2, Upload, Save,
  GalleryVertical, GalleryHorizontal // Import new icons
} from 'lucide-react';
import { generateId, DEFAULT_GROUPS, COLUMN_WIDTH, TANK_WIDTH, getAllConnectedIds } from './utils';
import TankCard from './components/TankCard';
import Sidebar from './components/Sidebar';
import ConnectionLines from './components/ConnectionLines';

// Define the constant for horizontal spacing
const ROW_HEIGHT = 180;

// --- UPDATED TIER COMPONENT ---
const TierZone = ({
  tier, tanks, groups, selectedTankId, connectionSourceId,
  highlightedIds, draggingState, conflicts, gridCapacity,
  handlers, registerRef, isLastTier, layoutMode
}) => {
  const isTargetTier = draggingState.currentTierId === tier.id;
  const [hoverIndex, setHoverIndex] = useState(null);
  const zoneRef = useRef(null);
  const isHorizontal = layoutMode === 'horizontal';

  const handleMouseMove = (e) => {
    if (draggingState.isDragging) return;
    if (zoneRef.current) {
      const rect = zoneRef.current.getBoundingClientRect();

      // Calculate index based on orientation
      let index;
      if (isHorizontal) {
        const y = e.clientY - rect.top;
        index = Math.floor(y / ROW_HEIGHT);
      } else {
        const x = e.clientX - rect.left;
        index = Math.floor(x / COLUMN_WIDTH);
      }

      if (index >= 0 && index < gridCapacity) {
        setHoverIndex(index);
      } else {
        setHoverIndex(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const isOccupied = tanks.some(t => t.columnIndex === hoverIndex);

  // Dynamic Styles based on orientation
  const containerClass = isHorizontal
    ? "flex-col h-full min-w-[200px] border-r border-neutral-800/50 last:border-0"
    : "flex-row w-full min-h-[160px] border-b border-neutral-800/50 last:border-0";

  const headerClass = isHorizontal
    ? "h-16 w-full border-b border-neutral-800/50 flex-row px-4"
    : "w-16 h-full border-r border-neutral-800/50 flex-col pt-6";

  const gridStyle = isHorizontal
    ? {
      gridTemplateRows: `repeat(${gridCapacity}, ${ROW_HEIGHT}px)`,
      height: 'max-content',
      width: '100%'
    }
    : {
      gridTemplateColumns: `repeat(${gridCapacity}, ${COLUMN_WIDTH}px)`,
      width: 'max-content',
      height: '100%'
    };

  return (
    <div
      id={`tier-${tier.id}`}
      data-tier-id={tier.id}
      className={`flex relative group/tier transition-colors duration-200 ${containerClass}
        ${isTargetTier && draggingState.isDragging ? 'bg-neutral-900/30' : 'hover:bg-neutral-900/10'}
      `}
    >
      {/* Tier Header Label */}
      <div className={`flex-shrink-0 bg-neutral-950 flex items-center justify-center z-10 sticky top-0 left-0 shadow-sm ${headerClass}`}>
        <span className="text-xl font-bold text-neutral-700 font-serif select-none">{tier.roman}</span>
        <div className={`flex gap-1 opacity-0 group-hover/tier:opacity-100 transition-opacity ${isHorizontal ? 'ml-auto' : 'mt-3 flex-col'}`}>
          {isLastTier && (
            <button
              onClick={(e) => { e.stopPropagation(); handlers.onDeleteTier(tier.id); }}
              className="p-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-900 rounded-sm transition-colors"
              title="Delete Tier"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div className="relative flex-1">
        <div
          ref={zoneRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="grid items-center p-4 relative"
          style={{ ...gridStyle, gap: '0' }}
        >
          {/* Drag Placeholder */}
          {draggingState.isDragging && isTargetTier && (
            <div
              className="absolute border border-dashed border-neutral-600 rounded-sm flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase pointer-events-none"
              style={{
                width: TANK_WIDTH,
                height: 120, // Approx tank card height
                left: isHorizontal ? '16px' : `${(draggingState.targetCol * COLUMN_WIDTH) + 16 + (COLUMN_WIDTH - TANK_WIDTH) / 2}px`,
                top: isHorizontal ? `${(draggingState.targetCol * ROW_HEIGHT) + 16}px` : '16px'
              }}
            >Move Here</div>
          )}

          {tanks.map(tank => (
            <TankCard
              key={tank.id}
              tank={tank}
              group={groups.find(g => g.id === tank.groupId) || groups[0]}
              isSelected={selectedTankId === tank.id}
              isConnectionSource={connectionSourceId === tank.id}
              isHighlighted={highlightedIds && highlightedIds.has(tank.id)}
              onEdit={handlers.onEditTank}
              onDelete={handlers.onDeleteTank}
              onMouseDown={handlers.onDragStart}
              setRef={(el) => registerRef(tank.id, el)}
              isDragging={draggingState.isDragging && draggingState.tankId === tank.id}
              conflictType={conflicts[tank.id]}
              // In horizontal mode, we interpret columnIndex as rowIndex
              styleOverride={isHorizontal ? {
                gridRowStart: (tank.columnIndex || 0) + 1,
                gridColumnStart: 1,
                justifySelf: 'center'
              } : {}}
            />
          ))}

          {/* Add Button Ghost */}
          {!draggingState.isDragging && hoverIndex !== null && !isOccupied && (
            <div
              onClick={(e) => { e.stopPropagation(); handlers.onAddTank(tier.id, hoverIndex); }}
              className="group flex flex-col items-center justify-center border border-dashed border-neutral-800 bg-neutral-950/50 hover:border-neutral-500 hover:bg-neutral-900 rounded-sm cursor-pointer transition-all z-0"
              style={{
                width: '144px', height: '128px', // Hardcoded roughly to match card size
                gridColumnStart: isHorizontal ? 1 : hoverIndex + 1,
                gridRowStart: isHorizontal ? hoverIndex + 1 : 1,
                marginLeft: isHorizontal ? 'auto' : '16px',
                marginRight: isHorizontal ? 'auto' : '0',
                marginTop: isHorizontal ? '16px' : '0'
              }}
            >
              <Plus className="text-neutral-700 group-hover:text-neutral-400 transition-colors" size={24} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TankTreeArchitect() {
  const toRoman = (num) => {
    const map = [
      { val: 1000, sym: "M" },
      { val: 900, sym: "CM" },
      { val: 500, sym: "D" },
      { val: 400, sym: "CD" },
      { val: 100, sym: "C" },
      { val: 90, sym: "XC" },
      { val: 50, sym: "L" },
      { val: 40, sym: "XL" },
      { val: 10, sym: "X" },
      { val: 9, sym: "IX" },
      { val: 5, sym: "V" },
      { val: 4, sym: "IV" },
      { val: 1, sym: "I" },
    ];

    let result = "";
    for (let { val, sym } of map) {
      while (num >= val) {
        result += sym;
        num -= val;
      }
    }
    return result;
  };

  const generateTiers = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `tier-${i + 1}`,
      roman: toRoman(i + 1),
      index: i
    }));
  };

  const [layoutMode, setLayoutMode] = useState('vertical');
  const [tiers, setTiers] = useState(generateTiers(5));
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [tanks, setTanks] = useState([
    { id: 't1', name: 'MS-1', tierId: 'tier-1', image: null, parentIds: [], groupId: 'g_lt', xpCost: 0, columnIndex: 2 },
    { id: 't2', name: 'BT-2', tierId: 'tier-2', image: null, parentIds: ['t1'], groupId: 'g_lt', xpCost: 270, columnIndex: 2 },
  ]);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [draggingState, setDraggingState] = useState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
  const tankRefs = useRef({});
  const containerRef = useRef(null);
  const dragOverlayRef = useRef(null);
  const dragData = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, tankId: null, currentTierId: null, targetCol: 0, hasMoved: false });
  const fileInputRef = useRef(null);

  const maxIndex = Math.max(...tanks.map(t => t.columnIndex || 0), 0);
  const gridCapacity = Math.max(maxIndex + 3, 6);

  const highlightedIds = useMemo(() => selectedTankId ? getAllConnectedIds(selectedTankId, tanks) : null, [selectedTankId, tanks]);
  const conflicts = useMemo(() => {
    const conflictsMap = {};
    const posMap = new Map();
    tanks.forEach(t => {
      const key = `${t.tierId}-${t.columnIndex}`;
      if (!posMap.has(key)) posMap.set(key, []);
      posMap.get(key).push(t.id);
    });
    posMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => conflictsMap[id] = 'overlap'); });
    return conflictsMap;
  }, [tanks, tiers]);

  const handleSaveProject = () => {
    const projectData = { version: "1.0", timestamp: new Date().toISOString(), tiers, groups, tanks };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tank-tree-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.tanks && data.tiers && data.groups) {
          setTiers(data.tiers); setGroups(data.groups); setTanks(data.tanks);
          setSelectedTankId(null); setConnectionSourceId(null);
        } else { alert("Invalid project file format."); }
      } catch (err) { console.error(err); alert("Failed to parse project file."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleBackgroundClick = () => { setSelectedTankId(null); setConnectionSourceId(null); };

  // --- UPDATED CONNECTION LOGIC ---
  const toggleConnection = (sourceId, targetId) => {
    if (sourceId === targetId) return;

    const sourceTank = tanks.find(t => t.id === sourceId);
    const targetTank = tanks.find(t => t.id === targetId);

    if (!sourceTank || !targetTank) return;

    // Check if connected (Direction: Source is parent of Target)
    if (targetTank.parentIds.includes(sourceId)) {
      // Disconnect
      setTanks(prev => prev.map(t => {
        if (t.id === targetId) return { ...t, parentIds: t.parentIds.filter(id => id !== sourceId) };
        return t;
      }));
      return;
    }

    // Check if connected (Direction: Target is parent of Source) - allowing bi-directional breaking
    if (sourceTank.parentIds.includes(targetId)) {
      // Disconnect
      setTanks(prev => prev.map(t => {
        if (t.id === sourceId) return { ...t, parentIds: t.parentIds.filter(id => id !== targetId) };
        return t;
      }));
      return;
    }

    // If not connected, Connect (Source becomes Parent of Target)
    setTanks(prev => prev.map(t => {
      if (t.id === targetId) return { ...t, parentIds: [...t.parentIds, sourceId] };
      return t;
    }));
  };

  const handleDragStart = (e, tank) => {
    if (e.altKey) {
      e.preventDefault(); e.stopPropagation();
      if (connectionSourceId === null) {
        setConnectionSourceId(tank.id);
      } else {
        // Changed connectTanks to toggleConnection
        if (connectionSourceId !== tank.id) toggleConnection(connectionSourceId, tank.id);
        setConnectionSourceId(null);
      }
      return;
    }
    e.stopPropagation(); if (connectionSourceId) setConnectionSourceId(null);
    const el = tankRefs.current[tank.id];
    const rect = el.getBoundingClientRect();
    dragData.current = { startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, tankId: tank.id, currentTierId: tank.tierId, targetCol: tank.columnIndex, hasMoved: false };
    window.addEventListener('mousemove', handleDragMove); window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragData.current.hasMoved) {
      const dist = Math.hypot(e.clientX - dragData.current.startX, e.clientY - dragData.current.startY);
      if (dist < 5) return;
      dragData.current.hasMoved = true;
      setDraggingState({ isPressed: true, isDragging: true, tankId: dragData.current.tankId, currentTierId: dragData.current.currentTierId, targetCol: dragData.current.targetCol });
    }

    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${e.clientX - dragData.current.offsetX}px`;
      dragOverlayRef.current.style.top = `${e.clientY - dragData.current.offsetY}px`;
    }

    if (dragData.current.hasMoved && containerRef.current) {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const tierEl = elements.find(el => el.getAttribute && el.getAttribute('data-tier-id'));
      let newTierId = tierEl ? tierEl.getAttribute('data-tier-id') : dragData.current.currentTierId;

      const rect = containerRef.current.getBoundingClientRect();
      let newIndex = 0;

      // Calculate logic based on layout mode
      if (layoutMode === 'horizontal') {
        const relativeY = (e.clientY - dragData.current.offsetY + 60) - rect.top + containerRef.current.scrollTop;
        newIndex = Math.floor(relativeY / ROW_HEIGHT);
      } else {
        const relativeX = (e.clientX - dragData.current.offsetX + TANK_WIDTH / 2) - rect.left + containerRef.current.scrollLeft;
        newIndex = Math.floor(relativeX / COLUMN_WIDTH);
      }

      if (newIndex < 0) newIndex = 0;

      if (newTierId !== dragData.current.currentTierId || newIndex !== dragData.current.targetCol) {
        dragData.current.currentTierId = newTierId;
        dragData.current.targetCol = newIndex;
        setDraggingState(prev => ({ ...prev, currentTierId: newTierId, targetCol: newIndex }));
      }
    }
  };
  const handleDragEnd = () => {
    if (dragData.current.hasMoved) { setTanks(curr => curr.map(t => t.id === dragData.current.tankId ? { ...t, columnIndex: dragData.current.targetCol, tierId: dragData.current.currentTierId } : t)); }
    else { setSelectedTankId(dragData.current.tankId); setIsSidebarOpen(true); }
    setDraggingState({ isPressed: false, isDragging: false, tankId: null, currentTierId: null, targetCol: 0 });
    window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd);
  };
  const handleAddTank = (tierId, specificColIndex = null) => {
    const tierIndex = tiers.findIndex(t => t.id === tierId);
    let targetCol = 0, parentId = null, inheritedGroup = groups[0].id;
    const parent = selectedTankId ? tanks.find(t => t.id === selectedTankId) : null;
    if (specificColIndex !== null) {
      targetCol = specificColIndex;
      if (parent && tiers.findIndex(t => t.id === parent.tierId) === tierIndex - 1) { parentId = parent.id; inheritedGroup = parent.groupId; }
    } else {
      if (parent && tiers.findIndex(t => t.id === parent.tierId) === tierIndex - 1) { parentId = parent.id; targetCol = parent.columnIndex || 0; inheritedGroup = parent.groupId; }
      while (tanks.some(t => t.tierId === tierId && t.columnIndex === targetCol)) targetCol++;
    }
    const newTank = { id: generateId(), name: 'New Vehicle', tierId, image: null, parentIds: parentId ? [parentId] : [], groupId: inheritedGroup, xpCost: 0, columnIndex: targetCol };
    setTanks([...tanks, newTank]); setSelectedTankId(newTank.id); setIsSidebarOpen(true);
  };
  const updateTank = (id, field, value) => setTanks(tanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateGroupColor = (gid, color) => setGroups(groups.map(g => g.id === gid ? { ...g, color } : g));
  const toggleParent = (id, pid) => setTanks(curr => curr.map(t => t.id === id ? { ...t, parentIds: t.parentIds.includes(pid) ? t.parentIds.filter(x => x !== pid) : [...t.parentIds, pid] } : t));
  const toggleChild = (id, cid) => setTanks(curr => curr.map(t => t.id === cid ? { ...t, parentIds: t.parentIds.includes(id) ? t.parentIds.filter(x => x !== id) : [...t.parentIds, id] } : t));
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedTankId) {
      const reader = new FileReader();
      reader.onloadend = () => updateTank(selectedTankId, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handleDeleteTier = (id) => {
    const isLast = tiers[tiers.length - 1].id === id;
    if (!isLast) { alert("You can only delete the last tier."); return; }
    if (tanks.some(t => t.tierId === id)) { alert("Cannot delete a tier that contains tanks."); return; }
    setTiers(tiers.filter(t => t.id !== id));
  };
  const combinedHandlers = { onEditTank: (t) => { setSelectedTankId(t.id); setIsSidebarOpen(true); }, onDeleteTank: (id) => { setTanks(tanks.filter(t => t.id !== id)); if (selectedTankId === id) setSelectedTankId(null); }, onDragStart: handleDragStart, onAddTank: handleAddTank, onDeleteTier: handleDeleteTier };
  const draggingTank = draggingState.tankId ? tanks.find(t => t.id === draggingState.tankId) : null;
  const draggingGroup = draggingTank ? groups.find(g => g.id === draggingTank.groupId) : null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans overflow-hidden select-none">
      <Sidebar
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        selectedTank={tanks.find(t => t.id === selectedTankId)}
        tanks={tanks} tiers={tiers} groups={groups}
        updateTank={updateTank} updateGroupColor={updateGroupColor} handleDeleteTank={combinedHandlers.onDeleteTank}
        toggleParent={toggleParent} toggleChild={toggleChild} handleImageUpload={handleImageUpload}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-950 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-sm hover:bg-neutral-800"><Settings size={16} /></button>}
            <h1 className="text-sm font-bold tracking-[0.2em] text-neutral-400 flex items-center gap-2 uppercase"><Shield size={16} /> Tank Tree Architect</h1>

            {/* ALIGNMENT SWITCHER */}
            <div className="h-6 w-px bg-neutral-800 mx-2"></div>
            <button
              onClick={() => setLayoutMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
              className="flex items-center gap-2 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm text-xs font-medium text-neutral-400 transition-colors"
              title="Switch Layout Alignment"
            >
              {layoutMode === 'vertical' ? <GalleryVertical size={14} /> : <GalleryHorizontal size={14} />}
              {layoutMode === 'vertical' ? 'VERTICAL' : 'HORIZONTAL'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* ... Keep existing Load/Save/Alert buttons ... */}
            <div className="flex items-center gap-2 mr-4 border-r border-neutral-800 pr-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              <button onClick={handleLoadClick} className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 hover:text-neutral-200 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm transition-colors"><Upload size={12} /> LOAD</button>
              <button onClick={handleSaveProject} className="flex items-center gap-1.5 px-2 py-1 text-neutral-500 hover:text-neutral-200 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm transition-colors"><Save size={12} /> SAVE</button>
            </div>
            {connectionSourceId && <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-blue-900 rounded-sm animate-pulse"><Link2 size={12} /> SELECT TARGET</div>}
            {Object.keys(conflicts).length > 0 && <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold px-2 py-1 bg-neutral-900 border border-red-900 rounded-sm"><AlertTriangle size={12} /> {Object.keys(conflicts).length} ISSUES</div>}
          </div>
        </div>

        <div
          ref={containerRef}
          onClick={handleBackgroundClick}
          className="flex-1 overflow-auto relative custom-scrollbar"
        >
          <div className={`
             min-w-full min-h-full relative p-4
             flex ${layoutMode === 'horizontal' ? 'flex-row h-full' : 'flex-col w-full pb-20'}
          `}>

            {/* Pass layoutMode to ConnectionLines */}
            <ConnectionLines
              tanks={tanks}
              groups={groups}
              tankRefs={tankRefs}
              containerRef={containerRef}
              draggingState={draggingState}
              highlightedIds={highlightedIds}
              layoutMode={layoutMode}
            />

            {/* TIER RENDERING LOOP */}
            <div className={`flex relative z-10 ${layoutMode === 'horizontal' ? 'flex-row h-full' : 'flex-col w-full'}`}>
              {tiers.map((tier, index) => (
                <TierZone
                  key={tier.id}
                  tier={tier}
                  tanks={tanks.filter(t => t.tierId === tier.id)}
                  groups={groups}
                  selectedTankId={selectedTankId}
                  connectionSourceId={connectionSourceId}
                  highlightedIds={highlightedIds}
                  draggingState={draggingState}
                  conflicts={conflicts}
                  gridCapacity={gridCapacity}
                  handlers={combinedHandlers}
                  registerRef={(id, el) => { tankRefs.current[id] = el; }}
                  isLastTier={index === tiers.length - 1}
                  layoutMode={layoutMode}
                />
              ))}

              {/* ADD TIER BUTTON */}
              <div className={`
                    flex relative border-transparent opacity-50 hover:opacity-100 transition-opacity
                    ${layoutMode === 'horizontal' ? 'w-16 h-full flex-col border-l border-neutral-800/20' : 'h-16 w-full flex-row border-t border-neutral-800/20'}
                `}>
                <div className="flex items-center justify-center p-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setTiers([...tiers, { id: generateId(), roman: toRoman(tiers.length + 1), index: tiers.length }]); }}
                    className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-sm text-neutral-500 hover:text-green-500 transition-all shadow-md"
                    title="Add New Tier"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {draggingState.isDragging && draggingTank && (
              <div
                ref={dragOverlayRef}
                className="fixed pointer-events-none z-[9999]"
                style={{ width: TANK_WIDTH, left: dragData.current.startX - dragData.current.offsetX, top: dragData.current.startY - dragData.current.offsetY }}
              >
                <TankCard tank={draggingTank} group={draggingGroup} isSelected={true} styleOverride={{ position: 'static' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}